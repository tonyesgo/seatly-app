import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Stack } from 'expo-router';

export default function Layout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '', // Sin texto
        headerBackVisible: true, // Botón de regreso
        headerStyle: {
          backgroundColor: theme.tabBackground, // Color igual que fondo
        },
        headerShadowVisible: false, // ✅ Esto va FUERA de headerStyle
        headerTintColor: '#fff', // Color del botón de volver
      }}
    />
  );
}
