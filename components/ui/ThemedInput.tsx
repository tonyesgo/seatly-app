import { useThemeColor } from '@/hooks/useThemeColor';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export function ThemedInput(props: TextInputProps) {
  const backgroundColor = useThemeColor({}, 'inputBackground');
  const textColor = useThemeColor({}, 'text');

  return (
    <TextInput
      {...props}
      placeholderTextColor="#999"
      style={[
        styles.input,
        { backgroundColor, color: textColor },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontFamily: 'Montserrat-Regular',
  },
});
