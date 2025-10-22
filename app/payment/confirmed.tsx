// app/payment/confirmed.tsx
import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedText } from '@/components/ui/ThemedText';
import { ThemedView } from '@/components/ui/ThemedView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function PaymentConfirmed() {
  const router = useRouter();
  const { barName, matchTeams, people, matchDate } = useLocalSearchParams();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        🎉 ¡Reserva Confirmada!
      </ThemedText>

      <ThemedText style={styles.label}>Bar: {barName}</ThemedText>
      <ThemedText style={styles.label}>Partido: {matchTeams}</ThemedText>
      <ThemedText style={styles.label}>Personas: {people}</ThemedText>
      {matchDate && (
        <ThemedText style={styles.label}>Fecha: {matchDate}</ThemedText>
      )}

      <ThemedButton onPress={() => router.push('/tabs/myreservations')} style={styles.button}>
  <ThemedText style={{ textAlign: 'center' }}>Ir a mis reservas</ThemedText>
</ThemedButton>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    marginTop: 32,
    width: '80%',
  },
});
