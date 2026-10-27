import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme';

export default function Checkbox({ rotulo, valor, onChange }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={rotulo}
      aria-checked={valor}
      onPress={() => onChange(!valor)}
      style={s.linha}
    >
      <View style={[s.caixa, valor && s.caixaMarcada]}>{valor && <Text style={s.marca}>✓</Text>}</View>
      <Text style={s.rotulo}>{rotulo}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  caixa: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: cores.linha,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaMarcada: { backgroundColor: cores.cobalto, borderColor: cores.cobalto },
  marca: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 16 },
  rotulo: { fontSize: 15, color: cores.tinta },
});
