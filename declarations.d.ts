/// <reference types="react" />

// 👇 Declaración correcta para Map
declare module "@/components/Map" {
  import { ComponentType } from "react";

  const MapView: ComponentType<any>;
  export const Marker: ComponentType<any>;
  export const PROVIDER_GOOGLE: string;

  export default MapView;
}

// 👇 Stub simple para Firebase (React Native)
// Evita errores en TypeScript porque no existen typings oficiales
// declarations.d.ts

declare module "firebase/auth/react-native";


// 👇 Definición para firebaseConfig (import común en el proyecto)
declare module "@/firebaseConfig" {
  import type { FirebaseApp } from "firebase/app";
  import type { Auth } from "firebase/auth";
  import type { Firestore } from "firebase/firestore";
  import type { FirebaseStorage } from "firebase/storage";

  export const app: FirebaseApp;
  export const auth: Auth;
  export const db: Firestore;
  export const storage: FirebaseStorage;
}
