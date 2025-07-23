import Colors from '@/constants/Colors';
import { app } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack, useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';


const db = getFirestore(app);

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [search, setSearch] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);

      // Obtener partidos
      const matchesSnap = await getDocs(collection(db, 'matches'));
      const matchesData = matchesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMatches(matchesData);

      // Obtener bares
      const barsSnap = await getDocs(collection(db, 'bars'));
      const barsData = barsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBars(barsData);
    } catch (error) {
      console.error('Error fetching data from Firebase:', error);
    } finally {
      setLoading(false);
    }
  };
<Stack.Screen options={{ headerShown: false }} />


  useEffect(() => {
    fetchData();
  }, []);

  const getPromotionsForMatch = async (match: any) => {
    const barList = match.broadcastBars || [];

    const barsWithPromos = await Promise.all(
      barList.map(async (bar: any) => {
        const barDoc = bars.find((b) => b.id === bar.barId);
        if (!barDoc) return null;

        let promoData = null;
        if (bar.promotionId) {
          const promoRef = doc(
            db,
            'bars',
            bar.barId,
            'defaultPromotions',
            bar.promotionId
          );
          const promoSnap = await getDoc(promoRef);
          if (promoSnap.exists()) {
            promoData = promoSnap.data();
          }
        }

        return {
          ...barDoc,
          capacity: bar.capacity,
          promotion: promoData,
        };
      })
    );

    return barsWithPromos.filter(Boolean);
  };

  const [filteredBars, setFilteredBars] = useState<any[]>([]);

  useEffect(() => {
    const loadPromos = async () => {
      if (!selectedMatch) {
        setFilteredBars([]);
        return;
      }

      const bars = await getPromotionsForMatch(selectedMatch);
      setFilteredBars(bars);
    };

    loadPromos();
  }, [selectedMatch]);

  const filteredMatches = matches.filter((match) =>
    match.teams?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.tabBackground }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 5 }]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} />
        }
      >
        <Text style={[styles.appTitle, { color: theme.tabBarActiveTintColor }]}>
          IDO10S
        </Text>

        <Text style={[styles.title, { color: theme.text }]}>¿Qué partido quieres ver?</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, fontFamily: 'Montserrat-Black' }]}
          placeholder="Buscar partido (ej. Tigres vs Rayados)"
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />

        {filteredMatches.map((match) => {
          let readableDate = '';
          try {
            if (match.date?.toDate) {
              readableDate = match.date.toDate().toLocaleString('es-MX', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });
            }
          } catch (err) {
            console.warn('Error al formatear la fecha', err);
          }

          return (
            <TouchableOpacity
              key={match.id}
              style={[
                styles.card,
                { backgroundColor: selectedMatch?.id === match.id ? '#dbeafe' : theme.tabBackground },
              ]}
              onPress={() => setSelectedMatch(match)}
            >
              <Text style={[styles.cardTitle, { color: theme.text }]}>{match.teams}</Text>
              <Text style={[styles.cardDate, { color: '#666' }]}>{readableDate}</Text>
            </TouchableOpacity>
          );
        })}

        {selectedMatch && (
          <View style={styles.barsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Bares que transmiten:
            </Text>
            <Text style={[{ marginBottom: 10, color: theme.text, fontFamily: 'Montserrat-Black' }]}>
              Mostrando {filteredBars.length} bares
            </Text>

            {filteredBars.length > 0 ? (
              <>
                {filteredBars.map((bar) => (
                  <View key={bar.id} style={[styles.card, { backgroundColor: theme.tabBackground }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{bar.name}</Text>
                    <Text style={[styles.cardDate, { color: '#666' }]}>{bar.location}</Text>
                    {bar.promotion && (
  <>
    <Text style={[styles.cardDate, { color: theme.tabBarActiveTintColor }]}>
      💵 ${bar.promotion.price}
    </Text>
    <Text style={[styles.cardDate, { color: theme.tabBarActiveTintColor }]}>
      🧾 {bar.promotion.included}
    </Text>
  </>
)}

                    <TouchableOpacity
                      style={[styles.reserveButton, { backgroundColor: theme.button }]}
                      onPress={() =>
                        router.push(`/reserve?barId=${bar.id}&matchId=${selectedMatch.id}`)
                      }
                    >
                      <Text style={[styles.reserveButtonText, { color: theme.buttonText }]}>
                        Reservar mesa
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={[styles.sectionTitle, { marginTop: 30, color: theme.text }]}>
                  Mapa de bares
                </Text>
                <View style={{ marginBottom: 140 }}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: Number(filteredBars[0]?.lat) || 25.6866,
                      longitude: Number(filteredBars[0]?.lng) || -100.3161,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }}
                  >
                    {filteredBars.map((bar) => {
                      const lat = Number(bar.lat);
                      const lng = Number(bar.lng);

                      if (isNaN(lat) || isNaN(lng)) return null;

                      return (
                        <Marker
                          key={bar.id}
                          coordinate={{
                            latitude: lat,
                            longitude: lng,
                          }}
                          title={bar.name}
                          description={bar.location}
                        />
                      );
                    })}
                  </MapView>
                </View>
              </>
            ) : (
              <Text style={[styles.noBars, { color: theme.text }]}>
                No hay bares registrados para este partido.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    padding: 10,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: 'Montserrat-ExtraBold',
    marginBottom: 5,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat-Black',
    marginBottom: 10,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Black',
  },
  cardDate: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Montserrat-Black',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-ExtraBold',
    marginTop: 30,
    marginBottom: 8,
  },
  noBars: {
    marginTop: 8,
    fontStyle: 'italic',
    fontFamily: 'Montserrat-Black',
  },
  barsContainer: {
    marginTop: 10,
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 160,
  },
  reserveButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reserveButtonText: {
    textAlign: 'center',
    fontFamily: 'Montserrat-ExtraBold',
  },
});
