import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventosApi, mensagemDeErro } from '../api';
import Botao from '../components/Botao';
import ConfirmarModal from '../components/ConfirmarModal';
import EventoCard from '../components/EventoCard';
import EventoModal from '../components/EventoModal';
import Mensagem from '../components/Mensagem';
import { useSessao } from '../SessaoContext';
import { cores } from '../theme';

export default function HomeScreen() {
  const { sessao, sair } = useSessao();
  const adminId = sessao?.adminId;

  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  // null (fechado) | { modo: 'criar' } | { modo: 'editar', evento }
  const [modal, setModal] = useState(null);
  const [paraExcluir, setParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    // Sem administrador logado não há o que listar (evita GET /api/eventos?adminId=undefined)
    if (adminId == null) return;
    setErro('');
    try {
      setEventos(await EventosApi.listar(adminId));
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [adminId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Chamada pelo modal. Se lançar erro, o modal mostra a mensagem e continua aberto.
  async function salvar(dados) {
    if (modal.modo === 'editar') {
      await EventosApi.atualizar(modal.evento.id, { data: dados.data, localizacao: dados.localizacao });
    } else {
      await EventosApi.criar({ ...dados, adminId });
    }
    setModal(null);
    await carregar();
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    try {
      await EventosApi.excluir(paraExcluir.id);
      setEventos((atuais) => atuais.filter((e) => e.id !== paraExcluir.id));
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setExcluindo(false);
      setParaExcluir(null);
    }
  }

  const cabecalhoLista = (
    <View style={s.cabecalhoLista}>
      <View style={s.barra}>
        <Text style={s.secao} accessibilityRole="header">Meus eventos</Text>
        <Botao titulo="Adicionar Evento" pequeno onPress={() => setModal({ modo: 'criar' })} />
      </View>
      <Mensagem>{erro}</Mensagem>
    </View>
  );

  return (
    <SafeAreaView style={s.tela}>
      <View style={s.topo}>
        <View style={s.topoTexto}>
          <Text style={s.tituloApp}>Gerenciador de Eventos</Text>
          <Text style={s.nome} numberOfLines={1}>{sessao?.nome}</Text>
        </View>
        <Botao titulo="Sair" variante="secundario" pequeno onPress={sair} />
      </View>

      {carregando ? (
        <ActivityIndicator style={s.carregando} size="large" color={cores.cobalto} accessibilityLabel="Carregando eventos" />
      ) : (
        <FlatList
          style={s.lista}
          contentContainerStyle={s.listaConteudo}
          data={eventos}
          keyExtractor={(evento) => String(evento.id)}
          renderItem={({ item }) => (
            <EventoCard
              evento={item}
              onEditar={() => setModal({ modo: 'editar', evento: item })}
              onExcluir={() => setParaExcluir(item)}
            />
          )}
          ItemSeparatorComponent={() => <View style={s.separador} />}
          ListHeaderComponent={cabecalhoLista}
          ListEmptyComponent={
            erro ? null : <Text style={s.vazio}>Você ainda não tem eventos cadastrados.</Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => {
                setAtualizando(true);
                carregar();
              }}
            />
          }
        />
      )}

      {modal && (
        <EventoModal
          modo={modal.modo}
          evento={modal.evento}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}

      {paraExcluir && (
        <ConfirmarModal
          titulo="Excluir evento"
          mensagem={`Excluir o evento "${paraExcluir.nome}"? Essa ação não pode ser desfeita.`}
          textoConfirmar="Excluir"
          carregando={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setParaExcluir(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.papel },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: cores.tinta,
  },
  topoTexto: { flexShrink: 1, gap: 2 },
  tituloApp: { color: '#fff', fontSize: 18, fontWeight: '800' },
  nome: { color: '#cfd8ee', fontSize: 13 },
  lista: { flex: 1 },
  listaConteudo: { padding: 16, width: '100%', maxWidth: 720, alignSelf: 'center' },
  cabecalhoLista: { gap: 12, marginBottom: 14 },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  secao: { fontSize: 22, fontWeight: '800', color: cores.tinta },
  separador: { height: 14 },
  carregando: { marginTop: 40 },
  vazio: { textAlign: 'center', color: cores.tintaSuave, fontSize: 15, paddingVertical: 40 },
});
