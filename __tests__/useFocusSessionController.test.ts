
import { renderHook, act } from '@testing-library/react';
import { useFocusSessionController } from '../hooks/controllers/useFocusSessionController';
import { useTaskContext } from '../context/TaskContext';
import { useNavigation } from '../context/NavigationContext';
import { TaskEntity } from '../types';

// Mock dependencies
jest.mock('../context/TaskContext');
jest.mock('../context/NavigationContext');
jest.mock('../hooks/useFirestore', () => ({
  useUserId: () => 'test-uid',
}));

const mockTaskService = {
  startSession: jest.fn(),
  pauseSession: jest.fn(),
  completeTask: jest.fn(),
};

jest.mock('../services/TaskService', () => ({
  TaskService: {
    getInstance: () => mockTaskService,
  },
}));

const mockUseTaskContext = useTaskContext as jest.Mock;
const mockUseNavigation = useNavigation as jest.Mock;

const mockCompleteFocusSession = jest.fn();
const mockStartBreathing = jest.fn();

describe('useFocusSessionController', () => {
  const mockTask: TaskEntity = {
    id: 'task-1',
    title: 'Focus on this',
    status: 'active',
    duration: 25, // 1500 seconds
    energy: 'Medium',
    category: 'Work',
    createdAt: Date.now(),
    isFocused: false,
    remainingSeconds: null,
    lastStartedAt: null,
    updatedAt: Date.now(),
  };

  const mockRunningTask: TaskEntity = {
      ...mockTask,
      isFocused: true,
      lastStartedAt: Date.now(),
      remainingSeconds: 1500,
      updatedAt: Date.now(),
  };


  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockCompleteFocusSession.mockClear();
    mockStartBreathing.mockClear();

    mockUseTaskContext.mockReturnValue({
      tasks: [mockTask, mockRunningTask],
      tasksMap: {
        'task-1': mockTask,
      }
    });

    mockUseNavigation.mockReturnValue({
      completeFocusSession: mockCompleteFocusSession,
      startBreathing: mockStartBreathing,
    });
  });

  it('should initialize and automatically start the session', () => {
    renderHook(() => useFocusSessionController('task-1'));

    // Verify that startSession was called on mount for an idle task
    expect(mockTaskService.startSession).toHaveBeenCalledWith('task-1', 1500);
  });

  it('should not start a session that is already running', () => {
      // Mock the task context to return a running task
      mockUseTaskContext.mockReturnValue({
        tasks: [mockRunningTask],
        tasksMap: { 'task-1': mockRunningTask }
      });

      renderHook(() => useFocusSessionController('task-1'));
  
      // Should NOT be called again if it's already running
      expect(mockTaskService.startSession).not.toHaveBeenCalled();
    });

  it('should toggle timer from running to paused', () => {
    mockUseTaskContext.mockReturnValue({
      tasks: [mockRunningTask],
      tasksMap: { 'task-1': mockRunningTask }
    });
    
    const { result } = renderHook(() => useFocusSessionController('task-1'));

    act(() => {
      result.current.actions.toggleTimer();
    });

    // Check that pauseSession was called with the correct remaining time
    expect(mockTaskService.pauseSession).toHaveBeenCalledWith('task-1', expect.any(Number));
  });

  it('should toggle timer from paused to running', () => {
    const pausedTask = { ...mockTask, isFocused: true, remainingSeconds: 900, lastStartedAt: null };
    mockUseTaskContext.mockReturnValue({
      tasks: [pausedTask],
      tasksMap: { 'task-1': pausedTask }
    });

    const { result } = renderHook(() => useFocusSessionController('task-1'));

    // The useEffect will call startSession on initial render for a paused task
    expect(mockTaskService.startSession).toHaveBeenCalledTimes(1);
    (mockTaskService.startSession as jest.Mock).mockClear(); // Clear for the next check

    // Since our mock task still has lastStartedAt: null, isActive is false
    act(() => {
      result.current.actions.toggleTimer();
    });

    // toggleTimer should call startSession because the task is not active
    expect(mockTaskService.startSession).toHaveBeenCalledWith('task-1', expect.any(Number));
    expect(mockTaskService.startSession).toHaveBeenCalledTimes(1);
  });

  it('should complete the session and navigate', async () => {
    mockUseTaskContext.mockReturnValue({ tasks: [mockTask], tasksMap: { 'task-1': mockTask } });
    const { result } = renderHook(() => useFocusSessionController('task-1'));

    await act(async () => {
      await result.current.actions.completeSession();
    });
    
    // Verify task completion was called
    expect(mockTaskService.completeTask).toHaveBeenCalledWith(mockTask, expect.any(Number), [mockTask]);
    
    // Verify navigation was called
    expect(mockCompleteFocusSession).toHaveBeenCalledWith('task-1');
  });

  it('should update the timer when active', () => {
    jest.useFakeTimers();
    const startTime = Date.now();
    jest.setSystemTime(startTime);

    const runningTaskWithTime = {
        ...mockTask,
        isFocused: true,
        lastStartedAt: startTime,
        remainingSeconds: 1500, // Starts with 25 mins
        updatedAt: startTime
    };

    mockUseTaskContext.mockReturnValue({
        tasks: [runningTaskWithTime],
        tasksMap: { 'task-1': runningTaskWithTime }
    });

    const { result } = renderHook(() => useFocusSessionController('task-1'));
    
    expect(result.current.state.timeLeft).toBe(1500);

    // Advance time by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // The hook's internal setInterval updates the state based on `calculateTaskTime`
    // `calculateTaskTime` uses Date.now(), which is controlled by fake timers.
    // elapsed = (startTime + 5000) - startTime = 5000ms = 5s.
    // remaining = 1500 - 5 = 1495.
    expect(result.current.state.timeLeft).toBe(1495);
    expect(result.current.state.formattedTime).toBe('24:55');

    jest.useRealTimers();
  });

  it('should call handleBreathing and pause the timer if active', () => {
    mockUseTaskContext.mockReturnValue({
      tasks: [mockRunningTask],
      tasksMap: { 'task-1': mockRunningTask }
    });

    const { result } = renderHook(() => useFocusSessionController('task-1'));

    act(() => {
        result.current.actions.handleBreathing();
    });

    expect(mockTaskService.pauseSession).toHaveBeenCalledWith('task-1', expect.any(Number));
    expect(mockStartBreathing).toHaveBeenCalled();
  });
});
