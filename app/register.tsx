import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
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
const db = getFirestore(app);

export default function RegisterScreen() {
  const router = useRouter();

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !lastName || !phone || !email || !password) {
      return Alert.alert('Campos incompletos', 'Por favor completa todos los campos');
    }

    if (!/^\d{10}$/.test(phone)) {
      return Alert.alert('Teléfono inválido', 'El número debe tener exactamente 10 dígitos');
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

      router.replace('/tabs/userpanel');
    } catch (error: any) {
      console.error('Error al registrar:', error);
      Alert.alert('Error', error.message);
    }
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
            <ThemedButton onPress={handleRegister}>Registrarme</ThemedButton>
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
