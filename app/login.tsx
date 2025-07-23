import { useLocalSearchParams, useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';

import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedView } from '@/components/ui/ThemedView';
import Colors from '@/constants/Colors';
import { app } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';

const auth = getAuth(app);

export default function LoginScreen() {
  const router = useRouter();
  const { redirectTo } = useLocalSearchParams();

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      const safeRedirect =
        typeof redirectTo === 'string' && redirectTo.startsWith('%2F') // encoded "/"
          ? decodeURIComponent(redirectTo)
          : null;

      if (safeRedirect) {
        router.replace(safeRedirect);
      } else {
        router.replace('/tabs/userpanel');
      }
    } catch (error: any) {
      console.error('Error de login:', error);
      Alert.alert('Error', error.message);
    }
  };

  const goToRegister = () => {
    router.push('/register');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.tabBackground }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: theme.tabBackground }}
        >
          <ThemedView style={styles.container}>
            <Text style={styles.title}>IDO10S</Text>

            <ThemedInput
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <ThemedInput
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <ThemedButton onPress={handleLogin}>Entrar</ThemedButton>
            <ThemedButton onPress={goToRegister}>¿No tienes cuenta? Regístrate</ThemedButton>
          </ThemedView>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
    gap: 12,
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 24,
    color: '#D7A048',
    fontFamily: 'Montserrat-Black',
  },
});
