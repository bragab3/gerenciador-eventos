import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { mensagemDeErro } from '../api';
import { brParaIso, isoParaBr, mascaraData } from '../datas';
import { cores, raio } from '../theme';
import Botao from './Botao';
import Campo from './Campo';
import Mensagem from './Mensagem';

const LIMITE_IMAGEM_BYTES = 1.5 * 1024 * 1024;

// modo "criar": nome, data, localização e imagem (galeria ou URL)
// modo "editar": apenas data e localização
export default function EventoModal({ modo, evento, onSalvar, onFechar }) {
  const editando = modo === 'editar';

  const [nome, setNome] = useState(evento?.nome ?? '');
  const [data, setData] = useState(evento ? isoParaBr(evento.data) : '');
  const [localizacao, setLocalizacao] = useState(evento?.localizacao ?? '');
  const [imagem, setImagem] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const imagemEhArquivo = imagem.startsWith('data:');

  async function escolherDaGaleria() {
    setErro('');
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.5, // reduz o tamanho: a imagem vai como Base64 no corpo da requisição
        base64: true,
      });
      if (resultado.canceled) return;

      const arquivo = resultado.assets?.[0];
      if (!arquivo?.base64) {
        setErro('Não foi possível ler a imagem selecionada.');
        return;
      }
      // tamanho aproximado dos bytes originais a partir do Base64
      if (arquivo.base64.length * 0.75 > LIMITE_IMAGEM_BYTES) {
        setErro('A imagem deve ter no máximo 1,5 MB. Escolha outra ou informe a URL.');
        return;
      }
      setImagem(`data:${arquivo.mimeType || 'image/jpeg'};base64,${arquivo.base64}`);
    } catch {
      setErro('Não foi possível abrir a galeria. Verifique a permissão de acesso às fotos.');
    }
  }

  async function salvar() {
    setErro('');

    if (!editando && !nome.trim()) {
      setErro('Informe o nome do evento.');
      return;
    }
    const dataIso = brParaIso(data);
    if (!dataIso) {
      setErro('Data inválida. Use o formato DD/MM/AAAA.');
      return;
    }
    if (!localizacao.trim()) {
      setErro('Informe a localização do evento.');
      return;
    }

    setSalvando(true);
    try {
      await onSalvar(
        editando
          ? { data: dataIso, localizacao: localizacao.trim() }
          : { nome: nome.trim(), data: dataIso, localizacao: localizacao.trim(), imagem: imagem.trim() }
      );
    } catch (err) {
      setErro(mensagemDeErro(err));
      setSalvando(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
      <KeyboardAvoidingView
        style={s.fundo}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.folha} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.conteudo}>
            <Text style={s.titulo}>{editando ? 'Editar evento' : 'Novo evento'}</Text>
            {editando && <Text style={s.subtitulo}>{evento.nome}</Text>}

            {!editando && (
              <Campo rotulo="Nome do evento" value={nome} onChangeText={setNome} maxLength={150} />
            )}

            <Campo
              rotulo="Data"
              placeholder="DD/MM/AAAA"
              value={data}
              onChangeText={(t) => setData(mascaraData(t))}
              keyboardType="number-pad"
              maxLength={10}
            />

            <Campo
              rotulo="Localização"
              value={localizacao}
              onChangeText={setLocalizacao}
              maxLength={255}
            />

            {!editando && (
              <>
                <Campo
                  rotulo="Imagem (URL)"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={imagemEhArquivo ? '' : imagem}
                  onChangeText={setImagem}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                <Botao titulo="Escolher imagem da galeria" variante="secundario" onPress={escolherDaGaleria} />

                {imagem !== '' && (
                  <View style={s.previa}>
                    <Image
                      source={{ uri: imagem }}
                      accessibilityLabel="Pré-visualização da imagem do evento"
                      style={s.previaImagem}
                      resizeMode="cover"
                    />
                    {imagemEhArquivo && (
                      <Botao titulo="Remover imagem" variante="secundario" pequeno onPress={() => setImagem('')} />
                    )}
                  </View>
                )}
              </>
            )}

            <Mensagem>{erro}</Mensagem>

            <View style={s.acoes}>
              <Botao titulo="Cancelar" variante="secundario" onPress={onFechar} />
              <Botao titulo="Salvar" variante="primario" carregando={salvando} onPress={salvar} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(20,33,61,0.55)', justifyContent: 'flex-end' },
  folha: {
    backgroundColor: cores.superficie,
    borderTopLeftRadius: raio + 8,
    borderTopRightRadius: raio + 8,
    maxHeight: '92%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  conteudo: { padding: 20, gap: 14 },
  titulo: { fontSize: 22, fontWeight: '800', color: cores.tinta },
  subtitulo: { fontSize: 15, color: cores.tintaSuave, marginTop: -8 },
  previa: { gap: 8, alignItems: 'flex-start' },
  previaImagem: { width: '100%', height: 160, borderRadius: raio - 2, backgroundColor: '#dfe5f0' },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
