import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import useParkedNotifier from '../hooks/useParkedNotifier';

// Create a test component that mounts the hook
function TestHarness() {
  useParkedNotifier();
  return null;
}

jest.useFakeTimers();

// Mock Expo Location low-level; let the real startSpeedUpdates run
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

jest.mock('../../services/cloudStorage', () => ({
  getSpotsCloud: jest.fn(async () => ([{ id: 's1', latitude: 37.0, longitude: -122.0, radiusMiles: 1 }])),
}));

const mockSendLocalNotification = jest.fn();
const mockConfirm = jest.fn(async () => 'timeout');
jest.mock('../../services/notificationService', () => ({
  sendLocalNotification: (...args: any[]) => mockSendLocalNotification(...args),
  confirmParked: (...args: any[]) => (mockConfirm as any)(...args),
}));

describe('useParkedNotifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prompts after 1 minute of being stopped', async () => {
    render(<TestHarness />);

    // Send a stopped update at the spot center
    const loc = {
      coords: {
        latitude: 37.0,
        longitude: -122.0,
        speed: 0, // m/s
      },
    } as any;

    // mount
    render(<TestHarness />);
    // wait for effect to wire the watch callback
    await waitFor(() => {
      expect(typeof watchCb).toBe('function');
    });
    // first tick - start parked timer
    act(() => {
      watchCb(loc);
    });

    // advance time just under threshold, ensure no notify
    act(() => {
      jest.advanceTimersByTime(59_000);
    });
    expect(mockSendLocalNotification).not.toHaveBeenCalled();

    // cross the 60s threshold
    act(() => {
      jest.advanceTimersByTime(2_000);
      watchCb(loc);
    });

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    expect(mockSendLocalNotification).not.toHaveBeenCalled();
  });
});
