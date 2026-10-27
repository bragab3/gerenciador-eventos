import * as ImagePicker from 'expo-image-picker';
import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { EventosApi } from '../src/api';
import HomeScreen from '../src/screens/HomeScreen';
import { SESSAO_KEY, lerCofre, prepararCofre, renderComSessao, sessaoExemplo } from '../test-utils/render';

jest.mock('../src/api', () => ({
  ...jest.requireActual('../src/api'),
  EventosApi: { listar: jest.fn(), criar: jest.fn(), atualizar: jest.fn(), excluir: jest.fn() },
}));

const feira = { id: 1, nome: 'Feira de Tecnologia', data: '2026-12-15', localizacao: 'São Paulo', imagem: 'https://exemplo.com/a.jpg', adminId: 1 };
const show = { id: 2, nome: 'Show de Jazz', data: '2027-01-09', localizacao: 'Rio de Janeiro', imagem: null, adminId: 1 };

async function abrirHome(eventos = [feira, show]) {
  prepararCofre({ sessao: sessaoExemplo });
  EventosApi.listar.mockResolvedValue(eventos);
  await renderComSessao(<HomeScreen />);
  // aguarda a sessão carregar e a primeira listagem terminar
  await waitFor(() => expect(EventosApi.listar).toHaveBeenCalled());
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listagem', () => {
  test('lista os eventos do administrador logado com título, data, localização e imagem', async () => {
    await abrirHome();

    expect(EventosApi.listar).toHaveBeenCalledWith(1);
    expect(EventosApi.listar).not.toHaveBeenCalledWith(undefined);
    const card = await screen.findByTestId('evento-1');
    expect(within(card).getByText('Feira de Tecnologia')).toBeTruthy();
    expect(within(card).getByText(/São Paulo/)).toBeTruthy();
    expect(within(card).getByText('15')).toBeTruthy();
    expect(within(card).getByText('dez')).toBeTruthy();
    expect(within(card).getByText('2026')).toBeTruthy();
    expect(within(card).getByLabelText('Imagem do evento Feira de Tecnologia')).toBeTruthy();

    const card2 = screen.getByTestId('evento-2');
    expect(within(card2).getByText('Show de Jazz')).toBeTruthy();
    // sem imagem: mostra o substituto
    expect(within(card2).getByText('Sem imagem')).toBeTruthy();
  });

  test('mostra o nome do administrador no topo', async () => {
    await abrirHome();
    expect(await screen.findByText('Maria Silva')).toBeTruthy();
  });

  test('sem eventos: mostra o estado vazio', async () => {
    await abrirHome([]);
    expect(await screen.findByText('Você ainda não tem eventos cadastrados.')).toBeTruthy();
  });

  test('falha ao listar: mostra o erro em vez do estado vazio', async () => {
    prepararCofre({ sessao: sessaoExemplo });
    EventosApi.listar.mockRejectedValue({ response: { status: 500, data: { mensagem: 'Erro interno' } } });
    await renderComSessao(<HomeScreen />);

    expect(await screen.findByText('Erro interno')).toBeTruthy();
    expect(screen.queryByText('Você ainda não tem eventos cadastrados.')).toBeNull();
  });
});

describe('adicionar evento', () => {
  async function abrirModalNovo() {
    await fireEvent.press(await screen.findByRole('button', { name: 'Adicionar Evento' }));
    return screen.findByText('Novo evento');
  }

  test('o modal tem nome, data, localização, imagem e botão de salvar', async () => {
    await abrirHome();
    await abrirModalNovo();

    ['Nome do evento', 'Data', 'Localização', 'Imagem (URL)'].forEach((r) => expect(screen.getByLabelText(r)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'Escolher imagem da galeria' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeTruthy();
  });

  test('salvar envia data em ISO, adminId e imagem por URL, depois recarrega a lista', async () => {
    await abrirHome([]);
    EventosApi.criar.mockResolvedValue({ ...feira, id: 3 });
    await abrirModalNovo();

    await fireEvent.changeText(screen.getByLabelText('Nome do evento'), '  Feira de Tecnologia ');
    await fireEvent.changeText(screen.getByLabelText('Data'), '15122026');
    await fireEvent.changeText(screen.getByLabelText('Localização'), 'São Paulo');
    await fireEvent.changeText(screen.getByLabelText('Imagem (URL)'), 'https://exemplo.com/a.jpg');

    // a máscara foi aplicada enquanto digitava
    expect(screen.getByLabelText('Data').props.value).toBe('15/12/2026');

    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(EventosApi.criar).toHaveBeenCalledWith({
        nome: 'Feira de Tecnologia',
        data: '2026-12-15',
        localizacao: 'São Paulo',
        imagem: 'https://exemplo.com/a.jpg',
        adminId: 1,
      })
    );
    // fecha o modal e recarrega
    await waitFor(() => expect(screen.queryByText('Novo evento')).toBeNull());
    expect(EventosApi.listar).toHaveBeenCalledTimes(2);
  });

  test('imagem escolhida da galeria vai como data URL Base64', async () => {
    await abrirHome([]);
    EventosApi.criar.mockResolvedValue({});
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ base64: 'AAAABBBB', mimeType: 'image/png' }],
    });
    await abrirModalNovo();

    await fireEvent.changeText(screen.getByLabelText('Nome do evento'), 'Show');
    await fireEvent.changeText(screen.getByLabelText('Data'), '01012027');
    await fireEvent.changeText(screen.getByLabelText('Localização'), 'Recife');
    await fireEvent.press(screen.getByRole('button', { name: 'Escolher imagem da galeria' }));

    expect(await screen.findByLabelText('Pré-visualização da imagem do evento')).toBeTruthy();
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({ base64: true, quality: 0.5 }));

    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(EventosApi.criar).toHaveBeenCalledWith(
        expect.objectContaining({ imagem: 'data:image/png;base64,AAAABBBB', adminId: 1 })
      )
    );
  });

  test('cancelar a galeria não altera a imagem', async () => {
    await abrirHome([]);
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
    await abrirModalNovo();

    await fireEvent.press(screen.getByRole('button', { name: 'Escolher imagem da galeria' }));
    await waitFor(() => expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled());
    expect(screen.queryByLabelText('Pré-visualização da imagem do evento')).toBeNull();
  });

  test('imagem maior que 1,5 MB é recusada', async () => {
    await abrirHome([]);
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ base64: 'A'.repeat(2_200_000), mimeType: 'image/jpeg' }], // ~1,65 MB
    });
    await abrirModalNovo();

    await fireEvent.press(screen.getByRole('button', { name: 'Escolher imagem da galeria' }));
    expect(await screen.findByText(/no máximo 1,5 MB/)).toBeTruthy();
    expect(screen.queryByLabelText('Pré-visualização da imagem do evento')).toBeNull();
  });

  test('data inválida (31/02) não chama a API', async () => {
    await abrirHome([]);
    await abrirModalNovo();

    await fireEvent.changeText(screen.getByLabelText('Nome do evento'), 'X');
    await fireEvent.changeText(screen.getByLabelText('Data'), '31022026');
    await fireEvent.changeText(screen.getByLabelText('Localização'), 'Y');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Data inválida. Use o formato DD/MM/AAAA.')).toBeTruthy();
    expect(EventosApi.criar).not.toHaveBeenCalled();
  });

  test('nome e localização são obrigatórios', async () => {
    await abrirHome([]);
    await abrirModalNovo();

    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Informe o nome do evento.')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Nome do evento'), 'X');
    await fireEvent.changeText(screen.getByLabelText('Data'), '15122026');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByText('Informe a localização do evento.')).toBeTruthy();
    expect(EventosApi.criar).not.toHaveBeenCalled();
  });

  test('erro da API aparece dentro do modal e ele continua aberto', async () => {
    await abrirHome([]);
    EventosApi.criar.mockRejectedValue({ response: { status: 400, data: { mensagem: 'x', detalhes: ['O nome deve ter no máximo 150 caracteres'] } } });
    await abrirModalNovo();

    await fireEvent.changeText(screen.getByLabelText('Nome do evento'), 'X');
    await fireEvent.changeText(screen.getByLabelText('Data'), '15122026');
    await fireEvent.changeText(screen.getByLabelText('Localização'), 'Y');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('O nome deve ter no máximo 150 caracteres')).toBeTruthy();
    expect(screen.getByText('Novo evento')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Salvar' }).props.accessibilityState.disabled).toBe(false));
  });

  test('Cancelar fecha o modal sem salvar', async () => {
    await abrirHome([]);
    await abrirModalNovo();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText('Novo evento')).toBeNull();
    expect(EventosApi.criar).not.toHaveBeenCalled();
  });
});

describe('editar evento (apenas data e localização)', () => {
  test('abre preenchido, sem campos de nome/imagem, e envia só data e localização', async () => {
    await abrirHome();
    EventosApi.atualizar.mockResolvedValue({});

    const card = await screen.findByTestId('evento-1');
    await fireEvent.press(within(card).getByRole('button', { name: 'Editar' }));

    expect(await screen.findByText('Editar evento')).toBeTruthy();
    expect(screen.queryByLabelText('Nome do evento')).toBeNull();
    expect(screen.queryByLabelText('Imagem (URL)')).toBeNull();
    expect(screen.getByLabelText('Data').props.value).toBe('15/12/2026');
    expect(screen.getByLabelText('Localização').props.value).toBe('São Paulo');

    await fireEvent.changeText(screen.getByLabelText('Data'), '20122026');
    await fireEvent.changeText(screen.getByLabelText('Localização'), ' Campinas ');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(EventosApi.atualizar).toHaveBeenCalledWith(1, { data: '2026-12-20', localizacao: 'Campinas' }));
    await waitFor(() => expect(screen.queryByText('Editar evento')).toBeNull());
    expect(EventosApi.listar).toHaveBeenCalledTimes(2);
  });
});

describe('excluir evento', () => {
  test('pede confirmação e, ao confirmar, exclui pelo id e remove da lista', async () => {
    await abrirHome();
    EventosApi.excluir.mockResolvedValue({});

    const card = await screen.findByTestId('evento-1');
    await fireEvent.press(within(card).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByText(/Excluir o evento "Feira de Tecnologia"\?/)).toBeTruthy();
    expect(EventosApi.excluir).not.toHaveBeenCalled();

    // o botão de confirmar é o 2º "Excluir" (o 1º é o do card)
    const botoes = screen.getAllByRole('button', { name: 'Excluir' });
    await fireEvent.press(botoes[botoes.length - 1]);

    await waitFor(() => expect(EventosApi.excluir).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByTestId('evento-1')).toBeNull());
    expect(screen.getByTestId('evento-2')).toBeTruthy();
  });

  test('cancelar a confirmação não exclui', async () => {
    await abrirHome();
    const card = await screen.findByTestId('evento-1');
    await fireEvent.press(within(card).getByRole('button', { name: 'Excluir' }));
    await screen.findByText(/Excluir o evento/);

    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(EventosApi.excluir).not.toHaveBeenCalled();
    expect(screen.getByTestId('evento-1')).toBeTruthy();
    expect(screen.queryByText(/Excluir o evento/)).toBeNull();
  });

  test('erro ao excluir (ex.: 403) mostra a mensagem e mantém o evento', async () => {
    await abrirHome();
    EventosApi.excluir.mockRejectedValue({ response: { status: 403, data: { mensagem: 'Este evento pertence a outro administrador.' } } });

    const card = await screen.findByTestId('evento-1');
    await fireEvent.press(within(card).getByRole('button', { name: 'Excluir' }));
    const botoes = await screen.findAllByRole('button', { name: 'Excluir' });
    await fireEvent.press(botoes[botoes.length - 1]);

    expect(await screen.findByText('Este evento pertence a outro administrador.')).toBeTruthy();
    expect(screen.getByTestId('evento-1')).toBeTruthy();
  });
});

describe('sair', () => {
  test('limpa a sessão guardada', async () => {
    await abrirHome();
    expect(lerCofre(SESSAO_KEY)).not.toBeNull();

    await fireEvent.press(await screen.findByRole('button', { name: 'Sair' }));
    await waitFor(() => expect(lerCofre(SESSAO_KEY)).toBeNull());
  });
});
