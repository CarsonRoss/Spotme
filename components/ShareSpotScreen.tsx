import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getCurrentLocation } from '../services/locationService';
import { createSpot, updateUserPoints } from '../services/spotService';
import { scheduleSpotExpiryNotification } from '../services/notificationService';
import { getCurrentUser } from '../services/authService';
import { ParkingSpot } from '../types';
import Glass from './Glass';
import { colors } from '../theme/colors';

export default function ShareSpotScreen() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    getCurrentLocation().then(loc => {
      if (loc) {
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    });
  }, []);

  const handleShareSpot = async (timeToLeave: number) => {
    if (!location) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Error', 'Please sign in to share a spot.');
      return;
    }

    setLoading(true);
    try {
      const spotId = await createSpot(
        user.uid,
        location.latitude,
        location.longitude,
        timeToLeave
      );

      await updateUserPoints(user.uid, 5);

      const spot: ParkingSpot = {
        id: spotId,
        userId: user.uid,
        latitude: location.latitude,
        longitude: location.longitude,
        timeToLeave,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + timeToLeave * 60 * 1000),
        isActive: true,
      };
      
      await scheduleSpotExpiryNotification(spot);

      Alert.alert(
        'Success',
        `Your spot will be free in ${timeToLeave} minutes. +5 points!`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.loadingText}>Sharing your spot…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Your Spot</Text>
      <Text style={styles.subtitle}>
        Let others know when you're leaving
      </Text>

      <Glass style={styles.locationCard}>
        <Text style={styles.locationText}>Location</Text>
        <Text style={styles.coordinates}>
          {location ? (
            `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
          ) : (
            'Fetching…'
          )}
        </Text>
      </Glass>

      <Glass style={styles.card}>
        <Text style={styles.timeTitle}>Leaving in</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.timeButton} onPress={() => handleShareSpot(2)}>
            <Text style={styles.timeButtonText}>2 min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeButton} onPress={() => handleShareSpot(5)}>
            <Text style={styles.timeButtonText}>5 min</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.timeButton} onPress={() => handleShareSpot(10)}>
            <Text style={styles.timeButtonText}>10 min</Text>
          </TouchableOpacity>
        </View>
      </Glass>

      <Glass style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>• Tap when you're leaving</Text>
        <Text style={styles.infoText}>• Others nearby get notified</Text>
        <Text style={styles.infoText}>• You earn 5 points for sharing</Text>
        <Text style={styles.infoText}>• Spot expires automatically</Text>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    color: colors.textSecondary,
  },
  locationCard: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  timeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  timeButton: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  timeButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  infoBox: {
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
