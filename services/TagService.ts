import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, collection, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { Tag } from '../types';
import { ContextService } from './ContextService';

/**
 * Service for managing user tags (categories) in Firestore.
 * Handles the creation, update, deletion, and hierarchy of tags.
 *
 * @singleton Use `TagService.getInstance()` to access the service.
 */
export class TagService {
  /** Singleton instance of the service. */
  private static instance: TagService;
  
  /**
   * Default hex colors for the initial set of seeded tags.
   */
  private readonly DEFAULT_COLORS = {
    'Work': '#9333ea',      // Purple-600
    'Personal': '#ea580c',  // Orange-600
    'Wellbeing': '#16a34a', // Green-600
    'Hobbies': '#0284c7'    // Sky-600
  };

  /**
   * Returns the singleton instance of TagService.
   * @returns The TagService instance.
   */
  public static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  /**
   * Fetches all tags for the current user from Firestore.
   *
   * @returns A promise resolving to an array of `Tag` objects.
   */
  public async getTags(): Promise<Tag[]> {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return [];

    const q = query(collection(db, 'users', uid, 'tags'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Tag);
  }

  /**
   * Seeds the user's account with a default set of tags if no tags currently exist.
   *
   * @interaction Uses a Firestore `writeBatch` for atomic creation of default tags.
   */
  public async initializeDefaultsIfEmpty() {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return;
    
    const q = query(collection(db, 'users', uid, 'tags'));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      const batch = writeBatch(db);
      
      const defaults = ['Work', 'Personal', 'Wellbeing', 'Hobbies'];
      
      defaults.forEach((name, index) => {
        const tagRef = doc(db, 'users', uid, 'tags', name); 
        batch.set(tagRef, {
          id: name,
          name: name,
          parentId: null,
          color: (this.DEFAULT_COLORS as any)[name] || '#64748b',
          order: index
        });
      });

      await batch.commit();
    }
  }

  /**
   * Creates a new tag in Firestore.
   *
   * @param name - The display name of the tag.
   * @param parentId - The ID of the parent tag for hierarchy, or null for root tags.
   * @returns A promise resolving to the unique ID of the newly created tag.
   *
   * @logic
   * - Generates a random HSL color for the new tag.
   * - Uses a UUID for the tag identifier.
   */
  public async createTag(name: string, parentId: string | null = null): Promise<string> {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return "";

    const newTagId = crypto.randomUUID();
    const tagRef = doc(db, 'users', uid, 'tags', newTagId);
    
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 60%)`;

    await setDoc(tagRef, {
      id: newTagId,
      name,
      parentId,
      color,
      order: Date.now()
    });

    return newTagId;
  }

  /**
   * Updates properties of an existing tag.
   *
   * @param tagId - The unique ID of the tag to update.
   * @param updates - Partial object containing the fields to update.
   */
  public async updateTag(tagId: string, updates: Partial<Tag>) {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return;

    const tagRef = doc(db, 'users', uid, 'tags', tagId);
    await updateDoc(tagRef, updates);
  }

  /**
   * Changes the parent of a tag, moving it in the hierarchy.
   *
   * @param tagId - The ID of the tag to move.
   * @param newParentId - The ID of the new parent tag, or null to move to root.
   */
  public async moveTag(tagId: string, newParentId: string | null) {
    if (tagId === newParentId) return;
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return;

    const tagRef = doc(db, 'users', uid, 'tags', tagId);
    await updateDoc(tagRef, { parentId: newParentId });
  }

  /**
   * Deletes a tag and performs cleanup for tasks and sub-tags.
   *
   * @param tagId - The unique ID of the tag to delete.
   *
   * @logic (Atomic Batch)
   * 1. Resets the category of all tasks associated with this tag to an empty string.
   * 2. Promotes all child tags of the deleted tag to the root level (parentId: null).
   * 3. Deletes the tag document itself.
   */
  public async deleteTag(tagId: string) {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return;
    
    const batch = writeBatch(db);

    // 1. Move tasks to inbox
    const tasksQuery = query(collection(db, 'users', uid, 'tasks'), where('category', '==', tagId));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach(doc => {
      batch.update(doc.ref, { category: '' });
    });

    // 2. Promote child tags to root
    const childTagsQuery = query(collection(db, 'users', uid, 'tags'), where('parentId', '==', tagId));
    const childTagsSnapshot = await getDocs(childTagsQuery);
    childTagsSnapshot.forEach(doc => {
      batch.update(doc.ref, { parentId: null });
    });

    // 3. Delete the tag
    const tagRef = doc(db, 'users', uid, 'tags', tagId);
    batch.delete(tagRef);
    
    await batch.commit();
  }
}
