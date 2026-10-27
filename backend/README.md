# Gerenciador de Eventos — Backend (Spring Boot)

Java 17+ · Spring Boot 3.5.6 · Spring Security + JWT (jjwt 0.12.6) · SpringDoc OpenAPI 2.8.9 · PostgreSQL / H2

## Como rodar

**Com PostgreSQL (padrão)**
```bash
docker compose up -d          # sobe o Postgres em localhost:5432 (db: eventos_db, user/senha: postgres)
mvn spring-boot:run
```

**Com H2 em memória (teste rápido, sem Docker)**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

Swagger UI: http://localhost:8080/swagger-ui.html

Variáveis de ambiente opcionais: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (Base64, mín. 256 bits),
`JWT_EXPIRATION_MS`, `CORS_ALLOWED_ORIGINS`.

## Endpoints

| Método | Rota                      | Auth | Descrição                                   |
|--------|---------------------------|------|---------------------------------------------|
| POST   | `/api/auth/cadastro`      | não  | Cadastra administrador (`nome,email,senha`) |
| POST   | `/api/auth/login`         | não  | Retorna `token` + `adminId`                 |
| GET    | `/api/eventos?adminId=1`  | JWT  | Lista eventos do administrador              |
| POST   | `/api/eventos`            | JWT  | Cadastra evento                             |
| PATCH  | `/api/eventos/{eventoId}` | JWT  | Atualiza `data` e/ou `localizacao`          |
| DELETE | `/api/eventos/{eventoId}` | JWT  | Exclui evento                               |

## Exemplo rápido (curl)

```bash
curl -X POST localhost:8080/api/auth/cadastro -H 'Content-Type: application/json' \
  -d '{"nome":"Maria Silva","email":"maria@email.com","senha":"senha123"}'

curl -X POST localhost:8080/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"maria@email.com","senha":"senha123"}'
# => {"token":"eyJ...","tipo":"Bearer","adminId":1,"nome":"Maria Silva","email":"maria@email.com"}

TOKEN=eyJ...

curl -X POST localhost:8080/api/eventos -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"nome":"Feira de Tecnologia","data":"2026-12-15","localizacao":"São Paulo","imagem":"https://exemplo.com/img.jpg","adminId":1}'

curl "localhost:8080/api/eventos?adminId=1" -H "Authorization: Bearer $TOKEN"

curl -X PATCH localhost:8080/api/eventos/1 -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"data":"2026-12-20","localizacao":"Campinas"}'

curl -X DELETE localhost:8080/api/eventos/1 -H "Authorization: Bearer $TOKEN"
```

## Observações de projeto

- `data` usa `LocalDate` (formato `yyyy-MM-dd`); `imagem` é opcional e aceita URL ou Base64 (coluna `TEXT`).
- Um administrador só enxerga/altera os próprios eventos: `adminId` diferente do token → `403`.
- Erros seguem o formato `ErroResponse` (`timestamp, status, erro, mensagem, caminho, detalhes`).
- `ddl-auto=update` é conveniente para o desafio; em produção use Flyway/Liquibase.
