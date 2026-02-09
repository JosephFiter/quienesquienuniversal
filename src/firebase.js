// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase config: env vars (Vercel / .env.local) con fallback para local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

console.log("DEBUG - API KEY SIENDO USADA:", import.meta.env.VITE_FIREBASE_API_KEY);
// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Analytics only in browser (avoids errors during build/SSR)
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
export { analytics };
