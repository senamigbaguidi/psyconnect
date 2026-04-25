import { createFileRoute } from "@tanstack/react-router";

const AFRI_API_KEY = process.env.AFRI_API_KEY;
const AFRI_BASE_URL = "https://build.lewisnote.com/v1";

export const Route = createFileRoute("/api/realtime-token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          if (!AFRI_API_KEY) {
            return Response.json(
              { error: "AFRI_API_KEY non configurée" },
              { status: 500 },
            );
          }
          // Require authenticated user
          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return Response.json({ error: "Non authentifié" }, { status: 401 });
          }

          // Mint short-lived ephemeral token for WebRTC client connection
          const tokenRes = await fetch(`${AFRI_BASE_URL}/realtime/token`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${AFRI_API_KEY}`,
              "Content-Type": "application/json",
            },
          });

          if (!tokenRes.ok) {
            const txt = await tokenRes.text().catch(() => "");
            console.error("Realtime token error", tokenRes.status, txt);
            return Response.json(
              { error: `Erreur fournisseur (${tokenRes.status})` },
              { status: 502 },
            );
          }
          const data = await tokenRes.json();
          return Response.json(data);
        } catch (e) {
          console.error("realtime-token handler error", e);
          return Response.json(
            { error: e instanceof Error ? e.message : "Erreur inconnue" },
            { status: 500 },
          );
        }
      },
    },
  },
});