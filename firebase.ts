import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from GoogleService-Info.plist
const firebaseConfig = {
  apiKey: "AIzaSyB8BtuJh8tvnS39WZ72t5Wyt0biOISDCIM",
  authDomain: "parkingspotme.firebaseapp.com",
  projectId: "parkingspotme",
  storageBucket: "parkingspotme.firebasestorage.app",
  messagingSenderId: "715404665832",
  appId: "1:715404665832:ios:849dc034cedd19bf97ba5d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Note: Make sure to enable these services in your Firebase project:
// - Authentication (Email/Password sign-in method)
// - Firestore Database (in test mode for development)