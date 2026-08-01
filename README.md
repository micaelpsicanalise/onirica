# Onírica

Site de interpretação de sonhos baseado em um dicionário de símbolos, com login e histórico salvos no Supabase.

Este guia assume que você **não vai usar o Terminal** — tudo é feito pelo navegador, no site do GitHub e do Supabase. Quem monta o site (o `npm install` / build) é o próprio GitHub, através de uma automação já configurada em `.github/workflows/deploy.yml`.

## 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto.
2. No menu à esquerda, abra **SQL Editor > New query**.
3. Abra o arquivo `schema.sql` (está nesta pasta), copie todo o conteúdo, cole no editor e clique em **Run**.
   Isso cria as tabelas `symbols` e `dreams` e já popula o dicionário de sonhos.
4. Vá em **Project Settings > API** e copie dois valores, você vai precisar deles no passo 3:
   - **Project URL**
   - **anon public key**
5. Em **Authentication > Providers**, confirme que **Email** está ativado (o login por link mágico já vem ligado por padrão).

## 2. Criar o repositório no GitHub (sem Terminal)

1. Entre em [github.com](https://github.com) → botão verde **New** (novo repositório).
2. Nome do repositório: `onirica`. Deixe **Public**. Não marque nenhuma opção de "adicionar README" (nosso projeto já tem um). Clique em **Create repository**.
3. Na página do repositório vazio, clique no link **uploading an existing file**.
4. Arraste **todos os arquivos e pastas** desta pasta `onirica` para dentro da janela do navegador (inclusive a pasta `.github` e o arquivo `.gitignore` — no Finder, aperte `Cmd + Shift + .` para mostrar arquivos ocultos como o `.gitignore`).
5. Role para baixo, escreva uma mensagem como "primeiro commit" e clique em **Commit changes**.

## 3. Guardar as chaves do Supabase com segurança

As chaves não vão dentro dos arquivos do projeto — elas ficam guardadas separadamente no GitHub:

1. No repositório, vá em **Settings > Secrets and variables > Actions**.
2. Clique em **New repository secret** e crie dois:
   - Nome `VITE_SUPABASE_URL` → cole a Project URL do passo 1.4
   - Nome `VITE_SUPABASE_ANON_KEY` → cole a anon public key do passo 1.4

## 4. Ativar o GitHub Pages

1. Ainda em **Settings**, clique em **Pages** no menu lateral.
2. Em **Build and deployment > Source**, selecione **GitHub Actions**.

Pronto — isso já é suficiente. Como o arquivo `.github/workflows/deploy.yml` já está no repositório, o GitHub vai automaticamente instalar as dependências, montar o site e publicá-lo toda vez que houver uma mudança.

## 5. Acompanhar e acessar o site

1. Clique na aba **Actions** do repositório — você verá o processo "Publicar site" rodando (leva 1-2 minutos).
2. Quando o ícone ficar verde ✓, volte em **Settings > Pages**: vai aparecer o link do seu site no topo, algo como:
   `https://SEU_USUARIO.github.io/onirica/`

## Fazendo alterações depois

Sempre que quiser mudar algo (texto, cor, um símbolo novo): abra o arquivo direto pelo site do GitHub (ícone de lápis ✏️ no canto do arquivo), edite, e clique em **Commit changes**. Isso já dispara a publicação automática de novo — sem precisar reinstalar nada.

## Estrutura

```
onirica/
├── .github/workflows/deploy.yml   ← automação que monta e publica o site
├── index.html
├── package.json
├── vite.config.js
├── schema.sql                     ← rode isso no Supabase antes de tudo
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx            ← UI, login e lógica de interpretação
    ├── supabaseClient.js  ← conexão com o Supabase
    └── index.css
```

**Nota sobre o `.env.example`**: ele existe só como referência de quais chaves o projeto precisa. Como você não vai rodar nada localmente, não precisa criar um `.env` de verdade — as chaves reais ficam nos "Secrets" do passo 3.
