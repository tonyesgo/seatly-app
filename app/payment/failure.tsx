// app/payment/failure.tsx

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export default function PaymentFailure() {
  const router = useRouter();

  useEffect(() => {
    Alert.alert(
      'Pago rechazado',
      'Tu pago no fue procesado. Puedes intentarlo nuevamente.',
      [{ text: 'OK', onPress: () => router.replace('/reserve') }]
    );
  }, []);

  return null;
}
