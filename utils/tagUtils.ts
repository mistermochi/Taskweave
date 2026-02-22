
import { Tag } from '@/types';

/**
 * Extracts potential tag strings (starting with #) from a text.
 */
export const extractTagsFromText = (text: string): string[] => {
  if (!text) return [];
  const words = text.split(/\s+/);
  return words.filter(w => w.startsWith('#')).map(w => w.slice(1).toLowerCase().replace(/[^a-z0-9]/g, ''));
};

// Dynamic Style Generator for Tags
export const getTagStyles = (tagId: string, tags: Tag[]) => {
    const tag = tags.find(t => t.id === tagId);
    // Use tag color if available, or fallback to a neutral gray
    const color = tag?.color || '#64748b'; // slate-500 default
    
    // Construct styles dynamically using the hex color
    return {
        bg: { backgroundColor: `${color}15`, borderColor: `${color}30` }, // 10% opacity hex
        text: { color: color },
        badge: { backgroundColor: `${color}20`, color: color, borderColor: `${color}30` },
        dot: { backgroundColor: color }
    };
};
