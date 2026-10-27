import { AxiosError } from 'axios';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';
import { api } from '../src/api';
import { SESSAO_KEY, lerCofre, prepararCofre, sessaoExemplo } from '../test-utils/render';

// Mini "backend" no lugar do axios: valida o fluxo completo (telas + navegação + sessão + interceptadores)
function backendFalso({ eventos = [], tokenValido = true } = {}) {
  const chamadas = [];
  api.defaults.adapter = async (config) => {
    chamadas.push(config);
    const ok = (status, data) => ({ data, status, statusText: '', headers: {}, config });
    const falha = (status, data) => {
      throw new AxiosError('falhou', AxiosError.ERR_BAD_REQUEST, config, null, ok(status, data));
    };

    if (config.url === '/api/auth/login') {
      const { email, senha } = JSON.parse(config.data);
      if (email === 'maria@email.com' && senha === 'senha123') {
        return ok(200, { token: 'jwt-ok', tipo: 'Bearer', adminId: 1, nome: 'Maria Silva', email });
      }
      return falha(401, { mensagem: 'Email ou senha inválidos' });
    }
    if (config.url === '/api/auth/cadastro') return ok(201, { id: 2 });
    if (config.url === '/api/eventos') {
      if (!tokenValido || config.headers.Authorization !== 'Bearer jwt-ok') {
        return falha(401, { mensagem: 'Autenticação necessária' });
      }
      return ok(200, eventos);
    }
    return falha(404, { mensagem: 'não encontrado' });
  };
  return chamadas;
}

const feira = { id: 1, nome: 'Feira de Tecnologia', data: '2026-12-15', localizacao: 'São Paulo', imagem: null, adminId: 1 };

beforeEach(() => {
  jest.clearAllMocks();
  prepararCofre();
});

test('sem sessão, o app abre no Login', async () => {
  backendFalso();
  await render(<App />);
  expect(await screen.findByText('Entre para cadastrar e acompanhar os seus eventos.')).toBeTruthy();
  expect(screen.queryByText('Meus eventos')).toBeNull();
});

test('com sessão salva, o app abre direto na Home e envia o token na listagem', async () => {
  prepararCofre({ sessao: { ...sessaoExemplo, token: 'jwt-ok' } });
  const chamadas = backendFalso({ eventos: [feira] });

  await render(<App />);

  expect(await screen.findByText('Feira de Tecnologia')).toBeTruthy();
  const listagem = chamadas.find((c) => c.url === '/api/eventos');
  expect(listagem.headers.Authorization).toBe('Bearer jwt-ok');
  expect(listagem.params).toEqual({ adminId: 1 });
});

test('fluxo: login → Home com eventos → Sair → volta ao Login', async () => {
  backendFalso({ eventos: [feira] });
  await render(<App />);

  await fireEvent.changeText(await screen.findByLabelText('Email do Administrador'), 'maria@email.com');
  await fireEvent.changeText(screen.getByLabelText('Senha'), 'senha123');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

  expect(await screen.findByText('Meus eventos')).toBeTruthy();
  expect(await screen.findByText('Feira de Tecnologia')).toBeTruthy();
  expect(lerCofre(SESSAO_KEY).token).toBe('jwt-ok');

  await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
  expect(await screen.findByText('Entre para cadastrar e acompanhar os seus eventos.')).toBeTruthy();
  expect(lerCofre(SESSAO_KEY)).toBeNull();
});

test('login errado mostra o erro e continua no Login', async () => {
  backendFalso();
  await render(<App />);

  await fireEvent.changeText(await screen.findByLabelText('Email do Administrador'), 'maria@email.com');
  await fireEvent.changeText(screen.getByLabelText('Senha'), 'errada');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

  expect(await screen.findByText('Email ou senha inválidos')).toBeTruthy();
  expect(screen.queryByText('Meus eventos')).toBeNull();
});

test('token expirado (401 na Home) encerra a sessão e volta ao Login', async () => {
  prepararCofre({ sessao: { ...sessaoExemplo, token: 'jwt-expirado' } });
  backendFalso({ tokenValido: false });

  await render(<App />);

  expect(await screen.findByText('Entre para cadastrar e acompanhar os seus eventos.')).toBeTruthy();
  await waitFor(() => expect(lerCofre(SESSAO_KEY)).toBeNull());
});

test('fluxo: Cadastrar-se → cadastro com sucesso → Login com mensagem e email preenchido', async () => {
  backendFalso();
  await render(<App />);

  await fireEvent.press(await screen.findByRole('button', { name: 'Cadastrar-se' }));
  expect(await screen.findByText('Cadastro de Administrador')).toBeTruthy();

  await fireEvent.changeText(screen.getByLabelText('Nome do Administrador'), 'Joana Souza');
  await fireEvent.changeText(screen.getByLabelText('Email'), 'joana@email.com');
  await fireEvent.changeText(screen.getByLabelText('Senha'), 'segredo1');
  await fireEvent.changeText(screen.getByLabelText('Confirmar Senha'), 'segredo1');
  await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

  expect(await screen.findByText(/cadastrado com sucesso/)).toBeTruthy();
  await waitFor(() => expect(screen.getByLabelText('Email do Administrador').props.value).toBe('joana@email.com'));
});
