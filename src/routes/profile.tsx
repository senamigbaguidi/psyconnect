import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopTabs } from "@/components/TopTabs";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Users } from "lucide-react";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, roles, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ communities: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("community_members").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      .then(({ count }) => setStats({ communities: count ?? 0 }));
  }, [user]);

  const profileType = roles.includes("admin") ? "Administrateur"
    : roles.includes("expert") ? "Professionnel" : "Standard";

  return (
    <div className="min-h-screen bg-background">
      <TopTabs />
      <main className="container mx-auto max-w-3xl px-4 py-10">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30" />
          <div className="-mt-10 px-6 pb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-primary text-2xl font-semibold text-primary-foreground">
              {(profile?.first_name?.[0] ?? "?").toUpperCase()}
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold">
              {profile?.is_anonymous ? "Anonyme" : `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`}
            </h1>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {profileType}
            </span>
          </div>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Communautés rejointes</p>
                <p className="text-2xl font-semibold">{stats.communities}</p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Langue</p>
            <p className="mt-1 text-base font-medium">{profile?.preferred_language?.toUpperCase()}</p>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" disabled>
            <Settings className="h-4 w-4" /> Paramètres
          </Button>
          <Button
            variant="destructive"
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </main>
    </div>
  );
}