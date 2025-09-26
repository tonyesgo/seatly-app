// components/ui/ThemedButton.tsx
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

type Props = {
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
};

export function ThemedButton({ onPress, children, style }: Props) {
  const backgroundColor = useThemeColor({}, 'button');
  const textColor = useThemeColor({}, 'buttonText');

  return (
    <TouchableOpacity
      onPress={onPress}
      // 👇 esto asegura que también funcione en web
      {...(Platform.OS === 'web' ? { onClick: onPress } : {})}
      activeOpacity={0.7}
      style={[
        styles.button,
        { backgroundColor },
        Platform.OS === 'web' ? { cursor: 'pointer' } : {},
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
});
