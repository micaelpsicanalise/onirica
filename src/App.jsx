import { useState, useEffect, useRef } from "react";
import { Moon, Sparkles, BookOpen, X, LogOut } from "lucide-react";
import { supabase } from "./supabaseClient";

// ---------------------------------------------------------------------------
// Dicionário local de símbolos. Isto é um espelho da tabela `symbols` no
// Supabase (veja schema.sql) — mantido aqui como fallback para o app
// funcionar mesmo antes de você popular o banco. Quando quiser que os
// significados sejam editáveis sem deploy, troque este array por um
// `supabase.from('symbols').select('*')` no useEffect abaixo.
// ---------------------------------------------------------------------------
const SYMBOLS = [
  { id: "agua", keys: ["agua", "mar", "oceano", "onda", "rio", "afogar", "afogando", "nadar"], label: "Água", category: "emocoes", meaning: "Suas emoções estão em movimento. Água calma sugere paz interior; água agitada ou o medo de afogar aponta para sentimentos que você não conseguiu processar ainda." },
  { id: "voar", keys: ["voar", "voando", "voo", "flutuar", "flutuando"], label: "Voar", category: "transformacao", meaning: "Desejo de liberdade ou de ver sua vida de um ponto de vista mais alto. Se o voo é fácil, indica confiança; se é difícil ou você cai, aponta para medo de perder o controle." },
  { id: "queda", keys: ["cair", "caindo", "queda", "despencar"], label: "Queda", category: "medos", meaning: "Sensação de perda de controle sobre alguma área da vida — trabalho, relação ou uma decisão recente que te deixou insegura(o)." },
  { id: "dente", keys: ["dente", "dentes", "dente caindo", "perder dente"], label: "Dentes caindo", category: "medos", meaning: "Ansiedade sobre imagem, envelhecimento ou medo de dizer algo e não ser levado a sério. Um clássico dos sonhos de ansiedade social." },
  { id: "cobra", keys: ["cobra", "serpente", "cobras"], label: "Cobra", category: "transformacao", meaning: "Transformação, cura ou uma ameaça oculta que você já percebeu mas ainda não enfrentou de frente. O contexto (a cobra ataca ou apenas observa) muda bastante o tom." },
  { id: "perseguicao", keys: ["perseguido", "perseguida", "sendo perseguido", "fugindo", "correndo de"], label: "Perseguição", category: "medos", meaning: "Algo na vida desperta que você está evitando enfrentar. O perseguidor costuma representar o próprio problema, não uma pessoa específica." },
  { id: "morte", keys: ["morte", "morrendo", "morrer", "funeral", "enterro"], label: "Morte", category: "transformacao", meaning: "Raramente é literal. Costuma marcar o fim de uma fase, hábito ou versão de si mesmo — para dar espaço a algo novo." },
  { id: "bebe", keys: ["bebe", "recem-nascido", "gravida", "gravidez"], label: "Bebê", category: "transformacao", meaning: "Um projeto, ideia ou parte de você que ainda está em formação, frágil e pedindo cuidado." },
  { id: "casamento", keys: ["casamento", "casando", "noiva", "noivo"], label: "Casamento", category: "relacoes", meaning: "União — de duas partes de si mesma(o), ou um compromisso real que está sendo avaliado, consciente ou não." },
  { id: "casa", keys: ["casa", "quarto", "comodo", "porta trancada", "sotao", "porao"], label: "Casa", category: "emocoes", meaning: "A casa costuma representar você mesma(o). Cômodos desconhecidos sugerem partes de sua personalidade ainda inexploradas." },
  { id: "escada", keys: ["escada", "escadas", "subindo escada", "descendo escada"], label: "Escada", category: "transformacao", meaning: "Progresso ou retrocesso em direção a um objetivo. Subir indica esforço consciente; descer pode indicar um retorno a padrões antigos." },
  { id: "exame", keys: ["prova", "exame", "teste", "vestibular"], label: "Exame / Prova", category: "medos", meaning: "Medo de ser avaliada(o) e não estar à altura — comum em fases de cobrança pessoal ou de início de algo novo (emprego, curso, projeto)." },
  { id: "fogo", keys: ["fogo", "incendio", "queimando", "chamas"], label: "Fogo", category: "transformacao", meaning: "Paixão intensa ou raiva não expressa. O fogo destrói para limpar — pode indicar que algo precisa acabar para você seguir em frente." },
  { id: "sangue", keys: ["sangue", "sangrando", "ferido", "ferida"], label: "Sangue", category: "emocoes", meaning: "Vitalidade, perda de energia ou uma mágoa que ainda está exposta. Pode também simbolizar vínculos familiares fortes." },
  { id: "espelho", keys: ["espelho", "reflexo", "reflexao"], label: "Espelho", category: "emocoes", meaning: "Autoimagem e autoconhecimento. Um espelho que distorce ou mostra outra pessoa aponta para um conflito entre quem você é e quem acha que deveria ser." },
  { id: "labirinto", keys: ["labirinto", "perdido", "perdida", "sem saida"], label: "Labirinto", category: "medos", meaning: "Sensação de estar sem direção clara diante de uma decisão importante — geralmente aparece em fases de indecisão prolongada." },
  { id: "carro", keys: ["carro", "dirigindo", "sem freio", "freio nao funciona", "acidente de carro"], label: "Carro", category: "transformacao", meaning: "O quanto você sente estar no controle da própria vida. Freios que falham indicam a sensação de que as coisas avançam rápido demais." },
  { id: "animal", keys: ["cachorro", "gato", "lobo", "leao", "aranha", "inseto", "aranhas"], label: "Animal", category: "relacoes", meaning: "Instintos e impulsos — o tipo de animal e como ele age no sonho revelam qual instinto está mais ativo em você agora (proteção, medo, desejo, raiva)." },
  { id: "chuva", keys: ["chuva", "chovendo", "tempestade"], label: "Chuva / Tempestade", category: "emocoes", meaning: "Emoções represadas sendo liberadas. Uma tempestade violenta sugere um conflito interno chegando ao limite antes de se resolver." },
  { id: "voz", keys: ["voz desconhecida", "gritando", "grito", "gritar", "sem voz", "nao conseguia falar"], label: "Voz / Grito", category: "relacoes", meaning: "Necessidade de ser ouvida(o) — ou frustração por sentir que, mesmo tentando, sua opinião não chega às pessoas certas." },
];

const CATEGORY_META = {
  emocoes: { label: "Emoções", color: "var(--rose)" },
  medos: { label: "Medos", color: "var(--teal)" },
  transformacao: { label: "Transformação", color: "var(--amber)" },
  relacoes: { label: "Relações", color: "var(--lavender)" },
};

const ADMIN_EMAIL = "micaelpsicanalise@gmail.com";

const EMPTY_NEW_SYMBOL = { id: "", label: "", category: "emocoes", keys: "", meaning: "" };

// ---------------------------------------------------------------------------
// Hub de administração — só carrega dados/edita se o e-mail logado bater com
// ADMIN_EMAIL. A proteção de verdade está nas policies de RLS do banco
// (admin-permissions.sql); isto aqui é só a interface.
// ---------------------------------------------------------------------------
function AdminPage({ session }) {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [newSymbol, setNewSymbol] = useState(EMPTY_NEW_SYMBOL);
  const [errorMsg, setErrorMsg] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  const isAdmin = session.user.email === ADMIN_EMAIL;

  useEffect(() => {
    if (isAdmin) loadSymbols();
  }, [isAdmin]);

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

  if (!isAdmin) {
    return (
      <div className="oracle-root flex items-center justify-center min-h-screen">
        <OracleStyles />
        <div className="result-card max-w-sm text-center">
          <h3>Acesso restrito</h3>
          <p>Essa página é só para administração do dicionário. Sua conta ({session.user.email}) não tem acesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="oracle-root">
      <OracleStyles />
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="oracle-eyebrow flex items-center gap-2"><Moon size={12} /> hub de administração</div>
            <h1 className="oracle-title" style={{ fontSize: "34px" }}>Dicionário de símbolos</h1>
          </div>
          <a href={import.meta.env.BASE_URL} className="btn-ghost">← Voltar ao site</a>
        </div>

        {errorMsg && <p className="text-xs text-red-300 mb-4">{errorMsg}</p>}
        {statusMsg && <p className="text-xs mb-4" style={{ color: "var(--amber)" }}>{statusMsg}</p>}

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
              {Object.entries(CATEGORY_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
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
                    {Object.entries(CATEGORY_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
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

function Constellation({ matches, onSelect, selectedId }) {
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
        const meta = CATEGORY_META[p.category];
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
// Landing / login — apresenta o site antes de pedir pra entrar. A prévia de
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

function LoginScreen() {
  const [error, setError] = useState(null);

  async function handleGoogleLogin() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="oracle-root landing-root">
      <OracleStyles />
      <div className="landing-constellation">
        <Constellation matches={PREVIEW_SYMBOLS.map((s, i) => ({ ...s, id: `preview-${i}` }))} onSelect={() => {}} selectedId={null} />
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
          dicionário de símbolos e monta um mapa — cada elemento reconhecido
          vira uma estrela, e juntas elas contam a mesma história por outro ângulo.
        </p>

        <div className="preview-tags mt-8 mb-10">
          {PREVIEW_SYMBOLS.map((s) => (
            <span key={s.label} className="preview-tag" style={{ borderColor: CATEGORY_META[s.category].color }}>
              {s.label}
            </span>
          ))}
        </div>

        <button onClick={handleGoogleLogin} className="btn-google">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z"/>
          </svg>
          Continuar com Google
        </button>
        {error && <p className="text-xs text-red-300 mt-3">{error}</p>}
        <p className="text-xs opacity-40 mt-6">
          Seus sonhos ficam privados — só você tem acesso ao seu histórico.
        </p>
      </div>
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
        color: var(--moon); font-family: 'Inter', sans-serif; min-height: 100%; padding: 48px 24px 64px;
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

function DreamOracle({ session }) {
  const [dreamText, setDreamText] = useState("");
  const [matches, setMatches] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [symbolsDict, setSymbolsDict] = useState(SYMBOLS); // começa com o fallback local
  const resultRef = useRef(null);

  useEffect(() => {
    loadEntries();
    loadSymbolsDict();
  }, []);

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
  }

  const selected = matches?.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="oracle-root">
      <OracleStyles />
      <div className="max-w-5xl mx-auto">
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
              estrela no seu mapa — juntas, elas contam a mesma história por outro ângulo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {session.user.email === ADMIN_EMAIL && (
              <a href="?admin=1" className="btn-ghost text-xs py-1.5 px-3">Admin</a>
            )}
            <button className="btn-ghost flex items-center gap-2" onClick={() => supabase.auth.signOut()}>
              <LogOut size={14} /> Sair ({session.user.email})
            </button>
          </div>
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
                  <p>Não encontrei nenhuma palavra do nosso dicionário nesse texto. Ainda assim, você pode guardar o sonho no seu histórico — o dicionário só ajuda com a interpretação, ele não decide o que vale a pena lembrar.</p>
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary" onClick={handleSave} disabled={saving}>
                    <BookOpen size={15} /> {saving ? "Salvando..." : "Salvar no meu histórico"}
                  </button>
                </div>
              </div>
            )}
            {matches && matches.length > 0 && (
              <div className="space-y-5">
                <Constellation matches={matches} onSelect={setSelectedId} selectedId={selectedId} />
                {selected && (
                  <div className="result-card">
                    <div className="meaning-eyebrow">{CATEGORY_META[selected.category].label}</div>
                    <h3>{selected.label}</h3>
                    <p>{selected.meaning}</p>
                  </div>
                )}
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
            <p className="text-sm opacity-50">Nenhum sonho salvo ainda — o primeiro fica aqui assim que você salvar.</p>
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
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = ainda carregando
  const isAdminRoute = new URLSearchParams(window.location.search).get("admin") === "1";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // ou um spinner, se preferir
  if (!session) return <LoginScreen />;
  if (isAdminRoute) return <AdminPage session={session} />;
  return <DreamOracle session={session} />;
}
