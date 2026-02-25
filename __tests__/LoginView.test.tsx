/**
 * @file Unit tests for LoginView.
 * Verifies that the login page renders the welcome message and
 * the Google authentication button.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginView } from '../views/LoginView';
import { signInWithPopup } from 'firebase/auth';

jest.mock('firebase/auth');
jest.mock('../firebase', () => ({ auth: {} }));

describe('LoginView Component', () => {
  it('renders welcome message and login button', () => {
    render(<LoginView />);
    expect(screen.getByText(/Welcome to Taskweave/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in with Google/i)).toBeInTheDocument();
  });

  it('triggers google sign in on button click', () => {
    render(<LoginView />);
    const button = screen.getByText(/Sign in with Google/i);
    fireEvent.click(button);
    expect(signInWithPopup).toHaveBeenCalled();
  });
});
