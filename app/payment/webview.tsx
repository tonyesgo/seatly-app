import { app } from '@/firebaseConfig';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getFirestore, runTransaction } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { WebView } from 'react-native-webview';

const db = getFirestore(app);

export default function PaymentWebView() {
  const { initPoint, reservationId } = useLocalSearchParams<{ initPoint: string; reservationId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const finalizeReservation = useCallback(async () => {
    const ref = doc(db, 'reservations', String(reservationId));
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data?.paid === true && data?.status === 'confirmed') return; // idempotente
      tx.update(ref, { paid: true, status: 'confirmed', clientConfirmedAt: new Date() });
    });
  }, [reservationId]);

  // **SINCRÓNICO**: devuelve boolean; los efectos async se lanzan y luego retornamos
  const handleShouldStart = useCallback((req: any): boolean => {
    const url: string = req?.url || '';

    // Deep link: seatly://payment/success?rid=...
    if (url.startsWith('seatly://payment/success')) {
      try {
        const parsed = Linking.parse(url);
        const rid = (parsed.queryParams?.rid as string) || String(reservationId);
        (async () => {
          try {
            if (rid) await finalizeReservation();
            router.replace({ pathname: '/payment/confirmed', params: { reservationId: String(reservationId) } });
          } catch {
            Alert.alert('Pago', 'Pago aprobado, pero hubo un detalle al confirmar. Revisa “Mis reservas”.');
            router.replace('/myreservations');
          }
        })();
      } catch {
        // ignore
      }
      return false; // evita que la WebView intente abrir el scheme
    }

    // Back URL HTTP(S): .../payment/success?rid=...
    if (url.includes('/payment/success')) {
      (async () => {
        await finalizeReservation();
        router.replace({ pathname: '/payment/confirmed', params: { reservationId: String(reservationId) } });
      })();
      return false;
    }

    if (url.includes('/payment/failure') || url.startsWith('seatly://payment/failure')) {
      router.replace('/payment/failure');
      return false;
    }
    if (url.includes('/payment/pending') || url.startsWith('seatly://payment/pending')) {
      router.replace('/payment/pending');
      return false;
    }

    return true; // permitir otras navegaciones
  }, [finalizeReservation, reservationId, router]);

  // Respaldo (no bloquea navegación, solo detecta y redirige)
  const handleNavChange = useCallback((navState: any) => {
    handleShouldStart(navState);
  }, [handleShouldStart]);

  if (!initPoint || typeof initPoint !== 'string') return null;

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <ActivityIndicator size="large" style={{ position: 'absolute', top: '50%', alignSelf: 'center', zIndex: 1 }} />
      )}
      <WebView
        source={{ uri: initPoint }}
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={handleShouldStart} // ✅ ahora es sincrónico
        onNavigationStateChange={handleNavChange}        // respaldo
        startInLoadingState
      />
    </View>
  );
}
