import { useState } from 'react';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// A API devolve "yyyy-MM-dd". Quebramos o texto à mão: new Date("2026-12-20") seria
// lido como UTC e, no fuso do Brasil, mostraria o dia anterior.
function partesDaData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return { ano, dia, mes: MESES[Number(mes) - 1] };
}

export default function EventoCard({ evento, onEditar, onExcluir }) {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const { ano, dia, mes } = partesDaData(evento.data);

  return (
    <article className="evento">
      <div className="evento-imagem">
        {evento.imagem && !imagemFalhou ? (
          <img
            src={evento.imagem}
            alt={`Imagem do evento ${evento.nome}`}
            loading="lazy"
            onError={() => setImagemFalhou(true)}
          />
        ) : (
          <span>Sem imagem</span>
        )}
        <time className="selo-data" dateTime={evento.data}>
          <span className="dia">{dia}</span>
          <span className="mes">{mes}</span>
          <span className="ano">{ano}</span>
        </time>
      </div>

      <div className="evento-corpo">
        <h3>{evento.nome}</h3>
        <p className="local">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span>{evento.localizacao}</span>
        </p>
      </div>

      <div className="evento-acoes">
        <button type="button" className="btn btn-secundario btn-pequeno" onClick={onEditar}>
          Editar
        </button>
        <button type="button" className="btn btn-perigo btn-pequeno" onClick={onExcluir}>
          Excluir
        </button>
      </div>
    </article>
  );
}
