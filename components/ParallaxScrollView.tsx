import React from 'react';
import { ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  headerImage?: React.ReactNode;
  headerBackgroundColor?: {
    light: string;
    dark: string;
  };
};

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const backgroundColor = headerBackgroundColor?.[colorScheme] ?? '#fff';

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 120,
        paddingBottom: insets.bottom + 30,
      }}
      style={{ flex: 1, backgroundColor }}
    >
      {headerImage && <View style={styles.header}>{headerImage}</View>}
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
});
