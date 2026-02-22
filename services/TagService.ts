
import { db } from '../firebase';
import { doc, setDoc, updateDoc, deleteDoc, collection, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { Tag } from '../types';
import { ContextService } from './ContextService';

export class TagService {
  private static instance: TagService;
  
  // Default Colors for initial seed
  private readonly DEFAULT_COLORS = {
    'Work': '#9333ea',      // Purple-600
    'Personal': '#ea580c',  // Orange-600
    'Wellbeing': '#16a34a', // Green-600
    'Hobbies': '#0284c7'    // Sky-600
  };

  public static getInstance(): TagService {
    if (!TagService.instance) {
      TagService.instance = new TagService();
    }
    return TagService.instance;
  }

  // --- Actions ---

  public async getTags(): Promise<Tag[]> {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return [];

    const q = query(collection(db, 'users', uid, 'tags'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Tag);
  }

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

  public async updateTag(tagId: string, updates: Partial<Tag>) {
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return;

    const tagRef = doc(db, 'users', uid, 'tags', tagId);
    await updateDoc(tagRef, updates);
  }

  public async moveTag(tagId: string, newParentId: string | null) {
    if (tagId === newParentId) return;
    const uid = ContextService.getInstance().getUserId();
    if (!uid) return;

    const tagRef = doc(db, 'users', uid, 'tags', tagId);
    await updateDoc(tagRef, { parentId: newParentId });
  }

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
