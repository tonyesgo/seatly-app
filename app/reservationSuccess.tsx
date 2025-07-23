import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ReservationSuccess() {
  const { barName, matchTeams, name, people } = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ title: 'Reserva confirmada' }} />
      <View style={styles.container}>
        <Text style={styles.title}>✅ ¡Reserva exitosa!</Text>
        <Text style={styles.text}>Bar: {barName}</Text>
        <Text style={styles.text}>Partido: {matchTeams}</Text>
        <Text style={styles.text}>Nombre: {name}</Text>
        <Text style={styles.text}>Personas: {people}</Text>
        <Text style={styles.footer}>Nos vemos pronto 🍻</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
  footer: {
    marginTop: 30,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
