// reserve.tsx

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
  TouchableOpacity,
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
      headerStyle: {
        backgroundColor: theme.tabBackground,
        shadowColor: 'transparent',
        elevation: 0,
      },
      headerTitleStyle: {
        color: theme.text,
        fontWeight: 'bold',
      },
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
        if (promoSnap.exists()) {
          setPromo(promoSnap.data());
        } else {
          setPromo(null);
        }

        const q = query(
          collection(db, 'reservations'),
          where('barId', '==', barId),
          where('matchId', '==', matchId)
        );
        const snapshot = await getDocs(q);
        const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().people || 0), 0);
        setCurrentReservations(total);
      }
    };

    fetchBarAndMatch();
  }, [barId, matchId]);

  const assignTables = async (peopleCount: number): Promise<string[] | null> => {
    const allTablesSnap = await getDocs(collection(db, 'bars', barId as string, 'tables'));
    const allTables: Table[] = allTablesSnap.docs.map((doc) => ({
      id: doc.id,
      capacity: doc.data().capacity,
    }));

    const resSnap = await getDocs(query(
      collection(db, 'reservations'),
      where('matchId', '==', matchId)
    ));

    const reservedTableIds = resSnap.docs.flatMap((doc) => doc.data().tableIds || []);
    const freeTables = allTables.filter((t: any) => !reservedTableIds.includes(t.id));

    const assigned: string[] = [];
    let remaining = peopleCount;

    for (const table of freeTables) {
      if (remaining <= 0) break;
      assigned.push(table.id);
      remaining -= table.capacity;
    }

    if (remaining > 0) return null;
    return assigned;
  };

  const handleReservation = async () => {
    if (!user) {
      Alert.alert(
        'Inicia sesión',
        'Debes iniciar sesión o crear una cuenta para hacer una reserva.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar sesión',
            onPress: () =>
              router.push(
                `/login?redirectTo=${encodeURIComponent(`/reserve?barId=${barId}&matchId=${matchId}`)}`
              ),
          },
        ]
      );
      return;
    }

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

    const tableIds = await assignTables(peopleCount);
    if (!tableIds) {
      Alert.alert('Capacidad excedida', 'Ya no hay suficientes mesas disponibles.');
      return;
    }

    const pricePerPerson = promo.price;

    try {
      const paymentUrl = await createPreference({
        title: `Reserva en ${bar?.name ?? ''} - ${match?.teams ?? ''}`,
        userEmail: user.email || '',
        barId: barId as string,
        matchId: matchId as string,
        name,
        phone,
        people: peopleCount,
        pricePerPerson,
        barName: bar?.name ?? '',
        matchTeams: match?.teams ?? '',
      });

      if (paymentUrl) {
        router.push({
          pathname: '/payment/webview',
          params: {
            initPoint: paymentUrl,
            barId: barId as string,
            matchId: matchId as string,
          },
        });
      } else {
        throw new Error('No se pudo generar el link de pago');
      }
    } catch (error) {
      console.error('Error al iniciar pago:', error);
      Alert.alert('Error', 'No se pudo iniciar el proceso de pago');
    }
  };

  const remaining = bar?.capacity ? bar.capacity - currentReservations : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.tabBackground }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {bar && match && (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Reservar en {bar.name}</Text>
              <Text style={[styles.subtitle, { color: theme.text }]}>Para ver: {match.teams}</Text>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => router.push(`/bar/${barId}`)}
              >
                <Text style={[styles.linkButtonText, { color: theme.tabBarActiveTintColor }]}>Más información del bar</Text>
              </TouchableOpacity>

              {promo && (
                <Text style={[styles.subtitle, { color: theme.text }]}>Promoción: {promo.included} — ${promo.price}</Text>
              )}
            </>
          )}

          {!user && (
            <>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Tu nombre"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder="Teléfono (10 dígitos)"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Número de personas"
            placeholderTextColor="#999"
            value={people}
            onChangeText={setPeople}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.button }]}
            onPress={handleReservation}
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>Pagar y reservar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Montserrat-Black',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-ExtraBold',
    marginBottom: 10,
  },
  availability: {
    fontSize: 14,
    fontFamily: 'Montserrat-ExtraBold',
    marginBottom: 20,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontFamily: 'Montserrat-ExtraBold',
  },
  button: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: 'Montserrat-Black',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 4,
    marginBottom: 16,
  },
  linkButtonText: {
    fontFamily: 'Montserrat-ExtraBold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
