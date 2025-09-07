import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ParkingSpot } from '../types';
import { colors } from '../theme/colors';
import Glass from './Glass';

interface SimpleMapViewProps {
  currentLocation: { latitude: number; longitude: number } | null;
  spots: ParkingSpot[];
  onClaimSpot: (spot: ParkingSpot) => void;
}

export default function SimpleMapView({ 
  currentLocation, 
  spots, 
  onClaimSpot 
}: SimpleMapViewProps) {
  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins <= 0) return 'Expired';
    if (diffMins === 1) return '1 min left';
    return `${diffMins} mins left`;
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  if (!currentLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Location Required</Text>
          <Text style={styles.subtitle}>
            Please enable location services to view nearby parking spots
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Glass style={styles.mapPlaceholder}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Parking Map</Text>
          <Text style={styles.mapSubtitle}>
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        </View>
        <View style={styles.currentLocationMarker}>
          <Text style={styles.markerText}>You are here</Text>
        </View>
        {spots.map((spot) => (
          <View key={spot.id} style={styles.spotMarker}>
            <Text style={styles.spotIcon}>⬤</Text>
            <View style={styles.spotInfo}>
              <Text style={styles.spotTitle}>Available Spot</Text>
              <Text style={styles.spotDetails}>Expires: {getTimeRemaining(spot.expiresAt)}</Text>
              <Text style={styles.spotDetails}>
                Distance: {calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  spot.latitude,
                  spot.longitude
                ).toFixed(1)} km
              </Text>
            </View>
            <TouchableOpacity style={styles.claimButton} onPress={() => onClaimSpot(spot)}>
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Glass>

      <Glass style={styles.spotsList}>
        <Text style={styles.listTitle}>Available Spots ({spots.length})</Text>
        <ScrollView style={styles.scrollView}>
          {spots.length === 0 ? (
            <View style={styles.noSpots}>
              <Text style={styles.noSpotsText}>No parking spots nearby</Text>
              <Text style={styles.noSpotsSubtext}>Check back later or share your spot</Text>
            </View>
          ) : (
            spots.map((spot) => (
              <View key={spot.id} style={styles.spotCard}>
                <View style={styles.spotCardHeader}>
                  <Text style={styles.spotCardIcon}>⬤</Text>
                  <View style={styles.spotCardInfo}>
                    <Text style={styles.spotCardTitle}>Available Spot</Text>
                    <Text style={styles.spotCardDistance}>
                      {calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        spot.latitude,
                        spot.longitude
                      ).toFixed(1)} km away
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.spotCardClaimButton} onPress={() => onClaimSpot(spot)}>
                    <Text style={styles.spotCardClaimText}>Claim</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.spotCardFooter}>
                  <Text style={styles.spotCardExpiry}>⏰ {getTimeRemaining(spot.expiresAt)}</Text>
                  <Text style={styles.spotCardCoordinates}>
                    📍 {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  mapPlaceholder: {
    padding: 16,
  },
  mapHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  mapSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  currentLocationMarker: {
    alignSelf: 'center',
    marginBottom: 12,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  markerText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  spotMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  spotIcon: {
    fontSize: 16,
    color: colors.accent,
    marginRight: 12,
  },
  spotInfo: {
    flex: 1,
  },
  spotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  spotDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  claimButton: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  claimButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  spotsList: {
    padding: 16,
    flex: 1,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  scrollView: {
    flex: 1,
  },
  noSpots: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noSpotsText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  noSpotsSubtext: {
    fontSize: 12,
    color: colors.textMuted,
  },
  spotCard: {
    backgroundColor: 'transparent',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  spotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spotCardIcon: {
    fontSize: 16,
    color: colors.accent,
    marginRight: 12,
  },
  spotCardInfo: {
    flex: 1,
  },
  spotCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  spotCardDistance: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  spotCardClaimButton: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  spotCardClaimText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  spotCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  spotCardExpiry: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  spotCardCoordinates: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
