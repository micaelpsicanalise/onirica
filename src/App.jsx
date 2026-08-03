import { useState, useEffect, useRef } from "react";
import { Moon, Sparkles, BookOpen, X, Image as ImageIcon } from "lucide-react";
import { supabase, supabaseUrl, supabaseAnonKey } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Dicionário local de símbolos. Isto é um espelho da tabela `symbols` no
// Supabase (veja schema.sql). Mantido aqui como fallback para o app
// funcionar mesmo antes de você popular o banco. Quando quiser que os
// significados sejam editáveis sem deploy, troque este array por um
// `supabase.from('symbols').select('*')` no useEffect abaixo.
// ---------------------------------------------------------------------------
const SYMBOLS = [
  { id: "agua", keys: ["agua", "mar", "oceano", "onda", "rio", "afogar", "afogando", "nadar"], label: "Água", category: "emocoes", meaning: "Suas emoções estão em movimento. Água calma sugere paz interior; água agitada ou o medo de afogar aponta para sentimentos que você não conseguiu processar ainda." },
  { id: "voar", keys: ["voar", "voando", "voo", "flutuar", "flutuando"], label: "Voar", category: "transformacao", meaning: "Desejo de liberdade ou de ver sua vida de um ponto de vista mais alto. Se o voo é fácil, indica confiança; se é difícil ou você cai, aponta para medo de perder o controle." },
  { id: "queda", keys: ["cair", "caindo", "queda", "despencar"], label: "Queda", category: "medos", meaning: "Sensação de perda de controle sobre alguma área da vida: trabalho, relação ou uma decisão recente que te deixou insegura(o)." },
  { id: "dente", keys: ["dente", "dentes", "dente caindo", "perder dente"], label: "Dentes caindo", category: "medos", meaning: "Ansiedade sobre imagem, envelhecimento ou medo de dizer algo e não ser levado a sério. Um clássico dos sonhos de ansiedade social." },
  { id: "cobra", keys: ["cobra", "serpente", "cobras"], label: "Cobra", category: "transformacao", meaning: "Transformação, cura ou uma ameaça oculta que você já percebeu mas ainda não enfrentou de frente. O contexto (a cobra ataca ou apenas observa) muda bastante o tom." },
  { id: "perseguicao", keys: ["perseguido", "perseguida", "sendo perseguido", "fugindo", "correndo de"], label: "Perseguição", category: "medos", meaning: "Algo na vida desperta que você está evitando enfrentar. O perseguidor costuma representar o próprio problema, não uma pessoa específica." },
  { id: "morte", keys: ["morte", "morrendo", "morrer", "funeral", "enterro"], label: "Morte", category: "transformacao", meaning: "Raramente é literal. Costuma marcar o fim de uma fase, hábito ou versão de si mesmo, para dar espaço a algo novo." },
  { id: "bebe", keys: ["bebe", "recem-nascido", "gravida", "gravidez"], label: "Bebê", category: "transformacao", meaning: "Um projeto, ideia ou parte de você que ainda está em formação, frágil e pedindo cuidado." },
  { id: "casamento", keys: ["casamento", "casando", "noiva", "noivo"], label: "Casamento", category: "relacoes", meaning: "União: de duas partes de si mesma(o), ou um compromisso real que está sendo avaliado, consciente ou não." },
  { id: "casa", keys: ["casa", "quarto", "comodo", "porta trancada", "sotao", "porao"], label: "Casa", category: "emocoes", meaning: "A casa costuma representar você mesma(o). Cômodos desconhecidos sugerem partes de sua personalidade ainda inexploradas." },
  { id: "escada", keys: ["escada", "escadas", "subindo escada", "descendo escada"], label: "Escada", category: "transformacao", meaning: "Progresso ou retrocesso em direção a um objetivo. Subir indica esforço consciente; descer pode indicar um retorno a padrões antigos." },
  { id: "exame", keys: ["prova", "exame", "teste", "vestibular"], label: "Exame / Prova", category: "medos", meaning: "Medo de ser avaliada(o) e não estar à altura, comum em fases de cobrança pessoal ou de início de algo novo (emprego, curso, projeto)." },
  { id: "fogo", keys: ["fogo", "incendio", "queimando", "chamas"], label: "Fogo", category: "transformacao", meaning: "Paixão intensa ou raiva não expressa. O fogo destrói para limpar; pode indicar que algo precisa acabar para você seguir em frente." },
  { id: "sangue", keys: ["sangue", "sangrando", "ferido", "ferida"], label: "Sangue", category: "emocoes", meaning: "Vitalidade, perda de energia ou uma mágoa que ainda está exposta. Pode também simbolizar vínculos familiares fortes." },
  { id: "espelho", keys: ["espelho", "reflexo", "reflexao"], label: "Espelho", category: "emocoes", meaning: "Autoimagem e autoconhecimento. Um espelho que distorce ou mostra outra pessoa aponta para um conflito entre quem você é e quem acha que deveria ser." },
  { id: "labirinto", keys: ["labirinto", "perdido", "perdida", "sem saida"], label: "Labirinto", category: "medos", meaning: "Sensação de estar sem direção clara diante de uma decisão importante. Geralmente aparece em fases de indecisão prolongada." },
  { id: "carro", keys: ["carro", "dirigindo", "sem freio", "freio nao funciona", "acidente de carro"], label: "Carro", category: "transformacao", meaning: "O quanto você sente estar no controle da própria vida. Freios que falham indicam a sensação de que as coisas avançam rápido demais." },
  { id: "animal", keys: ["cachorro", "gato", "lobo", "leao", "aranha", "inseto", "aranhas"], label: "Animal", category: "relacoes", meaning: "Instintos e impulsos: o tipo de animal e como ele age no sonho revelam qual instinto está mais ativo em você agora (proteção, medo, desejo, raiva)." },
  { id: "chuva", keys: ["chuva", "chovendo", "tempestade"], label: "Chuva / Tempestade", category: "emocoes", meaning: "Emoções represadas sendo liberadas. Uma tempestade violenta sugere um conflito interno chegando ao limite antes de se resolver." },
  { id: "voz", keys: ["voz desconhecida", "gritando", "grito", "gritar", "sem voz", "nao conseguia falar"], label: "Voz / Grito", category: "relacoes", meaning: "Necessidade de ser ouvida(o), ou frustração por sentir que, mesmo tentando, sua opinião não chega às pessoas certas." },
];

const DEFAULT_CATEGORIES = [
  { id: "emocoes", label: "Emoções", color: "#c97b93" },
  { id: "medos", label: "Medos", color: "#6fa8a0" },
  { id: "transformacao", label: "Transformação", color: "#e8a857" },
  { id: "relacoes", label: "Relações", color: "#c9c3e0" },
];

function getCategoryMeta(categories, id) {
  return categories.find((c) => c.id === id) ?? { id, label: id, color: "#c9c3e0" };
}

const ADMIN_EMAIL = "micaelpsicanalise@gmail.com";

// ---------------------------------------------------------------------------
// Menu fixo, igual em todas as páginas do app (login, app principal, admin).
// O blog tem o seu próprio, no mesmo estilo visual.
// ---------------------------------------------------------------------------
function TopNav({ session }) {
  const base = import.meta.env.BASE_URL;
  const isAdminRoute = new URLSearchParams(window.location.search).get("admin") === "1";
  const isAdmin = session && session.user.email === ADMIN_EMAIL;

  return (
    <nav className="topnav">
      <a href={base} className="topnav-brand">Onírica</a>
      <div className="topnav-links">
        <a href={base + "blog/"}>Linguagem dos Sonhos</a>
        {isAdmin && !isAdminRoute && <a href="?admin=1">Admin</a>}
        {isAdminRoute && <a href={base}>← Voltar ao app</a>}
        {session && (
          <button className="btn-ghost" onClick={() => supabase.auth.signOut()}>Sair</button>
        )}
      </div>
    </nav>
  );
}

const EMPTY_NEW_SYMBOL = { id: "", label: "", category: "emocoes", keys: "", meaning: "" };
const EMPTY_NEW_CATEGORY = { id: "", label: "", color: "#c9c3e0" };

// ---------------------------------------------------------------------------
// Hub de administração. Só carrega dados/edita se o e-mail logado bater com
// ADMIN_EMAIL. A proteção de verdade está nas policies de RLS do banco
// (admin-permissions.sql / categories-setup.sql); isto aqui é só a interface.
// ---------------------------------------------------------------------------
function AdminPage({ session, categories, reloadCategories }) {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [newSymbol, setNewSymbol] = useState(EMPTY_NEW_SYMBOL);
  const [newCategory, setNewCategory] = useState(EMPTY_NEW_CATEGORY);
  const [localCategories, setLocalCategories] = useState(categories);
  const [savingCategoryId, setSavingCategoryId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  const isAdmin = session.user.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) loadSymbols();
  }, [isAdmin]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  async function loadSymbols() {
    setLoading(true);
    const { data, error } = await supabase.from("symbols").select("*").order("label");
    if (error) setErrorMsg(error.message);
    else setSymbols(data ?? []);
    setLoading(false);
  }

  function updateLocal(id, field, value) {
    setSymbols((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function updateLocalCategory(id, field, value) {
    setLocalCategories((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  async function handleSave(symbol) {
    setSavingId(symbol.id);
    setErrorMsg(null);
    const keysArray = Array.isArray(symbol.keys)
      ? symbol.keys
      : symbol.keys.split(",").map((k) => k.trim()).filter(Boolean);
    const { error } = await supabase
      .from("symbols")
      .update({ label: symbol.label, category: symbol.category, keys: keysArray, meaning: symbol.meaning })
      .eq("id", symbol.id);
    if (error) setErrorMsg(error.message);
    else setStatusMsg(`"${symbol.label}" salvo.`);
    setSavingId(null);
    loadSymbols();
  }

  async function handleDelete(id) {
    if (!confirm(`Apagar o símbolo "${id}"? Isso não pode ser desfeito.`)) return;
    const { error } = await supabase.from("symbols").delete().eq("id", id);
    if (error) setErrorMsg(error.message);
    else setSymbols((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setErrorMsg(null);
    const keysArray = newSymbol.keys.split(",").map((k) => k.trim()).filter(Boolean);
    const { error } = await supabase.from("symbols").insert({
      id: newSymbol.id.trim().toLowerCase().replace(/\s+/g, "-"),
      label: newSymbol.label,
      category: newSymbol.category,
      keys: keysArray,
      meaning: newSymbol.meaning,
    });
    if (error) setErrorMsg(error.message);
    else {
      setStatusMsg(`"${newSymbol.label}" criado.`);
      setNewSymbol(EMPTY_NEW_SYMBOL);
      loadSymbols();
    }
  }

  async function handleSaveCategory(cat) {
    setSavingCategoryId(cat.id);
    setErrorMsg(null);
    const { error } = await supabase.from("categories").update({ label: cat.label, color: cat.color }).eq("id", cat.id);
    if (error) setErrorMsg(error.message);
    else setStatusMsg(`Categoria "${cat.label}" salva.`);
    setSavingCategoryId(null);
    reloadCategories();
  }

  async function handleDeleteCategory(id) {
    if (!confirm(`Apagar a categoria "${id}"? Símbolos que usam ela vão ficar com uma cor neutra até você trocar.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) setErrorMsg(error.message);
    else reloadCategories();
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    setErrorMsg(null);
    const { error } = await supabase.from("categories").insert({
      id: newCategory.id.trim().toLowerCase().replace(/\s+/g, "-"),
      label: newCategory.label,
      color: newCategory.color,
    });
    if (error) setErrorMsg(error.message);
    else {
      setStatusMsg(`Categoria "${newCategory.label}" criada.`);
      setNewCategory(EMPTY_NEW_CATEGORY);
      reloadCategories();
    }
  }

  if (!isAdmin) {
    return (
      <div className="oracle-root">
        <OracleStyles />
        <Starfield />
        <TopNav session={session} />
        <div className="page-content flex items-center justify-center" style={{ minHeight: "70vh" }}>
          <div className="result-card max-w-sm text-center relative z-10">
            <h3>Acesso restrito</h3>
            <p>Essa página é só para administração do dicionário. Sua conta ({session.user.email}) não tem acesso.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="oracle-root">
      <OracleStyles />
      <Starfield />
      <TopNav session={session} />
      <div className="max-w-4xl mx-auto relative z-10 page-content">
        <div className="mb-8">
          <div className="oracle-eyebrow flex items-center gap-2"><Moon size={12} /> hub de administração</div>
          <h1 className="oracle-title" style={{ fontSize: "34px" }}>Dicionário de símbolos</h1>
        </div>

        {errorMsg && <p className="text-xs text-red-300 mb-4">{errorMsg}</p>}
        {statusMsg && <p className="text-xs mb-4" style={{ color: "var(--amber)" }}>{statusMsg}</p>}

        {/* Categorias */}
        <div className="oracle-eyebrow mb-3">categorias</div>
        <form onSubmit={handleCreateCategory} className="journal-page mb-5 grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="field-label">id</label>
            <input required placeholder="ex: nostalgia" value={newCategory.id} onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value })} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="field-label">Rótulo</label>
            <input required placeholder="ex: Nostalgia" value={newCategory.label} onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="field-label">Cor</label>
            <input type="color" value={newCategory.color} onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })} className="oracle-input rounded-md h-[42px] w-14 p-1" />
          </div>
          <button type="submit" className="btn-primary h-[42px]"><Sparkles size={15} /> Criar</button>
        </form>
        <div className="space-y-2 mb-10">
          {localCategories.map((c) => (
            <div key={c.id} className="category-row">
              <input type="color" value={c.color} onChange={(e) => updateLocalCategory(c.id, "color", e.target.value)} className="rounded-md h-9 w-9 shrink-0 border-0 p-0 cursor-pointer" style={{ background: "transparent" }} />
              <input value={c.label} onChange={(e) => updateLocalCategory(c.id, "label", e.target.value)} className="oracle-input flex-1 min-w-0 rounded-md px-3 py-2 text-sm" />
              <button onClick={() => handleSaveCategory(c)} disabled={savingCategoryId === c.id} className="btn-primary text-xs py-1.5 px-3 shrink-0">
                {savingCategoryId === c.id ? "..." : "Salvar"}
              </button>
              <button onClick={() => handleDeleteCategory(c.id)} className="btn-ghost text-xs py-1.5 px-3 shrink-0">Apagar</button>
            </div>
          ))}
        </div>

        {/* Novo símbolo */}
        <form onSubmit={handleCreate} className="journal-page mb-10 space-y-4">
          <div className="oracle-eyebrow">novo símbolo</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">id (identificador único)</label>
              <input required placeholder="ex: tempestade" value={newSymbol.id} onChange={(e) => setNewSymbol({ ...newSymbol, id: e.target.value })} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="field-label">Rótulo</label>
              <input required placeholder="ex: Tempestade" value={newSymbol.label} onChange={(e) => setNewSymbol({ ...newSymbol, label: e.target.value })} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="field-label">Categoria</label>
            <select value={newSymbol.category} onChange={(e) => setNewSymbol({ ...newSymbol, category: e.target.value })} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm">
              {localCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Palavras-chave (separadas por vírgula)</label>
            <input required placeholder="trovão, relâmpago, tempestade" value={newSymbol.keys} onChange={(e) => setNewSymbol({ ...newSymbol, keys: e.target.value })} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="field-label">Significado</label>
            <textarea required placeholder="O que esse símbolo costuma representar..." value={newSymbol.meaning} onChange={(e) => setNewSymbol({ ...newSymbol, meaning: e.target.value })} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm" rows={3} style={{ fontFamily: "Inter, sans-serif", fontStyle: "normal" }} />
          </div>
          <button type="submit" className="btn-primary"><Sparkles size={15} /> Criar símbolo</button>
        </form>

        {/* Lista existente */}
        {loading && <p className="text-sm opacity-50">Carregando...</p>}
        <div className="oracle-eyebrow mb-3">símbolos</div>
        <div className="space-y-5">
          {symbols.map((s) => (
            <div key={s.id} className="admin-card space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Rótulo</label>
                  <input value={s.label} onChange={(e) => updateLocal(s.id, "label", e.target.value)} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="field-label">Categoria</label>
                  <select value={s.category} onChange={(e) => updateLocal(s.id, "category", e.target.value)} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm">
                    {localCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="field-label">Palavras-chave (separadas por vírgula)</label>
                <input
                  value={Array.isArray(s.keys) ? s.keys.join(", ") : s.keys}
                  onChange={(e) => updateLocal(s.id, "keys", e.target.value)}
                  className="oracle-input w-full rounded-md px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="field-label">Significado</label>
                <textarea value={s.meaning} onChange={(e) => updateLocal(s.id, "meaning", e.target.value)} rows={3} className="oracle-input w-full rounded-md px-3 py-2.5 text-sm" style={{ fontFamily: "Inter, sans-serif", fontStyle: "normal" }} />
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs opacity-40 font-mono">id: {s.id}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(s.id)} className="btn-ghost text-xs py-1.5 px-3">Apagar</button>
                  <button onClick={() => handleSave(s)} disabled={savingId === s.id} className="btn-primary text-xs py-1.5 px-3">
                    {savingId === s.id ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function normalize(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchSymbols(text, symbolsList) {
  const norm = normalize(text);
  return symbolsList.filter((s) =>
    s.keys.some((k) => {
      const pattern = new RegExp(`\\b${escapeRegex(normalize(k))}\\b`, "i");
      return pattern.test(norm);
    })
  );
}

function Constellation({ matches, onSelect, selectedId, categories }) {
  const n = matches.length;
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const r = n <= 1 ? 0 : 108;

  const points = matches.map((m, i) => {
    const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2;
    return { ...m, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] mx-auto" style={{ overflow: "visible" }}>
      {points.map((p, i) =>
        points.slice(i + 1).map((q, j) => (
          <line key={`${i}-${j}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--lavender)" strokeOpacity="0.25" strokeWidth="1" className="constellation-line" />
        ))
      )}
      {points.map((p) => {
        const meta = getCategoryMeta(categories, p.category);
        const isSelected = selectedId === p.id;
        return (
          <g key={p.id} transform={`translate(${p.x}, ${p.y})`} onClick={() => onSelect(p.id)} className="constellation-star" style={{ cursor: "pointer" }}>
            <circle r={isSelected ? 7 : 5} fill={meta.color} opacity={isSelected ? 1 : 0.85} />
            <circle r={isSelected ? 14 : 10} fill={meta.color} opacity="0.15" />
            <text y={-14} textAnchor="middle" fill="var(--moon)" fontFamily="'IBM Plex Mono', monospace" fontSize="11" opacity={isSelected ? 1 : 0.7}>
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Painel de geração de imagem. Usa a chave OpenAI do próprio cliente
// (guardada em user_settings), via a Edge Function generate-dream-image.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Carrossel de artes abstratas: só um "gostinho" do estilo de imagem que a
// IA pode gerar, pra tornar o convite mais visual. Não são imagens reais
// geradas, só ilustrações de exemplo no estilo do site.
// ---------------------------------------------------------------------------
const DREAM_ART_PREVIEWS = [
  { id: "agua", from: "#1b3a4a", to: "#6fa8a0", accent: "#f4f1ea" },
  { id: "voar", from: "#2a1f45", to: "#c97b93", accent: "#e8a857" },
  { id: "cosmos", from: "#0b0f1f", to: "#3d3466", accent: "#c9c3e0" },
  { id: "fogo", from: "#3a1f1f", to: "#e8a857", accent: "#c97b93" },
];

function DreamArtThumb({ art }) {
  return (
    <svg viewBox="0 0 280 180" className="dream-art-svg">
      <defs>
        <radialGradient id={`grad-${art.id}`} cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor={art.to} />
          <stop offset="100%" stopColor={art.from} />
        </radialGradient>
      </defs>
      <rect width="280" height="180" fill={`url(#grad-${art.id})`} />
      <circle cx="210" cy="45" r="26" fill={art.accent} opacity="0.85" />
      <circle cx="60" cy="130" r="60" fill={art.accent} opacity="0.12" />
      <circle cx="150" cy="150" r="34" fill={art.accent} opacity="0.18" />
      <path d="M0,120 Q70,90 140,115 T280,105 V180 H0 Z" fill={art.from} opacity="0.55" />
    </svg>
  );
}

function DreamArtCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % DREAM_ART_PREVIEWS.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dream-art-carousel">
      {DREAM_ART_PREVIEWS.map((art, i) => (
        <div key={art.id} className="dream-art-slide" style={{ opacity: i === index ? 1 : 0 }}>
          <DreamArtThumb art={art} />
        </div>
      ))}
      <div className="dream-art-dots">
        {DREAM_ART_PREVIEWS.map((art, i) => (
          <span key={art.id} className="dream-art-dot" style={{ opacity: i === index ? 1 : 0.3 }} />
        ))}
      </div>
    </div>
  );
}

function ImagePanel({ generatingImage, generatedImage, imageError, onGenerate }) {
  return (
    <div className="image-panel">
      {!generatedImage && (
        <button className="btn-ghost flex items-center gap-2" onClick={onGenerate} disabled={generatingImage}>
          <ImageIcon size={14} /> {generatingImage ? "Gerando imagem..." : "Criar imagem deste sonho com IA"}
        </button>
      )}
      {generatedImage && (
        <div className="space-y-2">
          <img src={`data:image/png;base64,${generatedImage}`} alt="Ilustração gerada do sonho" className="generated-image" />
          <button className="btn-ghost text-xs py-1.5 px-3" onClick={onGenerate} disabled={generatingImage}>
            {generatingImage ? "Gerando..." : "Gerar outra"}
          </button>
        </div>
      )}
      {imageError && <p className="text-xs text-red-300 mt-2">{imageError}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Landing / login. Apresenta o site antes de pedir pra entrar. A prévia de
// símbolos usa uma amostra fixa (não é interativa) só para dar gosto do que
// vem depois do login.
// ---------------------------------------------------------------------------
const PREVIEW_SYMBOLS = [
  { label: "Água", category: "emocoes" },
  { label: "Voar", category: "transformacao" },
  { label: "Perseguição", category: "medos" },
  { label: "Espelho", category: "emocoes" },
  { label: "Casa", category: "emocoes" },
  { label: "Cobra", category: "transformacao" },
];

const FEATURES = [
  { icon: Sparkles, title: "Dicionário de símbolos", desc: "Escreva o sonho como veio até você. A gente reconhece os elementos e monta a interpretação na hora." },
  { icon: Moon, title: "Constelação visual", desc: "Cada símbolo reconhecido vira uma estrela no seu mapa, conectada às outras da mesma história." },
  { icon: ImageIcon, title: "Imagem gerada por IA", desc: "Transforme o relato do sonho numa ilustração, com a sua própria conta na OpenAI." },
  { icon: BookOpen, title: "Histórico privado", desc: "Todo sonho salvo fica só seu, protegido por login, visível apenas para você." },
];

function LoginScreen({ categories }) {
  const [error, setError] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogCategories, setBlogCategories] = useState([]);
  const blogBaseUrl = import.meta.env.BASE_URL + "blog/";

  useEffect(() => {
    loadBlogPosts();
    loadBlogCategories();
  }, []);

  async function loadBlogPosts() {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("titulo, resumo, slug, data")
      .eq("status", "publicado")
      .order("data", { ascending: false })
      .limit(4);
    if (!error) setBlogPosts(data ?? []);
  }

  async function loadBlogCategories() {
    const { data, error } = await supabase
      .from("blog_categories")
      .select("nome, slug, descricao")
      .order("nome");
    if (!error) setBlogCategories(data ?? []);
  }

  async function handleGoogleLogin() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="oracle-root">
      <OracleStyles />
      <TopNav session={null} />

      {/* HERO */}
      <div className="landing-root" style={{ minHeight: "auto", padding: "9vh 24px 6vh" }}>
        <Starfield />
        <div className="landing-constellation">
          <Constellation matches={PREVIEW_SYMBOLS.map((s, i) => ({ ...s, id: `preview-${i}` }))} onSelect={() => {}} selectedId={null} categories={categories} />
        </div>
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <div className="oracle-eyebrow mb-2 justify-center flex items-center gap-2">
            <Moon size={12} /> onírica
          </div>
          <h1 className="oracle-title">
            O que seu sonho <em>quis dizer</em>
          </h1>
          <p className="oracle-sub mx-auto mt-2">
            Escreva o sonho como ele veio até você. A gente cruza o texto com um
            dicionário de símbolos e monta um mapa. Cada elemento reconhecido
            vira uma estrela, e juntas elas contam a mesma história por outro ângulo.
          </p>

          <div className="preview-tags mt-8 mb-10">
            {PREVIEW_SYMBOLS.map((s) => (
              <span key={s.label} className="preview-tag" style={{ borderColor: getCategoryMeta(categories, s.category).color }}>
                {s.label}
              </span>
            ))}
          </div>

          <div className="cta-row">
            <button onClick={handleGoogleLogin} className="btn-google">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/>
              </svg>
              Continuar com Google
            </button>
            <a href={blogBaseUrl} className="btn-ghost" style={{ padding: "12px 22px" }}>Linguagem dos Sonhos</a>
          </div>
          {error && <p className="text-xs text-red-300 mt-3">{error}</p>}
          <p className="text-xs opacity-40 mt-6">
            Seus sonhos ficam privados. Só você tem acesso ao seu histórico.
          </p>
        </div>
      </div>

      {/* FUNCIONALIDADES */}
      <div className="max-w-4xl mx-auto relative z-10" style={{ padding: "6vh 24px" }}>
        <div className="text-center mb-10">
          <div className="oracle-eyebrow mb-2">como funciona</div>
          <h2 className="oracle-title" style={{ fontSize: "clamp(24px,3.4vw,34px)" }}>O que o Onírica faz</h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon"><f.icon size={18} /></div>
              <div className="feature-title">{f.title}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* LINGUAGEM DOS SONHOS: categorias (sempre visível) */}
      {blogCategories.length > 0 && (
        <div className="max-w-5xl mx-auto relative z-10" style={{ padding: "6vh 24px", paddingBottom: blogPosts.length > 0 ? "2vh" : "10vh" }}>
          <div className="text-center mb-12">
            <div className="oracle-eyebrow mb-2">linguagem dos sonhos</div>
            <h2 className="oracle-title" style={{ fontSize: "clamp(28px,4vw,40px)" }}>Textos pra ir mais fundo</h2>
            <p className="oracle-sub mx-auto mt-3">Símbolos, psicologia dos sonhos, pesadelos e sonhos lúcidos, explicados com calma.</p>
          </div>
          <div className="post-grid">
            {blogCategories.map((c) => (
              <a key={c.slug} href={`${blogBaseUrl}?categoria=${c.slug}`} className="post-card">
                <div className="post-card-date">categoria</div>
                <div className="post-card-title">{c.nome}</div>
                <p className="post-card-desc">{c.descricao}</p>
                <span className="post-card-link">Explorar →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* LINGUAGEM DOS SONHOS: posts recentes */}
      {blogPosts.length > 0 && (
        <div className="max-w-5xl mx-auto relative z-10" style={{ padding: "2vh 24px 10vh" }}>
          <div className="post-grid">
            {blogPosts.map((p) => (
              <a key={p.slug} href={`${blogBaseUrl}?post=${p.slug}`} className="post-card">
                <div className="post-card-date">{new Date(p.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                <div className="post-card-title">{p.titulo}</div>
                <p className="post-card-desc">{p.resumo}</p>
                <span className="post-card-link">Ler o texto →</span>
              </a>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href={blogBaseUrl} className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>Ver todos os textos</a>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campo de estrelas + "bursts" de brilho no fundo. Posições geradas uma única
// vez (fora do componente) para não recalcular a cada renderização.
// ---------------------------------------------------------------------------
const STAR_POSITIONS = Array.from({ length: 55 }, () => ({
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: 1 + Math.random() * 1.8,
  opacity: 0.25 + Math.random() * 0.55,
  delay: Math.random() * 6,
}));

const BURST_POSITIONS = [
  { top: 12, left: 8, size: 22, color: "var(--amber)", delay: 0 },
  { top: 78, left: 15, size: 16, color: "var(--rose)", delay: 1.2 },
  { top: 22, left: 90, size: 18, color: "var(--lavender)", delay: 2.4 },
  { top: 62, left: 82, size: 24, color: "var(--teal)", delay: 0.6 },
  { top: 90, left: 55, size: 14, color: "var(--amber)", delay: 3 },
  { top: 8, left: 45, size: 16, color: "var(--lavender)", delay: 1.8 },
];

function Burst({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="burst-spark">
      <path
        d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"
        fill={color}
      />
    </svg>
  );
}

function Starfield() {
  return (
    <div className="starfield" aria-hidden="true">
      {STAR_POSITIONS.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
      {BURST_POSITIONS.map((b, i) => (
        <div
          key={i}
          className="burst"
          style={{ top: `${b.top}%`, left: `${b.left}%`, animationDelay: `${b.delay}s` }}
        >
          <Burst size={b.size} color={b.color} />
        </div>
      ))}
    </div>
  );
}

function OracleStyles() {
  return (
    <style>{`
      .oracle-root {
        --ink: #0b0f1f; --panel: #141a33; --panel-2: #1b2244;
        --moon: #f4f1ea; --lavender: #c9c3e0; --amber: #e8a857;
        --rose: #c97b93; --teal: #6fa8a0;
        background: var(--ink);
        background-image: radial-gradient(circle at 15% 10%, rgba(201,195,224,0.06), transparent 40%),
                          radial-gradient(circle at 85% 90%, rgba(232,168,87,0.05), transparent 45%);
        color: var(--moon); font-family: 'Inter', sans-serif; min-height: 100%;
        position: relative;
        overflow: hidden;
      }
      .page-content { padding: 40px 24px 64px; }
      .topnav {
        position: sticky;
        top: 0;
        z-index: 40;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        background: rgba(11,15,31,0.82);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(201,195,224,0.14);
      }
      .topnav-brand {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 18px;
        color: var(--moon);
      }
      .topnav-links {
        display: flex;
        align-items: center;
        gap: 22px;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 12.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .topnav-links a { color: var(--lavender); transition: color 0.2s; }
      .topnav-links a:hover { color: var(--amber); }
      .topnav-links .btn-ghost { padding: 8px 16px; font-size: 12px; }
      .starfield { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
      .star {
        position: absolute;
        border-radius: 50%;
        background: var(--moon);
        animation: twinkle 4.5s ease-in-out infinite;
      }
      @keyframes twinkle {
        0%, 100% { opacity: var(--min-o, 0.2); }
        50% { opacity: 1; }
      }
      .burst {
        position: absolute;
        transform: translate(-50%, -50%);
        opacity: 0.5;
        animation: burst-pulse 5s ease-in-out infinite;
      }
      .burst-spark { display: block; }
      @keyframes burst-pulse {
        0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(0.85) rotate(0deg); }
        50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1) rotate(8deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .star, .burst { animation: none !important; }
      }
      .oracle-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--lavender); opacity: 0.75; }
      .oracle-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: clamp(32px, 5vw, 52px); line-height: 1.05; margin: 10px 0 6px; }
      .oracle-title em { font-style: italic; font-weight: 500; color: var(--amber); }
      .oracle-sub { color: var(--lavender); font-size: 15px; max-width: 480px; line-height: 1.5; }
      .journal-page { background: var(--panel); border-radius: 4px; position: relative; padding: 28px 24px;
        background-image: repeating-linear-gradient(to bottom, transparent, transparent 33px, rgba(201,195,224,0.06) 34px); }
      .journal-page textarea { width: 100%; background: transparent; border: none; outline: none; resize: none; color: var(--moon);
        font-family: 'Fraunces', serif; font-style: italic; font-size: 18px; line-height: 34px; min-height: 204px; }
      .journal-page textarea::placeholder { color: rgba(244,241,234,0.35); }
      .btn-primary { background: var(--amber); color: #241704; font-weight: 600; font-size: 14px; border: none; border-radius: 999px;
        padding: 12px 22px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; }
      .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(232,168,87,0.25); }
      .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
      .btn-ghost { background: transparent; color: var(--lavender); border: 1px solid rgba(201,195,224,0.3); border-radius: 999px; padding: 11px 20px; font-size: 14px; cursor: pointer; }
      .oracle-input {
        background: var(--panel-2);
        border: 1px solid rgba(201,195,224,0.3);
        color: var(--moon);
        color-scheme: dark;
      }
      .oracle-input::placeholder { color: rgba(244,241,234,0.4); }
      .oracle-input:focus { border-color: var(--amber); }
      /* Sobrescreve o fundo branco que o Chrome/Safari forçam no autofill */
      .oracle-input:-webkit-autofill,
      .oracle-input:-webkit-autofill:hover,
      .oracle-input:-webkit-autofill:focus {
        -webkit-text-fill-color: var(--moon);
        -webkit-box-shadow: 0 0 0px 1000px var(--panel-2) inset;
        transition: background-color 9999s ease-in-out 0s;
      }
      .btn-ghost:hover { border-color: var(--lavender); color: var(--moon); }
      .btn-google {
        background: var(--moon);
        color: #1f1f1f;
        font-weight: 600;
        font-size: 14px;
        border: none;
        border-radius: 999px;
        padding: 11px 20px;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .btn-google:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(244,241,234,0.15); }
      .result-card { background: var(--moon); color: var(--ink); border-radius: 4px; padding: 32px 28px; }
      .result-card .meaning-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.55; }
      .result-card h3 { font-family: 'Fraunces', serif; font-weight: 600; font-size: 26px; margin: 6px 0 12px; }
      .result-card p { font-size: 15px; line-height: 1.6; color: #2a2a2a; }
      .constellation-star circle { transition: r 0.15s ease, opacity 0.15s ease; }
      .constellation-line { animation: draw-in 0.6s ease forwards; }
      @keyframes draw-in { from { opacity: 0; } }
      .entry-card { background: var(--panel-2); border-radius: 4px; padding: 16px 18px; font-size: 14px; }
      .admin-card {
        background: var(--panel-2);
        border-radius: 8px;
        padding: 22px 24px;
        border: 1px solid rgba(201,195,224,0.12);
      }
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(11,15,31,0.75);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 24px;
      }
      .modal-badge {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--amber), var(--rose));
        display: flex;
        align-items: center;
        justify-content: center;
        color: #241704;
        margin-bottom: 14px;
      }
      .modal-title {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 22px;
        line-height: 1.2;
      }
      .modal-steps {
        list-style: decimal;
        padding-left: 20px;
        font-size: 13px;
        line-height: 1.7;
        color: var(--lavender);
      }
      .modal-steps a { color: var(--amber); text-decoration: underline; }
      .dream-art-carousel {
        position: relative;
        width: 100%;
        aspect-ratio: 280 / 180;
        border-radius: 10px;
        overflow: hidden;
        margin-top: 4px;
      }
      .dream-art-slide {
        position: absolute;
        inset: 0;
        transition: opacity 1s ease;
      }
      .dream-art-svg { width: 100%; height: 100%; display: block; }
      .dream-art-dots {
        position: absolute;
        bottom: 8px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        gap: 5px;
      }
      .dream-art-dot {
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--moon);
        transition: opacity 0.4s ease;
      }
      .generated-image {
        width: 100%;
        border-radius: 8px;
        display: block;
      }
      .image-panel { display: flex; flex-direction: column; align-items: flex-start; }
      .category-row {
        background: var(--panel-2);
        border-radius: 8px;
        padding: 10px 14px;
        border: 1px solid rgba(201,195,224,0.12);
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .field-label {
        display: block;
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--lavender);
        opacity: 0.65;
        margin-bottom: 6px;
      }
      .tag { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; padding: 3px 9px; border-radius: 999px; border: 1px solid rgba(201,195,224,0.35); color: var(--lavender); }
      .preview-tag {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 11.5px;
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid;
        color: var(--moon);
        opacity: 0.85;
      }
      .preview-tags {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 10px;
        max-width: 420px;
        margin-left: auto;
        margin-right: auto;
      }
      .cta-row {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .feature-card {
        background: var(--panel-2);
        border: 1px solid rgba(201,195,224,0.12);
        border-radius: 8px;
        padding: 22px 20px;
        display: block;
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      a.feature-card:hover {
        transform: translateY(-3px);
        border-color: var(--amber);
      }
      .feature-icon {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background: rgba(232,168,87,0.15);
        color: var(--amber);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
      }
      .feature-title {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 17px;
        color: var(--moon);
        margin-bottom: 6px;
      }
      .feature-desc {
        font-size: 13.5px;
        color: var(--lavender);
        line-height: 1.6;
      }
      .post-card-date {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 10.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--amber);
        margin-bottom: 8px;
      }
      .post-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 22px;
      }
      .post-card {
        background: var(--panel-2);
        border: 1px solid rgba(201,195,224,0.14);
        border-radius: 10px;
        padding: 32px 28px;
        display: block;
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      .post-card:hover {
        transform: translateY(-4px);
        border-color: var(--amber);
      }
      .post-card-title {
        font-family: 'Fraunces', serif;
        font-weight: 600;
        font-size: 22px;
        color: var(--moon);
        margin-bottom: 12px;
        line-height: 1.25;
      }
      .post-card-desc {
        font-size: 14.5px;
        color: var(--lavender);
        line-height: 1.7;
        margin-bottom: 18px;
      }
      .post-card-link {
        font-family: 'IBM Plex Mono', monospace;
        font-size: 12px;
        color: var(--amber);
        letter-spacing: 0.02em;
      }
      .landing-root {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        padding: 32px 24px;
      }
      .landing-constellation {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min(720px, 140vw);
        opacity: 0.16;
        pointer-events: none;
      }
      .landing-constellation svg { max-width: none; width: 100%; }
      @media (prefers-reduced-motion: reduce) { .constellation-line, .btn-primary { animation: none !important; transition: none !important; } }
    `}</style>
  );
}

function DreamOracle({ session, categories }) {
  const [dreamText, setDreamText] = useState("");
  const [matches, setMatches] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [symbolsDict, setSymbolsDict] = useState(SYMBOLS); // começa com o fallback local
  const [apiKey, setApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageError, setImageError] = useState(null);
  const resultRef = useRef(null);

  useEffect(() => {
    loadEntries();
    loadSymbolsDict();
    loadApiKey();
  }, []);

  async function loadApiKey() {
    const { data } = await supabase.from("user_settings").select("openai_api_key").eq("user_id", session.user.id).maybeSingle();
    if (data?.openai_api_key) setApiKey(data.openai_api_key);
  }

  async function handleSaveApiKey(e) {
    e.preventDefault();
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: session.user.id, openai_api_key: keyInput.trim() });
    if (!error) {
      setApiKey(keyInput.trim());
      setShowKeyModal(false);
      setKeyInput("");
    } else {
      setImageError(error.message);
    }
  }

  async function handleGenerateImage() {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    setGeneratingImage(true);
    setImageError(null);
    setGeneratedImage(null);

    // O relato do sonho (exatamente como a pessoa escreveu) é a base do prompt.
    // Os símbolos reconhecidos entram só como reforço, quando existem.
    const symbolLabels = (matches ?? []).map((m) => m.label).join(", ");
    const prompt = `Uma ilustração onírica e surrealista representando este sonho, com base neste relato: "${dreamText}".${symbolLabels ? ` Elementos simbólicos presentes: ${symbolLabels}.` : ""} Estilo pintura surrealista, cores suaves e atmosféricas, sem texto na imagem.`;

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-dream-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ apiKey, prompt }),
      });

      // Erro (chave inválida, sem crédito, etc.) chega como JSON normal, não como stream.
      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => null);
        setImageError(errBody?.error ?? "Não foi possível gerar a imagem.");
        setGeneratingImage(false);
        return;
      }

      // Deu certo: lê o stream de eventos (SSE) e vai atualizando a imagem
      // a cada "prévia" recebida, até a versão final chegar.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop(); // pedaço incompleto, guarda pra próxima leitura

        for (const rawEvent of events) {
          const line = rawEvent.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.b64_json) setGeneratedImage(parsed.b64_json);
            if (parsed.error) setImageError(parsed.error.message ?? "Erro ao gerar imagem.");
          } catch {
            // ignora fragmentos que não formam um JSON válido ainda
          }
        }
      }
    } catch (e) {
      setImageError(String(e));
    }
    setGeneratingImage(false);
  }

  async function loadSymbolsDict() {
    const { data, error } = await supabase.from("symbols").select("*");
    // Se o banco tiver dados, usa eles (fica em dia com o que foi editado no Admin).
    // Se falhar ou vier vazio, mantém o dicionário local como fallback.
    if (!error && data && data.length > 0) setSymbolsDict(data);
  }

  async function loadEntries() {
    setLoadingEntries(true);
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) setErrorMsg(error.message);
    else setEntries(data ?? []);
    setLoadingEntries(false);
  }

  function handleInterpret() {
    if (!dreamText.trim()) return;
    const found = matchSymbols(dreamText, symbolsDict);
    setMatches(found);
    setSelectedId(found[0]?.id ?? null);
    setGeneratedImage(null);
    setImageError(null);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  async function handleSave() {
    if (!matches) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("dreams")
      .insert({
        user_id: session.user.id,
        dream_text: dreamText,
        symbols: matches.map((m) => m.id),
      })
      .select()
      .single();
    if (error) setErrorMsg(error.message);
    else setEntries([data, ...entries]);
    setSaving(false);
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("dreams").delete().eq("id", id);
    if (error) setErrorMsg(error.message);
    else setEntries(entries.filter((e) => e.id !== id));
  }

  function handleReset() {
    setDreamText("");
    setMatches(null);
    setSelectedId(null);
    setGeneratedImage(null);
    setImageError(null);
  }

  const selected = matches?.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="oracle-root">
      <OracleStyles />
      <Starfield />
      <TopNav session={session} />
      <div className="max-w-5xl mx-auto relative z-10 page-content">
        <div className="flex items-start justify-between flex-wrap gap-6 mb-10">
          <div>
            <div className="oracle-eyebrow flex items-center gap-2">
              <Moon size={12} /> dicionário de símbolos oníricos
            </div>
            <h1 className="oracle-title">
              O que seu sonho <em>quis dizer</em>
            </h1>
            <p className="oracle-sub">
              Escreva o sonho como ele veio até você. Cada símbolo reconhecido vira uma
              estrela no seu mapa. Juntas, elas contam a mesma história por outro ângulo.
            </p>
          </div>
          <button onClick={() => { setKeyInput(apiKey); setShowKeyModal(true); }} className="btn-ghost flex items-center gap-2 text-xs py-1.5 px-3">
            <ImageIcon size={13} /> {apiKey ? "Chave OpenAI ✓" : "Criar imagem do sonho com IA"}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="journal-page">
              <textarea
                value={dreamText}
                onChange={(e) => setDreamText(e.target.value)}
                placeholder="Eu estava caminhando por uma casa que não reconhecia, e de repente..."
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button className="btn-primary" onClick={handleInterpret} disabled={!dreamText.trim()}>
                <Sparkles size={15} /> Interpretar sonho
              </button>
              {matches && (
                <button className="btn-ghost" onClick={handleReset}>
                  Escrever outro
                </button>
              )}
            </div>
          </div>

          <div ref={resultRef}>
            {!matches && (
              <div className="h-full flex items-center justify-center text-center opacity-50 text-sm py-16">
                Sua interpretação aparece aqui assim que o sonho for enviado.
              </div>
            )}
            {matches && matches.length === 0 && (
              <div className="space-y-5">
                <div className="result-card">
                  <div className="meaning-eyebrow">Nenhum símbolo reconhecido</div>
                  <h3>Esse sonho é só seu, por enquanto</h3>
                  <p>Não encontrei nenhuma palavra do nosso dicionário nesse texto. Ainda assim, você pode guardar o sonho no seu histórico. O dicionário só ajuda com a interpretação: ele não decide o que vale a pena lembrar.</p>
                </div>
                <ImagePanel
                  generatingImage={generatingImage}
                  generatedImage={generatedImage}
                  imageError={imageError}
                  onGenerate={handleGenerateImage}
                />
                <div className="flex justify-end">
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    <BookOpen size={15} /> {saving ? "Salvando..." : "Salvar no meu histórico"}
                  </button>
                </div>
              </div>
            )}
            {matches && matches.length > 0 && (
              <div className="space-y-5">
                <Constellation matches={matches} onSelect={setSelectedId} selectedId={selectedId} categories={categories} />
                {selected && (
                  <div className="result-card">
                    <div className="meaning-eyebrow">{getCategoryMeta(categories, selected.category).label}</div>
                    <h3>{selected.label}</h3>
                    <p>{selected.meaning}</p>
                  </div>
                )}
                <ImagePanel
                  generatingImage={generatingImage}
                  generatedImage={generatedImage}
                  imageError={imageError}
                  onGenerate={handleGenerateImage}
                />
                <div className="flex justify-end">
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    <BookOpen size={15} /> {saving ? "Salvando..." : "Salvar no meu histórico"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16">
          <div className="oracle-eyebrow mb-3">seu histórico</div>
          {loadingEntries && <p className="text-sm opacity-50">Carregando...</p>}
          {!loadingEntries && entries.length === 0 && (
            <p className="text-sm opacity-50">Nenhum sonho salvo ainda. O primeiro fica aqui assim que você salvar.</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entries.map((e) => (
              <div key={e.id} className="entry-card">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs opacity-50">{new Date(e.created_at).toLocaleDateString("pt-BR")}</span>
                  <button onClick={() => handleDelete(e.id)} className="opacity-40 hover:opacity-90">
                    <X size={13} />
                  </button>
                </div>
                <p className="line-clamp-2 mb-3 opacity-85">{e.dream_text}</p>
                <div className="flex flex-wrap gap-1.5">
                  {(e.symbols ?? []).map((sid) => {
                    const s = symbolsDict.find((x) => x.id === sid);
                    return s ? <span key={sid} className="tag">{s.label}</span> : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {errorMsg && <p className="text-xs text-red-300 mt-8">{errorMsg}</p>}
      </div>

      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="journal-page max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="modal-badge"><ImageIcon size={20} /></div>
            <h3 className="modal-title">Crie a imagem do seu sonho com IA</h3>
            <DreamArtCarousel />
            <p className="text-sm opacity-80 mb-4 mt-3">
              Depois de interpretar um sonho, gere uma ilustração dele na hora, feita a partir
              do texto e dos símbolos reconhecidos. Só precisa de uma chave de API da OpenAI,
              sua e só sua: a imagem é gerada com o seu crédito, nada passa pela conta do site.
            </p>
            <ol className="modal-steps mb-4">
              <li>
                Crie uma conta em{" "}
                <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">platform.openai.com</a>
              </li>
              <li>
                Gere uma chave em{" "}
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
              </li>
              <li>Cole a chave (começa com "sk-") aqui embaixo</li>
            </ol>
            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="password"
                required
                placeholder="sk-..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="oracle-input w-full rounded-md px-3 py-2.5 text-sm"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontStyle: "normal" }}
              />
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn-ghost text-xs py-1.5 px-3" onClick={() => setShowKeyModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary text-xs py-1.5 px-3">Salvar chave</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = ainda carregando
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const isAdminRoute = new URLSearchParams(window.location.search).get("admin") === "1";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    loadCategories();
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase.from("categories").select("*");
    if (!error && data && data.length > 0) setCategories(data);
  }

  if (session === undefined) return null; // ou um spinner, se preferir
  if (!session) return <LoginScreen categories={categories} />;
  if (isAdminRoute) return <AdminPage session={session} categories={categories} reloadCategories={loadCategories} />;
  return <DreamOracle session={session} categories={categories} />;
}
