import axios from 'axios';
import { API_URL } from './config';

export const api = axios.create({ baseURL: API_URL, timeout: 15000 });

let tokenAtual = null;
let aoNaoAutorizado = null;

// Chamado pelo SessaoProvider: a partir daí todas as requisições levam Authorization: Bearer <token>
export function definirToken(token) {
  tokenAtual = token || null;
}

// Callback executado quando uma rota protegida responde 401 (token expirado/inválido)
export function definirAoNaoAutorizado(callback) {
  aoNaoAutorizado = callback;
}

api.interceptors.request.use((config) => {
  if (tokenAtual) {
    config.headers.Authorization = `Bearer ${tokenAtual}`;
  }
  return config;
});

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const rotaPublica = (erro.config?.url || '').includes('/api/auth/');
    if (erro.response?.status === 401 && !rotaPublica && aoNaoAutorizado) {
      aoNaoAutorizado();
    }
    return Promise.reject(erro);
  }
);

// Extrai uma mensagem legível do formato de erro da API (mensagem + detalhes)
export function mensagemDeErro(erro) {
  const corpo = erro?.response?.data;
  if (corpo?.detalhes?.length) return corpo.detalhes.join('\n');
  if (corpo?.mensagem) return corpo.mensagem;
  if (erro?.code === 'ERR_NETWORK' || erro?.code === 'ECONNABORTED') {
    return `Não foi possível conectar ao servidor (${api.defaults.baseURL}). Confira se o backend está rodando e se a URL está correta.`;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export const AuthApi = {
  login: (email, senha) => api.post('/api/auth/login', { email, senha }).then((r) => r.data),
  cadastrar: (dados) => api.post('/api/auth/cadastro', dados).then((r) => r.data),
};

export const EventosApi = {
  listar: (adminId) => api.get('/api/eventos', { params: { adminId } }).then((r) => r.data),
  criar: (dados) => api.post('/api/eventos', dados).then((r) => r.data),
  atualizar: (eventoId, dados) => api.patch(`/api/eventos/${eventoId}`, dados).then((r) => r.data),
  excluir: (eventoId) => api.delete(`/api/eventos/${eventoId}`),
};
