import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRegisterPushToken } from '@/hooks/useNotifications';
import { Stack } from 'expo-router';
import Head from 'expo-router/head'; // ✅ tu versión correcta

export default function Layout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // 👇 se ejecuta al cargar la app para registrar token de notificaciones
  useRegisterPushToken();

  return (
    <>
      {/* 🧠 Head para favicon y metadatos */}
      <Head>
        <title>Seatly</title>
        <meta
          name="description"
          content="Reserva tu mesa en los mejores bares para ver el partido con Seatly."
        />
        {/* 🟡 Favicon personalizado */}
        <link rel="icon" href="/seatly-favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/seatly-favicon.png" />
        <meta name="theme-color" content={theme.background} />
      </Head>

      <Stack
        screenOptions={{
          headerShown: true,
          headerTitle: '',
          headerBackVisible: true,
          headerStyle: {
            backgroundColor: theme.tabBackground,
          },
          headerShadowVisible: false,
          headerTintColor: theme.text,
        }}
      />
    </>
  );
}
