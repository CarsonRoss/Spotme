import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from '../../components/OnboardingScreen';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../../services/notificationService';

describe('Onboarding notifications', () => {
  it('requests permission and enables Next when toggle is turned on', async () => {
    const onDone = jest.fn();
    const { getByText, getByRole } = render(
      <SafeAreaProvider>
        <OnboardingScreen onDone={onDone} />
      </SafeAreaProvider>
    );

    // Go to step 1
    fireEvent.press(getByText('Next'));

    const toggle = getByRole('switch');
    expect(toggle).toBeTruthy();

    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(registerForPushNotificationsAsync).toHaveBeenCalled();
    });

    const next = getByText('Next');
    fireEvent.press(next);

    expect(screen.getByText('How it works')).toBeTruthy();
  });
});