import { StyleSheet, Text } from 'react-native';
import { cores } from '../theme';

// tipo: 'erro' | 'sucesso'
export default function Mensagem({ tipo = 'erro', children }) {
  if (!children) return null;
  return (
    <Text accessibilityRole="alert" style={[s.base, tipo === 'erro' ? s.erro : s.sucesso]}>
      {children}
    </Text>
  );
}

const s = StyleSheet.create({
  base: { padding: 12, borderRadius: 8, fontSize: 14, lineHeight: 20, overflow: 'hidden' },
  erro: { color: cores.perigo, backgroundColor: cores.perigoFundo },
  sucesso: { color: cores.sucesso, backgroundColor: cores.sucessoFundo },
});
