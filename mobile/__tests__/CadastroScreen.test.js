import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthApi } from '../src/api';
import CadastroScreen, { MENSAGEM_CADASTRO_OK } from '../src/screens/CadastroScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../src/api', () => ({
  ...jest.requireActual('../src/api'),
  AuthApi: { login: jest.fn(), cadastrar: jest.fn() },
}));

const metricas = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

async function abrir() {
  const navigation = { navigate: jest.fn(), goBack: jest.fn() };
  await render(
    <SafeAreaProvider initialMetrics={metricas}>
      <CadastroScreen navigation={navigation} />
    </SafeAreaProvider>
  );
  return navigation;
}

async function preencher({ nome = 'Maria Silva', email = 'maria@email.com', senha = 'senha123', confirmar = senha } = {}) {
  await fireEvent.changeText(screen.getByLabelText('Nome do Administrador'), nome);
  await fireEvent.changeText(screen.getByLabelText('Email'), email);
  await fireEvent.changeText(screen.getByLabelText('Senha'), senha);
  await fireEvent.changeText(screen.getByLabelText('Confirmar Senha'), confirmar);
}

beforeEach(() => jest.clearAllMocks());

test('mostra os 4 campos do desafio', async () => {
  await abrir();
  ['Nome do Administrador', 'Email', 'Senha', 'Confirmar Senha'].forEach((rotulo) =>
    expect(screen.getByLabelText(rotulo)).toBeTruthy()
  );
  expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeTruthy();
});

test('senha e confirmação diferentes: mostra erro e NÃO chama a API', async () => {
  await abrir();
  await preencher({ senha: 'senha123', confirmar: 'senha124' });
  await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

  expect(await screen.findByText(/As senhas não coincidem/)).toBeTruthy();
  expect(AuthApi.cadastrar).not.toHaveBeenCalled();
});

test('senha com menos de 6 caracteres é barrada antes da API', async () => {
  await abrir();
  await preencher({ senha: '12345' });
  await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

  expect(await screen.findByText('A senha deve ter no mínimo 6 caracteres.')).toBeTruthy();
  expect(AuthApi.cadastrar).not.toHaveBeenCalled();
});

test('campos vazios são barrados antes da API', async () => {
  await abrir();
  await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));
  expect(await screen.findByText('Preencha nome, email e senha.')).toBeTruthy();
  expect(AuthApi.cadastrar).not.toHaveBeenCalled();
});

test('cadastro com sucesso: envia dados sem a confirmação e volta ao login com a mensagem de sucesso', async () => {
  AuthApi.cadastrar.mockResolvedValue({ id: 1, nome: 'Maria Silva', email: 'maria@email.com' });
  const navigation = await abrir();

  await preencher({ nome: '  Maria Silva ', email: ' maria@email.com ' });
  await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

  await waitFor(() =>
    expect(AuthApi.cadastrar).toHaveBeenCalledWith({ nome: 'Maria Silva', email: 'maria@email.com', senha: 'senha123' })
  );
  expect(navigation.navigate).toHaveBeenCalledWith('Login', { aviso: MENSAGEM_CADASTRO_OK, email: 'maria@email.com' });
  expect(MENSAGEM_CADASTRO_OK).toMatch(/sucesso/);
});

test('email já cadastrado (409): mostra a mensagem do servidor e fica na tela', async () => {
  AuthApi.cadastrar.mockRejectedValue({ response: { status: 409, data: { mensagem: 'Email já cadastrado: maria@email.com' } } });
  const navigation = await abrir();

  await preencher();
  await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

  expect(await screen.findByText('Email já cadastrado: maria@email.com')).toBeTruthy();
  expect(navigation.navigate).not.toHaveBeenCalled();
});

test('"Voltar ao login" volta uma tela', async () => {
  const navigation = await abrir();
  await fireEvent.press(screen.getByRole('button', { name: 'Voltar ao login' }));
  expect(navigation.goBack).toHaveBeenCalled();
});
