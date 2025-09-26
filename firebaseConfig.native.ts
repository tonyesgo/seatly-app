// firebaseConfig.native.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDm9m6DzqFUPMoj5Uj6tUGRDEV7JtmOlC",
  authDomain: "ido10s.firebaseapp.com",
  projectId: "ido10s",
  storageBucket: "ido10s.appspot.com",
  messagingSenderId: "794085316378",
  appId: "1:794085316378:web:05334fe6dcf5d9227a7ea3",
};

const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

let auth: Auth;
auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
