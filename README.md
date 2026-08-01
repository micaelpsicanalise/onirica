# Onírica

Site de interpretação de sonhos baseado em um dicionário de símbolos, com login e histórico salvos no Supabase.

## 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e um novo projeto.
2. No painel, vá em **SQL Editor > New query**, cole o conteúdo de `schema.sql` e rode.
   Isso cria as tabelas `symbols` e `dreams`, as políticas de RLS e popula o dicionário.
3. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon public key`
4. Em **Authentication > Providers**, confirme que **Email** está habilitado (magic link já vem ativo por padrão).

## 2. Rodar localmente

```bash
git clone https://github.com/SEU_USUARIO/onirica.git
cd onirica
npm install
cp .env.example .env
```

Edite o `.env` com a URL e a chave que você copiou no passo 1.

```bash
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

## 3. Subir para o GitHub

```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/onirica.git
git push -u origin main
```

O `.env` **não** vai junto (está no `.gitignore`) — suas chaves ficam só na sua máquina e, depois, nas configurações do host de deploy.

## 4. Publicar com GitHub Pages

```bash
npm install
npm run build
npm run deploy
```

O `deploy` (script já configurado no `package.json`) publica a pasta `dist/` na branch `gh-pages`.
Depois, em **Settings > Pages** do repositório no GitHub, selecione a branch `gh-pages` como fonte.

Se você renomear o repositório para algo diferente de `onirica`, ajuste o campo `base` em `vite.config.js` para bater com o novo nome.

**Importante:** como as chaves do Supabase entram no build via `import.meta.env`, elas acabam visíveis no código do site publicado — isso é esperado e seguro, porque é a `anon key` (feita para ser pública) e a proteção de verdade vem das políticas de RLS no banco, não do segredo da chave.

## Estrutura

```
onirica/
├── index.html
├── package.json
├── vite.config.js
├── schema.sql            ← rode isso no Supabase antes de tudo
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx            ← UI, login e lógica de interpretação
    ├── supabaseClient.js  ← conexão com o Supabase
    └── index.css
```
