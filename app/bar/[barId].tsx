import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedView } from '@/components/ui/ThemedView';
import Colors from '@/constants/Colors';
import { db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function BarDetailScreen() {
  const { barId, matchId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const [bar, setBar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!barId) return;

    const fetchBar = async () => {
      const ref = doc(db, 'bars', String(barId));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setBar(snap.data());
      }
      setLoading(false);
    };

    fetchBar();
  }, [barId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Volver',
      headerBackVisible: true,
      headerStyle: {
        backgroundColor: theme.background,
        shadowColor: 'transparent',
        elevation: 0,
      },
      headerTitleStyle: {
        color: theme.text,
        fontWeight: 'bold',
        fontSize: 16,
      },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);

  if (loading) {
    return (
      <ThemedView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tabBarActiveTintColor} />
      </ThemedView>
    );
  }

  if (!bar) {
    return (
      <ThemedView style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>No se encontró información del bar.</Text>
        <ThemedButton onPress={() => router.back()}>Volver</ThemedButton>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerCard, { backgroundColor: theme.tabBackground }]}>
        <Text style={[styles.title, { color: theme.tabBarActiveTintColor }]}>{bar.name}</Text>
        <Text style={[styles.description, { color: theme.text }]}>{bar.description}</Text>
      </View>

      {bar.hours && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Horarios:</Text>
          <Text style={[styles.sectionText, { color: theme.text }]}>{bar.hours}</Text>
        </View>
      )}

      {bar.photos?.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Galería:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {bar.photos.map((url: string, index: number) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      )}

      {bar.location && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Dirección:</Text>
          <Text style={[styles.sectionText, { color: theme.text }]}>{bar.location}</Text>
        </View>
      )}

      {/* --- Botón de reservar --- */}
      {matchId && (
        <ThemedButton
          onPress={() =>
            router.push(`/reserve?barId=${barId}&matchId=${matchId}`)
          }
        >
          Reservar
        </ThemedButton>
      )}

      <ThemedButton onPress={() => router.back()}>Volver</ThemedButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    borderRadius: 16,
    marginBottom: 24,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
  },
  image: {
    width: 240,
    height: 160,
    marginRight: 16,
    borderRadius: 12,
  },
});
