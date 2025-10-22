import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedText } from '@/components/ui/ThemedText';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function UserPanelScreen() {
  const auth = getAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.tabBackground }]}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Image
            source={require("../../public/seatly-full.png")} // ajusta la ruta si cambias la carpeta
            style={{ width: 160, height: 80 }}
            resizeMode="contain"
          />
        </View>

        <ThemedText type="title" style={{ color: theme.text }}>Mi cuenta</ThemedText>

        {user ? (
          <>
            <ThemedText style={[styles.info, { color: theme.text }]}>
              Nombre: {user.displayName || 'Sin nombre'}
            </ThemedText>
            <ThemedText style={[styles.info, { color: theme.text }]}>
              Correo: {user.email}
            </ThemedText>

            <ThemedButton onPress={() => router.push('/tabs/myreservations')}>
              Mis reservas
            </ThemedButton>

            {/* 🔹 Nueva sección de Preguntas Frecuentes */}
            <ThemedButton onPress={() => router.push('/tabs/faq')}>
              Preguntas Frecuentes
            </ThemedButton>

            <ThemedButton onPress={handleLogout} style={styles.logoutButton}>
              Cerrar sesión
            </ThemedButton>
          </>
        ) : (
          <>
            <ThemedText style={[styles.info, { color: theme.text }]}>
              Para ver tus reservas, inicia sesión o crea una cuenta.
            </ThemedText>

            <ThemedButton onPress={() => router.push('/login')}>
              Iniciar sesión
            </ThemedButton>

            <ThemedButton onPress={() => router.push('/register')}>
              Crear cuenta
            </ThemedButton>

            {/* 🔹 También disponible aunque no haya sesión */}
            <ThemedButton onPress={() => router.push('/tabs/faq')}>
              Preguntas Frecuentes
            </ThemedButton>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 26,
    fontFamily: 'Montserrat-Black',
  },
  info: {
    fontSize: 16,
    fontFamily: 'Montserrat-Black',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#991b1b',
  },
});
