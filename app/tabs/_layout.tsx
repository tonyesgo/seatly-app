import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [fontsLoaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    'Montserrat-ExtraBold': require('../../assets/fonts/Montserrat-ExtraBold.ttf'),
    'Montserrat-Black': require('../../assets/fonts/Montserrat-Black.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tabBarActiveTintColor,
          tabBarButton: HapticTab,
          tabBarBackground: () => (
            <View style={{ backgroundColor: theme.tabBackground, flex: 1 }} />
          ),
          tabBarStyle: Platform.select({
            ios: { position: 'absolute' },
            default: {},
          }),
        }}
      >
        {/* ✅ Visible en la barra */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        {/* ✅ Visible en la barra */}
        <Tabs.Screen
          name="userpanel"
          options={{
            title: 'Mi cuenta',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />
        {/* 👇 Ocultos pero con layout */}
        <Tabs.Screen name="reserve" options={{ href: null }} />
        <Tabs.Screen name="myreservations" options={{ href: null }} />
         <Tabs.Screen name="faq" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
