import { Modal, StyleSheet, Text, View } from 'react-native';
import { cores, raio } from '../theme';
import Botao from './Botao';

// Alert.alert não funciona na web; um modal próprio funciona igual em iOS, Android e web.
export default function ConfirmarModal({ titulo, mensagem, textoConfirmar, onConfirmar, onCancelar, carregando }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancelar}>
      <View style={s.fundo}>
        <View style={s.caixa} accessibilityViewIsModal>
          <Text style={s.titulo}>{titulo}</Text>
          <Text style={s.mensagem}>{mensagem}</Text>
          <View style={s.acoes}>
            <Botao titulo="Cancelar" variante="secundario" onPress={onCancelar} />
            <Botao titulo={textoConfirmar} variante="primario" carregando={carregando} onPress={onConfirmar} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(20,33,61,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  caixa: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: cores.superficie,
    borderRadius: raio + 4,
    padding: 20,
    gap: 12,
  },
  titulo: { fontSize: 20, fontWeight: '800', color: cores.tinta },
  mensagem: { fontSize: 15, color: cores.tintaSuave, lineHeight: 22 },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 },
});
