import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { useNavigation } from '@/context/NavigationContext';
import { useTaskAppStore } from '@/features/task-app/use-task-app';

// Mock dependencies
jest.mock('@/context/NavigationContext');
jest.mock('@/features/task-app/use-task-app');

describe('QuickActions', () => {
  const mockStartBreathing = jest.fn();
  const mockStartGrounding = jest.fn();
  const mockShowChat = jest.fn();
  const mockSetActiveView = jest.fn();

  beforeEach(() => {
    (useNavigation as jest.Mock).mockReturnValue({
      startBreathing: mockStartBreathing,
      startGrounding: mockStartGrounding,
      showChat: mockShowChat,
    });
    (useTaskAppStore as unknown as jest.Mock).mockReturnValue({
      setActiveView: mockSetActiveView,
    });
  });

  it('renders all action buttons with tactile feedback classes and correct type', () => {
    render(<QuickActions />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);

    buttons.forEach((button) => {
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('active:scale-95');
    });
  });
});
