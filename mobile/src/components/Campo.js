import { StyleSheet, Text, TextInput, View } from 'react-native';
import { cores, raio } from '../theme';

// Rótulo visível + TextInput com o mesmo texto como accessibilityLabel
export default function Campo({ rotulo, ...props }) {
  return (
    <View style={s.campo}>
      <Text style={s.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor="#8a93a8"
        style={s.input}
        {...props}
      />
    </View>
  );
}

const s = StyleSheet.create({
  campo: { gap: 6 },
  rotulo: { fontSize: 14, fontWeight: '600', color: cores.tinta },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio - 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: cores.tinta,
    backgroundColor: cores.superficie,
  },
});
