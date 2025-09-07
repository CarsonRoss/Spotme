import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { getOnboardingCompletedCloud } from '../services/cloudStorage';

// Screens
import OnboardingScreen from '../components/OnboardingScreen';
import MySpotsScreen from '../components/MySpotsScreen';
import FindSpotScreen from '../components/FindSpotScreen';
import HistoryScreen from '../components/HistoryScreen';
import SettingsScreen from '../components/SettingsScreen';
import ProfileScreen from '../components/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          position: 'absolute',
          elevation: 0,
        },
        tabBarBackground: () => (
          <BlurView tint="dark" intensity={30} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} />
        ),
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '800',
          color: colors.textPrimary,
        },
        headerTransparent: true,
        headerBackground: () => (
          <BlurView tint="dark" intensity={30} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} />
        ),
      }}
    >
      <Tab.Screen
        name="Find"
        component={FindSpotScreen}
        options={{
          title: 'Find',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MySpots"
        component={MySpotsScreen}
        options={{
          title: 'My Spots',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🕘</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
    (async () => {
      try {
        const completed = await getOnboardingCompletedCloud();
        setShowOnboarding(!completed);
      } catch (e: any) {
        if (e?.code === 'auth/admin-restricted-operation') {
          // anonymous auth disabled → show onboarding without warning
          setShowOnboarding(true);
        } else {
          console.warn('Onboarding check failed', e);
          setShowOnboarding(true);
        }
      }
    })();
  }, []);

  if (showOnboarding === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.textPrimary} />
        <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={{
      dark: true,
      colors: {
        primary: colors.textPrimary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.accent,
      },
    } as any}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={showOnboarding ? 'Onboarding' : 'Main'}>
        {showOnboarding && (
          <Stack.Screen name="Onboarding" children={({ navigation }) => (
            <OnboardingScreen onDone={() => { setShowOnboarding(false); navigation.replace('Profile'); }} />
          )} />
        )}
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { Text, ActivityIndicator, View } from 'react-native';


// I don't want this app to really have a log in or sign up at the beginning. The app is very simple. I want there to be a first time story when the user logs in on how they can use the app. Here are the story slides

// User opens the app

// Welcome to Spotme -> Fade into next slide

// Slide 1: First, lets turn on Spotme notifications, this will allow you receieve information on where available parking near you may be (This turns on notifications for this app)-> Fade into next slide

// Slide 2: On this slide, I want an iphone to pop up and take up a majority of the screen, then have the rest of what is happening inside this iphone to show the user what they have to do to use the app. Now when you are looking for parking, you will receieve a notification on when a parking spot becomes available within a quarter mile of your location and directions on how to get there. Here also show an animation in the apple maps UI of the users location, and then a blue line starting at the users location and going to the parking spot in the path of the directions. -> Fade into next slide

// Slide 3: Now, lets choose your first spot. (Here allow them to put a pin on a map using apple maps UI, with the minimum radius being .3 miles from the pin, and then allow them to increase the radius from the pin of where they would receieve a notification)-> Fade into next slide

// Slide 4: You're all set! Show a button that says take me to spot me

// Slide 5: Now they are in the spot me dashboard, and they won't see that story again when they open the app.
// Here I want a few things. My spots, history, and settings.

// My spots: This is where they can add all of the spots they regularly park and where they will receieve notifications from. Miniumum radius is .3 miles.