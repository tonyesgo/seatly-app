import { ThemedButton } from '@/components/ui/ThemedButton';
import Colors from '@/constants/Colors';
import { app } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMercadoPago } from '@/hooks/useMercadoPago';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const db = getFirestore(app);
const auth = getAuth(app);

interface Table {
  id: string;
  capacity: number;
}

export default function ReserveScreen() {
  const { barId, matchId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { createPreference } = useMercadoPago();

  const [bar, setBar] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [promo, setPromo] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [people, setPeople] = useState('');
  const [phone, setPhone] = useState('');
  const [currentReservations, setCurrentReservations] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Reservar mesa',
      headerBackVisible: true,
      headerBackTitle: 'Inicio',
      headerStyle: { backgroundColor: theme.tabBackground, shadowColor: 'transparent', elevation: 0 },
      headerTitleStyle: { color: theme.text, fontWeight: 'bold' },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setName(authUser.displayName || '');

        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as { phone?: string };
          setPhone(userData.phone || '');
        }
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchBarAndMatch = async () => {
      if (barId) {
        const barSnap = await getDoc(doc(db, 'bars', barId as string));
        if (barSnap.exists()) setBar(barSnap.data());
      }

      if (matchId) {
        const matchSnap = await getDoc(doc(db, 'matches', matchId as string));
        if (matchSnap.exists()) setMatch(matchSnap.data());

        const promoSnap = await getDoc(doc(db, 'matches', matchId as string, 'promotions', barId as string));
        setPromo(promoSnap.exists() ? promoSnap.data() : null);

        const q = query(
          collection(db, 'reservations'),
          where('barId', '==', barId),
          where('matchId', '==', matchId)
        );
        const snapshot = await getDocs(q);
        const total = snapshot.docs.reduce((sum, d) => sum + (d.data().people || 0), 0);
        setCurrentReservations(total);
      }
    };
    fetchBarAndMatch();
  }, [barId, matchId]);

  // 🔹 Verifica disponibilidad, pero NO asigna mesas aún
  const checkAvailability = async (peopleCount: number): Promise<boolean> => {
    const matchDoc = await getDoc(doc(db, 'matches', matchId as string));
    const matchData = matchDoc.exists() ? matchDoc.data() : null;
    if (!matchData) return false;

    const broadcastBars: any[] = matchData.broadcastBars || [];
    const barConfig = broadcastBars.find((b) => b.barId === barId);
    if (!barConfig || !Array.isArray(barConfig.tableIds)) return false;

    const tablesDisponibles = barConfig.tableIds;

    const allTablesSnap = await getDocs(collection(db, 'bars', barId as string, 'tables'));
    const allTables: Table[] = allTablesSnap.docs.map((d) => ({
      id: d.id,
      capacity: d.data().capacity,
    }));

    const availableTables = allTables.filter((t) => tablesDisponibles.includes(t.id));

    const resSnap = await getDocs(query(
      collection(db, 'reservations'),
      where('matchId', '==', matchId),
      where('barId', '==', barId),
      where('status', 'in', ['pending', 'confirmed']) // 🔹 tomamos en cuenta las reservas pendientes y confirmadas
    ));

    const reservedTableIds = resSnap.docs
      .flatMap((d) => d.data().tableIds || []);

    const freeTables = availableTables
      .filter((t) => !reservedTableIds.includes(t.id))
      .sort((a, b) => a.capacity - b.capacity);

    let remaining = peopleCount;

    for (const table of freeTables) {
      remaining -= table.capacity;
      if (remaining <= 0) return true;
    }

    return false;
  };

  const handleReservation = async () => {
    if (!user) return;

    const peopleCount = parseInt(people);

    if (!name || !people || !phone) {
      Alert.alert('Completa todos los campos');
      return;
    }
    if (isNaN(peopleCount) || peopleCount <= 0) {
      Alert.alert('El número de personas debe ser mayor a 0');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      Alert.alert('Teléfono inválido', 'Ingresa un número de 10 dígitos');
      return;
    }
    if (!promo || typeof promo.price !== 'number') {
      Alert.alert('Error', 'Este bar aún no ha definido una promoción para este partido.');
      return;
    }

    // 🔹 Paso extra: verificar disponibilidad antes de crear reserva
    const hasAvailability = await checkAvailability(peopleCount);
    if (!hasAvailability) {
      Alert.alert('Capacidad excedida', 'Ya no hay suficientes mesas disponibles.');
      return;
    }

    const pricePerPerson = promo.price;

    try {
      // 1) Generamos un id de reserva
      const reservationId = doc(collection(db, 'reservations')).id;

      // 2) Guardamos reserva PENDING en Firestore (sin tableIds aún)
      await setDoc(doc(db, 'reservations', reservationId), {
        id: reservationId,
        status: 'pending',
        paid: false,
        createdAt: serverTimestamp(),
        userId: user.uid,
        userEmail: user.email || '',
        name,
        phone,
        barId,
        barName: bar?.name ?? '',
        matchId,
        matchTeams: match?.teams ?? '',
        people: peopleCount,
        pricePerPerson,
        totalPrice: peopleCount * pricePerPerson,
        source: 'app',
      });

      // 3) Creamos preferencia en MP
      const paymentUrl = await createPreference({
        title: `Reserva en ${bar?.name ?? ''} - ${match?.teams ?? ''}`,
        userEmail: user.email || '',
        barId: barId as string,
        matchId: matchId as string,
        people: peopleCount,
        pricePerPerson,
        reservationId,
      });

      // 4) Redirigimos a MP
      if (paymentUrl) {
        if (Platform.OS === 'web') {
          window.location.href = paymentUrl; 
        } else {
          router.push({
            pathname: '/payment/webview',
            params: {
              initPoint: paymentUrl,
              reservationId,
              barId: barId as string,
              matchId: matchId as string,
              people: String(peopleCount),
              pricePerPerson: String(pricePerPerson),
              userEmail: user.email || '',
              barName: bar?.name ?? '',
              matchTeams: match?.teams ?? '',
              name,
              phone,
            },
          });
        }
      } else {
        throw new Error('No se pudo generar el link de pago');
      }
    } catch (error) {
      console.error('Error al iniciar pago:', error);
      Alert.alert('Error', 'No se pudo iniciar el proceso de pago');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.tabBackground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {bar && match && (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Reservar en {bar.name}</Text>
              <Text style={[styles.subtitle, { color: theme.text }]}>Para ver: {match.teams}</Text>
              <ThemedButton onPress={() => router.push(`/bar/${barId}`)}>
                Más información del bar
              </ThemedButton>
              {promo && (
                <Text style={[styles.subtitle, { color: theme.text }]}>
                  Promoción: {promo.included} — ${promo.price}
                </Text>
              )}
            </>
          )}

          {!user ? (
            <>
              <Text style={[styles.subtitle, { color: theme.text, marginTop: 20 }]}>
                Debes iniciar sesión para continuar con tu reserva
              </Text>
              <ThemedButton
                onPress={() =>
                  router.push(
                    `/login?redirectTo=${encodeURIComponent(`/reserve?barId=${barId}&matchId=${matchId}`)}`
                  )
                }
              >
                Iniciar sesión o registrarse
              </ThemedButton>
            </>
          ) : (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Número de personas"
                placeholderTextColor="#999"
                value={people}
                onChangeText={setPeople}
                keyboardType="numeric"
              />

              <ThemedButton onPress={handleReservation}>
                Pagar y reservar
              </ThemedButton>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  title: { fontSize: 22, fontFamily: 'Montserrat-Black', marginBottom: 4 },
  subtitle: { fontSize: 16, fontFamily: 'Montserrat-ExtraBold', marginBottom: 10 },
  input: { padding: 12, borderRadius: 8, marginBottom: 15, fontFamily: 'Montserrat-ExtraBold' },
});
