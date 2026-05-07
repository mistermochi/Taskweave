import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppearanceForm } from '../appearance-form';
import { useUserSettings } from '@/hooks/useUserSettings';
import { vibrate } from '@/shared/lib/utils';

jest.mock('@/hooks/useUserSettings');
jest.mock('@/shared/lib/utils', () => ({
  ...jest.requireActual('@/shared/lib/utils'),
  vibrate: jest.fn(),
}));

// Mock Firebase to avoid initialization errors in CI
jest.mock('@/shared/api/firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(() => () => {}),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  enableMultiTabIndexedDbPersistence: jest.fn(() => Promise.resolve()),
}));

describe('AppearanceForm UX and Accessibility', () => {
  const mockUpdateSettings = jest.fn();
  const mockSettings = {
    themeMode: 'light',
    themeColor: 'green',
  };

  beforeEach(() => {
    (useUserSettings as jest.Mock).mockReturnValue({
      settings: mockSettings,
      updateSettings: mockUpdateSettings,
    });
    jest.clearAllMocks();
  });

  it('triggers haptic feedback when changing theme mode', () => {
    render(<AppearanceForm />);
    // Radios in Radix ToggleGroup might need to be found by role or text
    const darkButton = screen.getByText(/dark/i).closest('button')!;
    fireEvent.click(darkButton);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ themeMode: 'dark' });
    expect(vibrate).toHaveBeenCalledWith('light');
  });

  it('triggers haptic feedback and has aria-pressed when selecting accent color', () => {
    render(<AppearanceForm />);

    // Mantis is green (initial selection)
    const mantisButton = screen.getByTitle('Mantis');
    expect(mantisButton).toHaveAttribute('aria-pressed', 'true');

    // Marigold is orange
    const marigoldButton = screen.getByTitle('Marigold');
    expect(marigoldButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(marigoldButton);

    expect(mockUpdateSettings).toHaveBeenCalledWith({ themeColor: 'orange' });
    expect(vibrate).toHaveBeenCalledWith('light');
  });

  it('has appropriate focus styles for accent color buttons', () => {
    render(<AppearanceForm />);
    const mantisButton = screen.getByTitle('Mantis');

    expect(mantisButton).toHaveClass('focus-visible:ring-2');
  });
});
