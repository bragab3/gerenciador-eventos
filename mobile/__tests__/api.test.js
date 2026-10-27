import { AxiosError } from 'axios';
import { AuthApi, EventosApi, api, definirAoNaoAutorizado, definirToken, mensagemDeErro } from '../src/api';

// Adaptador falso: registra a requisição e devolve a resposta configurada
function simular(resposta) {
  const requisicoes = [];
  api.defaults.adapter = async (config) => {
    requisicoes.push(config);
    const { status = 200, data = {} } = typeof resposta === 'function' ? resposta(config) : resposta;
    const retorno = { data, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw new AxiosError('falhou', AxiosError.ERR_BAD_REQUEST, config, null, retorno);
    }
    return retorno;
  };
  return requisicoes;
}

afterEach(() => {
  definirToken(null);
  definirAoNaoAutorizado(null);
});

describe('interceptador de requisição', () => {
  test('envia Authorization: Bearer <token> depois de definirToken', async () => {
    const reqs = simular({ data: [] });
    definirToken('abc.def.ghi');
    await EventosApi.listar(7);
    expect(reqs[0].headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  test('não envia Authorization sem token', async () => {
    const reqs = simular({ data: {} });
    await AuthApi.login('a@b.com', 'x');
    expect(reqs[0].headers.Authorization).toBeUndefined();
  });
});

describe('contrato das rotas', () => {
  test('listar: GET /api/eventos?adminId=', async () => {
    const reqs = simular({ data: [{ id: 1 }] });
    const lista = await EventosApi.listar(3);
    expect(reqs[0]).toMatchObject({ method: 'get', url: '/api/eventos', params: { adminId: 3 } });
    expect(lista).toEqual([{ id: 1 }]);
  });

  test('criar: POST /api/eventos com o corpo', async () => {
    const reqs = simular({ status: 201, data: { id: 9 } });
    const corpo = { nome: 'X', data: '2026-12-15', localizacao: 'SP', imagem: '', adminId: 1 };
    await EventosApi.criar(corpo);
    expect(reqs[0]).toMatchObject({ method: 'post', url: '/api/eventos' });
    expect(JSON.parse(reqs[0].data)).toEqual(corpo);
  });

  test('atualizar: PATCH /api/eventos/{id}', async () => {
    const reqs = simular({ data: {} });
    await EventosApi.atualizar(5, { data: '2026-12-20', localizacao: 'Campinas' });
    expect(reqs[0]).toMatchObject({ method: 'patch', url: '/api/eventos/5' });
  });

  test('excluir: DELETE /api/eventos/{id}', async () => {
    const reqs = simular({ status: 204 });
    await EventosApi.excluir(5);
    expect(reqs[0]).toMatchObject({ method: 'delete', url: '/api/eventos/5' });
  });

  test('login e cadastro: POST /api/auth/*', async () => {
    const reqs = simular({ data: {} });
    await AuthApi.login('a@b.com', 'senha123');
    await AuthApi.cadastrar({ nome: 'A', email: 'a@b.com', senha: 'senha123' });
    expect(reqs.map((r) => [r.method, r.url])).toEqual([
      ['post', '/api/auth/login'],
      ['post', '/api/auth/cadastro'],
    ]);
  });
});

describe('401 (token expirado ou inválido)', () => {
  test('em rota protegida aciona o callback de sessão expirada', async () => {
    simular({ status: 401, data: { mensagem: 'Autenticação necessária' } });
    const aoNaoAutorizado = jest.fn();
    definirAoNaoAutorizado(aoNaoAutorizado);

    await expect(EventosApi.listar(1)).rejects.toBeDefined();
    expect(aoNaoAutorizado).toHaveBeenCalledTimes(1);
  });

  test('em /api/auth/ (credenciais erradas) NÃO derruba a sessão', async () => {
    simular({ status: 401, data: { mensagem: 'Email ou senha inválidos' } });
    const aoNaoAutorizado = jest.fn();
    definirAoNaoAutorizado(aoNaoAutorizado);

    await expect(AuthApi.login('a@b.com', 'errada')).rejects.toBeDefined();
    expect(aoNaoAutorizado).not.toHaveBeenCalled();
  });

  test('403 não aciona o callback', async () => {
    simular({ status: 403, data: { mensagem: 'Acesso negado' } });
    const aoNaoAutorizado = jest.fn();
    definirAoNaoAutorizado(aoNaoAutorizado);

    await expect(EventosApi.excluir(1)).rejects.toBeDefined();
    expect(aoNaoAutorizado).not.toHaveBeenCalled();
  });
});

describe('mensagemDeErro', () => {
  const comResposta = (data) => ({ response: { data } });

  test('junta os detalhes de validação, um por linha', () => {
    expect(mensagemDeErro(comResposta({ detalhes: ['A senha é obrigatória', 'Email inválido'], mensagem: 'x' }))).toBe(
      'A senha é obrigatória\nEmail inválido'
    );
  });
  test('usa a mensagem quando não há detalhes', () => {
    expect(mensagemDeErro(comResposta({ mensagem: 'Email já cadastrado', detalhes: [] }))).toBe('Email já cadastrado');
  });
  test('erro de rede explica como resolver', () => {
    expect(mensagemDeErro({ code: 'ERR_NETWORK' })).toMatch(/Não foi possível conectar ao servidor/);
  });
  test('timeout também é tratado como falha de conexão', () => {
    expect(mensagemDeErro({ code: 'ECONNABORTED' })).toMatch(/Não foi possível conectar/);
  });
  test('erro desconhecido tem mensagem genérica', () => {
    expect(mensagemDeErro(new Error('boom'))).toBe('Ocorreu um erro inesperado. Tente novamente.');
    expect(mensagemDeErro(undefined)).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });
});
