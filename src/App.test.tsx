import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders manager navigation', () => {
  localStorage.setItem('authToken', 'test-token');
  render(<App />);
  const brandElements = screen.getAllByText(/manager 2.0/i);
  expect(brandElements.length).toBeGreaterThan(0);
  localStorage.removeItem('authToken');
});
