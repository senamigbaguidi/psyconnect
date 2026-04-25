import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type ExpertType = "psychologue" | "psychiatre" | "coach" | "autre";
const VALID_TYPES: ExpertType[] = ["psychologue", "psychiatre", "coach", "autre"];

function authedClient(token: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function authenticate(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return { error: "Non authentifié", status: 401 as const };
  const token = auth.slice(7);
  const supabase = authedClient(token);
  const { data: claims } = await supabase.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "Token invalide", status: 401 as const };
  return { supabase, userId };
}

export const Route = createFileRoute("/api/referrals")({
  server: {
    handlers: {
      // GET /api/referrals?type=psychologue
      // Liste des experts actifs correspondants au type recommandé par PsyBot.
      // Les premium sont remontés en premier.
      GET: async ({ request }) => {
        const auth = await authenticate(request);
        if ("error" in auth) {
          return new Response(JSON.stringify({ error: auth.error }), {
            status: auth.status, headers: { "Content-Type": "application/json" },
          });
        }
        const url = new URL(request.url);
        const type = url.searchParams.get("type") as ExpertType | null;
        if (!type || !VALID_TYPES.includes(type)) {
          return new Response(JSON.stringify({ error: "Type d'expert invalide" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        const { data, error } = await auth.supabase
          .from("expert_profiles")
          .select("id, user_id, display_name, expert_type, description, cabinet_name, address, languages, consultation_price, subscription_tier, avatar_url")
          .eq("expert_type", type)
          .in("subscription_tier", ["standard", "premium"])
          .order("subscription_tier", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ experts: data ?? [] });
      },

      // POST /api/referrals { conversationId, expertType, expertId?, message? }
      // Crée un ticket de mise en relation entre le patient et un expert (ou un type).
      POST: async ({ request }) => {
        const auth = await authenticate(request);
        if ("error" in auth) {
          return new Response(JSON.stringify({ error: auth.error }), {
            status: auth.status, headers: { "Content-Type": "application/json" },
          });
        }
        const body = await request.json().catch(() => null) as {
          conversationId?: string;
          expertType?: ExpertType;
          expertId?: string | null;
          message?: string;
        } | null;
        if (!body || !body.expertType || !VALID_TYPES.includes(body.expertType)) {
          return new Response(JSON.stringify({ error: "Type d'expert invalide" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        if (body.message && body.message.length > 500) {
          return new Response(JSON.stringify({ error: "Message trop long" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        const { data, error } = await auth.supabase
          .from("referral_tickets")
          .insert({
            user_id: auth.userId,
            conversation_id: body.conversationId ?? null,
            expert_type: body.expertType,
            expert_id: body.expertId ?? null,
            message: body.message?.slice(0, 500) ?? null,
          })
          .select("id, status, created_at")
          .single();
        if (error || !data) {
          return new Response(JSON.stringify({ error: error?.message ?? "Erreur création ticket" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ ticket: data });
      },
    },
  },
});