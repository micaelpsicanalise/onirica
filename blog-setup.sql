-- Blog Onírica: categorias, posts, e política de acesso.
-- Leitura de posts PUBLICADOS é pública (sem login) — é isso que permite
-- o Google indexar o blog, ao contrário do app principal que fica atrás de login.
-- Escrita (criar/editar/apagar) continua restrita só ao seu e-mail.

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  descricao text,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria_id uuid references public.blog_categories(id) on delete set null,
  status text not null default 'rascunho' check (status in ('publicado','rascunho')),
  resumo text,
  conteudo text,
  tags text[] default '{}',
  meta_titulo text,
  meta_desc text,
  slug text not null unique,
  keyword text,
  views int not null default 0,
  data timestamptz not null default now()
);

alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;

-- Categorias: leitura pública, escrita só pra você
create policy "Categorias são públicas"
  on public.blog_categories for select
  using (true);

create policy "Admin cria categorias"
  on public.blog_categories for insert
  with check (auth.jwt() ->> 'email' = 'micaelpsicanalise@gmail.com');

create policy "Admin atualiza categorias"
  on public.blog_categories for update
  using (auth.jwt() ->> 'email' = 'micaelpsicanalise@gmail.com');

create policy "Admin apaga categorias"
  on public.blog_categories for delete
  using (auth.jwt() ->> 'email' = 'micaelpsicanalise@gmail.com');

-- Posts: só os PUBLICADOS são públicos; rascunhos só você vê
create policy "Posts publicados são públicos"
  on public.blog_posts for select
  using (status = 'publicado' or auth.jwt() ->> 'email' = 'micaelpsicanalise@gmail.com');

create policy "Admin cria posts"
  on public.blog_posts for insert
  with check (auth.jwt() ->> 'email' = 'micaelpsicanalise@gmail.com');

create policy "Admin atualiza posts"
  on public.blog_posts for update
  using (auth.jwt() ->> 'email' = 'micaelpsicanalise@gmail.com');

create policy "Admin apaga posts"
  on public.blog_posts for delete
  using (auth.jwt() ->> 'email' = 'micaelpsicanalise@gmail.com');

grant select on public.blog_categories to anon, authenticated;
grant insert, update, delete on public.blog_categories to authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

-- Contador de visualizações: função segura, não precisa dar permissão de
-- UPDATE geral pra visitantes anônimos, só executar esta função pontual.
create or replace function public.increment_post_views(post_slug text)
returns void
language plpgsql
security definer
as $$
begin
  update public.blog_posts set views = views + 1 where slug = post_slug and status = 'publicado';
end;
$$;

grant execute on function public.increment_post_views(text) to anon, authenticated;

-- Categorias de exemplo, pra você já ver o blog funcionando
insert into public.blog_categories (nome, slug, descricao) values
('Símbolos', 'simbolos', 'O significado por trás dos elementos mais comuns nos sonhos.'),
('Psicologia dos Sonhos', 'psicologia', 'O que a ciência e a psicanálise dizem sobre sonhar.'),
('Pesadelos', 'pesadelos', 'Entendendo os sonhos que assombram.'),
('Sonhos Lúcidos', 'sonhos-lucidos', 'Técnicas e teoria sobre tomar consciência dentro do sonho.')
on conflict (slug) do nothing;
