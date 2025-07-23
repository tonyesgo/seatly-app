import { app } from '@/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useEffect } from 'react';
import { Alert } from 'react-native';

const db = getFirestore(app);
const auth = getAuth(app);

export default function PaymentSuccess() {
  const router = useRouter();
  const {
    barId,
    matchId,
    name,
    phone,
    people,
    barName,
    matchTeams,
  } = useLocalSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      try {
        const peopleCount = parseInt(people as string);
        if (
          isNaN(peopleCount) ||
          !barId ||
          !matchId ||
          typeof name !== 'string' ||
          typeof phone !== 'string'
        ) {
          throw new Error('Parámetros inválidos');
        }

        // 1. Obtener mesas del bar
        const tablesSnap = await getDocs(collection(db, 'bars', barId as string, 'tables'));
        const allTables = tablesSnap.docs.map((doc) => ({
          id: doc.id,
          capacity: doc.data().capacity,
        }));

        // 2. Obtener mesas ya reservadas
        const resSnap = await getDocs(
          query(
            collection(db, 'reservations'),
            where('matchId', '==', matchId),
            where('barId', '==', barId)
          )
        );
        const reservedTableIds = new Set(
          resSnap.docs.flatMap((doc) => doc.data().tableIds || [])
        );
        const freeTables = allTables.filter((t) => !reservedTableIds.has(t.id));

        // 3. Asignar mesas según capacidad
        const assigned: string[] = [];
        let remaining = peopleCount;
        for (const table of freeTables) {
          if (remaining <= 0) break;
          assigned.push(table.id);
          remaining -= table.capacity;
        }

        if (remaining > 0) {
          Alert.alert('Error', 'No hay mesas suficientes para esta reserva');
          return;
        }

        // 4. Guardar reserva en Firestore
        await addDoc(collection(db, 'reservations'), {
          userId: user.uid,
          barId,
          matchId,
          name,
          phone,
          people: peopleCount,
          tableIds: assigned,
          createdAt: serverTimestamp(),
        });

        // 5. Formatear fecha
        let matchDateFormatted = '';
        const matchSnap = await getDoc(doc(db, 'matches', matchId as string));
        if (matchSnap.exists()) {
          const matchData = matchSnap.data();
          const rawDate = matchData.date?.toDate?.() || new Date(matchData.date);
          if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
            matchDateFormatted = rawDate.toLocaleString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        }

        // 6. Redirigir a pantalla de confirmación
        router.replace(
          `/payment/confirmed?barName=${encodeURIComponent(
            barName as string
          )}&matchTeams=${encodeURIComponent(
            matchTeams as string
          )}&people=${people}&matchDate=${encodeURIComponent(matchDateFormatted)}`
        );
      } catch (error) {
        console.error('❌ Error guardando reserva:', error);
        Alert.alert('Error', 'No se pudo guardar la reserva');
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
