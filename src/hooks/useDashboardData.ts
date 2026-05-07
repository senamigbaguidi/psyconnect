import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface CommunityCard {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
}

export interface RecentConversation {
  id: string;
  title: string;
  last_message_at: string;
}

interface DashboardState {
  joinedIds: string[];
  suggestions: CommunityCard[];
  conversations: RecentConversation[];
  loading: boolean;
  error: string | null;
}

/** Charge les données nécessaires à l'écran Accueil (suggestions, communautés rejointes, conversations récentes). */
export function useDashboardData() {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    joinedIds: [],
    suggestions: [],
    conversations: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!user) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [memRes, convRes] = await Promise.all([
        supabase.from("community_members").select("community_id").eq("user_id", user.id),
        supabase
          .from("chat_conversations")
          .select("id,title,last_message_at")
          .eq("user_id", user.id)
          .order("last_message_at", { ascending: false })
          .limit(3),
      ]);
      if (memRes.error) throw memRes.error;
      if (convRes.error) throw convRes.error;

      const joinedIds = (memRes.data ?? []).map((r) => r.community_id as string);

      let query = supabase
        .from("communities")
        .select("id,name,description,image_url")
        .order("created_at", { ascending: false })
        .limit(6);
      if (joinedIds.length > 0) query = query.not("id", "in", `(${joinedIds.join(",")})`);

      const sugRes = await query;
      if (sugRes.error) throw sugRes.error;

      setState({
        joinedIds,
        suggestions: ((sugRes.data ?? []) as CommunityCard[]).slice(0, 4),
        conversations: (convRes.data ?? []) as RecentConversation[],
        loading: false,
        error: null,
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}

export interface ProfileStats {
  communities: number;
  conversations: number;
  expertStatus: "pending" | "approved" | "rejected" | null;
  loading: boolean;
  error: string | null;
}

/** Statistiques affichées sur la page Profil. */
export function useProfileStats() {
  const { user, roles } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    communities: 0,
    conversations: 0,
    expertStatus: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [comm, conv, app] = await Promise.all([
          supabase
            .from("community_members")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("chat_conversations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
          supabase
            .from("expert_applications")
            .select("status")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        const expertStatus = roles.includes("expert")
          ? "approved"
          : ((app.data?.status as ProfileStats["expertStatus"]) ?? null);
        setStats({
          communities: comm.count ?? 0,
          conversations: conv.count ?? 0,
          expertStatus,
          loading: false,
          error: comm.error?.message ?? conv.error?.message ?? null,
        });
      } catch (e) {
        if (!cancelled) setStats((s) => ({ ...s, loading: false, error: (e as Error).message }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, roles]);

  return stats;
}