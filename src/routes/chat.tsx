import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { SOSDialog } from "@/components/SOSDialog";
import { ConversationsSidebar } from "@/components/chat/ConversationsSidebar";
import { ExpertRecommendations } from "@/components/chat/ExpertRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, AlertCircle, Loader2, Menu, X, Mic, Square, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

type Msg = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  metadata?: { crisis_detected?: boolean; recommend_expert?: string | null };
  voice?: { original: string; language: string };
};

const PAGE_SIZE = 20;
type ExpertType = "psychologue" | "psychiatre" | "coach" | "autre";

function ChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceLang, setVoiceLang] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Auto-scroll bas pendant le streaming.
  const stickyBottom = useRef(true);
  useEffect(() => {
    if (stickyBottom.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickyBottom.current = distance < 80;
  };

  // Charger une conversation existante (page la plus récente).
  const loadConversation = useCallback(async (convId: string, scrollToMessageId?: string) => {
    setLoadingConv(true);
    setMessages([]);
    setConversationId(convId);
    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(`/api/conversations/${convId}/messages?limit=${PAGE_SIZE}`, {
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    if (resp.ok) {
      const json = await resp.json();
      const items = (json.items ?? []) as Array<Msg & { id: string; created_at: string }>;
      setMessages(items);
      setHasMoreMessages(Boolean(json.hasMore));
      // Si on cible un message en particulier, on charge plus jusqu'à le trouver (max 5 pages).
      if (scrollToMessageId && !items.some((m) => m.id === scrollToMessageId)) {
        let pages = 0;
        let oldest = items[0]?.created_at;
        let allItems = items;
        while (pages < 5 && oldest && !allItems.some((m) => m.id === scrollToMessageId)) {
          pages++;
          const r2 = await fetch(`/api/conversations/${convId}/messages?limit=${PAGE_SIZE}&before=${encodeURIComponent(oldest)}`, {
            headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
          });
          if (!r2.ok) break;
          const j2 = await r2.json();
          const more = (j2.items ?? []) as Array<Msg & { id: string; created_at: string }>;
          if (more.length === 0) break;
          allItems = [...more, ...allItems];
          oldest = more[0]?.created_at;
          setHasMoreMessages(Boolean(j2.hasMore));
        }
        setMessages(allItems);
      }
      setHighlightId(scrollToMessageId ?? null);
    } else {
      toast.error("Impossible de charger la conversation");
    }
    setLoadingConv(false);
    setSidebarOpen(false);
    stickyBottom.current = !scrollToMessageId;
  }, []);

  // Scroll vers le message ciblé après chargement.
  useEffect(() => {
    if (!highlightId) return;
    const el = messageRefs.current.get(highlightId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const t = setTimeout(() => setHighlightId(null), 2500);
      return () => clearTimeout(t);
    }
  }, [highlightId, messages]);

  const loadMoreMessages = async () => {
    if (!conversationId || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldest = (messages[0] as Msg & { created_at?: string }).created_at;
    const { data: { session } } = await supabase.auth.getSession();
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (oldest) params.set("before", oldest);
    const resp = await fetch(`/api/conversations/${conversationId}/messages?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    if (resp.ok) {
      const json = await resp.json();
      const items = (json.items ?? []) as Array<Msg & { created_at: string }>;
      // Préserver la position de scroll après préfixage.
      const el = scrollRef.current;
      const prevHeight = el?.scrollHeight ?? 0;
      setMessages((prev) => [...items, ...prev]);
      setHasMoreMessages(Boolean(json.hasMore));
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
      stickyBottom.current = false;
    }
    setLoadingMore(false);
  };

  const newConversation = () => {
    setConversationId(null);
    setMessages([]);
    setHasMoreMessages(false);
    setSidebarOpen(false);
    stickyBottom.current = true;
  };

  const send = async (overrideText?: string, voiceMeta?: { original: string; language: string }) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending || !user) return;
    if (!overrideText) setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, voice: voiceMeta }]);
    setSending(true);
    stickyBottom.current = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ conversationId, message: text }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Erreur" }));
        toast.error(err.error ?? "Le chat est indisponible");
        setSending(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";
      let crisis = false;
      let recommend: string | null = null;
      let convId = conversationId;

      // Add empty assistant message
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith("event: meta")) continue;
          if (line.startsWith("data: ")) {
            const json = line.slice(6).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              if (parsed.conversationId) {
                convId = parsed.conversationId;
                setConversationId(parsed.conversationId);
                continue;
              }
              const delta = parsed.choices?.[0]?.delta?.content;
              if (typeof delta === "string") {
                assistantText += delta;
                if (assistantText.includes("[[CRISIS_DETECTED]]")) crisis = true;
                const m = assistantText.match(/\[\[RECOMMEND_EXPERT:(psychologue|psychiatre|coach|autre)\]\]/);
                if (m) recommend = m[1];
                const display = assistantText
                  .replace(/\[\[CRISIS_DETECTED\]\]/g, "")
                  .replace(/\[\[RECOMMEND_EXPERT:[^\]]+\]\]/g, "");
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: display,
                    metadata: { crisis_detected: crisis, recommend_expert: recommend },
                  };
                  return next;
                });
              }
            } catch { /* partial json */ }
          }
        }
      }
      void convId;
      if (crisis) setSosOpen(true);
      // Si l'utilisateur a parlé dans une langue locale, on lit la réponse en TTS dans cette langue.
      if (voiceMeta && assistantText) {
        const cleanReply = assistantText
          .replace(/\[\[CRISIS_DETECTED\]\]/g, "")
          .replace(/\[\[RECOMMEND_EXPERT:[^\]]+\]\]/g, "")
          .trim();
        playTTS(cleanReply, voiceMeta.language).catch(() => { /* silencieux */ });
      }
      // Rafraîchit la sidebar (nouvelle conversation ou maj last_message_at).
      setSidebarRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Connexion interrompue");
    } finally {
      setSending(false);
    }
  };

  // ===== Voix : enregistrement + ASR + traduction + envoi =====
  const startRecording = async () => {
    if (recording || transcribing || sending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        await handleAudioBlob(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (e) {
      toast.error("Micro indisponible. Vérifiez les permissions.");
      console.error(e);
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  };

  const handleAudioBlob = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const form = new FormData();
      const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
      form.append("file", blob, `voice.${ext}`);
      const resp = await fetch("/api/voice-transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: form,
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({ error: "Erreur" }));
        toast.error(j.error ?? "Transcription échouée");
        return;
      }
      const { text, language, frenchText } = (await resp.json()) as {
        text: string; language: string; frenchText: string;
      };
      if (!frenchText) {
        toast.error("Aucune parole détectée");
        return;
      }
      setVoiceLang(language);
      // Envoie la version FR au bot, en gardant la version originale visible côté UI.
      await send(frenchText, { original: text, language });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur audio");
    } finally {
      setTranscribing(false);
    }
  };

  const playTTS = async (text: string, language: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch("/api/voice-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ text, language }),
      });
      if (!resp.ok) return;
      const buf = await resp.arrayBuffer();
      const url = URL.createObjectURL(new Blob([buf], { type: resp.headers.get("content-type") || "audio/mpeg" }));
      if (!ttsAudioRef.current) ttsAudioRef.current = new Audio();
      ttsAudioRef.current.src = url;
      await ttsAudioRef.current.play().catch(() => { /* autoplay bloqué */ });
    } catch (e) {
      console.error("TTS error", e);
    }
  };
  void voiceLang;

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <SOSDialog open={sosOpen} onOpenChange={setSosOpen} />

      <main className="container mx-auto flex w-full max-w-6xl flex-1 px-2 py-4 md:px-4 md:py-6">
        <div className="grid w-full flex-1 gap-4 md:grid-cols-[280px_1fr]">
          {/* Sidebar desktop */}
          <div className="hidden h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border md:block">
            <ConversationsSidebar
              activeId={conversationId}
              onSelectConversation={(id) => loadConversation(id)}
              onSelectMessage={(cid, mid) => loadConversation(cid, mid)}
              onNew={newConversation}
              refreshKey={sidebarRefreshKey}
            />
          </div>

          {/* Sidebar mobile (drawer) */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-background/80 backdrop-blur" onClick={() => setSidebarOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-card shadow-xl">
                <div className="flex items-center justify-between border-b border-border p-2">
                  <span className="font-display text-sm font-semibold">Mes conversations</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSidebarOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="h-[calc(100%-2.75rem)]">
                  <ConversationsSidebar
                    activeId={conversationId}
                    onSelectConversation={(id) => loadConversation(id)}
                    onSelectMessage={(cid, mid) => loadConversation(cid, mid)}
                    onNew={newConversation}
                    refreshKey={sidebarRefreshKey}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex min-w-0 flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--gradient-calm)" }}>
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold">PsyBot</h1>
                  <p className="text-xs text-muted-foreground">Écoute bienveillante · 24h/24</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSosOpen(true)} className="border-destructive/40 text-destructive hover:bg-destructive/10">
                <AlertCircle className="mr-1 h-4 w-4" /> SOS
              </Button>
            </div>

            <Card className="flex h-[calc(100vh-12rem)] flex-1 flex-col overflow-hidden">
              <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-4 overflow-y-auto p-5">
                {hasMoreMessages && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline" size="sm"
                      onClick={loadMoreMessages}
                      disabled={loadingMore}
                      className="h-7 text-xs"
                    >
                      {loadingMore ? <Loader2 className="h-3 w-3 animate-spin" /> : "Charger les messages plus anciens"}
                    </Button>
                  </div>
                )}
                {loadingConv && (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
            {messages.length === 0 && (
              <div className="mx-auto max-w-md py-12 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-7 w-7" />
                </div>
                <p className="font-display text-lg font-semibold">Comment vous sentez-vous aujourd'hui ?</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Je suis là pour vous écouter, sans jugement. Tout ce que vous partagez reste confidentiel.
                </p>
                <div className="mt-6 grid gap-2">
                  {[
                    "Je me sens dépassé·e en ce moment",
                    "J'ai du mal à dormir depuis quelques jours",
                    "Je ressens beaucoup d'anxiété",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="rounded-lg border border-border bg-muted/30 px-4 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={m.id ?? i}
                ref={(el) => {
                  if (m.id) {
                    if (el) messageRefs.current.set(m.id, el);
                    else messageRefs.current.delete(m.id);
                  }
                }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 transition-shadow ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  } ${highlightId && m.id === highlightId ? "ring-2 ring-secondary ring-offset-2 ring-offset-background" : ""}`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground prose-p:my-1.5 prose-strong:text-foreground">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <div>
                      {m.voice?.original && (
                        <p className="mb-1 whitespace-pre-wrap text-xs opacity-80">
                          <span className="mr-1 rounded bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                            {m.voice.language}
                          </span>
                          {m.voice.original}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  )}
                  {m.role === "assistant" && m.metadata?.recommend_expert && (
                    <ExpertRecommendations
                      type={m.metadata.recommend_expert as ExpertType}
                      conversationId={conversationId}
                    />
                  )}
                </div>
              </div>
            ))}
            {sending && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-muted px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
              </div>

              <div className="border-t border-border bg-card p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Écrivez ce que vous ressentez…"
                rows={1}
                className="min-h-[44px] resize-none"
                disabled={sending || recording || transcribing}
              />
              <Button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={sending || transcribing}
                size="icon"
                variant={recording ? "destructive" : "outline"}
                className="h-11 w-11 shrink-0"
                aria-label={recording ? "Arrêter l'enregistrement" : "Enregistrer un message vocal"}
                title={recording ? "Arrêter" : "Parler dans votre langue"}
              >
                {transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : recording ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={() => send()} disabled={sending || !input.trim() || recording || transcribing} size="icon" className="h-11 w-11 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {(recording || transcribing) && (
              <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                {recording ? (
                  <><Volume2 className="h-3 w-3 animate-pulse" /> Enregistrement… appuyez sur stop quand vous avez fini.</>
                ) : (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Transcription et traduction en cours…</>
                )}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              PsyBot n'est pas un thérapeute. En cas d'urgence, appelez le <button onClick={() => setSosOpen(true)} className="font-medium text-destructive underline">136</button>.
            </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}