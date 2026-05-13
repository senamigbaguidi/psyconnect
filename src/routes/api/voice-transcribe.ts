import { createFileRoute } from "@tanstack/react-router";

const AFRI_API_KEY = process.env.AFRI_API_KEY;
const AFRI_BASE_URL = "https://build.lewisnote.com/v1";

/**
 * POST /api/voice-transcribe
 * Body: multipart/form-data avec champ "file" (audio).
 * 1) Transcrit l'audio avec Afri ASR (auto-détection langue).
 * 2) Traduit en français via /chat/completions.
 * Retour: { text, language, frenchText }
 */
export const Route = createFileRoute("/api/voice-transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!AFRI_API_KEY) {
            return Response.json({ error: "AFRI_API_KEY non configurée" }, { status: 500 });
          }
          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return Response.json({ error: "Non authentifié" }, { status: 401 });
          }

          const incoming = await request.formData();
          const file = incoming.get("file");
          if (!(file instanceof File)) {
            return Response.json({ error: "Fichier audio manquant" }, { status: 400 });
          }
          if (file.size > 25 * 1024 * 1024) {
            return Response.json({ error: "Audio trop volumineux (>25MB)" }, { status: 400 });
          }

          // 1) ASR
          const asrForm = new FormData();
          asrForm.append("file", file, file.name || "audio.webm");
          const asrRes = await fetch(`${AFRI_BASE_URL}/audio/afri-asr/transcribe`, {
            method: "POST",
            headers: { Authorization: `Bearer ${AFRI_API_KEY}` },
            body: asrForm,
          });
          if (!asrRes.ok) {
            const t = await asrRes.text().catch(() => "");
            console.error("Afri ASR error", asrRes.status, t);
            return Response.json({ error: `ASR (${asrRes.status})` }, { status: 502 });
          }
          const asr = (await asrRes.json()) as { text?: string; language?: string };
          const text = asr.text?.trim() ?? "";
          const language = asr.language ?? "unknown";

          if (!text) {
            return Response.json({ text: "", language, frenchText: "" });
          }

          // 2) Traduction → français (skip si déjà français)
          let frenchText = text;
          if (!/^fr/i.test(language)) {
            const trRes = await fetch(`${AFRI_BASE_URL}/chat/completions`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${AFRI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-5.4-nano",
                messages: [
                  {
                    role: "system",
                    content:
                      "Tu es un traducteur. Traduis fidèlement le texte de l'utilisateur en français standard. Réponds UNIQUEMENT avec la traduction, sans préambule, sans guillemets, sans explication.",
                  },
                  { role: "user", content: text },
                ],
                reasoning_effort: "low",
              }),
            });
            if (trRes.ok) {
              const j = await trRes.json();
              const out = j.choices?.[0]?.message?.content;
              if (typeof out === "string" && out.trim()) frenchText = out.trim();
            } else {
              console.error("Translation error", trRes.status);
            }
          }

          return Response.json({ text, language, frenchText });
        } catch (e) {
          console.error("voice-transcribe error", e);
          return Response.json(
            { error: e instanceof Error ? e.message : "Erreur inconnue" },
            { status: 500 },
          );
        }
      },
    },
  },
});