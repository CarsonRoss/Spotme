import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import Glass from './Glass';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { setOnboardingCompletedCloud, clearSpotsCloud } from '../services/cloudStorage';

export default function SettingsScreen() {
  const enableNotifications = async () => {
    await registerForPushNotificationsAsync();
    Alert.alert('Notifications', 'Notifications enabled (if permitted).');
  };

  const resetOnboarding = async () => {
    await setOnboardingCompletedCloud(false);
    await clearSpotsCloud();
    Alert.alert('Reset', 'Onboarding will show next launch and spots cleared.');
  };

  return (
    <View style={styles.container}>
      <Glass style={styles.card}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity style={styles.action} onPress={enableNotifications}>
          <Text style={styles.actionText}>Enable Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={resetOnboarding}>
          <Text style={styles.actionText}>Reset Onboarding</Text>
        </TouchableOpacity>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  card: { padding: 16 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 10 },
  action: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  actionText: { color: colors.textPrimary, fontWeight: '700' },
});
