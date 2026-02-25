# Portal ONG Ser Amor — Frontend

Frontend do portal de gestão da ONG Ser Amor, responsável pela interface de controle de cursos, alunos, presenças e demais recursos administrativos da organização.

Construído com [Angular 17](https://angular.dev/) e [Angular Material](https://material.angular.io/), consumindo a [API REST](https://portal-ong-ser-amor-api.onrender.com) do projeto.

---

## Sumário

- [Formas de executar o projeto](#formas-de-executar-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Executando o projeto](#executando-o-projeto)
  - [1. Dev Container em Named Volume ★ (recomendado)](#1-com-docker--dev-container-em-named-volume--recomendado)
  - [2. Dev Container com código local](#2-com-docker--dev-container-com-código-local)
  - [3. Manual (via terminal)](#3-com-docker--manual-via-terminal)
  - [4. Sem Docker — Setup local](#4-sem-docker--setup-local)
- [Testes](#testes)
- [Scripts disponíveis](#scripts-disponíveis)

---

## Formas de executar o projeto

Existem dois caminhos principais para rodar o projeto: **com Docker** ou **sem Docker**. A forma recomendada é com Docker, pois elimina a necessidade de configurar a máquina manualmente.

```
├── Com Docker
│   ├── Manual (docker compose no terminal)
│   └── Dev Container
│       ├── Código espelhado localmente (clone + Reopen in Container)
│       └── ★ Código no container via Named Volume (recomendado)
└── Sem Docker (setup manual completo na máquina)
```

---

## Funcionalidades

| Rota      | Descrição                                 |
| --------- | ----------------------------------------- |
| `/login`  | Autenticação do usuário                   |
| `/cursos` | Listagem e gestão de cursos (autenticado) |

> O acesso às rotas protegidas exige autenticação via JWT. O `authGuard` redireciona automaticamente para `/login` quando o token está ausente ou inválido.

---

## Variáveis de ambiente

O Angular utiliza arquivos de ambiente em vez de `.env`. Os arquivos ficam em `src/environments/`:

| Arquivo                      | Usado em                                         |
| ---------------------------- | ------------------------------------------------ |
| `environment.ts`             | Build de produção (`--configuration production`) |
| `environment.development.ts` | Build de desenvolvimento (padrão local)          |

| Variável | Descrição                 | Desenvolvimento         | Produção                                       |
| -------- | ------------------------- | ----------------------- | ---------------------------------------------- |
| `apiUrl` | URL base da API consumida | `http://localhost:3000` | `https://portal-ong-ser-amor-api.onrender.com` |

Para apontar o ambiente de desenvolvimento para uma API diferente, edite `src/environments/environment.development.ts`:

```typescript
export const environment = {
  apiUrl: "http://localhost:3000", // ajuste conforme necessário
};
```

---

## Executando o projeto

> **Usuários Windows — Docker via WSL2**
>
> Se ao criar ou iniciar containers você encontrar erros de recursos insuficientes, crie o arquivo `.wslconfig` na pasta do seu usuário (`C:\Users\nome_do_usuario`) com o seguinte conteúdo:
>
> ```ini
> [wsl2]
> memory=8GB
> processors=4
> swap=2GB
> ```
>
> Os valores acima são uma referência — ajuste `memory`, `processors` e `swap` de acordo com os recursos disponíveis na sua máquina. Isso aumenta os recursos disponíveis para o WSL2 (e consequentemente para o Docker Desktop). Após criar o arquivo, reinicie o WSL com `wsl --shutdown` no PowerShell e abra o Docker Desktop novamente.

### 1. Com Docker — Dev Container em Named Volume ★ (recomendado)

Esta é a forma mais prática. Todo o código fica **dentro do container** — nada é instalado ou clonado na sua máquina além das ferramentas essenciais.

**O que você precisa ter instalado na máquina:**

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (em execução)
- [VS Code](https://code.visualstudio.com/)
- Extensão [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) para o VS Code

**Passo a passo:**

1. Certifique-se de que o **Docker Desktop está em execução**.
2. Abra uma **nova janela** do VS Code.
3. Abra a paleta de comandos (`Ctrl+Shift+P` ou `Cmd+Shift+P`) e pesquise por:
   ```
   Dev Containers: Clone Repository in Named Container Volume
   ```
4. Cole a URL do repositório e siga as instruções.
5. O VS Code vai criar o container, instalar todas as dependências e abrir o projeto pronto para uso.
6. Após a inicialização, execute o servidor de desenvolvimento:
   ```bash
   npm run dev:docker
   ```

O frontend estará disponível em `http://localhost:4200`.

> Todo o ambiente de desenvolvimento (Node.js, Angular CLI, dependências) é provisionado automaticamente pelo Dev Container. Não é necessário instalar a stack na máquina.

---

### 2. Com Docker — Dev Container com código local

Nesta variante, o repositório é clonado localmente e o container espelha a pasta do projeto. Qualquer alteração feita no container é refletida no sistema de arquivos local e vice-versa.

**O que você precisa ter instalado na máquina:**

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (em execução)
- [VS Code](https://code.visualstudio.com/) com a extensão [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Git](https://git-scm.com/)

**Passo a passo:**

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   cd portal-ong-ser-amor-angular-app
   ```
2. Abra a pasta no VS Code.
3. Certifique-se de que o **Docker Desktop está em execução**.
4. Quando solicitado, clique em **Reopen in Container** (ou use a paleta de comandos: `Dev Containers: Reopen in Container`).
5. O VS Code vai construir o container e reabrir o projeto dentro dele.

---

### 3. Com Docker — Manual (via terminal)

Para quem prefere controle direto sobre os containers sem usar o Dev Container.

**Pré-requisitos:** Docker Desktop instalado e em execução.

```bash
# Desenvolvimento (hot-reload na porta 4200)
docker compose up

# Produção (nginx na porta 80)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

O frontend ficará disponível em:

- Desenvolvimento: `http://localhost:4200`
- Produção: `http://localhost:80`

> Em produção, o build do Angular é servido via **nginx** (imagem Alpine). A porta da aplicação pode ser configurada pela variável de ambiente `FRONTEND_PORT` (padrão: `80`).

---

### 4. Sem Docker — Setup local

Para rodar sem Docker é necessário instalar e configurar tudo na máquina.

**O que você precisa ter instalado:**

- [Node.js](https://nodejs.org/) v22+
- [Angular CLI](https://angular.dev/tools/cli) v17+:
  ```bash
  npm install -g @angular/cli@17
  ```

**Passo a passo:**

1. Clone o repositório e instale as dependências:
   ```bash
   git clone <url-do-repositorio>
   cd portal-ong-ser-amor-angular-app
   npm install
   ```
2. (Opcional) Ajuste a URL da API em `src/environments/environment.development.ts`.
3. Inicie a aplicação:

   ```bash
   # Desenvolvimento com hot-reload
   npm start

   # Build de produção
   npm run build
   ```

O frontend estará disponível em `http://localhost:4200`.

---

## Testes

```bash
# Testes unitários (via Karma)
npm test

# Build em modo watch (desenvolvimento)
npm run watch
```

---

## Scripts disponíveis

| Script               | Descrição                                                     |
| -------------------- | ------------------------------------------------------------- |
| `npm start`          | Inicia o servidor de desenvolvimento (`ng serve`)             |
| `npm run dev:docker` | Inicia o servidor de desenvolvimento acessível pelo container |
| `npm run build`      | Gera o build de produção na pasta `dist/`                     |
| `npm run watch`      | Build em modo watch com configuração de desenvolvimento       |
| `npm test`           | Executa os testes unitários via Karma                         |
