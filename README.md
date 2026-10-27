# Desafio Residência — Gerenciador de Eventos

Sistema para administradores cadastrarem e gerenciarem eventos: **API REST (Spring Boot)**, **frontend web (React)** e
**app mobile (React Native)**.

```
backend/       API Spring Boot 3 · JWT · Swagger · PostgreSQL/H2   -> README próprio
frontend-web/  React + Vite (web)                                  -> README próprio
mobile/        React Native + Expo (iOS/Android)                   -> README próprio
```

## Requisitos do desafio → onde estão

**Frontend (React e React Native)**

| Requisito | Web (`frontend-web/src`) | Mobile (`mobile/src`) |
|---|---|---|
| Login (email, senha, Gravar Senha, Entrar, Cadastrar-se) | `pages/Login.jsx` | `screens/LoginScreen.js` |
| Cadastro de Administrador (valida confirmação de senha, mensagem de sucesso) | `pages/Cadastro.jsx` | `screens/CadastroScreen.js` |
| Home de Eventos (imagem, título, data, localização) | `pages/Home.jsx`, `components/EventoCard.jsx` | `screens/HomeScreen.js`, `components/EventoCard.js` |
| Editar data e localização · Excluir | `Home.jsx`, `EventoModal.jsx` | `HomeScreen.js`, `EventoModal.js`, `ConfirmarModal.js` |
| Adicionar Evento (modal: nome, data, localização, imagem, salvar) | `components/EventoModal.jsx` | `components/EventoModal.js` |

**Backend (Spring Boot)**

| Serviço | Endpoint |
|---|---|
| Login de Administrador (retorna token) | `POST /api/auth/login` |
| Cadastro de Administrador (senha criptografada com BCrypt) | `POST /api/auth/cadastro` |
| Listagem de Eventos por administrador | `GET /api/eventos?adminId=` |
| Cadastro de Evento | `POST /api/eventos` |
| Atualização de data/localização | `PATCH /api/eventos/{eventoId}` |
| Exclusão de Evento | `DELETE /api/eventos/{eventoId}` |

**Requisitos adicionais:** segurança JWT em todos os serviços exceto login/cadastro (`backend/.../security`,
`SecurityConfig`) · documentação Swagger em `http://localhost:8080/swagger-ui.html` (SpringDoc) · API RESTful com
status HTTP e erros padronizados · código em repositório público (veja abaixo).

## Como rodar tudo

```bash
# 1) Backend (Java 17+)
cd backend
docker compose up -d && mvn spring-boot:run                      # PostgreSQL
# ou, sem Docker:  mvn spring-boot:run -Dspring-boot.run.profiles=h2

# 2) Frontend web
cd frontend-web && npm install && npm run dev                    # http://localhost:5173

# 3) App mobile
cd mobile && npm install && npx expo start                       # Expo Go / emulador
```

Detalhes (URL da API em celular físico, testes, e2e) em `mobile/README.md`.

## Testes

- `mobile`: `npm test` (83 testes) e `npm run e2e` (fluxo completo no navegador, aceita `E2E_BACKEND=real`).

## Publicar no GitHub (repositório público)

```bash
git init -b main
git add .
git commit -m "Gerenciador de Eventos: backend, frontend web e app mobile"
gh repo create gerenciador-eventos --public --source=. --push     # ou crie no site e use git remote add + git push
```

O `.gitignore` da raiz já exclui `node_modules`, `target`, `dist`, `.expo` e arquivos `.env`.
