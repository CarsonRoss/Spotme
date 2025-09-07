import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { getCurrentLocation } from '../services/locationService';
import { getNearbySpots, claimSpot, updateUserPoints } from '../services/spotService';
import { getCurrentUser } from '../services/authService';
import { ParkingSpot } from '../types';
import SimpleMapView from './SimpleMapView';

export default function FindSpotScreen() {
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setCurrentLocation(coords);
        
        // Subscribe to nearby spots
        const unsubscribe = getNearbySpots(
          coords.latitude,
          coords.longitude,
          5, // 5km radius
          (nearbySpots) => {
            setSpots(nearbySpots);
            setLoading(false);
          }
        );

        return unsubscribe;
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to get your location');
      setLoading(false);
    }
  };

  const handleClaimSpot = async (spot: ParkingSpot) => {
    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Error', 'Please sign in to claim a spot');
      return;
    }

    try {
      await claimSpot(spot.id, user.uid);
      
      // Optional: Add 1 point for claiming
      await updateUserPoints(user.uid, 1);
      
      Alert.alert(
        'Spot Claimed! 🎯',
        'You have successfully claimed this parking spot. Navigate to the location shown on the map.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!currentLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to get your location</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeLocation}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SimpleMapView
      currentLocation={currentLocation}
      spots={spots}
      onClaimSpot={handleClaimSpot}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
