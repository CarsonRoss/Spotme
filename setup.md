# SpotMe iOS App Setup Guide 🚗

Follow these steps to get your SpotMe iPhone app running:

## Step 1: Firebase Setup 🔥

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Enter project name: "SpotMe" (or your preferred name)
   - Enable Google Analytics (optional)
   - Click "Create project"

2. **Enable Authentication**
   - In Firebase Console, go to "Authentication" > "Sign-in method"
   - Click "Email/Password"
   - Enable it and click "Save"

3. **Enable Firestore Database**
   - Go to "Firestore Database" > "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location close to your users
   - Click "Done"

4. **Get Firebase Config**
   - Go to Project Settings (gear icon) > "General"
   - Scroll down to "Your apps"
   - Click "Add app" > "iOS app"
   - Enter your iOS bundle identifier (e.g., com.spotme.app)
   - Download the GoogleService-Info.plist file
   - Copy the config values to `firebase.ts`

5. **Update firebase.ts**
   - Open `firebase.ts` in your project
   - Replace the placeholder values with your actual Firebase config

## Step 2: iOS Development Setup 🍎

### Prerequisites
- **Mac computer** (required for iOS development)
- **Xcode** installed from Mac App Store
- **iOS Simulator** or physical iPhone device
- **Expo CLI** (`npm install -g @expo/cli`)

### Install Dependencies
```bash
cd SpotMe
npm install
```

## Step 3: Run the App 🚀

```bash
# Start development server
npm start

# Run on iOS Simulator
npm run ios

# Run on physical iPhone (scan QR code with Expo Go app)
# Download Expo Go from App Store first
```

## Step 4: Test Features ✅

1. **Authentication**
   - Create a new account
   - Sign in with existing account
   - Test sign out

2. **Location Services**
   - Grant location permissions when prompted
   - Verify GPS coordinates are captured
   - Test on physical device for best location accuracy

3. **Map Interface**
   - Clean, native iOS-style interface
   - Shows your current location
   - Displays available parking spots nearby
   - Interactive spot claiming

4. **Spot Sharing**
   - Share a parking spot with time-to-leave
   - Check if it appears in Firestore
   - Verify points are awarded (+5 for sharing)

5. **Notifications**
   - Check notification permissions
   - Test local notifications for new spots

## Troubleshooting 🔧

### Common iOS Issues:

1. **"Firebase not initialized"**
   - Check your Firebase config in `firebase.ts`
   - Ensure all required services are enabled

2. **"Location permission denied"**
   - Check iOS Settings > Privacy > Location Services
   - Ensure Expo Go has location access
   - Test on physical device for best results

3. **"App crashes on startup"**
   - Check Xcode console for native errors
   - Ensure all dependencies are properly installed
   - Try clearing Expo cache: `expo start -c`

4. **"Authentication failed"**
   - Verify Firebase Auth is enabled
   - Check email/password sign-in method
   - Ensure internet connection

### iOS-Specific Tips:

- **Physical Device**: Location services work best on real iPhone
- **Simulator**: Good for UI testing, limited location features
- **Expo Go**: Use for quick testing, some limitations apply
- **Development Build**: For full native features and Apple Maps

## Next Steps 🚀

Once basic setup is complete:

1. **Customize UI**: Modify colors, fonts, and iOS-specific styling
2. **Add iOS Features**: Implement native iOS capabilities
3. **Testing**: Test on various iPhone models and iOS versions
4. **App Store**: Prepare for App Store submission

## Support 💬

- Check [Expo iOS Documentation](https://docs.expo.dev/versions/latest/sdk/ios/)
- Visit [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- Review [React Native iOS](https://reactnative.dev/docs/running-on-device#running-on-ios)

---

**Happy iOS Development! 🍎✨**
