// Servidor SIMULADO do backend Spring Boot, usado apenas para testar o app sem o backend real
// (ex.: ambientes sem acesso ao Maven Central). Segue o contrato do projeto gerenciador-eventos-backend:
// mesmas rotas, status HTTP, mensagens e formato de erro (ErroResponse). Não use em produção.
//
//   node e2e/mock-backend.js            (porta 8080, ou PORT=xxxx)
const http = require('http');
const crypto = require('crypto');

const SEGREDO = crypto.randomBytes(32);
const EXPIRACAO_S = 24 * 60 * 60;

const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
function gerarJwt(admin) {
  const agora = Math.floor(Date.now() / 1000);
  const corpo = `${b64({ alg: 'HS256' })}.${b64({ sub: admin.email, adminId: admin.id, nome: admin.nome, iat: agora, exp: agora + EXPIRACAO_S })}`;
  return `${corpo}.${crypto.createHmac('sha256', SEGREDO).update(corpo).digest('base64url')}`;
}
function lerJwt(token) {
  const [h, p, assinatura] = (token || '').split('.');
  if (!h || !p || !assinatura) return null;
  const esperada = crypto.createHmac('sha256', SEGREDO).update(`${h}.${p}`).digest('base64url');
  if (assinatura.length !== esperada.length || !crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada))) return null;
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  return claims.exp > Math.floor(Date.now() / 1000) ? claims : null;
}

const hashSenha = (senha, sal) => crypto.scryptSync(senha, sal, 32).toString('hex');

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const dataValida = (s) => REGEX_DATA.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

const RAZOES = { 200: 'OK', 201: 'Created', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 500: 'Internal Server Error' };

function criarServidor({ origensPermitidas = ['http://localhost:8081', 'http://localhost:5173', 'http://localhost:3000'] } = {}) {
  const admins = [];
  const eventos = [];
  let seqAdmin = 1;
  let seqEvento = 1;
  const requisicoes = [];

  function enviar(req, res, status, corpo, extra = {}) {
    const origem = req.headers.origin;
    const cors = origem && origensPermitidas.includes(origem)
      ? { 'Access-Control-Allow-Origin': origem, Vary: 'Origin' }
      : {};
    res.writeHead(status, { 'Content-Type': 'application/json;charset=UTF-8', ...cors, ...extra });
    res.end(corpo === undefined ? undefined : JSON.stringify(corpo));
  }
  const erro = (req, res, status, mensagem, detalhes) =>
    enviar(req, res, status, {
      timestamp: new Date().toISOString().slice(0, 23),
      status,
      erro: RAZOES[status],
      mensagem,
      caminho: new URL(req.url, 'http://x').pathname,
      ...(detalhes ? { detalhes } : {}),
    });

  const lerCorpo = (req) =>
    new Promise((resolve) => {
      const partes = [];
      req.on('data', (c) => partes.push(c));
      req.on('end', () => resolve(Buffer.concat(partes).toString()));
    });

  const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const caminho = url.pathname;
    requisicoes.push({ metodo: req.method, caminho, autorizacao: req.headers.authorization || null });

    // CORS (preflight)
    if (req.method === 'OPTIONS') {
      const origem = req.headers.origin;
      if (!origem || !origensPermitidas.includes(origem)) return enviar(req, res, 403, { mensagem: 'Invalid CORS request' });
      res.writeHead(200, {
        'Access-Control-Allow-Origin': origem,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || '*',
        'Access-Control-Max-Age': '3600',
        Vary: 'Origin',
      });
      return res.end();
    }

    let corpo = {};
    if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
      try {
        const texto = await lerCorpo(req);
        corpo = texto ? JSON.parse(texto) : {};
      } catch {
        return erro(req, res, 400, 'Requisição malformada ou com valores em formato inválido (datas devem seguir yyyy-MM-dd).');
      }
    }

    // ---------- Públicos ----------
    if (req.method === 'POST' && caminho === '/api/auth/cadastro') {
      const detalhes = [];
      if (!corpo.nome || !String(corpo.nome).trim()) detalhes.push('nome: O nome é obrigatório');
      else if (corpo.nome.length > 120) detalhes.push('nome: O nome deve ter no máximo 120 caracteres');
      if (!corpo.email || !String(corpo.email).trim()) detalhes.push('email: O email é obrigatório');
      else if (!REGEX_EMAIL.test(corpo.email)) detalhes.push('email: Email inválido');
      if (!corpo.senha || !String(corpo.senha).trim()) detalhes.push('senha: A senha é obrigatória');
      else if (corpo.senha.length < 6 || corpo.senha.length > 72) detalhes.push('senha: A senha deve ter entre 6 e 72 caracteres');
      if (detalhes.length) return erro(req, res, 400, 'Dados inválidos.', detalhes);

      const email = corpo.email.trim().toLowerCase();
      if (admins.some((a) => a.email === email)) {
        return erro(req, res, 409, `Já existe um administrador cadastrado com o email: ${email}`);
      }
      const sal = crypto.randomBytes(8).toString('hex');
      const admin = { id: seqAdmin++, nome: corpo.nome.trim(), email, sal, hash: hashSenha(corpo.senha, sal) };
      admins.push(admin);
      return enviar(req, res, 201, { id: admin.id, nome: admin.nome, email: admin.email });
    }

    if (req.method === 'POST' && caminho === '/api/auth/login') {
      const detalhes = [];
      if (!corpo.email || !String(corpo.email).trim()) detalhes.push('email: O email é obrigatório');
      else if (!REGEX_EMAIL.test(corpo.email)) detalhes.push('email: Email inválido');
      if (!corpo.senha || !String(corpo.senha).trim()) detalhes.push('senha: A senha é obrigatória');
      if (detalhes.length) return erro(req, res, 400, 'Dados inválidos.', detalhes);

      const admin = admins.find((a) => a.email === corpo.email.trim().toLowerCase());
      if (!admin || hashSenha(corpo.senha, admin.sal) !== admin.hash) {
        return erro(req, res, 401, 'Email ou senha inválidos.');
      }
      return enviar(req, res, 200, { token: gerarJwt(admin), tipo: 'Bearer', adminId: admin.id, nome: admin.nome, email: admin.email });
    }

    // ---------- Protegidos (JWT) ----------
    if (!caminho.startsWith('/api/eventos')) return erro(req, res, 404, `No static resource ${caminho.slice(1)}.`);

    const cabecalho = req.headers.authorization || '';
    const claims = cabecalho.startsWith('Bearer ') ? lerJwt(cabecalho.slice(7).trim()) : null;
    if (!claims) {
      return erro(req, res, 401, 'Autenticação necessária: envie um token JWT válido no header Authorization (Bearer <token>).');
    }
    const adminAutenticado = admins.find((a) => a.email === claims.sub);
    if (!adminAutenticado) return erro(req, res, 401, 'Autenticação necessária: envie um token JWT válido no header Authorization (Bearer <token>).');
    const meuId = adminAutenticado.id;
    const resposta = (e) => ({ id: e.id, nome: e.nome, data: e.data, localizacao: e.localizacao, imagem: e.imagem, adminId: e.adminId });

    if (req.method === 'GET' && caminho === '/api/eventos') {
      const adminId = Number(url.searchParams.get('adminId'));
      if (!url.searchParams.has('adminId')) return erro(req, res, 400, "Required parameter 'adminId' is not present.");
      if (Number.isNaN(adminId)) return erro(req, res, 400, 'Requisição malformada ou com valores em formato inválido (datas devem seguir yyyy-MM-dd).');
      if (adminId !== meuId) return erro(req, res, 403, 'Você só pode listar ou cadastrar eventos do seu próprio administrador.');
      const lista = eventos.filter((e) => e.adminId === adminId).sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id);
      return enviar(req, res, 200, lista.map(resposta));
    }

    if (req.method === 'POST' && caminho === '/api/eventos') {
      const detalhes = [];
      if (!corpo.nome || !String(corpo.nome).trim()) detalhes.push('nome: O nome do evento é obrigatório');
      else if (corpo.nome.length > 150) detalhes.push('nome: O nome deve ter no máximo 150 caracteres');
      if (corpo.data == null) detalhes.push('data: A data é obrigatória');
      else if (!dataValida(corpo.data)) {
        return erro(req, res, 400, 'Requisição malformada ou com valores em formato inválido (datas devem seguir yyyy-MM-dd).');
      }
      if (!corpo.localizacao || !String(corpo.localizacao).trim()) detalhes.push('localizacao: A localização é obrigatória');
      else if (corpo.localizacao.length > 255) detalhes.push('localizacao: A localização deve ter no máximo 255 caracteres');
      if (corpo.adminId == null) detalhes.push('adminId: O adminId é obrigatório');
      if (detalhes.length) return erro(req, res, 400, 'Dados inválidos.', detalhes);

      if (corpo.adminId !== meuId) return erro(req, res, 403, 'Você só pode listar ou cadastrar eventos do seu próprio administrador.');
      const imagem = corpo.imagem && String(corpo.imagem).trim() ? String(corpo.imagem).trim() : null;
      const evento = { id: seqEvento++, nome: corpo.nome.trim(), data: corpo.data, localizacao: corpo.localizacao.trim(), imagem, adminId: meuId };
      eventos.push(evento);
      return enviar(req, res, 201, resposta(evento));
    }

    const m = /^\/api\/eventos\/(\d+)$/.exec(caminho);
    if (m && (req.method === 'PATCH' || req.method === 'DELETE')) {
      const id = Number(m[1]);

      if (req.method === 'PATCH') {
        if (corpo.localizacao != null && corpo.localizacao.length > 255) {
          return erro(req, res, 400, 'Dados inválidos.', ['localizacao: A localização deve ter no máximo 255 caracteres']);
        }
        if (corpo.data != null && !dataValida(corpo.data)) {
          return erro(req, res, 400, 'Requisição malformada ou com valores em formato inválido (datas devem seguir yyyy-MM-dd).');
        }
        const semData = corpo.data == null;
        const semLocal = corpo.localizacao == null || !String(corpo.localizacao).trim();
        if (semData && semLocal) return erro(req, res, 400, "Informe ao menos 'data' ou 'localizacao' para atualizar o evento.");
      }

      const evento = eventos.find((e) => e.id === id);
      if (!evento) return erro(req, res, 404, `Evento não encontrado: ${id}`);
      if (evento.adminId !== meuId) return erro(req, res, 403, 'Este evento pertence a outro administrador.');

      if (req.method === 'PATCH') {
        if (corpo.data != null) evento.data = corpo.data;
        if (corpo.localizacao != null && String(corpo.localizacao).trim()) evento.localizacao = corpo.localizacao.trim();
        return enviar(req, res, 200, resposta(evento));
      }
      eventos.splice(eventos.indexOf(evento), 1);
      res.writeHead(204, { ...(req.headers.origin && origensPermitidas.includes(req.headers.origin) ? { 'Access-Control-Allow-Origin': req.headers.origin } : {}) });
      return res.end();
    }

    return erro(req, res, 404, `No static resource ${caminho.slice(1)}.`);
  });

  return { servidor, admins, eventos, requisicoes };
}

module.exports = { criarServidor };

if (require.main === module) {
  const porta = Number(process.env.PORT || 8080);
  const { servidor } = criarServidor();
  servidor.listen(porta, () => console.log(`Backend simulado em http://localhost:${porta}`));
}
