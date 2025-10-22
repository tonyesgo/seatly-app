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

// 🔹 Dominio de tu dashboard (Next.js en Vercel)
const DASHBOARD_BASE_URL = 'https://admin.seatlyapp.com';

export default function PaymentSuccess() {
  const router = useRouter();
  const { reservationId, rid, payment_id, collection_id, collection_status } =
    useLocalSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        return;
      }

      try {
        // 1️⃣ Obtener reservationId del deep link
        let reservationIdParam = String(reservationId || rid || '');

        // 2️⃣ Determinar paymentId
        const maybePaymentId =
          (payment_id as string) ||
          (collection_status === 'approved' ? (collection_id as string) : '');

        if (!maybePaymentId) {
          Alert.alert('Pago en proceso', 'Aún no recibimos el ID de pago.');
          return;
        }

        // 3️⃣ Verificar en backend que el pago esté aprobado
        const verifyRes = await fetch(
          `${DASHBOARD_BASE_URL}/api/verifyPayment?payment_id=${encodeURIComponent(
            maybePaymentId
          )}`
        );
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(
            `Error verificando pago: ${JSON.stringify(verifyData)}`
          );
        }

        if (verifyData.status !== 'approved') {
          Alert.alert('Pago en proceso', 'Tu pago aún no está aprobado');
          router.replace(
            `/payment/pending?reservationId=${encodeURIComponent(
              reservationIdParam || 'unknown'
            )}`
          );
          return;
        }

        // 4️⃣ Usar external_reference si no llegó reservationId
        if (!reservationIdParam && verifyData.external_reference) {
          reservationIdParam = String(verifyData.external_reference);
        }

        if (!reservationIdParam) {
          throw new Error('No se pudo determinar reservationId');
        }

        // 5️⃣ Buscar la reserva
        const resRef = doc(db, 'reservations', reservationIdParam);
        const resSnap = await getDoc(resRef);
        if (!resSnap.exists()) throw new Error('Reserva no encontrada');

        const resData = resSnap.data() as any;

        // 🔄 Idempotencia: si ya está confirmada, redirigir
        if (resData.status === 'confirmed' && resData.paid === true) {
          router.replace(
            `/payment/confirmed?barName=${encodeURIComponent(
              resData.barName || ''
            )}` +
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

        // 6️⃣ Obtenemos la configuración del partido (para saber qué mesas están habilitadas)
        const matchSnap = await getDoc(doc(db, 'matches', matchId as string));
        if (!matchSnap.exists()) throw new Error('Partido no encontrado');
        const matchData = matchSnap.data() as any;
        const broadcastBars = matchData.broadcastBars || [];
        const barConfig = broadcastBars.find((b: any) => b.barId === barId);

        if (!barConfig || !Array.isArray(barConfig.tableIds)) {
          throw new Error('El bar no tiene mesas habilitadas para este partido');
        }

        const enabledTableIds: string[] = barConfig.tableIds;

        // 7️⃣ Obtenemos todas las mesas del bar
        const tablesSnap = await getDocs(collection(db, 'bars', barId, 'tables'));
        const allTables = tablesSnap.docs.map((d) => ({
          id: d.id,
          capacity: Number(d.data().capacity || 0),
          status: d.data().status || 'active',
        }));

        // 8️⃣ Filtramos solo las mesas habilitadas y activas
        const availableTables = allTables.filter(
          (t) => enabledTableIds.includes(t.id) && t.status !== 'inactive'
        );

        // 9️⃣ Excluimos las mesas ya reservadas (pending o confirmed)
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

        const freeTables = availableTables
          .filter((t) => !reservedIds.has(t.id))
          .sort((a, b) => a.capacity - b.capacity);

        if (!freeTables.length) {
          throw new Error('No hay mesas disponibles');
        }

        // 🔟 Asignación optimizada: mesa más pequeña donde quepan todos
        const singleTable = freeTables
          .filter((t) => t.capacity >= peopleCount)
          .sort((a, b) => a.capacity - b.capacity)[0];

        if (!singleTable) {
          Alert.alert(
            'Error',
            'No hay ninguna mesa disponible que tenga capacidad suficiente.'
          );
          return;
        }

        const assigned = [singleTable.id];

        // 1️⃣1️⃣ Confirmamos reserva
        await updateDoc(resRef, {
          tableIds: assigned,
          paid: true,
          status: 'confirmed',
          paymentId: String(maybePaymentId),
          updatedAt: serverTimestamp(),
        });

        // 1️⃣2️⃣ Formatear fecha del partido
        let matchDateFormatted = '';
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

        // 1️⃣3️⃣ Redirigir a confirmación
        router.replace(
          `/payment/confirmed?barName=${encodeURIComponent(barName || '')}` +
            `&matchTeams=${encodeURIComponent(matchTeams || '')}` +
            `&people=${encodeURIComponent(String(peopleCount))}` +
            (matchDateFormatted
              ? `&matchDate=${encodeURIComponent(matchDateFormatted)}`
              : '')
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
