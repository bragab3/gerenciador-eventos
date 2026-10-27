import { useEffect, useState } from 'react';
import { mensagemDeErro } from '../api.js';

const LIMITE_IMAGEM_BYTES = 1.5 * 1024 * 1024;

function lerComoDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    leitor.readAsDataURL(arquivo);
  });
}

// modo "criar": nome, data, localização e imagem (URL ou arquivo)
// modo "editar": apenas data e localização
export default function EventoModal({ modo, evento, onSalvar, onFechar }) {
  const editando = modo === 'editar';

  const [nome, setNome] = useState(evento?.nome ?? '');
  const [data, setData] = useState(evento?.data ?? '');
  const [localizacao, setLocalizacao] = useState(evento?.localizacao ?? '');
  const [imagem, setImagem] = useState('');
  const [chaveArquivo, setChaveArquivo] = useState(0);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const aoPressionar = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    window.addEventListener('keydown', aoPressionar);
    return () => window.removeEventListener('keydown', aoPressionar);
  }, [onFechar]);

  async function escolherArquivo(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem (JPG, PNG, WebP...).');
      setChaveArquivo((c) => c + 1);
      return;
    }
    if (arquivo.size > LIMITE_IMAGEM_BYTES) {
      setErro('A imagem deve ter no máximo 1,5 MB. Escolha outra ou informe a URL.');
      setChaveArquivo((c) => c + 1);
      return;
    }

    try {
      setErro('');
      setImagem(await lerComoDataUrl(arquivo));
    } catch (err) {
      setErro(err.message);
    }
  }

  function removerImagem() {
    setImagem('');
    setChaveArquivo((c) => c + 1);
  }

  async function submeter(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await onSalvar(
        editando
          ? { data, localizacao: localizacao.trim() }
          : { nome: nome.trim(), data, localizacao: localizacao.trim(), imagem: imagem.trim() }
      );
    } catch (err) {
      setErro(mensagemDeErro(err));
      setSalvando(false);
    }
  }

  const imagemEhArquivo = imagem.startsWith('data:');

  return (
    <div
      className="fundo-modal"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
        <h2 id="titulo-modal">{editando ? 'Editar evento' : 'Novo evento'}</h2>
        {editando && <p className="subtitulo">{evento.nome}</p>}

        <form className="formulario" onSubmit={submeter}>
          {!editando && (
            <div className="campo">
              <label htmlFor="evento-nome">Nome do evento</label>
              <input
                id="evento-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={150}
                autoFocus
                required
              />
            </div>
          )}

          <div className="campo">
            <label htmlFor="evento-data">Data</label>
            <input
              id="evento-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              autoFocus={editando}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="evento-localizacao">Localização</label>
            <input
              id="evento-localizacao"
              type="text"
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              maxLength={255}
              required
            />
          </div>

          {!editando && (
            <>
              <div className="campo">
                <label htmlFor="evento-imagem-url">Imagem (URL)</label>
                <input
                  id="evento-imagem-url"
                  type="url"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={imagemEhArquivo ? '' : imagem}
                  onChange={(e) => setImagem(e.target.value)}
                />
              </div>

              <div className="campo">
                <label htmlFor="evento-imagem-arquivo">Ou escolha uma imagem do computador</label>
                <input
                  key={chaveArquivo}
                  id="evento-imagem-arquivo"
                  type="file"
                  accept="image/*"
                  onChange={escolherArquivo}
                />
              </div>

              {imagem && (
                <div className="previa">
                  <img src={imagem} alt="Pré-visualização da imagem do evento" />
                  {imagemEhArquivo && (
                    <button type="button" className="btn-link" onClick={removerImagem}>
                      Remover imagem
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {erro && (
            <p className="erro" role="alert">
              {erro}
            </p>
          )}

          <div className="modal-acoes">
            <button type="button" className="btn btn-secundario" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
