# SpotMe 🚗

A React Native app that helps users find and share parking spots in real-time. Users can mark their parking spot as "freeing up soon" and nearby users get notified with location information.

## Features

### ✅ MVP Features
- **User Authentication**: Email/password login using Firebase Auth
- **Share Spot**: Mark your parking spot as available with time-to-leave options
- **Find Spot**: Interactive map showing available parking spots (Apple Maps on iOS)
- **Real-time Updates**: Spots automatically expire and update
- **Push Notifications**: Get notified when new spots open nearby
- **Points System**: Earn points for sharing (5) and claiming (1) spots

### 🎯 Core Functionality
- GPS location capture and sharing
- Real-time spot broadcasting
- Automatic spot expiration
- Nearby spot discovery (5km radius)
- User points and rewards tracking
- Clean Apple Maps integration for iOS

## Tech Stack

- **Frontend**: React Native with Expo
- **Authentication**: Firebase Auth
- **Database**: Firestore (real-time)
- **Maps**: react-native-maps with Apple Maps (iOS) / Google Maps (Android)
- **Location**: Expo Location
- **Notifications**: Expo Push Notifications
- **Language**: TypeScript

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android)

### 1. Clone and Install Dependencies
```bash
cd SpotMe
npm install
```

### 2. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Get your Firebase config and update `firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Maps Setup
- **iOS**: Uses Apple Maps by default (no API key needed)
- **Android**: Uses Google Maps (requires Google Maps API key)

For Android users:
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps SDK for Android
3. Add the API key to your app configuration

### 4. Run the App
```bash
# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
SpotMe/
├── components/           # React components
│   ├── LoginScreen.tsx
│   ├── ShareSpotScreen.tsx
│   ├── FindSpotScreen.tsx
│   └── ProfileScreen.tsx
├── services/            # Business logic services
│   ├── authService.ts
│   ├── spotService.ts
│   ├── locationService.ts
│   └── notificationService.ts
├── navigation/          # Navigation configuration
│   └── AppNavigator.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
├── firebase.ts          # Firebase configuration
└── App.tsx             # Main app component
```

## How It Works

### Sharing a Spot
1. User taps "I'm leaving this spot"
2. App captures current GPS location
3. User selects time-to-leave (2, 5, or 10 minutes)
4. Spot is broadcast to nearby users
5. User earns 5 points

### Finding a Spot
1. Map shows all available spots within 5km
2. Green pins indicate available spots
3. Tap on a spot to see details and claim it
4. Claiming a spot earns 1 point
5. Spots automatically expire after the set time

### Notifications
- New spot notifications when spots become available nearby
- Expiry reminders for shared spots
- Push notifications for real-time updates

## Points System

- **Share a spot**: +5 points
- **Claim a spot**: +1 point
- Points are stored in user profile
- Leaderboard potential for future features

## Maps Integration

- **iOS**: Clean Apple Maps interface with native iOS styling
- **Android**: Google Maps integration for Android users
- Automatic provider selection based on platform
- Enhanced UI with better callouts and styling

## Future Enhancements

- [ ] Social features (friend connections)
- [ ] Spot ratings and reviews
- [ ] Premium features
- [ ] Integration with parking meters
- [ ] Car sharing integration
- [ ] Analytics dashboard

## Troubleshooting

### Common Issues
1. **Location not working**: Ensure location permissions are granted
2. **Maps not loading**: 
   - iOS: Should work automatically with Apple Maps
   - Android: Check Google Maps API key configuration
3. **Firebase connection**: Verify Firebase config and internet connection
4. **Notifications**: Ensure notification permissions are granted

### Development Tips
- Use Expo Go app for quick testing
- Check Expo logs for debugging
- Test on physical device for location features
- Use Firebase console to monitor data
- iOS users get the cleanest map experience with Apple Maps

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Happy Parking! 🚗💨**
