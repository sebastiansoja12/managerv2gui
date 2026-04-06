import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import http from './http-common';

test('renders manager navigation', async () => {
  (http.get as jest.Mock)
      .mockResolvedValueOnce({data: {token: 'csrf-token'}, status: 200})
      .mockResolvedValueOnce({data: {
        userId: {value: 1},
        username: 'manager',
        language: 'pl',
      }, status: 200});
  render(<App />);
  await screen.findByRole('button', {name: /Szczegóły przesyłki/i});
  const brandElements = screen.getAllByText(/manager 2.0/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
