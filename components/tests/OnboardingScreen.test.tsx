import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from '../../components/OnboardingScreen';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../../services/notificationService';

test('notifications toggle works', async () => {
  const { getByText, getByPlaceholderText, getByRole } = render(<OnboardingScreen onDone={() => {}} />);

  fireEvent.changeText(getByPlaceholderText('Full name'), 'John Doe');
  fireEvent.changeText(getByPlaceholderText('Phone number'), '1234567890');
  fireEvent.press(getByText('Next')); // to step 1

  const toggle = getByRole('switch'); // or getByTestId('notifications-switch') if you add it back
  fireEvent(toggle, 'valueChange', true);

  await waitFor(() => {
    // assert next enabled, etc.
  });
});

describe('Onboarding notifications', () => {
  it('requests permission and enables Next when toggle is turned on', async () => {
    const onDone = jest.fn();
    const { getByText, getByPlaceholderText, getByTestId } = render(
      <SafeAreaProvider>
        <OnboardingScreen onDone={onDone} />
      </SafeAreaProvider>
    );

    // Step 0: fill required fields and continue
    fireEvent.changeText(getByPlaceholderText('Full name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Phone number'), '1234567890');
    fireEvent.press(getByText('Next'));

    const toggle = getByTestId('notifications-switch');
    fireEvent(toggle, 'valueChange', true);

    await waitFor(() => {
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(registerForPushNotificationsAsync).toHaveBeenCalled();
    });

    fireEvent.press(getByText('Next'));
    expect(screen.getByText('How it works')).toBeTruthy();
  });
});