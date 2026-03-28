/** @jest-environment node */
import { Tag } from '../entities/tag';
import { processTagsForPicker } from '../entities/tag/lib/tag-utils';

// Mock performance if not available (Node.js < 16)
const perf = typeof performance !== 'undefined' ? performance : require('perf_hooks').performance;

describe('TagPicker Logic Performance', () => {
  it('should process 1000 tags with deep hierarchy in < 50ms', () => {
    // Generate 1000 tags in a binary tree structure
    const tags: Tag[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `tag-${i}`,
      name: `Project ${i}`,
      parentId: i === 0 ? null : `tag-${Math.floor((i - 1) / 2)}`,
      color: '#000000',
      order: i
    }));

    const start = perf.now();
    const result = processTagsForPicker(tags, 'Project 999');
    const end = perf.now();

    const duration = end - start;

    // Verification of correctness
    expect(result.tagsById.size).toBe(1000);
    expect(result.visibleTags.has('tag-999')).toBe(true);

    // Check ancestry chain for tag-999 in a binary tree: 999 -> 499 -> 249 -> 124 -> 61 -> 30 -> 14 -> 6 -> 2 -> 0 -> null
    let currId: string | undefined = 'tag-999';
    while (currId) {
        expect(result.visibleTags.has(currId)).toBe(true);
        const tag = result.tagsById.get(currId);
        currId = tag?.parentId || undefined;
    }

    // Performance check
    // O(T) should be very fast. 50ms is very generous.
    console.log(`TagPicker processTagsForPicker duration for 1000 tags: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(50);
  });
});
