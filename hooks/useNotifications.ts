import { db } from '@/firebaseConfig';
import { isDevice } from 'expo-device'; // ✅ Import nombrado correcto
import * as Notifications from 'expo-notifications';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import * as React from 'react';
import { Platform } from 'react-native';

// 📌 Configurar cómo se muestran notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as Notifications.NotificationBehavior;
  },
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  try {
    if (isDevice) {
      console.log("📱 Dispositivo físico detectado");

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log("🔐 Estado de permisos existente:", existingStatus);

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("📥 Nuevo estado de permisos:", finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.warn('⚠️ No se otorgaron permisos de notificaciones');
        alert('No se pudieron habilitar las notificaciones');
        return;
      }

      // ✅ Obtener token Expo
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Expo push token generado:', token);
    } else {
      console.warn("⚠️ No es un dispositivo físico, no se puede generar token");
      alert('Las notificaciones requieren un dispositivo físico');
    }

    // 📌 Configuración Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log("⚙️ Canal de notificaciones Android configurado");
    }
  } catch (err) {
    console.error("❌ Error registrando notificaciones:", err);
  }

  return token;
}

// 📌 Hook que se ejecuta automáticamente si hay un usuario autenticado
export function useRegisterPushToken() {
  const auth = getAuth();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("👤 Estado de autenticación cambió:", user?.uid);

      if (user) {
        try {
          const token = await registerForPushNotificationsAsync();
          console.log("📲 Token recibido en hook:", token);

          if (token) {
            // ✅ Guardar token en Firestore en users/{uid}
            await setDoc(
              doc(db, 'users', user.uid),
              { expoPushToken: token },
              { merge: true }
            );
            console.log("✅ Token guardado en Firestore para usuario:", user.uid);
          } else {
            console.warn("⚠️ No se generó token para guardar en Firestore");
          }
        } catch (err) {
          console.error("❌ Error en hook useRegisterPushToken:", err);
        }
      }
    });
    return unsubscribe;
  }, []);
}
