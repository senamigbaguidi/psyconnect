import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/conversations/$id/messages")({
  server: {
    handlers: {
      // GET /api/conversations/:id/messages?before=ISO&limit=20
      // Pagination "Charger plus" : renvoie les messages plus anciens que `before`.
      GET: async ({ request, params }) => {
        try {
          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Non authentifié" }), {
              status: 401, headers: { "Content-Type": "application/json" },
            });
          }
          const token = auth.slice(7);
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

          const url = new URL(request.url);
          const before = url.searchParams.get("before");
          const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);

          let query = supabase
            .from("chat_messages")
            .select("id, role, content, metadata, created_at")
            .eq("conversation_id", params.id)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

          if (before) query = query.lt("created_at", before);

          const { data, error } = await query;
          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500, headers: { "Content-Type": "application/json" },
            });
          }
          // On renvoie en ordre chronologique (ascendant).
          const items = (data ?? []).slice().reverse();
          return Response.json({
            items,
            hasMore: (data?.length ?? 0) === limit,
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});