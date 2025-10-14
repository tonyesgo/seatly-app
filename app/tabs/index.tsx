import MapView, { Marker, PROVIDER_GOOGLE } from '@/components/Map';
import Colors from '@/constants/Colors';
import { app } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const db = getFirestore(app);

type BarMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  promotion?: any;
  location?: string;
  icon?: string;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterSport, setFilterSport] = useState<string | null>(null);
  const [filterLeague, setFilterLeague] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterMunicipality, setFilterMunicipality] = useState<string | null>(null);

  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [bars, setBars] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredBars, setFilteredBars] = useState<any[]>([]);
  const [selectedBar, setSelectedBar] = useState<any | null>(null);

  const fetchData = async () => {
  try {
    setLoading(true);

    // ✅ Consulta ordenada por fecha ascendente
    const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'asc'));
    const matchesSnap = await getDocs(matchesQuery);

    const now = new Date();

    const matchesData = matchesSnap.docs
      .map((doc) => {
        const data = doc.data() as {
          date?: any;
          teams?: string;
          sport?: string;
          league?: string;
        };
        return { id: doc.id, ...data };
      })
      .filter((match) => {
        const matchDate = match.date?.toDate?.();
        return matchDate instanceof Date && matchDate >= now;
      });

    setMatches(matchesData);

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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadPromos = async () => {
      if (!selectedMatch) {
        if (mounted) setFilteredBars([]);
        return;
      }
      try {
        const list = await getPromotionsForMatch(selectedMatch);
        if (mounted) setFilteredBars(list);
      } catch (e) {
        console.log('loadPromos error:', e);
        if (mounted) setFilteredBars([]);
      }
    };
    loadPromos();
    return () => {
      mounted = false;
    };
  }, [selectedMatch, bars]);

  const getPromotionsForMatch = async (match: any) => {
    const barList = Array.isArray(match?.broadcastBars) ? match.broadcastBars : [];
    const results: any[] = [];
    for (const bar of barList) {
      try {
        const barDoc = bars.find((b) => b.id === bar?.barId);
        if (!barDoc) continue;

        let promoData: any = null;
        if (bar?.promotionId) {
          try {
            const promoRef = doc(
              db,
              'bars',
              String(bar.barId),
              'defaultPromotions',
              String(bar.promotionId)
            );
            const promoSnap = await getDoc(promoRef);
            if (promoSnap.exists()) promoData = promoSnap.data();
          } catch (e) {
            console.log('Promo fetch error:', e);
          }
        }

        results.push({
          ...barDoc,
          capacity: bar?.capacity ?? null,
          promotion: promoData,
        });
      } catch (e) {
        console.log('Bar processing error:', e);
      }
    }
    return results;
  };

  const sportsFromMatches = useMemo(
    () => Array.from(new Set(matches.map((m) => m.sport))).filter(Boolean),
    [matches]
  );

  const leaguesFromMatches = (sport: string) =>
    Array.from(new Set(matches.filter((m) => m.sport === sport).map((m) => m.league)))
      .filter(Boolean);

  const municipalitiesFromBars = useMemo(
    () =>
      Array.from(
        new Set(filteredBars.map((b) => b.address?.municipality?.trim()))
      ).filter(Boolean),
    [filteredBars]
  );

  const filteredBarsByMunicipality = useMemo(() => {
    if (!filterMunicipality) return filteredBars;
    return filteredBars.filter(
      (b) =>
        b.address?.municipality?.toLowerCase().trim() ===
        filterMunicipality.toLowerCase().trim()
    );
  }, [filteredBars, filterMunicipality]);

  const filteredMatches = matches.filter((match) => {
    let ok = true;
    if (search && !match.teams?.toLowerCase().includes(search.toLowerCase())) ok = false;
    if (filterSport && match.sport?.toLowerCase() !== filterSport.toLowerCase()) ok = false;
    if (filterLeague && match.league !== filterLeague) ok = false;
    if (filterDate && match.date?.toDate) {
      const matchDate = match.date.toDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (filterDate === "hoy" && matchDate.toDateString() !== today.toDateString()) ok = false;
      if (filterDate === "mañana") {
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        if (matchDate.toDateString() !== tomorrow.toDateString()) ok = false;
      }
      if (filterDate === "fin") {
        const day = matchDate.getDay();
        if (![5,6,0].includes(day)) ok = false;
      }
      if (filterDate === "7dias") {
        const week = new Date(today); week.setDate(today.getDate() + 7);
        if (matchDate < today || matchDate > week) ok = false;
      }
    }
    return ok;
  });

  const DATES = ["hoy", "mañana", "fin", "7dias"];

  return (
  <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
    <ScrollView
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      contentContainerStyle={[styles.container, { paddingBottom: 20 }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
    >
      {/* 👇 Logo Seatly completo */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <Image
          source={require("../../public/seatly-full.png")}
          style={{ width: 160, height: 80 }}
          resizeMode="contain"
        />
      </View>

        {/* Buscador */}
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
          placeholder="Buscar partido (ej. Tigres vs Rayados)"
          placeholderTextColor="#9D9C9E"
          value={search}
          onChangeText={setSearch}
        />

        {/* --- Filtros deportes --- */}
        <Text style={[styles.filterTitle, { color: theme.text }]}>FILTRAR POR DEPORTE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            {sportsFromMatches.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.chip,
                  {
                    backgroundColor: filterSport === s ? theme.tabBarActiveTintColor : theme.cardBackground,
                    borderColor: filterSport === s ? theme.tabBarActiveTintColor : theme.border,
                  },
                ]}
                onPress={() => { setFilterSport(filterSport === s ? null : s); setFilterLeague(null); }}
              >
                <Text style={{ color: filterSport === s ? theme.buttonText : theme.text }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* --- Filtros liga --- */}
        {filterSport && (
          <>
            <Text style={[styles.filterTitle, { color: theme.text }]}>FILTRAR POR LIGA</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                {leaguesFromMatches(filterSport).map((l) => (
                  <TouchableOpacity
                    key={l}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: filterLeague === l ? theme.tabBarActiveTintColor : theme.cardBackground,
                        borderColor: filterLeague === l ? theme.tabBarActiveTintColor : theme.border,
                      },
                    ]}
                    onPress={() => setFilterLeague(filterLeague === l ? null : l)}
                  >
                    <Text style={{ color: filterLeague === l ? theme.buttonText : theme.text }}>{l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        )}

        {/* --- Filtros fecha --- */}
        <Text style={[styles.filterTitle, { color: theme.text }]}>FILTRAR POR FECHA</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
          {DATES.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.chip,
                {
                  backgroundColor: filterDate === d ? theme.tabBarActiveTintColor : theme.cardBackground,
                  borderColor: filterDate === d ? theme.tabBarActiveTintColor : theme.border,
                },
              ]}
              onPress={() => setFilterDate(filterDate === d ? null : d)}
            >
              <Text style={{ color: filterDate === d ? theme.buttonText : theme.text }}>{d.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Lista de partidos --- */}
        {filteredMatches.map((match) => {
          let readableDate = '';
          try {
            if (match.date?.toDate) {
              readableDate = match.date.toDate().toLocaleString('es-MX', {
                weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
              });
            }
          } catch {}
          return (
            <TouchableOpacity
              key={match.id}
              style={[
                styles.card,
                { backgroundColor: selectedMatch?.id === match.id ? '#dbeafe' : theme.cardBackground },
              ]}
              onPress={() => setSelectedMatch(match)}
            >
              <Text style={[styles.cardTitle, { color: theme.text }]}>{match.teams}</Text>
              <Text style={[styles.cardDate, { color: theme.secondaryText }]}>{readableDate}</Text>
              {(match.sport || match.league) && (
                <Text style={{ fontSize: 13, color: theme.secondaryText }}>
                  {match.sport} {match.league ? `· ${match.league}` : ""}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* --- Lista de bares + filtro municipio --- */}
        {selectedMatch && (
          <View style={styles.barsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Bares que transmiten:</Text>

            {municipalitiesFromBars.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        backgroundColor: !filterMunicipality ? theme.tabBarActiveTintColor : theme.cardBackground,
                        borderColor: !filterMunicipality ? theme.tabBarActiveTintColor : theme.border,
                      },
                    ]}
                    onPress={() => setFilterMunicipality(null)}
                  >
                    <Text style={{ color: !filterMunicipality ? theme.buttonText : theme.text }}>Todos</Text>
                  </TouchableOpacity>
                  {municipalitiesFromBars.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: filterMunicipality === m ? theme.tabBarActiveTintColor : theme.cardBackground,
                          borderColor: filterMunicipality === m ? theme.tabBarActiveTintColor : theme.border,
                        },
                      ]}
                      onPress={() => setFilterMunicipality(filterMunicipality === m ? null : m)}
                    >
                      <Text style={{ color: filterMunicipality === m ? theme.buttonText : theme.text }}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            <Text style={{ marginBottom: 10, color: theme.secondaryText }}>
              Mostrando {filteredBarsByMunicipality.length} bares
            </Text>

            {filteredBarsByMunicipality.map((bar) => (
              <View key={bar.id} style={[styles.card, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{bar.name}</Text>
                <Text style={[styles.cardDate, { color: theme.secondaryText }]}>{bar.location}</Text>
                {bar.promotion && (
                  <>
                    <Text style={{ marginTop: 4, color: '#D7A048' }}>
                      Promo: ${bar.promotion.price}
                    </Text>
                    {bar.promotion.included && (
                      <Text style={{ fontSize: 12, color: theme.secondaryText }}>
                        {bar.promotion.included}
                      </Text>
                    )}
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={{
                      flex: 0.6,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: theme.cardBackground,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                    onPress={() => router.push(`/bar/${bar.id}?matchId=${selectedMatch.id}`)}
                  >
                    <Text style={{ fontFamily: 'Montserrat-ExtraBold', fontSize: 13, color: theme.text }}>
                      Más info
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: theme.tabBarActiveTintColor,
                      alignItems: 'center',
                    }}
                    onPress={() => router.push(`/tabs/reserve?barId=${bar.id}&matchId=${selectedMatch.id}`)}
                  >
                    <Text style={{ fontFamily: 'Montserrat-ExtraBold', fontSize: 15, color: theme.buttonText }}>
                      Reservar
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* --- Mapa --- */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mapa de bares</Text>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ width: '100%', height: 400, borderRadius: 10, marginBottom: 20 }}
              initialRegion={{
                latitude: Number(filteredBarsByMunicipality[0]?.coordinates?.lat ?? 25.6866),
                longitude: Number(filteredBarsByMunicipality[0]?.coordinates?.lng ?? -100.3161),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              latitude={Number(filteredBarsByMunicipality[0]?.coordinates?.lat ?? 25.6866)}
              longitude={Number(filteredBarsByMunicipality[0]?.coordinates?.lng ?? -100.3161)}
              zoom={14}
              height={400}
              markers={filteredBarsByMunicipality
                .filter((bar) => bar.coordinates?.lat && bar.coordinates?.lng)
                .map((bar): BarMarker => ({
                  id: bar.id,
                  name: bar.name,
                  lat: Number(bar.coordinates.lat),
                  lng: Number(bar.coordinates.lng),
                  promotion: bar.promotion,
                  location: bar.location,
                  icon: "/assets/images/icon.png",
                }))}
              onMarkerClick={(bar: BarMarker) => setSelectedBar(bar)}
            >
              {filteredBarsByMunicipality.map((bar: any) => {
                const lat = Number(bar.coordinates?.lat ?? bar.lat);
                const lng = Number(bar.coordinates?.lng ?? bar.lng);
                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                  <Marker
                    key={bar.id}
                    coordinate={{ latitude: lat, longitude: lng }}
                    anchor={{ x: 0.5, y: 1 }}
                    onPress={() => setSelectedBar(bar)}
                  >
                    <View style={{ alignItems: "center" }}>
                      <View
                        style={{
                          width: 50,
                          height: 50,
                          backgroundColor: "#1B1D36",
                          borderRadius: 25,
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 2,
                          borderColor: "#fff",
                        }}
                      >
                        <Image
                          source={require("@/assets/images/icon.png")}
                          style={{ width: 28, height: 28 }}
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  </Marker>
                );
              })}
            </MapView>

          </View>
        )}
      </ScrollView>

      {/* --- Modal del bar --- */}
      <Modal
        visible={!!selectedBar}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedBar(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedBar && (
              <>
                <Text style={styles.modalTitle}>{selectedBar.name}</Text>
                <Text style={styles.modalSubtitle}>{selectedBar.location}</Text>

                {selectedBar.promotion && (
                  <>
                    <Text style={styles.modalPromo}>
                      Promo: ${selectedBar.promotion.price}
                    </Text>
                    {selectedBar.promotion.included && (
                      <Text style={{ fontSize: 13, color: '#9D9C9E', marginBottom: 10, textAlign: 'center' }}>
                        {selectedBar.promotion.included}
                      </Text>
                    )}
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={{
                      flex: 0.6,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: theme.cardBackground,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                    onPress={() => {
                      setSelectedBar(null);
                      router.push(`/bar/${selectedBar.id}?matchId=${selectedMatch.id}`);
                    }}
                  >
                    <Text style={{ fontFamily: 'Montserrat-ExtraBold', fontSize: 13, color: theme.text }}>
                      Más info
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: theme.tabBarActiveTintColor,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setSelectedBar(null);
                      router.push(`/tabs/reserve?barId=${selectedBar.id}&matchId=${selectedMatch.id}`);
                    }}
                  >
                    <Text style={{ fontFamily: 'Montserrat-ExtraBold', fontSize: 15, color: theme.buttonText }}>
                      Reservar
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => setSelectedBar(null)}>
                  <Text style={{ marginTop: 10, color: theme.secondaryText }}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  container: { padding: 10 },
  appTitle: { fontSize: 28, fontFamily: 'Montserrat-ExtraBold', marginBottom: 5, textAlign: 'center' },
  input: { padding: 10, borderRadius: 8, marginBottom: 20 },
  filterTitle: { fontFamily: "Montserrat-ExtraBold", marginBottom: 6, marginTop: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1 },
  card: { padding: 15, borderRadius: 10, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Montserrat-Black' },
  cardDate: { fontSize: 14, marginTop: 4, fontFamily: 'Montserrat-Black' },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat-ExtraBold', marginTop: 30, marginBottom: 8 },
  barsContainer: { marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', padding: 20, borderRadius: 12, backgroundColor: '#1B1D36', alignItems: 'center' },
  modalTitle: { fontFamily: 'Montserrat-Black', fontSize: 18, marginBottom: 6, color: '#FFF' },
  modalSubtitle: { fontSize: 14, color: '#9D9C9E', marginBottom: 10 },
  modalPromo: { fontSize: 14, color: '#D7A048', marginBottom: 5 },
});
