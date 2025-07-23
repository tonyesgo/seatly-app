// app/payment/pending.tsx

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert } from 'react-native';

export default function PaymentPending() {
  const router = useRouter();

  useEffect(() => {
    Alert.alert(
      'Pago en proceso',
      'Tu pago está siendo procesado. Recibirás confirmación pronto.',
      [{ text: 'OK', onPress: () => router.replace('/tabs/userpanel') }]
    );
  }, []);

  return null;
}
