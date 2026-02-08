// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Firebase config: env vars (Vercel / .env.local) con fallback para local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDieIWgxGak3Oip6yXx7tnkcS21tc-C90w",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "nfcproyect912.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "nfcproyect912",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "nfcproyect912.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "476246323351",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:476246323351:web:9f62f4991b149739e8f9d2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-CN3D7JDVXK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Analytics only in browser (avoids errors during build/SSR)
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
export { analytics };
