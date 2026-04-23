import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { SOSDialog } from "@/components/SOSDialog";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

type Msg = {
  role: "user" | "assistant";
  content: string;
  metadata?: { crisis_detected?: boolean; recommend_expert?: string | null };
};

function ChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Connexion interrompue");
    } finally {
      setSending(false);
    }
  };

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <SOSDialog open={sosOpen} onOpenChange={setSosOpen} />

      <main className="container mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--gradient-warm)" }}>
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

        <Card className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
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
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground prose-p:my-1.5 prose-strong:text-foreground">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                  {m.metadata?.recommend_expert && (
                    <div className="mt-3 border-t border-border/50 pt-3">
                      <Link
                        to="/experts"
                        className="inline-flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
                      >
                        Voir les {m.metadata.recommend_expert}s recommandés
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
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
                disabled={sending}
              />
              <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              PsyBot n'est pas un thérapeute. En cas d'urgence, appelez le <button onClick={() => setSosOpen(true)} className="font-medium text-destructive underline">136</button>.
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}