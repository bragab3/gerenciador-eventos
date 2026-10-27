// Teste ponta a ponta do app (versão web do Expo) com Chromium + Playwright.
//
// Pré-requisito: gerar o bundle web apontando para a URL da API:
//   EXPO_PUBLIC_API_URL=http://localhost:8080 npx expo export --platform web
//
// Uso:
//   node e2e/run-e2e.js                      -> sobe o backend SIMULADO (e2e/mock-backend.js) e roda o teste
//   E2E_BACKEND=real node e2e/run-e2e.js     -> usa o seu backend Spring Boot já rodando em E2E_API_URL
//                                               (suba-o com CORS_ALLOWED_ORIGINS=http://localhost:8081)
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { chromium } = require('playwright');
const { criarServidor } = require('./mock-backend');
const { servirPasta } = require('./servidor-estatico');

const API = process.env.E2E_API_URL || 'http://localhost:8080';
const PORTA_APP = Number(process.env.APP_PORT || 8081);
const APP = `http://localhost:${PORTA_APP}`;
const DIST = path.join(__dirname, '..', 'dist');
const PRINTS = path.join(__dirname, 'screenshots');
const usarBackendReal = process.env.E2E_BACKEND === 'real';

// e-mail único por execução: permite repetir o teste contra um banco persistente (PostgreSQL)
const EMAIL = `e2e.${Date.now()}@email.com`;
const SENHA = 'senha123';
const NOME = 'Administrador E2E';

// ---------- utilitários ----------
function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}
// PNG RGB com degradê (sem dependências), só para ter uma imagem real de teste
function gerarPng(largura, altura, [r0, g0, b0], [r1, g1, b1]) {
  const linhas = [];
  for (let y = 0; y < altura; y++) {
    const linha = Buffer.alloc(1 + largura * 3);
    for (let x = 0; x < largura; x++) {
      const t = (x + y) / (largura + altura);
      linha[1 + x * 3] = Math.round(r0 + (r1 - r0) * t);
      linha[2 + x * 3] = Math.round(g0 + (g1 - g0) * t);
      linha[3 + x * 3] = Math.round(b0 + (b1 - b0) * t);
    }
    linhas.push(linha);
  }
  const chunk = (tipo, dados) => {
    const t = Buffer.from(tipo);
    const len = Buffer.alloc(4); len.writeUInt32BE(dados.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
    return Buffer.concat([len, t, dados, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0); ihdr.writeUInt32BE(altura, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(linhas))), chunk('IEND', Buffer.alloc(0)),
  ]);
}

let passos = 0;
const falhas = [];
async function passo(nome, fn) {
  passos++;
  try {
    await fn();
    console.log(`  ✓ ${nome}`);
  } catch (e) {
    falhas.push(`${nome}: ${e.message.split('\n')[0]}`);
    console.log(`  ✗ ${nome}\n      ${e.message.split('\n')[0]}`);
  }
}
function esperar(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

async function apiBackend(rota, { metodo = 'GET', corpo, token } = {}) {
  const r = await fetch(`${API}${rota}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await r.text();
  return { status: r.status, corpo: texto ? JSON.parse(texto) : null };
}

(async () => {
  fs.mkdirSync(PRINTS, { recursive: true });
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/ não encontrado. Rode: EXPO_PUBLIC_API_URL=' + API + ' npx expo export --platform web');
  }
  fs.writeFileSync(path.join(DIST, 'e2e-foto.png'), gerarPng(320, 180, [43, 89, 255], [255, 180, 0]));
  const arquivoUpload = path.join(PRINTS, 'upload-teste.png');
  fs.writeFileSync(arquivoUpload, gerarPng(240, 160, [198, 40, 40], [20, 33, 61]));

  let mock = null;
  if (!usarBackendReal) {
    mock = criarServidor({ origensPermitidas: [APP] });
    await new Promise((ok) => mock.servidor.listen(Number(new URL(API).port), ok));
  }
  const servidorApp = await servirPasta(DIST, PORTA_APP);
  console.log(`App: ${APP}  |  API: ${API} (${usarBackendReal ? 'backend REAL' : 'backend SIMULADO'})  |  e-mail do teste: ${EMAIL}\n`);

  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'pt-BR' });
  const page = await contexto.newPage();

  const errosPagina = [];
  const errosConsole = [];
  const requisicoesApi = [];
  page.on('pageerror', (e) => errosPagina.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errosConsole.push(m.text());
  });
  page.on('request', (r) => {
    if (r.url().startsWith(API)) requisicoesApi.push({ metodo: r.method(), url: r.url().replace(API, ''), auth: r.headers()['authorization'] || null });
  });

  // O React Navigation mantém a tela anterior montada (oculta) por baixo da atual:
  // todos os seletores consideram apenas elementos VISÍVEIS.
  const visivel = (loc) => loc.filter({ visible: true });
  const botao = (nome) => visivel(page.getByRole('button', { name: nome, exact: true }));
  const campo = (rotulo) => visivel(page.getByLabel(rotulo, { exact: true }));
  const caixa = (nome) => visivel(page.getByRole('checkbox', { name: nome }));
  const ver = (texto) => visivel(page.getByText(texto)).first().waitFor({ timeout: 8000 });
  const sumiu = (texto) => visivel(page.getByText(texto)).first().waitFor({ state: 'detached', timeout: 8000 });
  // espera a animação dos modais terminar antes de capturar
  const print = async (nome) => {
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(PRINTS, `${nome}.png`) });
  };
  let token = null;

  // ================== LOGIN / CADASTRO ==================
  console.log('Login e cadastro');
  await passo('abre o app na tela de Login com os campos e botões do desafio', async () => {
    await page.goto(APP);
    await ver('Entre para cadastrar e acompanhar os seus eventos.');
    for (const r of ['Email do Administrador', 'Senha']) await campo(r).waitFor();
    await caixa('Gravar Senha').waitFor();
    await botao('Entrar').waitFor();
    await botao('Cadastrar-se').waitFor();
    await print('01-login');
  });

  await passo('cadastro: senhas diferentes mostram erro e nada é enviado ao servidor', async () => {
    await botao('Cadastrar-se').click();
    await ver('Crie o seu acesso para gerenciar eventos.');
    await campo('Nome do Administrador').fill(NOME);
    await campo('Email').fill(EMAIL);
    await campo('Senha').fill(SENHA);
    await campo('Confirmar Senha').fill('outra-senha');
    await botao('Cadastrar').click();
    await ver('As senhas não coincidem');
    await print('02-cadastro-senhas-diferentes');
    esperar(!requisicoesApi.some((r) => r.url === '/api/auth/cadastro'), 'chamou a API de cadastro mesmo com senhas diferentes');
  });

  await passo('cadastro com sucesso: volta ao Login com a mensagem de sucesso e o email preenchido', async () => {
    await campo('Confirmar Senha').fill(SENHA);
    await botao('Cadastrar').click();
    await ver('Administrador cadastrado com sucesso!');
    esperar((await campo('Email do Administrador').inputValue()) === EMAIL, 'email não veio preenchido no login');
    await print('03-cadastro-sucesso');
    const r = await apiBackend('/api/auth/login', { metodo: 'POST', corpo: { email: EMAIL, senha: SENHA } });
    esperar(r.status === 200, `administrador não existe no servidor (login direto retornou ${r.status})`);
  });

  await passo('cadastro repetido (409): mostra a mensagem do servidor e continua no cadastro', async () => {
    await botao('Cadastrar-se').click();
    await campo('Nome do Administrador').fill(NOME);
    await campo('Email').fill(EMAIL);
    await campo('Senha').fill(SENHA);
    await campo('Confirmar Senha').fill(SENHA);
    await botao('Cadastrar').click();
    await ver('Já existe um administrador cadastrado');
    await botao('Voltar ao login').click();
    await ver('Entre para cadastrar e acompanhar os seus eventos.');
  });

  await passo('login com senha errada (401): mostra o erro e continua no Login', async () => {
    await campo('Senha').fill('senha-errada');
    await botao('Entrar').click();
    await ver('Email ou senha inválidos');
    await print('04-login-erro');
  });

  await passo('login correto com "Gravar Senha" leva à Home (sem eventos ainda)', async () => {
    await campo('Senha').fill(SENHA);
    await caixa('Gravar Senha').click();
    await botao('Entrar').click();
    await ver('Meus eventos');
    await ver('Você ainda não tem eventos cadastrados.');
    await ver(NOME);
    await print('05-home-vazia');
    const login = requisicoesApi.filter((r) => r.url === '/api/auth/login');
    esperar(login.every((r) => r.auth === null), 'o login enviou Authorization (deveria ser público)');
    esperar(
      await page.evaluate(() => !!JSON.parse(localStorage.getItem('gerenciador.sessao') || 'null')?.token),
      'token não foi guardado'
    );
    token = (await apiBackend('/api/auth/login', { metodo: 'POST', corpo: { email: EMAIL, senha: SENHA } })).corpo;
  });

  // ================== EVENTOS ==================
  console.log('\nEventos');
  const meusEventos = async () => (await apiBackend(`/api/eventos?adminId=${token.adminId}`, { token: token.token })).corpo;

  await passo('Adicionar Evento abre o modal com nome, data, localização, imagem e Salvar', async () => {
    await botao('Adicionar Evento').first().click();
    await ver('Novo evento');
    for (const r of ['Nome do evento', 'Data', 'Localização', 'Imagem (URL)']) await campo(r).waitFor();
    await botao('Escolher imagem da galeria').waitFor();
    await botao('Salvar').waitFor();
  });

  await passo('data inválida (31/02/2027) é barrada no app', async () => {
    await campo('Nome do evento').fill('Feira de Tecnologia');
    await campo('Data').fill('31022027');
    esperar((await campo('Data').inputValue()) === '31/02/2027', 'máscara de data não formatou');
    await campo('Localização').fill('São Paulo');
    await botao('Salvar').click();
    await ver('Data inválida. Use o formato DD/MM/AAAA.');
    await print('06-modal-data-invalida');
    esperar((await meusEventos()).length === 0, 'criou evento com data inválida');
  });

  await passo('salvar evento com imagem por URL: aparece na lista e persiste no servidor', async () => {
    await campo('Data').fill('15122026');
    await campo('Imagem (URL)').fill(`${APP}/e2e-foto.png`);
    await print('07-modal-novo-preenchido');
    await botao('Salvar').click();
    await sumiu('Novo evento');
    await ver('Feira de Tecnologia');
    const lista = await meusEventos();
    esperar(lista.length === 1, `esperava 1 evento no servidor, veio ${lista.length}`);
    esperar(lista[0].data === '2026-12-15' && lista[0].localizacao === 'São Paulo', 'dados do evento divergem');
    esperar(lista[0].imagem === `${APP}/e2e-foto.png`, 'URL da imagem não foi salva');
    esperar(lista[0].adminId === token.adminId, 'evento não ficou associado ao administrador');
  });

  await passo('salvar evento com imagem escolhida de arquivo (seletor): vai como Base64', async () => {
    await botao('Adicionar Evento').first().click();
    await campo('Nome do evento').fill('Show de Jazz');
    await campo('Data').fill('09012027');
    await campo('Localização').fill('Rio de Janeiro');
    const [seletor] = await Promise.all([page.waitForEvent('filechooser'), botao('Escolher imagem da galeria').click()]);
    await seletor.setFiles(arquivoUpload);
    await visivel(page.getByLabel('Pré-visualização da imagem do evento')).waitFor({ timeout: 8000 });
    await print('08-modal-com-previa');
    await botao('Salvar').click();
    await sumiu('Novo evento');
    await ver('Show de Jazz');
    const lista = await meusEventos();
    const jazz = lista.find((e) => e.nome === 'Show de Jazz');
    esperar(jazz && jazz.imagem.startsWith('data:image/png;base64,'), `imagem não foi salva como data URL (veio: ${String(jazz?.imagem).slice(0, 30)})`);
  });

  await passo('lista mostra título, data, localização e imagem de cada evento, em ordem de data', async () => {
    await visivel(page.getByLabel('Imagem do evento Feira de Tecnologia')).waitFor();
    await visivel(page.getByLabel('Imagem do evento Show de Jazz')).waitFor();
    for (const t of ['📍 São Paulo', '📍 Rio de Janeiro']) await ver(t);
    const feira = page.getByTestId('evento-' + (await meusEventos())[0].id);
    esperar((await feira.innerText()).includes('Feira de Tecnologia'), 'ordem por data incorreta (Feira 15/12/2026 vem antes de Jazz 09/01/2027)');
    await print('09-home-com-eventos');
  });

  await passo('Editar: só data e localização, e a lista é atualizada', async () => {
    const feira = (await meusEventos()).find((e) => e.nome === 'Feira de Tecnologia');
    await page.getByTestId(`evento-${feira.id}`).getByRole('button', { name: 'Editar', exact: true }).click();
    await ver('Editar evento');
    esperar((await campo('Nome do evento').count()) === 0, 'modo editar não deveria ter o campo Nome');
    esperar((await campo('Imagem (URL)').count()) === 0, 'modo editar não deveria ter o campo Imagem');
    esperar((await campo('Data').inputValue()) === '15/12/2026', 'data não veio preenchida');
    esperar((await campo('Localização').inputValue()) === 'São Paulo', 'localização não veio preenchida');
    await campo('Data').fill('20122026');
    await campo('Localização').fill('Campinas');
    await print('10-modal-editar');
    await botao('Salvar').click();
    await sumiu('Editar evento');
    await ver('📍 Campinas');
    const depois = (await meusEventos()).find((e) => e.id === feira.id);
    esperar(depois.data === '2026-12-20' && depois.localizacao === 'Campinas', 'PATCH não persistiu');
    esperar(depois.nome === 'Feira de Tecnologia' && depois.imagem === feira.imagem, 'o PATCH alterou nome/imagem');
  });

  await passo('Excluir: pede confirmação; cancelar mantém; confirmar remove do app e do servidor', async () => {
    const jazz = (await meusEventos()).find((e) => e.nome === 'Show de Jazz');
    const cartao = page.getByTestId(`evento-${jazz.id}`);
    await cartao.getByRole('button', { name: 'Excluir', exact: true }).click();
    await ver('Excluir o evento "Show de Jazz"?');
    await print('11-confirmar-exclusao');
    await botao('Cancelar').click();
    await sumiu('Excluir o evento');
    esperar((await meusEventos()).length === 2, 'cancelar excluiu o evento');

    await cartao.getByRole('button', { name: 'Excluir', exact: true }).click();
    await ver('Excluir o evento "Show de Jazz"?');
    await botao('Excluir').last().click();
    await sumiu('Show de Jazz');
    const lista = await meusEventos();
    esperar(lista.length === 1 && lista[0].nome === 'Feira de Tecnologia', 'exclusão não refletiu no servidor');
  });

  // ================== SESSÃO / SEGURANÇA ==================
  console.log('\nSessão e segurança JWT');
  await passo('recarregar a página mantém o login e a lista', async () => {
    await page.reload();
    await ver('Meus eventos');
    await ver('Feira de Tecnologia');
  });

  await passo('todas as chamadas a /api/eventos levaram Authorization: Bearer <token>', async () => {
    const protegidas = requisicoesApi.filter((r) => r.url.startsWith('/api/eventos') && r.metodo !== 'OPTIONS');
    esperar(protegidas.length >= 6, `poucas chamadas registradas (${protegidas.length})`);
    const semToken = protegidas.filter((r) => !r.auth?.startsWith('Bearer ey'));
    esperar(semToken.length === 0, `${semToken.length} chamada(s) sem token: ${semToken.map((r) => r.metodo + ' ' + r.url).join(', ')}`);
    const metodos = new Set(protegidas.map((r) => r.metodo));
    for (const m of ['GET', 'POST', 'PATCH', 'DELETE']) esperar(metodos.has(m), `não exercitou ${m}`);
  });

  await passo('Sair volta ao Login, apaga a sessão e mantém as credenciais gravadas', async () => {
    await botao('Sair').click();
    await ver('Entre para cadastrar e acompanhar os seus eventos.');
    esperar((await campo('Email do Administrador').inputValue()) === EMAIL, 'email salvo não foi preenchido');
    esperar((await campo('Senha').inputValue()) === SENHA, 'senha salva não foi preenchida');
    esperar((await caixa('Gravar Senha').getAttribute('aria-checked')) === 'true', 'checkbox deveria vir marcado');
    esperar(await page.evaluate(() => localStorage.getItem('gerenciador.sessao') === null), 'sessão não foi apagada');
    await print('12-login-credenciais-gravadas');
  });

  await passo('token inválido/expirado: o app volta ao Login sozinho (401)', async () => {
    await botao('Entrar').click();
    await ver('Meus eventos');
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('gerenciador.sessao'));
      localStorage.setItem('gerenciador.sessao', JSON.stringify({ ...s, token: 'token.invalido.xyz' }));
    });
    await page.reload();
    await ver('Entre para cadastrar e acompanhar os seus eventos.');
    esperar(await page.evaluate(() => localStorage.getItem('gerenciador.sessao') === null), 'sessão inválida não foi limpa');
  });

  await passo('sem login, o servidor recusa /api/eventos (401) e outro admin recebe 403', async () => {
    const semToken = await apiBackend(`/api/eventos?adminId=${token.adminId}`);
    esperar(semToken.status === 401, `esperava 401 sem token, veio ${semToken.status}`);
    const outro = await apiBackend('/api/auth/cadastro', { metodo: 'POST', corpo: { nome: 'Outro', email: `outro.${Date.now()}@email.com`, senha: SENHA } });
    const loginOutro = await apiBackend('/api/auth/login', { metodo: 'POST', corpo: { email: outro.corpo.email, senha: SENHA } });
    const alheio = await apiBackend(`/api/eventos?adminId=${token.adminId}`, { token: loginOutro.corpo.token });
    esperar(alheio.status === 403, `esperava 403 ao listar eventos de outro admin, veio ${alheio.status}`);
  });

  await passo('nenhum erro de JavaScript na página durante todo o fluxo', async () => {
    esperar(errosPagina.length === 0, `pageerror: ${errosPagina[0]}`);
    esperar(errosConsole.length === 0, `console.error: ${errosConsole[0]}`);
  });

  await navegador.close();
  servidorApp.close();
  if (mock) mock.servidor.close();
  fs.unlinkSync(path.join(DIST, 'e2e-foto.png'));

  console.log(`\n${passos - falhas.length}/${passos} passos OK`);
  if (falhas.length) {
    console.log('Falhas:\n - ' + falhas.join('\n - '));
    process.exit(1);
  }
})().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
