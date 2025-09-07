import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Glass from './Glass';
import { colors } from '../theme/colors';
import { getUserProfileCloud, getSpotsCloud, type CloudStoredSpot } from '../services/cloudStorage';
import * as ExpoLocation from 'expo-location';

export default function ProfileScreen() {
  const [userProfile, setUserProfile] = useState<{ fullName?: string } | null>(null);
  const [spots, setSpots] = useState<CloudStoredSpot[]>([]);
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [profileRes, list] = await Promise.all([
        getUserProfileCloud(),
        getSpotsCloud(),
      ]);
      setUserProfile(profileRes);
      setSpots(list);

      if (list.length > 0) {
        try {
          const res = await ExpoLocation.reverseGeocodeAsync({
            latitude: list[0].latitude,
            longitude: list[0].longitude,
          });
          const first: any = Array.isArray(res) && res[0] ? res[0] : null;
          if (first) {
            const city = first.city || first.subregion || '';
            const region = first.region || '';
            const formatted = [city, region].filter(Boolean).join(', ');
            if (formatted) setLocation(formatted);
          }
        } catch {}
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Note: Sign out functionality removed since this is a cloud-based profile system
  // Users can manage their data through the app settings or by clearing app data

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Glass style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your SpotMe account</Text>
      </Glass>

      <Glass style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{userProfile.fullName || 'Not set'}</Text>
        </View>
        {location ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{location}</Text>
          </View>
        ) : null}
      </Glass>

      <Glass style={styles.infoSection}>
        <Text style={styles.sectionTitle}>My Spots</Text>
        {loading ? (
          <View style={{ paddingVertical: 16, alignItems: 'center' }}>
            <ActivityIndicator color={colors.textPrimary} />
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading spots…</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    margin: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoSection: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  spotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  spotIcon: { fontSize: 18, width: 22, textAlign: 'center' },
  spotTitle: { color: colors.textPrimary, fontWeight: '700' },
  spotMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  signOutButton: {
    backgroundColor: colors.surfaceElevated,
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
});
