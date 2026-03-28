import { parseHash, stringifyAppState, AppState } from '../router';

describe('Router Utility', () => {
  describe('parseHash', () => {
    it('should parse default state for empty hash', () => {
      expect(parseHash('')).toEqual({
        activeView: 'tasks',
        taskTab: 'active',
        selectedTaskId: null,
        searchQuery: '',
      });
    });

    it('should parse dashboard route', () => {
      expect(parseHash('#/dashboard')).toEqual({
        activeView: 'dashboard',
        taskTab: 'active',
        selectedTaskId: null,
        searchQuery: '',
      });
    });

    it('should parse dashboard with task ID', () => {
      expect(parseHash('#/dashboard/123')).toEqual({
        activeView: 'dashboard',
        taskTab: 'active',
        selectedTaskId: '123',
        searchQuery: '',
      });
    });

    it('should parse search query', () => {
      expect(parseHash('#/tasks?q=hello')).toEqual({
        activeView: 'tasks',
        taskTab: 'active',
        selectedTaskId: null,
        searchQuery: 'hello',
      });
    });

    it('should parse tasks/done route', () => {
      expect(parseHash('#/tasks/done')).toEqual({
        activeView: 'tasks',
        taskTab: 'done',
        selectedTaskId: null,
        searchQuery: '',
      });
    });

    it('should parse tasks/archived route', () => {
      expect(parseHash('#/tasks/archived')).toEqual({
        activeView: 'tasks',
        taskTab: 'archived',
        selectedTaskId: null,
        searchQuery: '',
      });
    });

    it('should parse complex state', () => {
      expect(parseHash('#/dashboard/123?q=test')).toEqual({
        activeView: 'dashboard',
        taskTab: 'active',
        selectedTaskId: '123',
        searchQuery: 'test',
        shareTitle: undefined,
        shareText: undefined,
        shareUrl: undefined,
      });
    });

    it('should parse share parameters', () => {
      expect(parseHash('#/tasks/new?share_title=My+Title&share_text=Some+notes&share_url=https://example.com')).toEqual({
        activeView: 'tasks',
        taskTab: 'active',
        selectedTaskId: 'new',
        searchQuery: '',
        shareTitle: 'My Title',
        shareText: 'Some notes',
        shareUrl: 'https://example.com',
      });
    });
  });

  describe('stringifyAppState', () => {
    it('should stringify default state', () => {
      const state: AppState = {
        activeView: 'tasks',
        taskTab: 'active',
        selectedTaskId: null,
        searchQuery: '',
      };
      expect(stringifyAppState(state)).toBe('#/tasks');
    });

    it('should stringify dashboard with task', () => {
      const state: AppState = {
        activeView: 'dashboard',
        taskTab: 'active',
        selectedTaskId: '123',
        searchQuery: '',
      };
      expect(stringifyAppState(state)).toBe('#/dashboard/123');
    });

    it('should stringify tasks/done', () => {
      const state: AppState = {
        activeView: 'tasks',
        taskTab: 'done',
        selectedTaskId: null,
        searchQuery: '',
      };
      expect(stringifyAppState(state)).toBe('#/tasks/done');
    });

    it('should stringify tasks/archived with task', () => {
      const state: AppState = {
        activeView: 'tasks',
        taskTab: 'archived',
        selectedTaskId: '456',
        searchQuery: '',
      };
      expect(stringifyAppState(state)).toBe('#/tasks/archived/456');
    });

    it('should stringify tasks with search including tag', () => {
      const state: AppState = {
        activeView: 'tasks',
        taskTab: 'active',
        selectedTaskId: null,
        searchQuery: '#work urgent',
      };
      // URLSearchParams uses + for space and %23 for #.
      expect(stringifyAppState(state)).toBe('#/tasks?q=%23work+urgent');
    });
  });
});
