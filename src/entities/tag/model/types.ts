/**
 * Category is a dynamic string representing a Tag ID or Name.
 * Used for legacy compatibility and new tag-based categorization.
 */
export type Category = string;

/**
 * Represents a user-defined category or tag for tasks.
 */
export interface Tag {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
  order: number;
}
