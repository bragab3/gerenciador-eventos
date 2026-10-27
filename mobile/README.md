# Gerenciador de Eventos — App Mobile (React Native + Expo)

Aplicativo para iOS e Android do **Desafio Residência – Gerenciador de Eventos**. Consome a mesma API Spring Boot do
frontend web e segue a mesma identidade visual.

Expo SDK 58 · React Native 0.88 · React 19 · React Navigation 7 · axios · expo-secure-store · expo-image-picker

## Como rodar

Requisitos: Node.js LTS, o backend rodando e o app **Expo Go** no celular (ou um emulador Android/iOS).

```bash
npm install
npx expo start          # escaneie o QR code com o Expo Go, ou tecle "a" (Android) / "i" (iOS) / "w" (web)
```

### URL da API

| Onde o app roda            | URL da API                          |
|----------------------------|-------------------------------------|
| Emulador Android           | `http://10.0.2.2:8080` (padrão)     |
| iOS Simulator / navegador  | `http://localhost:8080` (padrão)    |
| **Celular físico**         | `http://<IP-da-sua-máquina>:8080`   |

Para celular físico (mesma rede Wi-Fi do computador), copie `.env.example` para `.env` e ajuste:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:8080
```

> O CORS só importa na pré-visualização web. Para usá-la com o backend real, suba-o com
> `CORS_ALLOWED_ORIGINS=http://localhost:8081` (veja o README do backend).

## O que o app faz (requisitos do PDF)

| Requisito do desafio | Onde está |
|---|---|
| **Login**: email, senha, "Gravar Senha", botões Entrar e Cadastrar-se | `src/screens/LoginScreen.js` |
| "Gravar Senha" salva para acesso rápido nas próximas vezes | `src/storage.js` (Keychain/Keystore via `expo-secure-store`) |
| **Cadastro**: nome, email, senha, confirmar senha; valida se coincidem; mensagem de sucesso | `src/screens/CadastroScreen.js` |
| **Home**: lista eventos com imagem, título, data e localização | `src/screens/HomeScreen.js`, `src/components/EventoCard.js` |
| **Editar** data e localização | `src/components/EventoModal.js` (modo `editar`) |
| **Excluir** evento da lista (com confirmação) | `src/components/ConfirmarModal.js` |
| **Adicionar Evento** (modal: nome, data, localização, imagem, Salvar) | `src/components/EventoModal.js` (modo `criar`) |
| JWT em todos os serviços, exceto login/cadastro | `src/api.js` (header `Authorization: Bearer`), rotas protegidas em `App.js` |

Comportamentos extras: a sessão sobrevive ao fechar o app; token expirado (401) devolve ao login sozinho; puxar a lista
para baixo atualiza; imagem por URL **ou** da galeria (enviada em Base64, limite de 1,5 MB); data digitada com máscara
`DD/MM/AAAA` e validada (rejeita 31/02).

## Estrutura

```
App.js                    navegação: sem sessão -> Login/Cadastro; com sessão -> Home
src/api.js                axios + interceptadores (token, 401) + AuthApi / EventosApi
src/SessaoContext.js      sessão (token, adminId, nome) restaurada ao abrir o app
src/storage.js            cofre seguro (SecureStore; AsyncStorage só na web)
src/datas.js              máscara e conversão DD/MM/AAAA <-> yyyy-MM-dd
src/screens/              Login, Cadastro, Home
src/components/           Botao, Campo, Checkbox, EventoCard, EventoModal, ConfirmarModal, Mensagem
__tests__/                testes Jest (83)
e2e/                      teste ponta a ponta no navegador (Playwright) + backend simulado
```

## Testes

```bash
npm test                  # 83 testes (Jest + Testing Library): datas, cliente da API, telas e fluxo completo
```

**Ponta a ponta (navegador, via react-native-web)** — percorre cadastro, login, criar (URL e arquivo), editar, excluir,
sessão e JWT, conferindo o estado no servidor depois de cada ação:

```bash
npx playwright install chromium                 # uma vez
npm run build:web                               # gera dist/ com a URL da API embutida
npm run e2e                                     # usa o backend SIMULADO (e2e/mock-backend.js)

# contra o SEU backend Spring Boot (recomendado antes de entregar):
#   1) suba o backend com:  CORS_ALLOWED_ORIGINS=http://localhost:8081  (e o banco de pé)
#   2) E2E_BACKEND=real npm run e2e
```

O e2e usa um e-mail novo a cada execução, então pode ser repetido contra um banco persistente. As capturas de tela
ficam em `e2e/screenshots/` (ignoradas pelo git).

## Observações

- **Android em build de produção:** o Android bloqueia HTTP puro fora do Expo Go. Publique o backend em HTTPS ou habilite
  `usesCleartextTraffic` (plugin `expo-build-properties`) apenas para testes.
- Na **web** (apenas pré-visualização) o SecureStore não existe; token e senha ficam no `localStorage`.
- As fontes são as do sistema (o frontend web usa Bricolage Grotesque / IBM Plex Sans).
