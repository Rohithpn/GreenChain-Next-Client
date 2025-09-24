import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// IMPORTANT: Replace this with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAgbnC-eUUxUZClWXm2_DSV1I1o7vCbacQ",
  authDomain: "greenchain-live.firebaseapp.com",
  projectId: "greenchain-live",
  storageBucket: "greenchain-live.firebasestorage.app",
  messagingSenderId: "120668116951",
  appId: "1:120668116951:web:a6617de12892010078dd92",
  measurementId: "G-KCFV94TYKE"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
