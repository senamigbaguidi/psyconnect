import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function authedClient(token: string) {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const Route = createFileRoute("/api/conversations")({
  server: {
    handlers: {
      // GET /api/conversations?q=&from=&to=&limit=&offset=
      // Recherche dans les conversations + messages de l'utilisateur.
      // Si q vide → renvoie la liste paginée des conversations.
      // Si q présent → renvoie les messages correspondants groupés par conversation.
      GET: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization");
          if (!auth?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Non authentifié" }), {
              status: 401, headers: { "Content-Type": "application/json" },
            });
          }
          const token = auth.slice(7);
          const supabase = authedClient(token);
          const { data: claims } = await supabase.auth.getClaims(token);
          const userId = claims?.claims?.sub;
          if (!userId) {
            return new Response(JSON.stringify({ error: "Token invalide" }), {
              status: 401, headers: { "Content-Type": "application/json" },
            });
          }

          const url = new URL(request.url);
          const q = url.searchParams.get("q")?.trim() ?? "";
          const from = url.searchParams.get("from"); // ISO date
          const to = url.searchParams.get("to");
          const limit = Math.min(Number(url.searchParams.get("limit") ?? 20), 50);
          const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);

          if (q.length === 0) {
            // Pagination simple des conversations.
            let query = supabase
              .from("chat_conversations")
              .select("id, title, last_message_at, crisis_detected, created_at")
              .eq("user_id", userId)
              .order("last_message_at", { ascending: false })
              .range(offset, offset + limit - 1);
            if (from) query = query.gte("last_message_at", from);
            if (to) query = query.lte("last_message_at", to);
            const { data, error } = await query;
            if (error) {
              return new Response(JSON.stringify({ error: error.message }), {
                status: 500, headers: { "Content-Type": "application/json" },
              });
            }
            return Response.json({
              type: "conversations",
              items: data ?? [],
              hasMore: (data?.length ?? 0) === limit,
            });
          }

          // Recherche full-text via ILIKE (index trigram).
          if (q.length > 200) {
            return new Response(JSON.stringify({ error: "Requête trop longue" }), {
              status: 400, headers: { "Content-Type": "application/json" },
            });
          }
          let mq = supabase
            .from("chat_messages")
            .select("id, conversation_id, role, content, created_at")
            .eq("user_id", userId)
            .ilike("content", `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
          if (from) mq = mq.gte("created_at", from);
          if (to) mq = mq.lte("created_at", to);
          const { data: messages, error: mErr } = await mq;
          if (mErr) {
            return new Response(JSON.stringify({ error: mErr.message }), {
              status: 500, headers: { "Content-Type": "application/json" },
            });
          }

          // Récupère les titres des conversations associées.
          const convIds = Array.from(new Set((messages ?? []).map((m) => m.conversation_id)));
          let convs: Array<{ id: string; title: string }> = [];
          if (convIds.length > 0) {
            const { data: cd } = await supabase
              .from("chat_conversations")
              .select("id, title")
              .in("id", convIds);
            convs = cd ?? [];
          }
          const titleMap = new Map(convs.map((c) => [c.id, c.title]));

          return Response.json({
            type: "search",
            query: q,
            items: (messages ?? []).map((m) => ({
              ...m,
              conversation_title: titleMap.get(m.conversation_id) ?? "Conversation",
            })),
            hasMore: (messages?.length ?? 0) === limit,
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