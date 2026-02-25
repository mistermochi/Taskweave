import { Tag } from "@/types";

/**
 * Utility functions for managing tag hierarchies and metadata.
 */

/**
 * Recursively retrieves all child tags for a given tag ID.
 *
 * @param tagId - The ID of the parent tag.
 * @param allTags - The full list of available tags.
 * @returns An array containing the IDs of all descendant tags.
 */
export const getChildTagIds = (tagId: string, allTags: Tag[]): string[] => {
    const children = allTags.filter(t => t.parentId === tagId);
    let ids = children.map(c => c.id);

    children.forEach(c => {
        ids = [...ids, ...getChildTagIds(c.id, allTags)];
    });

    return ids;
};

/**
 * Determines the nesting level (depth) of a tag within the hierarchy.
 *
 * @param tagId - The ID of the tag to check.
 * @param allTags - The full list of available tags.
 * @returns The depth level (0 for root tags, 1 for children, etc.).
 */
export const getTagDepth = (tagId: string, allTags: Tag[]): number => {
    const tag = allTags.find(t => t.id === tagId);
    if (!tag || !tag.parentId) return 0;
    return 1 + getTagDepth(tag.parentId, allTags);
};

/**
 * Retrieves the full lineage of a tag (itself and all ancestors).
 *
 * @param tagId - The ID of the leaf tag.
 * @param allTags - The full list of available tags.
 * @returns An array of tags from root down to the specified tag.
 */
export const getTagLineage = (tagId: string | null, allTags: Tag[]): Tag[] => {
    if (!tagId) return [];
    const tag = allTags.find(t => t.id === tagId);
    if (!tag) return [];
    
    if (!tag.parentId) return [tag];
    return [...getTagLineage(tag.parentId, allTags), tag];
};
