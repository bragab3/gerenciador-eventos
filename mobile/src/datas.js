const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Máscara de digitação: "15122026" -> "15/12/2026"
export function mascaraData(texto) {
  const d = (texto ?? '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// "2026-12-15" (formato da API) -> "15/12/2026"
export function isoParaBr(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

// "15/12/2026" -> "2026-12-15". Retorna null se o formato ou a data (ex.: 31/02) forem inválidos.
export function brParaIso(br) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br ?? '');
  if (!m) return null;
  const [, d, mes, a] = m;
  const dia = Number(d);
  const mm = Number(mes);
  const ano = Number(a);
  const data = new Date(Date.UTC(ano, mm - 1, dia));
  const valida =
    data.getUTCFullYear() === ano && data.getUTCMonth() === mm - 1 && data.getUTCDate() === dia;
  return valida ? `${a}-${mes}-${d}` : null;
}

// Quebra o texto "yyyy-MM-dd" à mão: new Date("2026-12-20") seria lido como UTC e,
// no fuso do Brasil, mostraria o dia anterior.
export function partesDaData(iso) {
  const [ano, mes, dia] = iso.split('-');
  return { ano, dia, mes: MESES[Number(mes) - 1] };
}
