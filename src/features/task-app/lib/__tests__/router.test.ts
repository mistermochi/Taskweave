import { parseHash, stringifyAppState, AppState } from '../router';

describe('Router Utility', () => {
  describe('parseHash', () => {
    it('should parse default state for empty hash', () => {
      expect(parseHash('')).toEqual({
        activeView: 'tasks',
        selectedTaskId: null,
        selectedTagId: null,
        searchQuery: '',
      });
    });

    it('should parse dashboard route', () => {
      expect(parseHash('#/dashboard')).toEqual({
        activeView: 'dashboard',
        selectedTaskId: null,
        selectedTagId: null,
        searchQuery: '',
      });
    });

    it('should parse dashboard with task ID', () => {
      expect(parseHash('#/dashboard/123')).toEqual({
        activeView: 'dashboard',
        selectedTaskId: '123',
        selectedTagId: null,
        searchQuery: '',
      });
    });

    it('should parse tasks with tag', () => {
      expect(parseHash('#/tasks/tag/work')).toEqual({
        activeView: 'tasks',
        selectedTaskId: null,
        selectedTagId: 'work',
        searchQuery: '',
      });
    });

    it('should parse search query', () => {
      expect(parseHash('#/tasks?q=hello')).toEqual({
        activeView: 'tasks',
        selectedTaskId: null,
        selectedTagId: null,
        searchQuery: 'hello',
      });
    });

    it('should parse complex state', () => {
      expect(parseHash('#/dashboard/123?q=test')).toEqual({
        activeView: 'dashboard',
        selectedTaskId: '123',
        selectedTagId: null,
        searchQuery: 'test',
      });
    });
  });

  describe('stringifyAppState', () => {
    it('should stringify default state', () => {
      const state: AppState = {
        activeView: 'tasks',
        selectedTaskId: null,
        selectedTagId: null,
        searchQuery: '',
      };
      expect(stringifyAppState(state)).toBe('#/tasks');
    });

    it('should stringify dashboard with task', () => {
      const state: AppState = {
        activeView: 'dashboard',
        selectedTaskId: '123',
        selectedTagId: null,
        searchQuery: '',
      };
      expect(stringifyAppState(state)).toBe('#/dashboard/123');
    });

    it('should stringify tasks with tag and search', () => {
      const state: AppState = {
        activeView: 'tasks',
        selectedTaskId: null,
        selectedTagId: 'work',
        searchQuery: 'urgent',
      };
      expect(stringifyAppState(state)).toBe('#/tasks/tag/work?q=urgent');
    });
  });
});
