import Checkbox from 'expo-checkbox';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedButton } from '@/components/ui/ThemedButton';
import { ThemedInput } from '@/components/ui/ThemedInput';
import Colors from '@/constants/Colors';
import { app } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/useColorScheme';

const auth = getAuth(app);
const db = getFirestore(app);

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { redirectTo } = params;

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = async () => {
    if (!name || !lastName || !phone || !email || !password) {
      return Alert.alert('Campos incompletos', 'Por favor completa todos los campos');
    }

    if (!/^\d{10}$/.test(phone)) {
      return Alert.alert('Teléfono inválido', 'El número debe tener exactamente 10 dígitos');
    }

    if (!acceptedTerms) {
      return Alert.alert(
        'Términos y condiciones',
        'Debes aceptar los términos y la política de privacidad para continuar'
      );
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await updateProfile(userCredential.user, {
        displayName: `${name} ${lastName}`,
      });

      await setDoc(doc(db, 'users', userId), {
        name,
        lastName,
        phone,
        email,
        createdAt: new Date().toISOString(),
      });

      let safeRedirect: string | null = null;
      if (typeof redirectTo === 'string' && redirectTo.trim() !== '') {
        try {
          safeRedirect = decodeURIComponent(redirectTo);
        } catch {
          safeRedirect = redirectTo;
        }
      }

      if (safeRedirect) {
        console.log('➡️ Redirigiendo tras registro a:', safeRedirect);
        router.replace(safeRedirect);
      } else {
        router.replace('/tabs/userpanel');
      }
    } catch (error: any) {
      console.error('❌ Error al registrar:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleGoToLogin = () => {
    if (typeof redirectTo === 'string' && redirectTo.trim() !== '') {
      router.push(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
    } else {
      router.push('/login');
    }
  };

  const openTerms = () => Linking.openURL('https://seatlyapp.com/legal/terms');
  const openPrivacy = () => Linking.openURL('https://seatlyapp.com/legal/privacy');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>SEATLY</Text>

        <ThemedInput placeholder="Nombre" value={name} onChangeText={setName} />
        <ThemedInput placeholder="Apellido" value={lastName} onChangeText={setLastName} />
        <ThemedInput
          placeholder="Teléfono (10 dígitos)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
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

        {/* 🔹 Checkbox de aceptación legal */}
        <View style={styles.termsContainer}>
          <Checkbox
            value={acceptedTerms}
            onValueChange={setAcceptedTerms}
            color={acceptedTerms ? theme.tint : undefined}
          />
          <Text style={[styles.termsText, { color: theme.text }]}>
            He leído y acepto los{' '}
          </Text>
          <TouchableOpacity onPress={openTerms}>
            <Text style={[styles.link, { color: theme.tint }]}>Términos y Condiciones</Text>
          </TouchableOpacity>
          <Text style={[styles.termsText, { color: theme.text }]}> y la </Text>
          <TouchableOpacity onPress={openPrivacy}>
            <Text style={[styles.link, { color: theme.tint }]}>Política de Privacidad</Text>
          </TouchableOpacity>
        </View>

        <ThemedButton onPress={handleRegister}>Registrarme</ThemedButton>

        <ThemedButton onPress={handleGoToLogin}>
          Ya tengo cuenta, Iniciar sesión
        </ThemedButton>
      </View>
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 5,
  },
  termsText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
