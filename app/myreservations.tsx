import Colors from '@/constants/Colors';
import { auth, db } from "@/firebaseConfig";
import { useColorScheme } from '@/hooks/useColorScheme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ResItem = {
  id: string;
  barId: string;
  matchId: string;
  people: number;
  status?: string;
  paid?: boolean;
  barName: string;
  barLocation?: string;
  barLat?: number | null;
  barLng?: number | null;
  matchTeams: string;
  matchDateStr: string;
  matchDate?: Date | null;
  name?: string;
};

function getStatusBadge(res: ResItem) {
  const now = new Date();
  const isPast = res.matchDate ? res.matchDate.getTime() < now.getTime() : false;

  if (res.status === 'cancelled') {
    return { label: 'Cancelada', bg: '#EEE', fg: '#999' };
  }
  if (res.status === 'confirmed' && res.paid) {
    return isPast
      ? { label: 'Completada', bg: '#E6F7EE', fg: '#0F8F4D' }
      : { label: 'Confirmada', bg: '#E6F7EE', fg: '#0F8F4D' };
  }
  if (res.status === 'pending' && !res.paid) {
    return { label: 'Pendiente de pago', bg: '#FFF4E5', fg: '#B35C00' };
  }

  if (res.paid) {
    return isPast
      ? { label: 'Completada', bg: '#E6F7EE', fg: '#0F8F4D' }
      : { label: 'Confirmada', bg: '#E6F7EE', fg: '#0F8F4D' };
  }
  return { label: 'Pendiente', bg: '#FFF4E5', fg: '#B35C00' };
}

const openInMaps = (address?: string, lat?: number | null, lng?: number | null) => {
  let url = '';
  if (lat && lng) {
    url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  } else if (address) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  } else {
    return;
  }
  Linking.openURL(url);
};

export default function MyReservationsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [userId, setUserId] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ResItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
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

        const dataWithDetails: ResItem[] = await Promise.all(
          snap.docs.map(async (docRes) => {
            const resData: any = docRes.data();

            const barSnap = await getDoc(doc(db, 'bars', resData.barId));
            const matchSnap = await getDoc(doc(db, 'matches', resData.matchId));

            const barData: any = barSnap.exists() ? barSnap.data() : {};
            const barName = barData.name || 'Bar desconocido';

            const matchData = matchSnap.exists() ? (matchSnap.data() as any) : null;

            let matchDate: Date | null = null;
            if (matchData?.date) {
              try {
                if (typeof matchData.date?.toDate === 'function') {
                  matchDate = matchData.date.toDate();
                } else {
                  matchDate = new Date(matchData.date);
                }
                if (!(matchDate instanceof Date) || isNaN(matchDate.getTime())) {
                  matchDate = null;
                }
              } catch {
                matchDate = null;
              }
            }

            const matchDateStr = matchDate
              ? format(matchDate, "EEEE d 'de' MMMM, h:mm a", { locale: es })
              : 'Fecha no disponible';

            return {
              id: docRes.id,
              name: resData.name || 'Reservación',
              barId: resData.barId,
              matchId: resData.matchId,
              people: Number(resData.people || 0),
              status: resData.status,
              paid: !!resData.paid,
              barName,
              barLocation: barData.location || '',
              barLat: barData.coordinates?.lat ?? null,
              barLng: barData.coordinates?.lng ?? null,
              matchTeams: matchData?.teams || 'Partido desconocido',
              matchDateStr,
              matchDate,
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

  const { visibleList, emptyLabel } = useMemo(() => {
    const now = new Date();
    const active = reservations
      .filter((r) => {
        if (r.status === 'cancelled') return false;
        if (!r.matchDate) return false;
        return r.matchDate.getTime() >= now.getTime();
      })
      .sort((a, b) => (a.matchDate?.getTime() ?? 0) - (b.matchDate?.getTime() ?? 0));

    const past = reservations
      .filter((r) => {
        if (r.status === 'cancelled') return true;
        return !r.matchDate || r.matchDate.getTime() < now.getTime();
      })
      .sort((a, b) => (b.matchDate?.getTime() ?? 0) - (a.matchDate?.getTime() ?? 0));

    if (showPast) {
      return { visibleList: past, emptyLabel: 'No tienes reservas anteriores.' };
    } else {
      return { visibleList: active, emptyLabel: 'No tienes reservas activas.' };
    }
  }, [reservations, showPast]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.tabBackground }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Mis Reservas</Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            onPress={() => setShowPast(false)}
            style={[
              styles.toggleBtn,
              { borderColor: theme.tabBarActiveTintColor },
              !showPast ? { backgroundColor: theme.tabBarActiveTintColor } : { backgroundColor: 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                !showPast ? { color: theme.tabBackground } : { color: theme.text },
              ]}
            >
              Activas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPast(true)}
            style={[
              styles.toggleBtn,
              { borderColor: theme.tabBarActiveTintColor },
              showPast ? { backgroundColor: theme.tabBarActiveTintColor } : { backgroundColor: 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.toggleText,
                showPast ? { color: theme.tabBackground } : { color: theme.text },
              ]}
            >
              Anteriores
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingTop: 20, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text style={[styles.text, { color: theme.text, marginTop: 8 }]}>Cargando...</Text>
          </View>
        ) : visibleList.length === 0 ? (
          <Text style={[styles.text, { color: theme.text }]}>{emptyLabel}</Text>
        ) : (
          visibleList.map((res) => {
            const badge = getStatusBadge(res);
            return (
              <View key={res.id} style={[styles.card, { backgroundColor: theme.inputBackground }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {res.name || 'Reservación'}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
                  </View>
                </View>
                <Text style={[styles.cardText, { color: theme.text }]}>
                  Personas: {res.people}
                </Text>
                <Text style={[styles.cardText, { color: theme.text }]}>
                  Bar: {res.barName}
                </Text>
                <Text style={[styles.cardText, { color: theme.text }]}>
                  Partido: {res.matchTeams}
                </Text>
                <Text style={[styles.cardText, { color: theme.text }]}>
                  Fecha: {res.matchDateStr}
                </Text>

                {(res.barLat && res.barLng) || res.barLocation ? (
                  <TouchableOpacity
                    style={[styles.goButton, { backgroundColor: theme.tabBarActiveTintColor }]}
                    onPress={() => openInMaps(res.barLocation, res.barLat, res.barLng)}
                  >
                    <Text style={[styles.goButtonText, { color: theme.tabBackground }]}>
                      Ir al bar
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 22, fontFamily: 'Montserrat-Black', marginBottom: 12 },
  text: { marginTop: 20, fontStyle: 'italic', fontFamily: 'Montserrat-ExtraBold' },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  toggleText: { fontSize: 14, fontFamily: 'Montserrat-Black' },
  card: { padding: 15, borderRadius: 10, marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: { fontSize: 16, fontFamily: 'Montserrat-Black' },
  cardText: { fontSize: 14, fontFamily: 'Montserrat-ExtraBold', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontFamily: 'Montserrat-Black' },
  goButton: { marginTop: 10, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  goButtonText: { fontSize: 14, fontFamily: 'Montserrat-ExtraBold' },
});
