import Colors from '@/constants/Colors';
import { app } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const db = getFirestore(app);

export default function ConfirmedScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const barId = typeof params.barId === 'string' ? decodeURIComponent(params.barId) : null;
  const matchId = typeof params.matchId === 'string' ? decodeURIComponent(params.matchId) : null;

  const [resolvedBarName, setResolvedBarName] = useState<string | null>(
    params.barName ? decodeURIComponent(params.barName as string) : null
  );
  const [resolvedMatchTeams, setResolvedMatchTeams] = useState<string | null>(
    params.matchTeams ? decodeURIComponent(params.matchTeams as string) : null
  );
  const decodedDate = params.matchDate ? decodeURIComponent(params.matchDate as string) : '';
  const peopleCount = parseInt(params.people as string || '1');

  useEffect(() => {
    const fetchFallbackNames = async () => {
      if (!resolvedBarName && barId) {
        const barDoc = await getDoc(doc(db, 'bars', barId));
        if (barDoc.exists()) {
          setResolvedBarName(barDoc.data().name || 'bar');
        }
      }

      if (!resolvedMatchTeams && matchId) {
        const matchDoc = await getDoc(doc(db, 'matches', matchId));
        if (matchDoc.exists()) {
          setResolvedMatchTeams(matchDoc.data().teams || 'partido');
        }
      }
    };

    fetchFallbackNames();
  }, [barId, matchId]);

  return (
    <View style={[styles.container, { backgroundColor: theme.tabBackground }]}>
      <Text style={[styles.emoji, { fontSize: 80 }]}>✅</Text>
      <Text style={[styles.title, { color: theme.text }]}>¡Reserva confirmada!</Text>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        Has reservado {peopleCount} persona{peopleCount > 1 ? 's' : ''} para ver{' '}
        {resolvedMatchTeams || 'partido'} en {resolvedBarName || 'bar'}.
      </Text>

      {decodedDate ? (
        <Text style={[styles.date, { color: theme.text }]}>
          Fecha del partido: {decodedDate}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.button, marginTop: 30 }]}
        onPress={() => router.replace('/myreservations')}
      >
        <Text style={[styles.buttonText, { color: theme.buttonText }]}>
          Ver mis reservas
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Montserrat-Black',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
    marginBottom: 12,
  },
  date: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Black',
    textAlign: 'center',
  },
});
