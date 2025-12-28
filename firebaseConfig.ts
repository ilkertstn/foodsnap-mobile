import { initializeAuth } from "firebase/auth";
// @ts-ignore
import { getReactNativePersistence } from "@firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBOCCahL0IUKoM50CszgfJq-_rnxIZT_B0",
    authDomain: "foodsnap-ae590.firebaseapp.com",
    projectId: "foodsnap-ae590",
    storageBucket: "foodsnap-ae590.firebasestorage.app",
    messagingSenderId: "885268694668",
    appId: "1:885268694668:web:3477d5b7cfbef7de601da9",
    measurementId: "G-PDP24SVF22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence (Recommended for React Native / Expo)
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
