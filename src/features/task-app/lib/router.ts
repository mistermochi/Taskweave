import { TaskView } from "../use-task-app";

export interface AppState {
  activeView: TaskView;
  selectedTaskId: string | null;
  selectedTagId: string | null;
  searchQuery: string;
}

export function parseHash(hash: string): AppState {
  const defaultState: AppState = {
    activeView: 'tasks',
    selectedTaskId: null,
    selectedTagId: null,
    searchQuery: '',
  };

  if (!hash || hash === '#/') return defaultState;

  // Remove leading #
  const path = hash.startsWith('#') ? hash.substring(1) : hash;

  // Split path and query
  const [routePath, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');
  const searchQuery = params.get('q') || '';

  const segments = routePath.split('/').filter(Boolean);

  const state = { ...defaultState, searchQuery };

  if (segments[0] === 'dashboard') {
    state.activeView = 'dashboard';
    if (segments[1]) {
      state.selectedTaskId = segments[1];
    }
  } else if (segments[0] === 'tasks') {
    state.activeView = 'tasks';
    if (segments[1] === 'tag' && segments[2]) {
      state.selectedTagId = segments[2];
    } else if (segments[1]) {
      state.selectedTaskId = segments[1];
    }
  } else if (segments[0] === 'insights') {
    state.activeView = 'insights';
  } else if (segments[0] === 'settings') {
    state.activeView = 'settings';
  }

  return state;
}

export function stringifyAppState(state: AppState): string {
  let path = '/';

  if (state.activeView === 'dashboard') {
    path = '/dashboard';
    if (state.selectedTaskId) {
      path += `/${state.selectedTaskId}`;
    }
  } else if (state.activeView === 'tasks') {
    path = '/tasks';
    if (state.selectedTagId) {
      path += `/tag/${state.selectedTagId}`;
    } else if (state.selectedTaskId) {
      path += `/${state.selectedTaskId}`;
    }
  } else if (state.activeView === 'insights') {
    path = '/insights';
  } else if (state.activeView === 'settings') {
    path = '/settings';
  }

  const params = new URLSearchParams();
  if (state.searchQuery) {
    params.set('q', state.searchQuery);
  }

  const queryString = params.toString();
  return `#${path}${queryString ? `?${queryString}` : ''}`;
}
