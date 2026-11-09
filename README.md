# Anota

Aplicativo de notas offline-first feito para o miniprojeto de banco de dados NoSQL (documentos). Ele usa o CouchDB como banco no servidor e o PouchDB como banco local dentro do navegador. As notas são salvas primeiro no navegador, então o app continua funcionando sem internet, e quando a conexão volta tudo é sincronizado com o CouchDB automaticamente.

Cada nota é um documento com os campos `titulo` e `texto`.

## O que você precisa ter instalado

- Docker e Docker Compose (no Windows, o Docker Desktop já traz os dois)
- Python 3 (só para servir os arquivos do front-end; Node com `npx serve` também serve)
- Um navegador atualizado

Os passos abaixo funcionam no Linux e no Windows. Onde o comando muda, estão as duas versões: use o bloco **Linux** no terminal do Linux e o bloco **Windows** no PowerShell.

## Estrutura do projeto

```
Anota/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── app/
    ├── index.html
    ├── style.css
    ├── app.js
    └── config.example.js
```

Os arquivos `.env` e `app/config.js` guardam a sua senha de verdade, por isso não vão para o GitHub. Eles são criados por você nos passos abaixo, a partir dos arquivos de exemplo.

## Passo a passo

### 1. Baixar o projeto

```bash
git clone <endereço do repositório>
cd Anota
```

### 2. Criar o arquivo .env

Copie o arquivo de exemplo.

Linux:

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Use o comando de cópia em vez de criar o arquivo na mão pelo Bloco de Notas, porque no Windows ele costuma salvar como `.env.txt`, e aí o Docker não encontra.

Abra o `.env` e troque os valores pelo usuário e pela senha que você quer usar no CouchDB:

```
COUCHDB_USER=admin
COUCHDB_PASSWORD=escolha_uma_senha
```

O Docker Compose lê esse arquivo sozinho, desde que ele esteja na mesma pasta do `docker-compose.yml` e se chame exatamente `.env`.

### 3. Subir o CouchDB com o Docker

```bash
docker compose up -d
```

Para conferir se subiu, abra `http://localhost:5984` no navegador. Deve aparecer uma mensagem de boas-vindas do CouchDB em formato JSON.

### 4. Criar o banco de dados

Abra o painel do CouchDB (o Fauxton) em `http://localhost:5984/_utils` e entre com o usuário e a senha que você colocou no `.env`.

Clique em **Create Database**, dê o nome `notas` (tudo minúsculo, exatamente assim) e confirme.

### 5. Liberar o CORS

O navegador bloqueia, por segurança, que uma página em um endereço converse com um servidor em outro. Como o app vai rodar em `localhost:8080` e o CouchDB em `localhost:5984`, é preciso liberar isso no CouchDB.

No Fauxton:

1. Clique na engrenagem (Configuration) no menu lateral.
2. Abra a aba **CORS**.
3. Ative **Enable CORS**.
4. Escolha **Select List of Origins** e adicione `http://localhost:8080`, sem barra no final.
5. Salve.

### 6. Criar o config.js do front-end

O app precisa saber o usuário e a senha do CouchDB. Copie o exemplo.

Linux:

```bash
cp app/config.example.js app/config.js
```

Windows (PowerShell):

```powershell
Copy-Item app\config.example.js app\config.js
```

Abra o `app/config.js` e coloque os mesmos dados do `.env`:

```js
const COUCH_URL = 'http://localhost:5984/notas';
const COUCH_USER = 'admin';
const COUCH_PASS = 'escolha_uma_senha';
```

### 7. Rodar o app

Entre na pasta `app` e suba um servidor local simples.

Linux:

```bash
cd app
python3 -m http.server 8080 --bind 127.0.0.1
```

Windows (PowerShell):

```powershell
cd app
python -m http.server 8080 --bind 127.0.0.1
```

No Windows o comando costuma ser `python`, e não `python3`. Se `python` não funcionar, tente `py -m http.server 8080 --bind 127.0.0.1`.

O `--bind 127.0.0.1` faz o servidor aceitar conexões só do seu computador. Deixe esse terminal aberto enquanto usa o app.

Agora abra `http://localhost:8080` no navegador. Se aparecer a tela do Anota, é só escrever um título, uma nota e clicar em **Salvar nota**.

## Como testar se está sincronizando

1. Crie uma nota no app e abra o banco `notas` no Fauxton. O documento deve estar lá, com `titulo` e `texto`.
2. Crie um documento direto no Fauxton, com os campos `titulo` e `texto`. Ele deve aparecer no app.
3. Teste o modo offline: aperte F12, vá na aba **Network** e marque **Offline**. Crie algumas notas, elas aparecem na lista normalmente, mas não chegam ao Fauxton. Desmarque **Offline** e elas sobem sozinhas.

## Observação sobre segurança

Esse projeto é para uso local e estudo. Como o app roda no navegador, a senha do CouchDB fica visível no código do front-end. Em um sistema real, o acesso ao banco passaria por um servidor intermediário ou por usuários com permissões limitadas, e não por uma conta de administrador.
