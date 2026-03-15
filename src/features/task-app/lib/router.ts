import { TaskView, TaskTab } from "../use-task-app";

export interface AppState {
  activeView: TaskView;
  taskTab: TaskTab;
  selectedTaskId: string | null;
  searchQuery: string;
}

export function parseHash(hash: string): AppState {
  const defaultState: AppState = {
    activeView: 'tasks',
    taskTab: 'active',
    selectedTaskId: null,
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
    if (segments[1] === 'done') {
      state.taskTab = 'done';
      if (segments[2]) {
        state.selectedTaskId = segments[2];
      }
    } else if (segments[1] === 'archived') {
      state.taskTab = 'archived';
      if (segments[2]) {
        state.selectedTaskId = segments[2];
      }
    } else {
      state.taskTab = 'active';
      if (segments[1]) {
        state.selectedTaskId = segments[1];
      }
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
    if (state.taskTab === 'done') {
      path += '/done';
    } else if (state.taskTab === 'archived') {
      path += '/archived';
    }

    if (state.selectedTaskId) {
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
