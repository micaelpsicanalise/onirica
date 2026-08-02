// Edge Function: generate-dream-image
//
// Existe só para contornar uma trava técnica da OpenAI (ela bloqueia chamadas
// diretas do navegador, por CORS). NÃO guarda nem cobra nada — a chave de API
// usada é sempre a que o próprio cliente enviou na requisição, vinda da conta
// dele. O dono do site nunca paga por essa geração de imagem.
//
// Usa o modelo gpt-image-1 com streaming (partial_images) — a imagem chega
// em etapas, então o site consegue mostrar ela se formando progressivamente
// em vez de só um "carregando...".

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Confirma que quem está chamando é um usuário logado no Onírica —
    // isso não protege dinheiro nenhum (o custo é do cliente), só evita que
    // qualquer pessoa na internet use esta função como proxy genérico.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { apiKey, prompt } = await req.json();
    if (!apiKey || !prompt) {
      return new Response(JSON.stringify({ error: "Faltam dados (apiKey ou prompt)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        stream: true,
        partial_images: 2,
      }),
    });

    // Se a OpenAI recusar (chave inválida, sem crédito, etc.), ela responde
    // com um JSON de erro normal, não com stream — repassamos como está.
    if (!openaiRes.ok) {
      const errBody = await openaiRes.json().catch(() => null);
      return new Response(
        JSON.stringify({ error: errBody?.error?.message ?? "Erro ao gerar imagem na OpenAI." }),
        { status: openaiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Quando dá certo, repassa o stream de eventos (SSE) direto pro navegador,
    // sem reprocessar — o front-end lê os eventos e vai atualizando a imagem.
    return new Response(openaiRes.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
