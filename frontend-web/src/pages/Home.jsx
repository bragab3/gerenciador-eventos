import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventosApi, mensagemDeErro } from '../api.js';
import { getSessao, limparSessao } from '../auth.js';
import EventoCard from '../components/EventoCard.jsx';
import EventoModal from '../components/EventoModal.jsx';

export default function Home() {
  const navigate = useNavigate();
  const sessao = getSessao();
  const adminId = sessao?.adminId;

  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  // null (fechado) | { modo: 'criar' } | { modo: 'editar', evento }
  const [modal, setModal] = useState(null);

  const carregar = useCallback(async () => {
    setErro('');
    try {
      setEventos(await EventosApi.listar(adminId));
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setCarregando(false);
    }
  }, [adminId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Chamada pelo modal. Se lançar erro, o modal mostra a mensagem e continua aberto.
  async function salvar(dados) {
    if (modal.modo === 'editar') {
      await EventosApi.atualizar(modal.evento.id, {
        data: dados.data,
        localizacao: dados.localizacao,
      });
    } else {
      await EventosApi.criar({ ...dados, adminId });
    }
    setModal(null);
    await carregar();
  }

  async function excluir(evento) {
    const confirmado = window.confirm(
      `Excluir o evento "${evento.nome}"? Essa ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    try {
      await EventosApi.excluir(evento.id);
      setEventos((atuais) => atuais.filter((e) => e.id !== evento.id));
    } catch (err) {
      window.alert(mensagemDeErro(err));
    }
  }

  function sair() {
    limparSessao();
    navigate('/');
  }

  return (
    <>
      <header className="topo">
        <h1>Gerenciador de Eventos</h1>
        <div className="topo-usuario">
          <span>{sessao?.nome}</span>
          <button type="button" className="btn btn-secundario btn-pequeno" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <main className="conteudo">
        <div className="barra">
          <h2>Meus eventos</h2>
          <button type="button" className="btn btn-primario" onClick={() => setModal({ modo: 'criar' })}>
            Adicionar Evento
          </button>
        </div>

        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}

        {carregando ? (
          <p className="subtitulo">Carregando eventos...</p>
        ) : eventos.length === 0 && !erro ? (
          <div className="vazio">
            <p>Você ainda não tem eventos cadastrados.</p>
            <button type="button" className="btn btn-primario" onClick={() => setModal({ modo: 'criar' })}>
              Adicionar Evento
            </button>
          </div>
        ) : (
          <ul className="grade">
            {eventos.map((evento) => (
              <li key={evento.id}>
                <EventoCard
                  evento={evento}
                  onEditar={() => setModal({ modo: 'editar', evento })}
                  onExcluir={() => excluir(evento)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {modal && (
        <EventoModal
          modo={modal.modo}
          evento={modal.evento}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </>
  );
}
