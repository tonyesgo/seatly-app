import { app } from '@/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, Platform, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const db = getFirestore(app);

export default function PaymentWebView() {
  const {
    initPoint,
    reservationId,
    barId,
    matchId,
    people,
    pricePerPerson,
    userEmail,
    barName,
    matchTeams,
    name,
    phone,
    tableIds,
  } = useLocalSearchParams<{
    initPoint: string;
    reservationId: string;
    barId: string;
    matchId: string;
    people: string;
    pricePerPerson: string;
    userEmail: string;
    barName: string;
    matchTeams: string;
    name: string;
    phone: string;
    tableIds: string;
  }>();

  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const finalizeReservation = useCallback(async () => {
    if (!reservationId) return;

    try {
      const ref = doc(db, 'reservations', String(reservationId));
      await setDoc(ref, {
        id: reservationId,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        userEmail: userEmail || '',
        name: name || '',
        phone: phone || '',
        barId,
        barName: barName ?? '',
        matchId,
        matchTeams: matchTeams ?? '',
        people: Number(people),
        pricePerPerson: Number(pricePerPerson),
        totalPrice: Number(pricePerPerson) * Number(people),
        paid: true,
        paymentId: null, // opcional: luego puedes guardar el id de MercadoPago
        source: 'app',
        clientConfirmedAt: new Date(),
        tableIds: tableIds ? JSON.parse(tableIds as string) : [], // ✅ guardamos las mesas asignadas
      });
    } catch (err) {
      console.error('Error guardando reserva confirmada:', err);
      throw err;
    }
  }, [reservationId, barId, matchId, people, pricePerPerson, userEmail, barName, matchTeams, name, phone, tableIds]);

  const handleShouldStart = useCallback(
    (req: any): boolean => {
      const url: string = req?.url || '';

      if (url.startsWith('seatly://payment/success') || url.includes('/payment/success')) {
        (async () => {
          try {
            await finalizeReservation();
            router.replace({ pathname: '/payment/confirmed', params: { reservationId: String(reservationId) } });
          } catch {
            Alert.alert('Pago', 'Pago aprobado, pero hubo un detalle al confirmar. Revisa “Mis reservas”.');
            router.replace('/myreservations');
          }
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

      return true;
    },
    [finalizeReservation, reservationId, router]
  );

  const handleNavChange = useCallback(
    (navState: any) => {
      handleShouldStart(navState);
    },
    [handleShouldStart]
  );

  if (!initPoint || typeof initPoint !== 'string') return null;

  // 🚨 Fallback para web: nunca intentes renderizar WebView
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ marginBottom: 20, fontSize: 16, textAlign: 'center' }}>
          Estás en la versión web. Haz clic en el botón de abajo para continuar con tu pago en MercadoPago:
        </Text>
        <Button title="Ir a MercadoPago" onPress={() => { window.location.href = String(initPoint); }} />
      </View>
    );
  }

  // ✅ En móvil sí usamos WebView
  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <ActivityIndicator size="large" style={{ position: 'absolute', top: '50%', alignSelf: 'center', zIndex: 1 }} />
      )}
      <WebView
        source={{ uri: initPoint }}
        onLoadEnd={() => setLoading(false)}
        onShouldStartLoadWithRequest={handleShouldStart}
        onNavigationStateChange={handleNavChange}
        startInLoadingState
      />
    </View>
  );
}
