// 👇 Declaración correcta para Map
declare module "@/components/Map" {
  import { ComponentType } from "react";

  const MapView: ComponentType<any>;
  export const Marker: ComponentType<any>;
  export const PROVIDER_GOOGLE: string;

  export default MapView;
}

// 👇 Aquí definimos bien el módulo de Firebase
declare module "firebase/auth/react-native" {
  import { Persistence } from "firebase/auth";

  // `getReactNativePersistence` devuelve un Persistence válido
  export function getReactNativePersistence(storage: any): Persistence;
}
// 👇 Definición para firebaseConfig
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
