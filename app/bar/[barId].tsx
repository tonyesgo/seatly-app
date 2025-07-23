import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedView } from '@/components/ui/ThemedView';
import { db } from '@/firebaseConfig';
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
  const { barId } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

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
    title: 'Volver', // puedes poner el nombre del bar o solo "Volver"
    headerBackVisible: true,
    headerStyle: {
      backgroundColor: '#1f1f1f',
      shadowColor: 'transparent',
      elevation: 0,
    },
    headerTitleStyle: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    headerTintColor: '#fff', // color del ícono de regresar
  });
}, [navigation]);


  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color="#f4b63d" />
      </ThemedView>
    );
  }

  if (!bar) {
    return (
      <ThemedView style={styles.centered}>
        <Text style={{ color: '#fff' }}>No se encontró información del bar.</Text>
        <ThemedButton onPress={() => router.back()}>
          Volver
        </ThemedButton>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{bar.name}</Text>
        <Text style={styles.description}>{bar.description}</Text>
      </View>

      {bar.hours && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horarios:</Text>
          <Text style={styles.sectionText}>{bar.hours}</Text>
        </View>
      )}

      {bar.photos?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Galería:</Text>
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
          <Text style={styles.sectionTitle}>Dirección:</Text>
          <Text style={styles.sectionText}>{bar.location}</Text>
        </View>
      )}

      <ThemedButton onPress={() => router.back()}>
        Volver
      </ThemedButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#1f1f1f',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
  },
  headerCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f4b63d',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  sectionText: {
    color: '#ccc',
  },
  image: {
    width: 240,
    height: 160,
    marginRight: 16,
    borderRadius: 12,
  },
});
