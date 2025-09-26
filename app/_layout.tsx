import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRegisterPushToken } from '@/hooks/useNotifications'; // 👈 importar
import { Stack } from 'expo-router';

export default function Layout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // 👇 este hook se ejecuta apenas carga el layout
  useRegisterPushToken();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '', // Sin texto
        headerBackVisible: true, // Botón de regreso
        headerStyle: {
          backgroundColor: theme.tabBackground, // Color igual que fondo
        },
        headerShadowVisible: false, // ✅ va FUERA de headerStyle
        headerTintColor: theme.text, // Color del botón de volver
      }}
    />
  );
}
