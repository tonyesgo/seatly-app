import Colors from '@/constants/Colors';
import { app } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const db = getFirestore(app);
const auth = getAuth(app);

export default function MyReservationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [userId, setUserId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setReservations([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchReservations = async () => {
      setLoading(true);

      try {
        const q = query(collection(db, 'reservations'), where('userId', '==', userId));
        const snap = await getDocs(q);

        const dataWithDetails = await Promise.all(
          snap.docs.map(async (docRes) => {
            const resData = docRes.data();

            const barSnap = await getDoc(doc(db, 'bars', resData.barId));
            const matchSnap = await getDoc(doc(db, 'matches', resData.matchId));

            const barName = barSnap.exists() ? barSnap.data().name : 'Bar desconocido';
            const matchData = matchSnap.exists() ? matchSnap.data() : null;

        let formattedDate = 'Fecha no disponible';

if (matchData?.date) {
  try {
    let dateObj;

    if (typeof matchData.date.toDate === 'function') {
      // Timestamp de Firebase
      dateObj = matchData.date.toDate();
    } else {
      // String o Date
      dateObj = new Date(matchData.date);
    }

    // Validar que la fecha sea válida
    if (!isNaN(dateObj.getTime())) {
      formattedDate = format(dateObj, "EEEE d 'de' MMMM, h:mm a", { locale: es });
    }
  } catch (err) {
    console.warn('Error al formatear la fecha:', err);
  }
}


            return {
              id: docRes.id,
              ...resData,
              barName,
              matchTeams: matchData?.teams || 'Partido desconocido',
              matchDate: formattedDate,
            };
          })
        );

        setReservations(dataWithDetails);
      } catch (error) {
        console.error('Error al buscar reservas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [userId]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.tabBackground }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Mis Reservas</Text>

        {loading ? (
          <Text style={[styles.text, { color: theme.text }]}>Cargando...</Text>
        ) : reservations.length === 0 ? (
          <Text style={[styles.text, { color: theme.text }]}>No tienes reservas registradas.</Text>
        ) : (
          reservations.map((res) => (
            <View key={res.id} style={[styles.card, { backgroundColor: theme.inputBackground }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{res.name}</Text>
              <Text style={[styles.cardText, { color: theme.text }]}>Personas: {res.people}</Text>
              <Text style={[styles.cardText, { color: theme.text }]}>Bar: {res.barName}</Text>
              <Text style={[styles.cardText, { color: theme.text }]}>Partido: {res.matchTeams}</Text>
              <Text style={[styles.cardText, { color: theme.text }]}>Fecha: {res.matchDate}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Black',
    marginBottom: 16,
  },
  text: {
    marginTop: 20,
    fontStyle: 'italic',
    fontFamily: 'Montserrat-ExtraBold',
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Black',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    fontFamily: 'Montserrat-ExtraBold',
    marginTop: 2,
  },
});
