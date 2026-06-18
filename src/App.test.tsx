import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders manager navigation', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/managermove/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
