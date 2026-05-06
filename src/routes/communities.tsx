import { createFileRoute, Link, Outlet, useLocation, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopTabs } from "@/components/TopTabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCanCreateCommunity } from "@/hooks/useCommunityPermissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Lock } from "lucide-react";

export const Route = createFileRoute("/communities")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: CommunitiesLayout,
});

function CommunitiesLayout() {
  const location = useLocation();
  // Sous-route active → laisser l'enfant rendre son propre layout
  if (location.pathname !== "/communities") return <Outlet />;
  return <CommunitiesListScreen />;
}

interface Community {
  id: string; name: string; description: string; image_url: string | null; creator_id: string;
}

function CommunitiesListScreen() {
  const { user } = useAuth();
  const canCreate = useCanCreateCommunity();
  const [joined, setJoined] = useState<Community[]>([]);
  const [suggestions, setSuggestions] = useState<Community[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: members } = await supabase
        .from("community_members").select("community_id").eq("user_id", user.id);
      const joinedIds = new Set((members ?? []).map((m: any) => m.community_id));

      const { data: all } = await supabase
        .from("communities").select("id,name,description,image_url,creator_id")
        .order("created_at", { ascending: false });
      const list = (all as Community[]) ?? [];
      setJoined(list.filter((c) => joinedIds.has(c.id)));
      setSuggestions(list.filter((c) => !joinedIds.has(c.id)));
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <TopTabs />
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold">Communautés</h1>
            <p className="text-sm text-muted-foreground">Échangez dans des espaces dédiés et bienveillants.</p>
          </div>
          {/* Bouton de création visible seulement pour admin/expert */}
          {canCreate ? (
            <Button asChild>
              <Link to="/communities/new"><Plus className="h-4 w-4" /> Créer une communauté</Link>
            </Button>
          ) : (
            <Button variant="outline" disabled title="Réservé aux professionnels et administrateurs">
              <Lock className="h-4 w-4" /> Création réservée aux pros
            </Button>
          )}
        </div>

        <Section title="Mes communautés" items={joined} empty="Vous n'avez encore rejoint aucune communauté." />
        <Section title="Suggestions" items={suggestions} empty="Aucune suggestion pour l'instant." />
      </main>
    </div>
  );
}

function Section({ title, items, empty }: { title: string; items: Community[]; empty: string }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link key={c.id} to="/communities/$id" params={{ id: c.id }}>
              <Card className="h-full p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-calm)]">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <p className="font-display font-semibold">{c.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}