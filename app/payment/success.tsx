// app/payment/success.tsx
import { app } from '@/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect } from 'react';
import { Alert } from 'react-native';

const db = getFirestore(app);
const auth = getAuth(app);

// Usa tu dominio público del dashboard
const DASHBOARD_BASE_URL = 'https://admin.seatlyapp.com';

export default function PaymentSuccess() {
  const router = useRouter();

  const {
    reservationId,
    rid,
    payment_id,
    collection_id,
    collection_status,
  } = useLocalSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      try {
        // 1) reservationId desde deep link (acepta reservationId o rid)
        const reservationIdParam = String(reservationId || rid || '');
        if (!reservationIdParam) throw new Error('Falta reservationId en el deep link');

        // 2) Determinar paymentId (MP puede mandar collection_id/collection_status)
        const maybePaymentId =
          (payment_id as string) ||
          (collection_status === 'approved' ? (collection_id as string) : '');

        if (!maybePaymentId) {
          Alert.alert('Pago en proceso', 'Aún no recibimos el ID de pago.');
          router.replace(`/payment/pending?reservationId=${encodeURIComponent(reservationIdParam)}`);
          return;
        }

        // 3) Verificar en backend que el pago esté aprobado
        const verifyRes = await fetch(
          `${DASHBOARD_BASE_URL}/api/verifyPayment?payment_id=${encodeURIComponent(maybePaymentId)}`
        );
        const verifyData = await verifyRes.json();

        if (verifyData.status !== 'approved') {
          Alert.alert('Pago en proceso', 'Tu pago aún no está aprobado');
          router.replace(`/payment/pending?reservationId=${encodeURIComponent(reservationIdParam)}`);
          return;
        }

        // 4) Cargar la reserva pending que ya creaste antes de pagar
        const resRef = doc(db, 'reservations', reservationIdParam);
        const resSnap = await getDoc(resRef);
        if (!resSnap.exists()) throw new Error('Reserva no encontrada');

        const resData = resSnap.data() as any;

        // Idempotencia: si ya estaba confirmada, redirige directo
        if (resData.status === 'confirmed' && resData.paid === true) {
          router.replace(
            `/payment/confirmed?barName=${encodeURIComponent(resData.barName || '')}` +
              `&matchTeams=${encodeURIComponent(resData.matchTeams || '')}` +
              `&people=${encodeURIComponent(String(resData.people || 1))}`
          );
          return;
        }

        const { barId, matchId, people, barName, matchTeams } = resData;
        const peopleCount = Number(people || 0);
        if (!barId || !matchId || !peopleCount) {
          throw new Error('Reserva incompleta (barId/matchId/people faltan)');
        }

        // 5) Mesas disponibles (excluye confirmed y pending con tableIds asignadas)
        const tablesSnap = await getDocs(collection(db, 'bars', barId, 'tables'));
        const allTables = tablesSnap.docs.map((d) => ({
          id: d.id,
          capacity: Number(d.data().capacity || 0),
        }));

        const resSameMatchBar = await getDocs(
          query(
            collection(db, 'reservations'),
            where('matchId', '==', matchId),
            where('barId', '==', barId),
            where('status', 'in', ['confirmed', 'pending'])
          )
        );

        const reservedIds = new Set(
          resSameMatchBar.docs.flatMap((d) => {
            const data = d.data() as any;
            return Array.isArray(data.tableIds) ? data.tableIds : [];
          })
        );

        const freeTables = allTables.filter((t) => !reservedIds.has(t.id));

        // 👉 Ordenar mesas por capacidad ascendente (más chicas primero)
        freeTables.sort((a, b) => a.capacity - b.capacity);

        // 6) Asignación optimizada
        let assigned: string[] = [];

        // (a) Intentar con una sola mesa que cubra a todos
        const singleTable = freeTables.find((t) => t.capacity >= peopleCount);
        if (singleTable) {
          assigned = [singleTable.id];
        } else {
          // (b) Combinar varias mesas chicas hasta cubrir
          let remaining = peopleCount;
          for (const t of freeTables) {
            if (remaining <= 0) break;
            assigned.push(t.id);
            remaining -= t.capacity;
          }
          if (remaining > 0) {
            Alert.alert('Error', 'No hay mesas suficientes para esta reserva');
            return;
          }
        }

        // 7) Actualizar esta misma reserva como confirmada
        await updateDoc(resRef, {
          tableIds: assigned,
          paid: true,
          status: 'confirmed',
          paymentId: String(maybePaymentId),
          updatedAt: serverTimestamp(),
        });

        // 8) (Opcional) Formatear fecha del partido para mostrarla en la confirmación
        let matchDateFormatted = '';
        const matchSnap = await getDoc(doc(db, 'matches', matchId as string));
        if (matchSnap.exists()) {
          const matchData = matchSnap.data() as any;
          const rawDate = matchData?.date?.toDate?.() || new Date(matchData?.date);
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

        // 9) Redirigir a confirmación
        router.replace(
          `/payment/confirmed?barName=${encodeURIComponent(barName || '')}` +
            `&matchTeams=${encodeURIComponent(matchTeams || '')}` +
            `&people=${encodeURIComponent(String(peopleCount))}` +
            (matchDateFormatted ? `&matchDate=${encodeURIComponent(matchDateFormatted)}` : '')
        );
      } catch (error) {
        console.error('❌ Error en payment/success:', error);
        Alert.alert('Error', 'No se pudo confirmar la reserva');
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
