import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import useParkedNotifier from '../hooks/useParkedNotifier';

function Harness() {
  useParkedNotifier();
  return null;
}

jest.useFakeTimers();

// mock expo-location watch
let watchCb: any;
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3, High: 4 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  watchPositionAsync: jest.fn((opts: any, cb: any) => {
    watchCb = cb;
    return Promise.resolve({ remove: jest.fn() });
  }),
}));

// cloud spots present but unused here
jest.mock('../../services/cloudStorage', () => ({
  getSpotsCloud: jest.fn(async () => ([])),
}));

const mockSendOpening = jest.fn();
const mockConfirm = jest.fn(async () => 'yes');
jest.mock('../../services/notificationService', () => ({
  sendLocalNotification: jest.fn(),
  confirmParked: (...args: any[]) => (mockConfirm as any)(...args),
  sendSpotOpeningNotification: (...args: any[]) => mockSendOpening(...args),
}));

describe('departing from parked sends opening notification', () => {
  it('fires on parked->moving transition and includes lat/lon', async () => {
    render(<Harness />);

    const loc = { coords: { latitude: 12.34, longitude: 56.78, speed: 0 } } as any;
    await waitFor(() => expect(typeof watchCb).toBe('function'));

    // become parked (start timer)
    act(() => {
      watchCb(loc);
      jest.advanceTimersByTime(60_000);
      watchCb(loc);
    });

    // ensure confirm was invoked and resolved
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());

    // now move (> ~10 mph -> 4.47 m/s)
    act(() => {
      watchCb({ coords: { ...loc.coords, speed: 5 } });
    });

    await waitFor(() => expect(mockSendOpening).toHaveBeenCalledWith(12.34, 56.78));
  });
});


