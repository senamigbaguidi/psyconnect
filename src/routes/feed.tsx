import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PostRow = {
  id: string;
  author_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  created_at: string;
};

type AuthorMap = Record<string, { display_name: string; subscription_tier: string }>;

export const Route = createFileRoute("/feed")({
  component: FeedPage,
});

function FeedPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [authors, setAuthors] = useState<AuthorMap>({});
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: postRows } = await supabase
        .from("posts")
        .select("id,author_id,title,content,excerpt,cover_image_url,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(50);
      const list = (postRows ?? []) as PostRow[];
      setPosts(list);

      const ids = Array.from(new Set(list.map((p) => p.author_id)));
      if (ids.length) {
        const { data: ex } = await supabase
          .from("expert_profiles")
          .select("user_id,display_name,subscription_tier")
          .in("user_id", ids);
        const map: AuthorMap = {};
        (ex ?? []).forEach((e) => {
          map[e.user_id] = { display_name: e.display_name, subscription_tier: e.subscription_tier };
        });
        setAuthors(map);
      }
      setBusy(false);
    })();
  }, [user]);

  // Boost premium: premium first
  const ordered = [...posts].sort((a, b) => {
    const ap = authors[a.author_id]?.subscription_tier === "premium" ? 1 : 0;
    const bp = authors[b.author_id]?.subscription_tier === "premium" ? 1 : 0;
    return bp - ap;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-4xl font-semibold">Fil de publications</h1>
        <p className="mt-2 text-muted-foreground">Articles et conseils de nos professionnels.</p>

        <div className="mt-8 space-y-5">
          {busy && <p className="text-muted-foreground">Chargement...</p>}
          {!busy && ordered.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">Aucune publication pour le moment.</Card>
          )}
          {ordered.map((p) => {
            const a = authors[p.author_id];
            return (
              <Card key={p.id} className="overflow-hidden">
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt={p.title} className="h-48 w-full object-cover" loading="lazy" />
                )}
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{a?.display_name ?? "Professionnel"}</span>
                    {a?.subscription_tier === "premium" && <Badge className="bg-primary text-primary-foreground">Premium</Badge>}
                    <span>· {new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-semibold">{p.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-foreground/90">
                    {p.excerpt ?? p.content.slice(0, 300) + (p.content.length > 300 ? "..." : "")}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}