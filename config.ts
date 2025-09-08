// Configuration file for SpotMe app
// Copy this file and update with your actual values

export const config = {
  // Firebase Configuration
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  },
  
  // Google Maps API Key
  googleMaps: {
    apiKey: "AIzaSyBHmes8pUsA5Iq1qy8i3gvgZHMGWYfXgKQ"
  },
  
  // App Configuration
  app: {
    name: "SpotMe",
    version: "1.0.0",
    requirePhoneVerification: true
  },
  
  // Points System
  points: {
    shareSpot: 5,
    claimSpot: 1
  },

  // Twilio (backend endpoints you control)
  twilio: {
    startUrl: "", // POST { phone }
    checkUrl: ""  // POST { phone, code } -> { approved: boolean }
  }
};

// Instructions:
// 1. Copy this file to config.local.ts
// 2. Update with your actual Firebase and Google Maps API keys
// 3. Import config.local.ts in firebase.ts instead of this file
