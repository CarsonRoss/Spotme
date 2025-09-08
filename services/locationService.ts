import * as Location from 'expo-location';

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    });
    
    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Speed utilities
export type SpeedListener = (speedMetersPerSecond: number | null, loc: Location.LocationObject | null) => void;

let speedSubscription: Location.LocationSubscription | null = null;
let lastSpeed: number | null = null;

export const getLastSpeed = (): number | null => lastSpeed;

export const startSpeedUpdates = async (listener?: SpeedListener): Promise<() => void> => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    return () => {};
  }
  if (speedSubscription) {
    // Already running; just attach side-listener once via polling lastSpeed
    if (listener) listener(lastSpeed, null);
    return () => {};
  }

  speedSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 2000,
      distanceInterval: 5,
    },
    (loc) => {
      // speed in m/s from native if available; compute fallback if missing
      let speed = typeof loc.coords.speed === 'number' ? loc.coords.speed : null;
      if (speed == null || Number.isNaN(speed)) {
        speed = null;
      }
      lastSpeed = speed;
      if (listener) listener(speed, loc);
    }
  );

  return () => {
    if (speedSubscription) {
      speedSubscription.remove();
      speedSubscription = null;
    }
  };
};

export const stopSpeedUpdates = (): void => {
  if (speedSubscription) {
    speedSubscription.remove();
    speedSubscription = null;
  }
};
