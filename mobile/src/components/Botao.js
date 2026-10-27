import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { cores } from '../theme';

// variante: 'primario' | 'secundario' | 'perigo'
export default function Botao({ titulo, onPress, variante = 'primario', carregando = false, disabled = false, pequeno = false, testID }) {
  const inativo = disabled || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      aria-disabled={inativo}
      aria-busy={carregando}
      disabled={inativo}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        s.base,
        pequeno && s.pequeno,
        s[variante],
        pressed && s.pressionado,
        inativo && s.inativo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={variante === 'primario' ? '#fff' : cores.tinta} />
      ) : (
        <Text style={[s.texto, pequeno && s.textoPequeno, s[`texto_${variante}`]]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    minHeight: 46,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pequeno: { minHeight: 36, paddingVertical: 6, paddingHorizontal: 12 },
  primario: { backgroundColor: cores.cobalto },
  secundario: { backgroundColor: cores.superficie, borderColor: cores.linha },
  perigo: { backgroundColor: cores.superficie, borderColor: '#f0b5b5' },
  pressionado: { opacity: 0.85 },
  inativo: { opacity: 0.6 },
  texto: { fontSize: 16, fontWeight: '600' },
  textoPequeno: { fontSize: 14 },
  texto_primario: { color: '#fff' },
  texto_secundario: { color: cores.tinta },
  texto_perigo: { color: cores.perigo },
});

