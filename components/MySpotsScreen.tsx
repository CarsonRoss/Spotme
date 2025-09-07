import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { colors } from '../theme/colors';
import Glass from './Glass';
import { getSpotsCloud, addSpotCloud, CloudStoredSpot } from '../services/cloudStorage';
import { getCurrentLocation } from '../services/locationService';

export default function MySpotsScreen() {
  const [spots, setSpots] = useState<CloudStoredSpot[]>([]);
  const [radius, setRadius] = useState<number>(0.3);

  const load = async () => setSpots(await getSpotsCloud());
  useEffect(() => { load(); }, []);

  const addCurrent = async () => {
    const loc = await getCurrentLocation();
    if (!loc) return;
    await addSpotCloud({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      radiusMiles: radius,
    });
    load();
  };

  return (
    <View style={styles.container}>
      <Glass style={styles.card}>
        <Text style={styles.title}>My Spots</Text>
        <Text style={styles.sub}>Choose radius</Text>
        <View style={styles.row}>
          {[0.3, 0.5, 1, 2].map((r) => (
            <TouchableOpacity key={r} onPress={() => setRadius(r)} style={[styles.chip, radius === r && styles.chipActive]}>
              <Text style={styles.chipText}>{r} mi</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.primary} onPress={addCurrent}>
          <Text style={styles.primaryText}>Add current location</Text>
        </TouchableOpacity>
      </Glass>

      <FlatList
        data={spots}
        keyExtractor={(item) => item.id ?? `${item.latitude}-${item.longitude}`}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <Glass style={styles.spotCard}>
            <Text style={styles.spotTitle}>Spot</Text>
            <Text style={styles.spotText}>📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
            <Text style={styles.spotText}>🎯 Radius: {item.radiusMiles} mi</Text>
            <Text style={styles.spotMeta}>Added {item.createdAt ? item.createdAt.toLocaleString() : ''}</Text>
          </Glass>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  card: { padding: 16, marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sub: { color: colors.textSecondary, fontSize: 12, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.surfaceElevated },
  chipText: { color: colors.textPrimary, fontWeight: '700' },
  primary: { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  primaryText: { color: colors.textPrimary, fontWeight: '700' },
  spotCard: { padding: 14, marginBottom: 10 },
  spotTitle: { color: colors.textPrimary, fontWeight: '800', marginBottom: 6 },
  spotText: { color: colors.textSecondary, fontSize: 12 },
  spotMeta: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
});
