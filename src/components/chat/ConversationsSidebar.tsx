import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Loader2, AlertCircle, MessageCircle } from "lucide-react";

type Conversation = {
  id: string;
  title: string;
  last_message_at: string;
  crisis_detected: boolean;
  created_at: string;
};

type SearchHit = {
  id: string;
  conversation_id: string;
  conversation_title: string;
  role: string;
  content: string;
  created_at: string;
};

const PERIODS = [
  { value: "all", label: "Toute période" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "3 derniers mois" },
] as const;
type Period = typeof PERIODS[number]["value"];

function periodToFromIso(period: Period): string | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 86400_000).toISOString();
}

const PAGE_SIZE = 20;

export function ConversationsSidebar({
  activeId,
  onSelectConversation,
  onSelectMessage,
  onNew,
  refreshKey,
}: {
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onSelectMessage: (conversationId: string, messageId: string) => void;
  onNew: () => void;
  refreshKey: number;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searching, setSearching] = useState(false);

  // Debounce input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPage = useCallback(async (reset: boolean) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(reset ? 0 : offset),
    });
    const fromIso = periodToFromIso(period);
    if (fromIso) params.set("from", fromIso);
    const resp = await fetch(`/api/conversations?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    if (resp.ok) {
      const json = await resp.json();
      const items = (json.items ?? []) as Conversation[];
      setConversations((prev) => reset ? items : [...prev, ...items]);
      setHasMore(Boolean(json.hasMore));
      setOffset((reset ? 0 : offset) + items.length);
    }
    setLoading(false);
  }, [offset, period]);

  const fetchSearch = useCallback(async (reset: boolean) => {
    if (!debouncedQuery) return;
    setSearching(true);
    const { data: { session } } = await supabase.auth.getSession();
    const params = new URLSearchParams({
      q: debouncedQuery,
      limit: String(PAGE_SIZE),
      offset: String(reset ? 0 : searchOffset),
    });
    const fromIso = periodToFromIso(period);
    if (fromIso) params.set("from", fromIso);
    const resp = await fetch(`/api/conversations?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    if (resp.ok) {
      const json = await resp.json();
      const items = (json.items ?? []) as SearchHit[];
      setSearchHits((prev) => reset ? items : [...prev, ...items]);
      setSearchHasMore(Boolean(json.hasMore));
      setSearchOffset((reset ? 0 : searchOffset) + items.length);
    }
    setSearching(false);
  }, [debouncedQuery, period, searchOffset]);

  // Initial + reset on filter / refresh.
  const initialKey = useRef<string>("");
  useEffect(() => {
    const k = `${period}|${refreshKey}`;
    if (initialKey.current === k) return;
    initialKey.current = k;
    setOffset(0);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, refreshKey]);

  // Search reset.
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchHits([]);
      setSearchHasMore(false);
      setSearchOffset(0);
      return;
    }
    setSearchOffset(0);
    fetchSearch(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, period]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now.getTime() - d.getTime()) / 3600_000;
    if (diffH < 24) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (diffH < 24 * 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  const highlight = (text: string) => {
    if (!debouncedQuery) return text;
    const idx = text.toLowerCase().indexOf(debouncedQuery.toLowerCase());
    if (idx === -1) return text.slice(0, 120);
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + debouncedQuery.length + 80);
    const before = (start > 0 ? "…" : "") + text.slice(start, idx);
    const match = text.slice(idx, idx + debouncedQuery.length);
    const after = text.slice(idx + debouncedQuery.length, end) + (end < text.length ? "…" : "");
    return (
      <>
        {before}<mark className="rounded bg-secondary/30 px-0.5 text-foreground">{match}</mark>{after}
      </>
    );
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card/40">
      <div className="space-y-2 border-b border-border p-3">
        <Button onClick={onNew} className="h-9 w-full" size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nouvelle conversation
        </Button>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans mes échanges..."
            className="h-8 pl-7 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                period === p.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {debouncedQuery ? (
          <>
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Résultats pour « {debouncedQuery} »
            </p>
            {searching && searchHits.length === 0 && (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            )}
            {!searching && searchHits.length === 0 && (
              <p className="px-2 py-3 text-xs text-muted-foreground">Aucun message trouvé.</p>
            )}
            {searchHits.map((h) => (
              <button
                key={h.id}
                onClick={() => onSelectMessage(h.conversation_id, h.id)}
                className="mb-1 block w-full rounded-md p-2 text-left text-xs transition-colors hover:bg-muted"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-foreground">{h.conversation_title}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(h.created_at)}</span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-muted-foreground">
                  <span className="mr-1 text-[10px] uppercase text-muted-foreground/70">{h.role === "user" ? "Vous" : "PsyBot"}:</span>
                  {highlight(h.content)}
                </p>
              </button>
            ))}
            {searchHasMore && (
              <Button
                variant="ghost" size="sm"
                onClick={() => fetchSearch(false)}
                disabled={searching}
                className="mt-1 h-7 w-full text-xs"
              >
                {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : "Charger plus de résultats"}
              </Button>
            )}
          </>
        ) : (
          <>
            {conversations.length === 0 && !loading && (
              <div className="px-2 py-6 text-center">
                <MessageCircle className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Aucune conversation pour le moment.</p>
              </div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`mb-1 block w-full rounded-md p-2 text-left transition-colors ${
                  activeId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{c.title}</span>
                  {c.crisis_detected && <AlertCircle className="h-3 w-3 shrink-0 text-destructive" />}
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(c.last_message_at)}</p>
              </button>
            ))}
            {hasMore && (
              <Button
                variant="ghost" size="sm"
                onClick={() => fetchPage(false)}
                disabled={loading}
                className="mt-1 h-7 w-full text-xs"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Charger plus"}
              </Button>
            )}
            {loading && conversations.length === 0 && (
              <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}