/**
 * @file Unit tests for LoginView component.
 * Verifies the rendering of the landing page and the
 * Google authentication flow.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginView from '../views/LoginView';
import { auth } from '../firebase'; // We'll mock this
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

// Mock the entire firebase/auth module
jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'), // Keep original functions we don't mock
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

// Mock the firebase module that exports the auth instance
jest.mock('../firebase', () => ({
  auth: {
    // This is a placeholder object. The actual instance doesn't matter
    // because we are mocking the functions that use it.
  },
  db: {},
}));

describe('LoginView', () => {
  beforeEach(() => {
    // Clear mock history before each test
    (signInWithPopup as jest.Mock).mockClear();
    (GoogleAuthProvider as jest.Mock).mockClear();
  });

  it('should call signInWithPopup when the Google sign-in button is clicked', async () => {
    // Arrange: Mock the implementation of signInWithPopup to resolve successfully
    (signInWithPopup as jest.Mock).mockResolvedValue({
      /* mock user credential object */
    });

    render(<LoginView />);

    // Act: Find the button and click it
    const googleButton = screen.getByText(/Sign in with Google/i);
    fireEvent.click(googleButton);

    // Assert: Check if signInWithPopup was called correctly
    await waitFor(() => {
        expect(signInWithPopup).toHaveBeenCalledTimes(1);
    });

    // We expect it to be called with the auth instance and a provider instance
    expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.any(Object));
    // Verify that we are creating a GoogleAuthProvider
    expect(GoogleAuthProvider).toHaveBeenCalledTimes(1);
  });

  it('should log an error if signInWithPopup fails', async () => {
    // Arrange: Mock the implementation to reject with an error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Sign-in failed');
    (signInWithPopup as jest.Mock).mockRejectedValue(mockError);

    render(<LoginView />);

    // Act
    const googleButton = screen.getByText(/Sign in with Google/i);
    fireEvent.click(googleButton);

    // Assert
    await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Google Sign-In failed", mockError);
    });

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });
});
