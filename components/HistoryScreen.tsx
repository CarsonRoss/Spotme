import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import Glass from './Glass';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Glass style={styles.card}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.text}>Your recent shared and claimed spots will appear here.</Text>
      </Glass>
      <Glass style={styles.empty}>
        <Text style={styles.emptyText}>No history yet</Text>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  card: { padding: 16, marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  text: { color: colors.textSecondary, fontSize: 12 },
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 12 },
});
