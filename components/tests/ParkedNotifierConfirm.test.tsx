import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import useParkedNotifier from '../hooks/useParkedNotifier';

function Harness() {
  useParkedNotifier();
  return null;
}

jest.useFakeTimers();

// Mock expo-location callback
let watchCb: any;
const mockRemove = jest.fn();
jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3, High: 4 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  watchPositionAsync: jest.fn((opts: any, cb: any) => {
    watchCb = cb;
    return Promise.resolve({ remove: mockRemove });
  }),
}));

// Spots includes the point
jest.mock('../../services/cloudStorage', () => ({
  getSpotsCloud: jest.fn(async () => ([{ id: 's1', latitude: 37, longitude: -122, radiusMiles: 1 }])),
}));

const mockSendLocal = jest.fn();
const mockConfirm = jest.fn();
let confirmResolver: (v: 'yes' | 'no' | 'timeout') => void;
jest.mock('../../services/notificationService', () => ({
  sendLocalNotification: (...args: any[]) => mockSendLocal(...args),
  confirmParked: (...args: any[]) => (mockConfirm as any)(...args),
}));

describe('useParkedNotifier confirm flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('asks confirm, respects no -> 3m cooldown, and timeout counts as parked', async () => {
    render(<Harness />);
    const loc = { coords: { latitude: 37, longitude: -122, speed: 0 } } as any;

    // parked for 1 min
    await waitFor(() => expect(typeof watchCb).toBe('function'));
    act(() => {
      watchCb(loc);
      jest.advanceTimersByTime(60_000);
      watchCb(loc);
    });
    // confirm resolves 'no'
    mockConfirm.mockResolvedValueOnce('no');
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());

    // Should not send local notification after 'no'
    expect(mockSendLocal).not.toHaveBeenCalled();

    // Within 3 minutes, should not re-trigger (cooldown)
    act(() => {
      jest.advanceTimersByTime(2 * 60_000);
      watchCb(loc);
    });
    expect(mockSendLocal).not.toHaveBeenCalled();

    // After cooldown ends, parked again 1 min triggers confirm; answer 'timeout'
    act(() => {
      jest.advanceTimersByTime(2 * 60_000);
      watchCb(loc);
      jest.advanceTimersByTime(60_000);
      watchCb(loc);
    });
    mockConfirm.mockResolvedValueOnce('timeout');
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockSendLocal).not.toHaveBeenCalled();
  });
});


