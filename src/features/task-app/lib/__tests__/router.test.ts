import { parseHash, stringifyAppState, AppState } from '../router';

describe('Router Utility', () => {
  describe('parseHash', () => {
    it('should parse default state for empty hash', () => {
      expect(parseHash('')).toEqual({
        activeView: 'tasks',
        selectedTaskId: null,
        searchQuery: '',
      });
    });

    it('should parse dashboard route', () => {
      expect(parseHash('#/dashboard')).toEqual({
        activeView: 'dashboard',
        selectedTaskId: null,
        searchQuery: '',
      });
    });

    it('should parse dashboard with task ID', () => {
      expect(parseHash('#/dashboard/123')).toEqual({
        activeView: 'dashboard',
        selectedTaskId: '123',
        searchQuery: '',
      });
    });

    it('should parse search query', () => {
      expect(parseHash('#/tasks?q=hello')).toEqual({
        activeView: 'tasks',
        selectedTaskId: null,
        searchQuery: 'hello',
      });
    });

    it('should parse complex state', () => {
      expect(parseHash('#/dashboard/123?q=test')).toEqual({
        activeView: 'dashboard',
        selectedTaskId: '123',
        searchQuery: 'test',
      });
    });
  });

  describe('stringifyAppState', () => {
    it('should stringify default state', () => {
      const state: AppState = {
        activeView: 'tasks',
        selectedTaskId: null,
        searchQuery: '',
      };
      expect(stringifyAppState(state)).toBe('#/tasks');
    });

    it('should stringify dashboard with task', () => {
      const state: AppState = {
        activeView: 'dashboard',
        selectedTaskId: '123',
        searchQuery: '',
      };
      expect(stringifyAppState(state)).toBe('#/dashboard/123');
    });

    it('should stringify tasks with search including tag', () => {
      const state: AppState = {
        activeView: 'tasks',
        selectedTaskId: null,
        searchQuery: '#work urgent',
      };
      // URLSearchParams uses + for space and %23 for #.
      expect(stringifyAppState(state)).toBe('#/tasks?q=%23work+urgent');
    });
  });
});
