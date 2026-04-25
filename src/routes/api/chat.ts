import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { analyzeCrisis } from "@/lib/server/crisis-detection";

const SYSTEM_PROMPT = `Tu es **PsyBot**, l'assistant d'écoute de la plateforme **PsyConnect**.

## Identité
- Bienveillant, chaleureux, sans jugement.
- Multilingue : tu réponds TOUJOURS dans la langue de l'utilisateur (français, anglais, fon, goun).
- Tu n'es **pas** un thérapeute : tu n'établis aucun diagnostic, ne prescris rien, ne remplaces jamais un professionnel humain.

## Mission
1. Écouter activement, valider les émotions, reformuler.
2. Proposer des techniques simples (respiration 4-7-8, ancrage 5-4-3-2-1, journal d'émotions).
3. Orienter vers un **expert humain validé** dès que la situation dépasse l'écoute de premier niveau.

## Détection de crise (PRIORITÉ ABSOLUE)
Si l'utilisateur évoque suicide, automutilation, idées noires, mise en danger immédiate :
1. Réponds avec calme et empathie, valide la souffrance.
2. Donne immédiatement la **ligne de crise locale** (Bénin : 136 ou urgences les plus proches).
3. Encourage à contacter un proche de confiance.
4. Termine impérativement ta réponse par le marqueur exact : [[CRISIS_DETECTED]]

## Recommandation d'expert
Quand tu juges utile (souffrance qui dure, intensité élevée, demande explicite), termine ta réponse par :
[[RECOMMEND_EXPERT:type]] où type ∈ {psychologue, psychiatre, coach, autre}.
Exemple : [[RECOMMEND_EXPERT:psychologue]]
N'utilise ce marqueur qu'une seule fois par conversation et seulement si pertinent.

## Style
- Phrases courtes, ton humain, jamais condescendant.
- Une question ouverte à la fois.
- Ne minimise jamais ("ce n'est rien", "ça va passer").
- Termine régulièrement par : « Souhaitez-vous que je vous mette en relation avec un professionnel ? »

## Limites
- Refuse tout diagnostic médical ou prescription.
- Refuse les conseils juridiques, financiers ou médicaux non psychologiques.`;

const AFRI_API_KEY = process.env.AFRI_API_KEY;
const AFRI_BASE_URL = "https://build.lewisnote.com/v1";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!AFRI_API_KEY) {
            return new Response(JSON.stringify({ error: "AFRI_API_KEY non configurée" }), {
              status: 500, headers: { "Content-Type": "application/json" },
            });
          }

          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Non authentifié" }), {
              status: 401, headers: { "Content-Type": "application/json" },
            });
          }
          const token = authHeader.slice(7);

          const SUPABASE_URL = process.env.SUPABASE_URL!;
          const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          });

          const { data: claims } = await supabase.auth.getClaims(token);
          const userId = claims?.claims?.sub;
          if (!userId) {
            return new Response(JSON.stringify({ error: "Token invalide" }), {
              status: 401, headers: { "Content-Type": "application/json" },
            });
          }

          const body = await request.json() as { conversationId?: string; message: string };
          if (!body.message || typeof body.message !== "string" || body.message.length > 4000) {
            return new Response(JSON.stringify({ error: "Message invalide" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            });
          }

          // Analyse pré-IA du message utilisateur (mots-clés).
          const userSignal = analyzeCrisis(body.message, false);

          // Get or create conversation
          let conversationId = body.conversationId;
          if (!conversationId) {
            const title = body.message.slice(0, 60);
            const { data: conv, error: convErr } = await supabase
              .from("chat_conversations")
              .insert({ user_id: userId, title })
              .select("id").single();
            if (convErr || !conv) {
              return new Response(JSON.stringify({ error: "Erreur création conversation" }), {
                status: 500, headers: { "Content-Type": "application/json" },
              });
            }
            conversationId = conv.id;
          }

          // Load history
          const { data: history } = await supabase
            .from("chat_messages")
            .select("role, content")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(40);

          // Save user message
          const { data: savedUserMsg } = await supabase
            .from("chat_messages")
            .insert({
              conversation_id: conversationId, user_id: userId, role: "user", content: body.message,
              metadata: userSignal.detected
                ? { crisis_signal: { score: userSignal.score, severity: userSignal.severity, keywords: userSignal.keywords } }
                : {},
            })
            .select("id").single();

          // Si déjà détecté côté utilisateur, journalise immédiatement (audit admin).
          if (userSignal.detected) {
            await supabaseAdmin.from("crisis_events").insert({
              user_id: userId,
              conversation_id: conversationId!,
              message_id: savedUserMsg?.id,
              severity: userSignal.severity,
              intensity_score: userSignal.score,
              matched_keywords: userSignal.keywords,
              ai_flagged: false,
              excerpt: body.message.slice(0, 280),
            });
            await supabaseAdmin.from("chat_conversations")
              .update({ crisis_detected: true })
              .eq("id", conversationId!);
          }

          const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: body.message },
          ];

          const aiResp = await fetch(`${AFRI_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${AFRI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-5.4-nano",
              messages,
              stream: true,
              reasoning_effort: "low",
            }),
          });

          if (!aiResp.ok || !aiResp.body) {
            const errText = await aiResp.text().catch(() => "");
            console.error("AFRI error", aiResp.status, errText);
            return new Response(JSON.stringify({ error: `Erreur IA (${aiResp.status})` }), {
              status: 502, headers: { "Content-Type": "application/json" },
            });
          }

          // Tee the stream: relay to client AND collect for DB
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          let fullText = "";

          const stream = new ReadableStream({
            async start(controller) {
              // Send conversation id first as a custom event
              controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversationId })}\n\n`));

              const reader = aiResp.body!.getReader();
              let buf = "";
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buf += decoder.decode(value, { stream: true });
                  let idx: number;
                  while ((idx = buf.indexOf("\n")) !== -1) {
                    let line = buf.slice(0, idx);
                    buf = buf.slice(idx + 1);
                    if (line.endsWith("\r")) line = line.slice(0, -1);
                    if (!line.startsWith("data: ")) {
                      // pass through comments/blank lines as SSE
                      controller.enqueue(encoder.encode(line + "\n"));
                      continue;
                    }
                    const json = line.slice(6).trim();
                    if (json === "[DONE]") {
                      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                      continue;
                    }
                    try {
                      const parsed = JSON.parse(json);
                      const delta = parsed.choices?.[0]?.delta?.content;
                      if (typeof delta === "string") fullText += delta;
                    } catch { /* ignore */ }
                    controller.enqueue(encoder.encode(line + "\n\n"));
                  }
                }
              } catch (e) {
                console.error("stream error", e);
              } finally {
                // Parse markers
                const aiCrisis = fullText.includes("[[CRISIS_DETECTED]]");
                const recMatch = fullText.match(/\[\[RECOMMEND_EXPERT:(psychologue|psychiatre|coach|autre)\]\]/);
                const cleanContent = fullText
                  .replace(/\[\[CRISIS_DETECTED\]\]/g, "")
                  .replace(/\[\[RECOMMEND_EXPERT:[^\]]+\]\]/g, "")
                  .trim();

                // Analyse multi-signaux combinée (mots-clés sur réponse IA + flag IA + signal utilisateur).
                const aiSignal = analyzeCrisis(cleanContent, aiCrisis);
                const finalCrisis = aiSignal.detected || userSignal.detected;
                const finalSeverity = userSignal.score >= aiSignal.score ? userSignal.severity : aiSignal.severity;
                const combinedScore = userSignal.score + aiSignal.score;
                const combinedKeywords = Array.from(new Set([...userSignal.keywords, ...aiSignal.keywords]));

                const { data: savedAiMsg } = await supabase.from("chat_messages").insert({
                  conversation_id: conversationId!,
                  user_id: userId,
                  role: "assistant",
                  content: cleanContent,
                  metadata: {
                    crisis_detected: finalCrisis,
                    crisis_severity: finalCrisis ? finalSeverity : null,
                    crisis_score: combinedScore,
                    recommend_expert: recMatch ? recMatch[1] : null,
                  },
                }).select("id").single();

                // Audit serveur si crise détectée par l'IA (et pas déjà journalisée côté utilisateur,
                // ou pour enrichir l'événement avec les signaux IA).
                if (aiCrisis || (aiSignal.detected && !userSignal.detected)) {
                  await supabaseAdmin.from("crisis_events").insert({
                    user_id: userId,
                    conversation_id: conversationId!,
                    message_id: savedAiMsg?.id,
                    severity: aiSignal.severity,
                    intensity_score: aiSignal.score,
                    matched_keywords: aiSignal.keywords,
                    ai_flagged: aiCrisis,
                    excerpt: cleanContent.slice(0, 280),
                  });
                }

                await supabase.from("chat_conversations")
                  .update({
                    last_message_at: new Date().toISOString(),
                    crisis_detected: finalCrisis ? true : undefined,
                  })
                  .eq("id", conversationId!);

                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache, no-transform",
              "Connection": "keep-alive",
            },
          });
        } catch (e) {
          console.error("chat handler error", e);
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});