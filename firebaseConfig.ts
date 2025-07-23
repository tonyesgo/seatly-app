// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDm9m6DzqFvlPMoj5Uj6tURgDEV7JtmOIc",
  authDomain: "ido10s.firebaseapp.com",
  projectId: "ido10s",
  storageBucket: "ido10s.appspot.com",
  messagingSenderId: "794085316378",
  appId: "1:794085316378:web:05334fe6dcf5d9227a7ea3"
};

const app = initializeApp(firebaseConfig);

export { app }; // ✅ ESTA LÍNEA ES CLAVE
export const db = getFirestore(app);
