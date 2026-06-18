import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders manager navigation', () => {
  render(<App />);
  const linkElement = screen.getByText(/manager 2.0/i);
  expect(linkElement).toBeInTheDocument();
});
