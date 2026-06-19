import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import http from './http-common';

test('renders manager navigation', async () => {
  (http.request as jest.Mock).mockResolvedValue({data: [], status: 200});
  localStorage.setItem('authToken', 'test-token');
  render(<App />);
  await screen.findByRole('button', {name: /ShipmentControlCenter/i});
  const brandElements = screen.getAllByText(/manager 2.0/i);
  expect(brandElements.length).toBeGreaterThan(0);
  localStorage.removeItem('authToken');
});
