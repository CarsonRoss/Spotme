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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Simple card component for displaying a spot with a non-interactive map and city label
function SpotCard({ spot, city, onEdit }: { spot: CloudStoredSpot; city: string; onEdit: (spot: CloudStoredSpot) => void }) {
  const MI_TO_METERS = 1609.34;
  const metersPerDegLat = 111320; // approx
  const metersPerDegLon = 111320 * Math.max(0.00001, Math.cos((spot.latitude * Math.PI) / 180));
  const radiusMeters = (spot.radiusMiles || 0.3) * MI_TO_METERS;
  const radiusDegLat = radiusMeters / metersPerDegLat;
  const radiusDegLon = radiusMeters / metersPerDegLon;
  const angular = Math.max(radiusDegLat, radiusDegLon); // use the larger angular radius
  const PAD = 2.6; // 2x for diameter + ~30% padding
  const region = {
    latitude: spot.latitude,
    longitude: spot.longitude,
    latitudeDelta: Math.max(0.005, angular * PAD),
    longitudeDelta: Math.max(0.005, angular * PAD),
  };

  return (
    <Glass style={styles.mapCard}>
      <View style={styles.mapSquare}>
        <MapView style={styles.map} pointerEvents="none" initialRegion={region}>
          <Marker coordinate={{ latitude: spot.latitude, longitude: spot.longitude }} />
          <Circle
            center={{ latitude: spot.latitude, longitude: spot.longitude }}
            radius={radiusMeters}
            strokeColor="rgba(52,199,89,0.9)"
            fillColor="rgba(52,199,89,0.15)"
          />
        </MapView>
      </View>
      {!!spot.name && <Text style={styles.nameAbove}>{spot.name}</Text>}
      <Text style={styles.cityBelow}>{city}</Text>
      <TouchableOpacity style={styles.editPill} onPress={() => onEdit(spot)}>
          <Text style={styles.editPillText}>Edit</Text>
        </TouchableOpacity>
    </Glass>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [userProfile, setUserProfile] = useState<{ fullName?: string } | null>(null);
  const [spots, setSpots] = useState<CloudStoredSpot[]>([]);
  const [location, setLocation] = useState<string>('');
  const [spotCities, setSpotCities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      return () => {};
    }, [])
  );

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

      // Resolve city for each spot (simple reverse geocode per spot)
      try {
        const pairs = await Promise.all(
          list.map(async (s) => {
            try {
              const results = await ExpoLocation.reverseGeocodeAsync({
                latitude: s.latitude,
                longitude: s.longitude,
              });
      
              const f = results?.[0];
              if (!f) return [s.id || `${s.latitude},${s.longitude}`, ''] as const;
      
              const city = [f.city || f.subregion, f.region]
                .filter(Boolean)
                .join(', ');
      
              return [s.id || `${s.latitude},${s.longitude}`, city] as const;
            } catch {
              return [s.id || `${s.latitude},${s.longitude}`, ''] as const;
            }
          })
        );
      
        const map = Object.fromEntries(pairs.filter(([_, city]) => city));
        setSpotCities(map);
      } catch {}
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 12 }}>
      <Glass style={styles.header}>
        <Text style={styles.title}>{userProfile.fullName || 'Not set'}</Text>
        {location ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoValue}>{location}</Text>
          </View>
        ) : null}
      </Glass>

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, styles.sectionHeader]}>My Spots</Text>
        <TouchableOpacity style={styles.addSpotButtonWrap} onPress={() => navigation.navigate('AddSpot')}>
          <LinearGradient colors={["#0A84FF", "#0A84FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addSpotButton}>
            <Text style={styles.addSpotPlus}>+</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading spots…</Text>
        </View>
      ) : spots.length === 0 ? (
        <Text style={{ color: colors.textSecondary, marginHorizontal: 16 }}>No spots saved yet.</Text>
      ) : (
        <View style={[styles.grid, styles.gridWrap]}>
          {spots.map((s) => (
            <View key={s.id || `${s.latitude},${s.longitude}` } style={styles.gridItem}>
              <SpotCard
                spot={s}
                city={spotCities[s.id || `${s.latitude},${s.longitude}`] || ''}
                onEdit={(spot) => navigation.navigate('EditSpot', { spotId: spot.id, name: spot.name || '', radiusMiles: spot.radiusMiles, latitude: spot.latitude, longitude: spot.longitude })}
              />
            </View>
          ))}
        </View>
      )}

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
    alignItems: 'flex-start',
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
  sectionHeader: {
    marginHorizontal: 16,
  },
  sectionHeaderRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addSpotButtonWrap: { padding: 2 },
  addSpotButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addSpotPlus: { color: '#ffffff', fontWeight: '500', fontSize: 20, lineHeight: 20 },
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
  mapCard: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  mapSquare: { aspectRatio: 1, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, position: 'relative' },
  map: {
    width: '100%',
    height: '100%',
  },
  cityBelow: { marginTop: 8, color: colors.textPrimary, fontWeight: '400' },
  nameAbove: { marginTop: 10, color: colors.textPrimary, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%' },
  gridWrap: { paddingHorizontal: 16 },
  editPill: { position: 'absolute', right: 10, bottom: 7, zIndex: 5, backgroundColor: 'rgba(10,132,255,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  editPillText: { color: '#ffffff', fontWeight: '800', fontSize: 11 },
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
