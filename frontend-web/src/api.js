import axios from 'axios';
import { getSessao, limparSessao } from './auth.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// Envia o JWT em todas as requisições: Authorization: Bearer <token>
api.interceptors.request.use((config) => {
  const sessao = getSessao();
  if (sessao?.token) {
    config.headers.Authorization = `Bearer ${sessao.token}`;
  }
  return config;
});

// Token expirado ou inválido em rota protegida: limpa a sessão e volta ao login
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const rotaPublica = (erro.config?.url || '').includes('/api/auth/');
    if (erro.response?.status === 401 && !rotaPublica) {
      limparSessao();
      window.location.href = '/';
    }
    return Promise.reject(erro);
  }
);

// Extrai uma mensagem legível do formato de erro da API (mensagem + detalhes)
export function mensagemDeErro(erro) {
  const corpo = erro.response?.data;
  if (corpo?.detalhes?.length) return corpo.detalhes.join('\n');
  if (corpo?.mensagem) return corpo.mensagem;
  if (erro.code === 'ERR_NETWORK') {
    return 'Não foi possível conectar ao servidor. Confira se o backend está rodando em ' + api.defaults.baseURL + '.';
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
