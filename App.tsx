import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { Keyboard, View, Pressable } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import useParkedNotifier from './components/hooks/useParkedNotifier';
import { registerNotificationHandlers, registerForPushNotificationsAsync } from './services/notificationService';

export default function App() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useParkedNotifier();
  useEffect(() => { registerNotificationHandlers(); }, []);
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      console.log('Expo push token:', token);
    })();
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <AppNavigator />
      <Pressable
        onPress={() => Keyboard.dismiss()}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        pointerEvents={keyboardVisible ? 'auto' : 'none'}
      />
    </View>
  );
}
