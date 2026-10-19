import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import http from './http-common';

jest.mock('./hooks/ImpersonationService', () => ({
  __esModule: true,
  default: {
    getCurrent: () => Promise.resolve(null),
  },
}));

jest.mock('./hooks/MaintenanceService', () => ({
  __esModule: true,
  default: {
    getPublicStatus: () => Promise.resolve({enabled: false}),
  },
}));

test('renders manager navigation', async () => {
  (http.get as jest.Mock)
      .mockResolvedValueOnce({data: {token: 'csrf-token'}, status: 200})
      .mockResolvedValueOnce({data: {
        userId: {value: 1},
        username: 'manager',
        language: 'pl',
      }, status: 200});
  render(<App />);
  expect((await screen.findAllByRole('button', {name: 'Strona startowa'})).length).toBeGreaterThan(0);
  expect(screen.getAllByRole('button', {name: 'Procesy'}).length).toBeGreaterThan(0);
  const brandElements = screen.getAllByText(/manager 2.0/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
