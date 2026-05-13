import { createFileRoute } from "@tanstack/react-router";

const AFRI_API_KEY = process.env.AFRI_API_KEY;
const AFRI_BASE_URL = "https://build.lewisnote.com/v1";

/**
 * POST /api/voice-tts
 * Body JSON: { text: string, language?: string }
 * Retour: audio binaire (audio/mpeg).
 */
export const Route = createFileRoute("/api/voice-tts")({
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

          const body = (await request.json()) as { text?: string; language?: string };
          const text = (body.text ?? "").trim();
          if (!text) return Response.json({ error: "Texte manquant" }, { status: 400 });
          if (text.length > 4000) {
            return Response.json({ error: "Texte trop long" }, { status: 400 });
          }

          const ttsRes = await fetch(`${AFRI_BASE_URL}/audio/afri-voice/tts`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${AFRI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text,
              language: body.language || undefined,
            }),
          });
          if (!ttsRes.ok) {
            const t = await ttsRes.text().catch(() => "");
            console.error("Afri TTS error", ttsRes.status, t);
            return Response.json({ error: `TTS (${ttsRes.status})` }, { status: 502 });
          }

          const contentType = ttsRes.headers.get("content-type") || "audio/mpeg";
          const audio = await ttsRes.arrayBuffer();
          return new Response(audio, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "no-store",
            },
          });
        } catch (e) {
          console.error("voice-tts error", e);
          return Response.json(
            { error: e instanceof Error ? e.message : "Erreur inconnue" },
            { status: 500 },
          );
        }
      },
    },
  },
});