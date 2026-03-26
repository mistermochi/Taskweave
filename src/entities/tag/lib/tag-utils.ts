import { Tag } from '../model/types';

/**
 * Performance Optimization (Bolt ⚡):
 * Consolidates tag lookups, hierarchy grouping, and search visibility into a single O(T) pass.
 * This replaces O(T^2) recursive filtering with O(1) map lookups.
 *
 * @param tags The full list of tags to process.
 * @param searchQuery Optional search query to filter visible tags.
 * @returns An object containing tags mapped by ID, parent, and visibility.
 */
export function processTagsForPicker(tags: Tag[], searchQuery: string = "") {
  const idMap = new Map<string, Tag>();
  const parentMap = new Map<string | null, Tag[]>();
  const query = searchQuery.toLowerCase();

  // First pass: Build maps
  tags.forEach(tag => {
    idMap.set(tag.id, tag);
    const pid = tag.parentId || null;
    if (!parentMap.has(pid)) parentMap.set(pid, []);
    parentMap.get(pid)!.push(tag);
  });

  // Sort children by order
  parentMap.forEach(children => children.sort((a, b) => (a.order || 0) - (b.order || 0)));

  // Second pass: Determine visibility if searching
  const visible = new Set<string>();
  if (query) {
    tags.forEach(tag => {
      if (tag.name.toLowerCase().includes(query)) {
        // Add self and all ancestors to visible set
        let current: Tag | undefined = tag;
        while (current && !visible.has(current.id)) {
          visible.add(current.id);
          current = current.parentId ? idMap.get(current.parentId) : undefined;
        }
      }
    });
  }

  return { tagsById: idMap, tagsByParent: parentMap, visibleTags: visible };
}
