// firebaseConfig.web.ts
import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
    Auth,
    browserLocalPersistence,
    getAuth,
    setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDm9m6DzqFvlPMoj5Uj6tURgDEV7JtmOIc",
  authDomain: "ido10s.firebaseapp.com",
  projectId: "ido10s",
  storageBucket: "ido10s.firebasestorage.app",
  messagingSenderId: "794085316378",
  appId: "1:794085316378:web:05334fe6dcf5d9227a7ea3"
};

const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

let auth: Auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
