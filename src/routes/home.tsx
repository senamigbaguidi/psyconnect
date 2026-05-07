import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Users, BookOpen, Sparkles, RefreshCw } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

export const Route = createFileRoute("/home")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: HomePage,
});

function HomePage() {
  const { profile } = useAuth();
  const { suggestions, conversations, loading, error, reload } = useDashboardData();
  const firstName = profile?.is_anonymous ? "" : profile?.first_name ?? "";

  return (
    <AppShell>
        <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Bienvenue</p>
          <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
            Bonjour {firstName || "à vous"} 🌿
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Comment vous sentez-vous aujourd'hui ? Prenez un instant pour respirer.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild aria-label="Démarrer une conversation avec PsyBot">
              <Link to="/chat"><MessageCircle className="h-4 w-4" /> Parler à PsyBot</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/communities"><Users className="h-4 w-4" /> Voir les communautés</Link>
            </Button>
          </div>
        </section>

        {conversations.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Reprendre une conversation</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {conversations.map((c) => (
                <Link key={c.id} to="/chat" aria-label={`Reprendre : ${c.title}`}>
                  <Card className="h-full p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-calm)] focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <p className="line-clamp-1 font-medium">{c.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(c.last_message_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Communautés suggérées</h2>
            {error && (
              <Button variant="ghost" size="sm" onClick={reload} aria-label="Réessayer">
                <RefreshCw className="h-4 w-4" /> Réessayer
              </Button>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
            {!loading && !error && suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune nouvelle communauté à découvrir.</p>
            )}
            {!loading && error && (
              <p className="text-sm text-destructive">Impossible de charger les communautés.</p>
            )}
            {!loading && suggestions.map((c) => (
              <Link key={c.id} to="/communities/$id" params={{ id: c.id }}>
                <Card className="h-full p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-calm)] focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <p className="font-display font-semibold">{c.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Ressources bien-être</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <ResourceCard icon={<Sparkles className="h-5 w-5" />} title="Respiration 4-7-8" desc="3 minutes pour calmer l'anxiété." />
            <ResourceCard icon={<BookOpen className="h-5 w-5" />} title="Comprendre l'anxiété" desc="Repères simples pour mieux la traverser." />
            <ResourceCard icon={<Sparkles className="h-5 w-5" />} title="Ancrage 5-4-3-2-1" desc="Revenir au présent en quelques instants." />
          </div>
        </section>
    </AppShell>
  );
}

function ResourceCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">{icon}</div>
      <p className="font-display font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}