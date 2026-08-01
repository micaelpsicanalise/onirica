-- ---------------------------------------------------------------------------
-- Onírica — schema do Supabase
-- Rode isto em: Supabase Dashboard > SQL Editor > New query > Run
-- ---------------------------------------------------------------------------

-- Tabela de símbolos (o "dicionário"). Hoje o app ainda usa uma cópia fixa
-- no código como fallback; popular esta tabela é o que te permite editar
-- os significados sem precisar fazer deploy de novo.
create table if not exists public.symbols (
  id text primary key,
  label text not null,
  category text not null check (category in ('emocoes', 'medos', 'transformacao', 'relacoes')),
  keys text[] not null,
  meaning text not null
);

-- Tabela de sonhos salvos por cada usuário
create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dream_text text not null,
  symbols text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists dreams_user_id_idx on public.dreams(user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security: cada pessoa só enxerga e mexe nos próprios sonhos
-- ---------------------------------------------------------------------------
alter table public.dreams enable row level security;

create policy "Usuários leem apenas os próprios sonhos"
  on public.dreams for select
  using (auth.uid() = user_id);

create policy "Usuários inserem apenas os próprios sonhos"
  on public.dreams for insert
  with check (auth.uid() = user_id);

create policy "Usuários apagam apenas os próprios sonhos"
  on public.dreams for delete
  using (auth.uid() = user_id);

-- Símbolos são um dicionário público — todo mundo pode ler, ninguém edita
-- pelo app (edição é feita direto no painel do Supabase, por enquanto)
alter table public.symbols enable row level security;

create policy "Qualquer pessoa lê os símbolos"
  on public.symbols for select
  using (true);

-- ---------------------------------------------------------------------------
-- Seed: os mesmos símbolos que já estão hoje no código (App.jsx)
-- ---------------------------------------------------------------------------
insert into public.symbols (id, label, category, keys, meaning) values
('agua', 'Água', 'emocoes', array['agua','mar','oceano','onda','rio','afogar','afogando','nadar'], 'Suas emoções estão em movimento. Água calma sugere paz interior; água agitada ou o medo de afogar aponta para sentimentos que você não conseguiu processar ainda.'),
('voar', 'Voar', 'transformacao', array['voar','voando','voo','flutuar','flutuando'], 'Desejo de liberdade ou de ver sua vida de um ponto de vista mais alto. Se o voo é fácil, indica confiança; se é difícil ou você cai, aponta para medo de perder o controle.'),
('queda', 'Queda', 'medos', array['cair','caindo','queda','despencar'], 'Sensação de perda de controle sobre alguma área da vida — trabalho, relação ou uma decisão recente que te deixou insegura(o).'),
('dente', 'Dentes caindo', 'medos', array['dente','dentes','dente caindo','perder dente'], 'Ansiedade sobre imagem, envelhecimento ou medo de dizer algo e não ser levado a sério. Um clássico dos sonhos de ansiedade social.'),
('cobra', 'Cobra', 'transformacao', array['cobra','serpente','cobras'], 'Transformação, cura ou uma ameaça oculta que você já percebeu mas ainda não enfrentou de frente. O contexto muda bastante o tom.'),
('perseguicao', 'Perseguição', 'medos', array['perseguido','perseguida','sendo perseguido','fugindo','correndo de'], 'Algo na vida desperta que você está evitando enfrentar. O perseguidor costuma representar o próprio problema, não uma pessoa específica.'),
('morte', 'Morte', 'transformacao', array['morte','morrendo','morrer','funeral','enterro'], 'Raramente é literal. Costuma marcar o fim de uma fase, hábito ou versão de si mesmo — para dar espaço a algo novo.'),
('bebe', 'Bebê', 'transformacao', array['bebe','recem-nascido','gravida','gravidez'], 'Um projeto, ideia ou parte de você que ainda está em formação, frágil e pedindo cuidado.'),
('casamento', 'Casamento', 'relacoes', array['casamento','casando','noiva','noivo'], 'União — de duas partes de si mesma(o), ou um compromisso real que está sendo avaliado, consciente ou não.'),
('casa', 'Casa', 'emocoes', array['casa','quarto','comodo','porta trancada','sotao','porao'], 'A casa costuma representar você mesma(o). Cômodos desconhecidos sugerem partes de sua personalidade ainda inexploradas.'),
('escada', 'Escada', 'transformacao', array['escada','escadas','subindo escada','descendo escada'], 'Progresso ou retrocesso em direção a um objetivo. Subir indica esforço consciente; descer pode indicar um retorno a padrões antigos.'),
('exame', 'Exame / Prova', 'medos', array['prova','exame','teste','vestibular'], 'Medo de ser avaliada(o) e não estar à altura — comum em fases de cobrança pessoal ou de início de algo novo.'),
('fogo', 'Fogo', 'transformacao', array['fogo','incendio','queimando','chamas'], 'Paixão intensa ou raiva não expressa. O fogo destrói para limpar — pode indicar que algo precisa acabar para você seguir em frente.'),
('sangue', 'Sangue', 'emocoes', array['sangue','sangrando','ferido','ferida'], 'Vitalidade, perda de energia ou uma mágoa que ainda está exposta. Pode também simbolizar vínculos familiares fortes.'),
('espelho', 'Espelho', 'emocoes', array['espelho','reflexo','reflexao'], 'Autoimagem e autoconhecimento. Um espelho que distorce ou mostra outra pessoa aponta para um conflito entre quem você é e quem acha que deveria ser.'),
('labirinto', 'Labirinto', 'medos', array['labirinto','perdido','perdida','sem saida'], 'Sensação de estar sem direção clara diante de uma decisão importante.'),
('carro', 'Carro', 'transformacao', array['carro','dirigindo','sem freio','freio nao funciona','acidente de carro'], 'O quanto você sente estar no controle da própria vida. Freios que falham indicam a sensação de que as coisas avançam rápido demais.'),
('animal', 'Animal', 'relacoes', array['cachorro','gato','lobo','leao','aranha','inseto','aranhas'], 'Instintos e impulsos — o tipo de animal e como ele age no sonho revelam qual instinto está mais ativo em você agora.'),
('chuva', 'Chuva / Tempestade', 'emocoes', array['chuva','chovendo','tempestade'], 'Emoções represadas sendo liberadas. Uma tempestade violenta sugere um conflito interno chegando ao limite antes de se resolver.'),
('voz', 'Voz / Grito', 'relacoes', array['voz desconhecida','gritando','grito','gritar','sem voz','nao conseguia falar'], 'Necessidade de ser ouvida(o) — ou frustração por sentir que sua opinião não chega às pessoas certas.')
on conflict (id) do nothing;
