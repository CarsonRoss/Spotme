/// <reference types="jest" />
import '@testing-library/jest-native/extend-expect';

// Polyfill fetch for Firebase in Jest (node environment)
import { fetch as crossFetch, Headers, Request, Response } from 'cross-fetch';
Object.assign(globalThis as any, { fetch: crossFetch, Headers, Request, Response });

// Expo/SDK mocks to avoid runtime issues
(Object.assign(globalThis as any, { __ExpoImportMetaRegistry: {} }));
jest.mock('expo', () => ({}), { virtual: true });
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'test-project' } } }, appOwnership: 'standalone' }));
jest.mock('expo-blur', () => ({ BlurView: ({ children }: any) => children }));

// Safe-area + Reanimated mocks
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const ctx = React.createContext({ top: 0, right: 0, bottom: 0, left: 0 });
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});
jest.mock('react-native-reanimated', () => ({}), { virtual: true });

// Notifications + service mocks
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined', canAskAgain: true })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted', canAskAgain: false })),
}));
jest.mock('../services/notificationService', () => ({
  registerForPushNotificationsAsync: jest.fn(() => Promise.resolve('token')),
}));

// Mock firebase singleton so tests don't import real SDK
jest.mock('../firebase', () => ({ auth: {}, db: {} }));