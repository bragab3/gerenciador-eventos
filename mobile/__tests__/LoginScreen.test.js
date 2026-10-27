import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AuthApi } from '../src/api';
import LoginScreen from '../src/screens/LoginScreen';
import { CREDENCIAIS_KEY, SESSAO_KEY, lerCofre, prepararCofre, renderComSessao } from '../test-utils/render';

jest.mock('../src/api', () => ({
  ...jest.requireActual('../src/api'),
  AuthApi: { login: jest.fn(), cadastrar: jest.fn() },
}));

const respostaLogin = { token: 'jwt-123', tipo: 'Bearer', adminId: 4, nome: 'Maria Silva', email: 'maria@email.com' };

function abrir(route) {
  const navigation = { navigate: jest.fn() };
  return { navigation, pronto: renderComSessao(<LoginScreen navigation={navigation} route={route ?? { params: undefined }} />) };
}

async function preencher(email, senha) {
  await fireEvent.changeText(screen.getByLabelText('Email do Administrador'), email);
  await fireEvent.changeText(screen.getByLabelText('Senha'), senha);
}

beforeEach(() => {
  jest.clearAllMocks();
  prepararCofre();
});

test('mostra os campos e botões pedidos no desafio', async () => {
  await abrir().pronto;
  expect(screen.getByLabelText('Email do Administrador')).toBeTruthy();
  expect(screen.getByLabelText('Senha')).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: 'Gravar Senha' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Cadastrar-se' })).toBeTruthy();
});

test('não chama a API com campos vazios e avisa o usuário', async () => {
  await abrir().pronto;
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  expect(await screen.findByText('Informe o email e a senha.')).toBeTruthy();
  expect(AuthApi.login).not.toHaveBeenCalled();
});

test('login com sucesso envia email sem espaços e guarda a sessão (token + adminId)', async () => {
  AuthApi.login.mockResolvedValue(respostaLogin);
  await abrir().pronto;

  await preencher('  maria@email.com ', 'senha123');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

  await waitFor(() => expect(AuthApi.login).toHaveBeenCalledWith('maria@email.com', 'senha123'));
  await waitFor(() =>
    expect(lerCofre(SESSAO_KEY)).toEqual({ token: 'jwt-123', adminId: 4, nome: 'Maria Silva', email: 'maria@email.com' })
  );
});

test('"Gravar Senha" marcado: salva email e senha para as próximas vezes', async () => {
  AuthApi.login.mockResolvedValue(respostaLogin);
  await abrir().pronto;

  await preencher('maria@email.com', 'senha123');
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gravar Senha' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

  await waitFor(() => expect(lerCofre(CREDENCIAIS_KEY)).toEqual({ email: 'maria@email.com', senha: 'senha123' }));
});

test('"Gravar Senha" desmarcado: não guarda e apaga credenciais antigas', async () => {
  prepararCofre({ credenciais: { email: 'antigo@email.com', senha: 'velha123' } });
  AuthApi.login.mockResolvedValue(respostaLogin);
  await abrir().pronto;

  // começa marcado e preenchido por causa das credenciais salvas; o usuário desmarca
  await waitFor(() => expect(screen.getByLabelText('Email do Administrador').props.value).toBe('antigo@email.com'));
  await fireEvent.press(screen.getByRole('checkbox', { name: 'Gravar Senha' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

  await waitFor(() => expect(lerCofre(SESSAO_KEY)).not.toBeNull());
  expect(lerCofre(CREDENCIAIS_KEY)).toBeNull();
});

test('com credenciais salvas, abre com email e senha preenchidos e a opção marcada', async () => {
  prepararCofre({ credenciais: { email: 'maria@email.com', senha: 'senha123' } });
  await abrir().pronto;

  await waitFor(() => expect(screen.getByLabelText('Email do Administrador').props.value).toBe('maria@email.com'));
  expect(screen.getByLabelText('Senha').props.value).toBe('senha123');
  expect(screen.getByRole('checkbox', { name: 'Gravar Senha' }).props.accessibilityState.checked).toBe(true);
});

test('credenciais inválidas: mostra a mensagem da API e não cria sessão', async () => {
  AuthApi.login.mockRejectedValue({ response: { status: 401, data: { mensagem: 'Email ou senha inválidos' } } });
  await abrir().pronto;

  await preencher('maria@email.com', 'errada');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

  expect(await screen.findByText('Email ou senha inválidos')).toBeTruthy();
  expect(lerCofre(SESSAO_KEY)).toBeNull();
  // o botão volta a ficar utilizável
  await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' }).props.accessibilityState.disabled).toBe(false));
});

test('servidor fora do ar: explica o problema de conexão', async () => {
  AuthApi.login.mockRejectedValue({ code: 'ERR_NETWORK' });
  await abrir().pronto;

  await preencher('maria@email.com', 'senha123');
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

  expect(await screen.findByText(/Não foi possível conectar ao servidor/)).toBeTruthy();
});

test('"Cadastrar-se" navega para a tela de cadastro', async () => {
  const { navigation, pronto } = abrir();
  await pronto;
  await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar-se' }));
  expect(navigation.navigate).toHaveBeenCalledWith('Cadastro');
});

test('depois do cadastro mostra a mensagem de sucesso e já traz o email preenchido', async () => {
  prepararCofre({ credenciais: { email: 'outra@email.com', senha: 'x12345' } });
  await abrir({ params: { aviso: 'Administrador cadastrado com sucesso!', email: 'novo@email.com' } }).pronto;

  expect(screen.getByText('Administrador cadastrado com sucesso!')).toBeTruthy();
  await waitFor(() => expect(screen.getByLabelText('Email do Administrador').props.value).toBe('novo@email.com'));
  expect(screen.getByLabelText('Senha').props.value).toBe('');
});
