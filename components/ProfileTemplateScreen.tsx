import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import Glass from './Glass';
import { getSpotsCloud, getUserProfileCloud, type CloudStoredSpot } from '../services/cloudStorage';
import * as ExpoLocation from 'expo-location';

export default function ProfileTemplateScreen() {
  const [spots, setSpots] = useState<CloudStoredSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string>('');
  const [location, setLocation] = useState<string>('');

  const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
    (async () => {
        try {
        const [profileRes, list] = await Promise.all([
            getUserProfileCloud(),
            getSpotsCloud(),
        ]);

        setProfile(profileRes); // store the whole thing
        setSpots(list);

        if (list.length > 0) {
            try {
            const res = await ExpoLocation.reverseGeocodeAsync({
                latitude: list[0].latitude,
                longitude: list[0].longitude,
            });
            const first = Array.isArray(res) && res[0] ? (res[0] as any) : null;
            if (first) {
                const city = first.city || first.subregion || '';
                const region = first.region || '';
                const formatted = [city, region].filter(Boolean).join(', ');
                if (formatted) setLocation(formatted);
            }
            } catch {}
        }
        } finally {
        setLoading(false);
        }
    })();
    }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ gap: 6, marginBottom: 12 }}>
        <Text style={styles.name}>{profile?.fullName || 'User'}</Text>
        {location ? <Text style={styles.location}>{location}</Text> : null}
      </View>

      <Glass style={{ padding: 16 }}>
        <Text style={styles.sectionTitle}>My Spots</Text>
        {loading ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator color={colors.textPrimary} />
            <Text style={{ color: colors.textMuted, marginTop: 8 }}>Loading spots…</Text>
          </View>
        ) : spots.length === 0 ? (
          <Text style={{ color: colors.textSecondary }}>No spots saved yet.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {spots.map((s) => (
              <View key={s.id} style={styles.spotRow}>
                <Text style={styles.spotIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spotTitle}>{formatLatLon(s.latitude, s.longitude)}</Text>
                  <Text style={styles.spotMeta}>{s.radiusMiles.toFixed(1)} mi radius</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Glass>
    </ScrollView>
  );
}

function formatLatLon(lat: number, lon: number): string {
  const f = (n: number) => n.toFixed(5);
  return `${f(lat)}, ${f(lon)}`;
}

const styles = StyleSheet.create({
  name: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  location: { color: colors.textSecondary, fontSize: 14 },
  sectionTitle: { color: colors.textPrimary, fontWeight: '800', marginBottom: 12, fontSize: 16 },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  spotIcon: { fontSize: 18, width: 22, textAlign: 'center' },
  spotTitle: { color: colors.textPrimary, fontWeight: '700' },
  spotMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});


