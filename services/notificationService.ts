import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { ParkingSpot } from '../types';
import { Linking } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Add fields required by newer NotificationBehavior typings
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // In Expo Go (SDK 53+), remote push on Android is not supported.
    if (Constants.appOwnership === 'expo') {
      console.warn('Remote push notifications on Android are not supported in Expo Go. Use a development build.');
      return undefined;
    }
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: true },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return undefined;
    }

    try {
      const projectId = (Constants as any).expoConfig?.extra?.eas?.projectId || (Constants as any).easConfig?.projectId;
      if (!projectId) {
        console.warn('No EAS projectId found; set extra.eas.projectId in app.json or pass to getExpoPushTokenAsync.');
        return undefined;
      }
      const response = await Notifications.getExpoPushTokenAsync({ projectId });
      token = response.data;
    } catch (e) {
      console.warn('Could not fetch Expo push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
};

export const sendLocalNotification = async (
  title: string, 
  body: string, 
  data?: any
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null,
  });
};

// Sends an actionable confirmation notification and resolves with user's choice or timeout
export async function confirmParked(timeoutMs: number = 30_000): Promise<'yes' | 'no' | 'timeout'> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Are you parked?'
        , body: 'Confirm if you are parked now.'
        , categoryIdentifier: 'confirm-parked'
        , data: { type: 'confirm_parked' }
      },
      trigger: null,
    });

    // Setup a one-off listener and timeout race
    return await new Promise<'yes' | 'no' | 'timeout'>((resolve) => {
      const timer = setTimeout(() => resolve('timeout'), timeoutMs);
      const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
        try {
          const action = resp.actionIdentifier;
          if (resp.notification.request.identifier !== id) return;
          if (action === 'YES') resolve('yes');
          else if (action === 'NO') resolve('no');
        } finally {
          clearTimeout(timer);
          sub.remove();
        }
      });
    });
  } catch {
    return 'timeout';
  }
}

export const sendSpotNotification = async (spot: ParkingSpot) => {
  const timeLeft = Math.ceil((spot.expiresAt.getTime() - Date.now()) / 60000);
  
  await sendLocalNotification(
    'A Parking Spot is Available!',
    `A spot is freeing up in ${timeLeft} minutes nearby. Tap to view on map!`,
    { spotId: spot.id, type: 'new_spot' }
  );
};

export const scheduleSpotExpiryNotification = async (spot: ParkingSpot) => {
  const timeUntilExpiry = spot.expiresAt.getTime() - Date.now();
  
  if (timeUntilExpiry > 0) {
    const secondsBefore = Math.max(1, Math.floor(timeUntilExpiry / 1000) - 60);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Spot Expiring Soon',
        body: 'Your shared parking spot will expire in 1 minute.',
        data: { spotId: spot.id, type: 'spot_expiry' },
      },
      trigger: {
        seconds: secondsBefore,
        repeats: false,
      } as Notifications.TimeIntervalTriggerInput,
    });
  }
};

// Send a local notification indicating a spot is opening up at coordinates
export async function sendSpotOpeningNotification(lat: number, lon: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'There is a parking spot opening up!',
      body: 'Tap to navigate before it is gone.',
      data: { type: 'spot_opening', latitude: lat, longitude: lon },
    },
    trigger: null,
  });
}

// Register a global handler to route spot_opening notifications to Apple Maps
export async function registerNotificationHandlers() {
  try {
    // Register actionable buttons for the parked confirmation prompt
    await Notifications.setNotificationCategoryAsync('confirm-parked', [
      {
        identifier: 'YES',
        buttonTitle: 'Yes',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'NO',
        buttonTitle: 'No',
        options: { opensAppToForeground: false },
      },
    ]);

    Notifications.addNotificationResponseReceivedListener((resp) => {
      const data: any = resp?.notification?.request?.content?.data;
      if (data?.type === 'spot_opening' && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const url = `http://maps.apple.com/?daddr=${data.latitude},${data.longitude}`;
        Linking.openURL(url).catch(() => {});
      }
    });
  } catch {}
}
