import Colors from '@/constants/Colors';
import { app } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FAQ = {
  id: string;
  question: string;
  answer: string;
  order?: number;
};

const db = getFirestore(app);

export default function FAQScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FAQ[];
        setFaqs(items);
      } catch (error) {
        console.error('❌ Error cargando FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={{ color: theme.text, marginTop: 10 }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Preguntas Frecuentes</Text>

      {faqs.length === 0 ? (
        <Text style={{ color: theme.secondaryText }}>No hay preguntas disponibles.</Text>
      ) : (
        faqs.map((faq, index) => (
          <View key={faq.id} style={[styles.card, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              onPress={() => setOpenIndex(openIndex === index ? null : index)}
              style={styles.questionRow}
            >
              <Text style={[styles.question, { color: theme.text }]}>{faq.question}</Text>
              <Ionicons
                name={openIndex === index ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.text}
              />
            </TouchableOpacity>

            {openIndex === index && (
              <Text style={[styles.answer, { color: theme.secondaryText }]}>{faq.answer}</Text>
            )}
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
  },
  answer: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 20,
  },
});
