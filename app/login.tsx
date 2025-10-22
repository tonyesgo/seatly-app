import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { useLayoutEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import { ThemedView } from '@/components/ui/ThemedView';
import Colors from '@/constants/Colors';
import { auth } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function LoginScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { redirectTo } = params;

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
      headerBackVisible: true,
      headerStyle: {
        backgroundColor: theme.background,
        shadowColor: 'transparent',
        elevation: 0,
      },
      headerTintColor: theme.text,
    });
  }, [navigation, theme]);

  const handleLogin = async () => {
    console.log('👉 handleLogin ejecutado', { email, password });

    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa correo y contraseña');
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login exitoso:', userCred.user.uid);

      // 🔹 Detectar ruta de retorno (si viene de reserva o registro)
      let safeRedirect: string | null = null;

      if (typeof redirectTo === 'string' && redirectTo.trim() !== '') {
        try {
          safeRedirect = decodeURIComponent(redirectTo);
        } catch {
          safeRedirect = redirectTo; // fallback
        }
      }

      // 🔹 Redirigir después de login
      if (safeRedirect) {
        console.log('➡️ Redirigiendo a:', safeRedirect);
        router.replace(safeRedirect);
      } else {
        console.log('➡️ Redirigiendo a /tabs/userpanel');
        router.replace('/tabs/userpanel');
      }
    } catch (error: any) {
      console.error('❌ Error de login:', error);
      Alert.alert('Error', 'Credenciales incorrectas o cuenta inexistente');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Olvidé mi contraseña', 'Por favor ingresa tu correo electrónico primero.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña.');
    } catch (error: any) {
      console.error('❌ Error reset password:', error);
      Alert.alert('Error', error.message);
    }
  };

  const goToRegister = () => {
    if (typeof redirectTo === 'string' && redirectTo.trim() !== '') {
      router.push(`/register?redirectTo=${encodeURIComponent(redirectTo)}`);
    } else {
      router.push('/register');
    }
  };

  // 🔹 Versión web
  if (Platform.OS === 'web') {
    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        style={{ backgroundColor: theme.background }}
      >
        <ThemedView style={styles.container}>
          <Text style={[styles.title, { color: theme.text }]}>SEATLY</Text>

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

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={[styles.forgotText, { color: theme.text }]}>
              Olvidé mi contraseña
            </Text>
          </TouchableOpacity>

          <ThemedButton onPress={goToRegister}>
            ¿No tienes cuenta? Regístrate
          </ThemedButton>
        </ThemedView>
      </ScrollView>
    );
  }

  // 🔹 Versión móvil (Android / iOS)
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: theme.background }}
        >
          <ThemedView style={styles.container}>
            <Text style={[styles.title, { color: theme.text }]}>SEATLY</Text>

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

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={[styles.forgotText, { color: theme.text }]}>
                Olvidé mi contraseña
              </Text>
            </TouchableOpacity>

            <ThemedButton onPress={goToRegister}>
              ¿No tienes cuenta? Regístrate
            </ThemedButton>
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
    fontFamily: 'Montserrat-Black',
  },
  forgotText: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Montserrat-ExtraBold',
    textDecorationLine: 'underline',
  },
});
