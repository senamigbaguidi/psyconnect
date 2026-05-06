import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopTabs } from "@/components/TopTabs";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search as SearchIcon, Users, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [communities, setCommunities] = useState<{ id: string; name: string; description: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; first_name: string; last_name: string }[]>([]);

  useEffect(() => {
    if (!q.trim()) { setCommunities([]); setUsers([]); return; }
    const t = setTimeout(async () => {
      const [{ data: c }, { data: u }] = await Promise.all([
        supabase.from("communities").select("id,name,description").ilike("name", `%${q}%`).limit(10),
        supabase.from("profiles").select("id,first_name,last_name").or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`).limit(10),
      ]);
      setCommunities((c as any) ?? []);
      setUsers((u as any) ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="min-h-screen bg-background">
      <TopTabs />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Rechercher</h1>
        <div className="relative mt-4">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Communautés, utilisateurs, ressources..."
            aria-label="Recherche"
            className="pl-9 h-11"
          />
        </div>

        {communities.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Communautés</h2>
            <div className="mt-3 space-y-2">
              {communities.map((c) => (
                <Link key={c.id} to="/communities/$id" params={{ id: c.id }}>
                  <Card className="flex items-center gap-3 p-3 hover:bg-accent/40">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{c.description}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {users.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Utilisateurs</h2>
            <div className="mt-3 space-y-2">
              {users.map((u) => (
                <Card key={u.id} className="flex items-center gap-3 p-3">
                  <UserIcon className="h-5 w-5 text-secondary" />
                  <p className="font-medium">{u.first_name} {u.last_name}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {q && communities.length === 0 && users.length === 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">Aucun résultat.</p>
        )}
      </main>
    </div>
  );
}