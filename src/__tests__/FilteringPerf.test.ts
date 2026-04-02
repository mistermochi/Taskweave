/** @jest-environment node */
import { parseTaskInput } from '../shared/lib/textParserUtils';
import { Task } from '@/entities/task';
import { Tag } from '@/entities/tag';

// Mocking the filtering logic from TaskApp.tsx (REFACTORED)
function filterTasksLogic({
    sourceTasks,
    mergedSource,
    taskTab,
    selectedTagId,
    mergedTagsMap,
    mergedTagsByName,
    searchQuery
}: {
    sourceTasks: Task[],
    mergedSource: Task[] | null,
    taskTab: string,
    selectedTagId: string | null,
    mergedTagsMap: Record<string, Tag>,
    mergedTagsByName: Record<string, Tag>,
    searchQuery: string
}) {
    // Bolt ⚡ Optimization: Return sourceTasks reference directly if no filters are active
    // and no status fallback is required. This avoids redundant O(N) traversals
    // and preserves reference stability for child components like TaskList.
    const isUnfiltered = !searchQuery && !selectedTagId && sourceTasks !== mergedSource;
    if (isUnfiltered) return sourceTasks;

    // Bolt ⚡: Hoist search parsing and only execute if query exists
    const parsedSearch = searchQuery ? parseTaskInput(searchQuery) : null;
    const tagKeyword = parsedSearch?.attributes.tagKeyword;
    const searchTitle = parsedSearch?.cleanTitle.toLowerCase();
    const lowerTagKeyword = tagKeyword?.toLowerCase();

    const selectedTag = selectedTagId
      ? mergedTagsMap[selectedTagId]
      : null;

    const matchedTag = lowerTagKeyword
      ? mergedTagsByName[lowerTagKeyword] // Bolt ⚡: O(1) lookup from specialized map
      : null;

    return sourceTasks.filter((task) => {
      // Bolt ⚡: For robustness, if we fell back to mergedTasks (mergedSource),
      // we must still apply status filtering.
      if (sourceTasks === mergedSource) {
        if (taskTab === "active" && task.status !== "active") return false;
        if (taskTab === "done" && task.status !== "completed") return false;
        if (taskTab === "archived" && task.status !== "archived") return false;
      }

      // Search filter
      if (searchQuery) {
          // If there's a tag keyword, task must match it
          if (tagKeyword) {
              const tagIdMatch = matchedTag ? task.category === matchedTag.id : false;
              const tagNameMatch = task.category.toLowerCase() === lowerTagKeyword;
              if (!tagIdMatch && !tagNameMatch) return false;
          }

          // If there's clean text search, task must match it in title or notes
          if (searchTitle) {
              const matchesTitle = task.title.toLowerCase().includes(searchTitle);
              const matchesNotes = task.notes?.toLowerCase().includes(searchTitle) || false;
              if (!matchesTitle && !matchesNotes) return false;
          }
      }

      // Legacy Tag filter (still used by some parts of the app possibly)
      if (selectedTagId && !tagKeyword) {
        if (!selectedTag) return false;
        if (
          task.category !== selectedTag.id &&
          task.category !== selectedTag.name
        )
          return false;
      }

      return true;
    });
}

describe('Task Filtering Performance (After Optimization)', () => {
    const NUM_TASKS = 5000;
    const sourceTasks: Task[] = Array.from({ length: NUM_TASKS }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        notes: `Notes for task ${i}`,
        status: 'active',
        category: 'work',
        duration: 30,
        energy: 'Medium',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        blockedBy: []
    } as Task));

    const mergedTagsMap: Record<string, Tag> = {
        'work': { id: 'work', name: 'Work', color: 'blue', order: 0, parentId: null }
    };
    const mergedTagsByName: Record<string, Tag> = {
        'work': { id: 'work', name: 'Work', color: 'blue', order: 0, parentId: null }
    };

    it('confirms reference stability and O(1) performance for unfiltered list', () => {
        const start = performance.now();
        const result = filterTasksLogic({
            sourceTasks,
            mergedSource: [], // Not the same as sourceTasks, so it isUnfiltered = true
            taskTab: 'active',
            selectedTagId: null,
            mergedTagsMap,
            mergedTagsByName,
            searchQuery: ''
        });
        const end = performance.now();

        const duration = end - start;
        console.log(`Optimized filtering time for ${NUM_TASKS} tasks (unfiltered): ${duration.toFixed(4)}ms`);

        expect(result.length).toBe(NUM_TASKS);
        // Optimized implementation returns the SAME array reference
        expect(result).toBe(sourceTasks);
        // Increased threshold slightly for environment variance, but still very small.
        expect(duration).toBeLessThan(0.5);
    });

    it('measures performance with search query', () => {
        const start = performance.now();
        const result = filterTasksLogic({
            sourceTasks,
            mergedSource: [],
            taskTab: 'active',
            selectedTagId: null,
            mergedTagsMap,
            mergedTagsByName,
            searchQuery: 'Task 123'
        });
        const end = performance.now();

        const duration = end - start;
        console.log(`Filtering time for ${NUM_TASKS} tasks with search query (unchanged): ${duration.toFixed(4)}ms`);

        expect(result.length).toBeGreaterThan(0);
    });
});
