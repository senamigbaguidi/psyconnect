import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Settings, Users, MessageCircle, BadgeCheck, Clock, XCircle } from "lucide-react";
import { useProfileStats } from "@/hooks/useDashboardData";

export const Route = createFileRoute("/profile")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, roles, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const stats = useProfileStats();

  const profileType = roles.includes("admin") ? "Administrateur"
    : roles.includes("expert") ? "Professionnel" : "Standard";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30" />
          <div className="-mt-10 px-6 pb-6">
            {authLoading || !profile ? (
              <>
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="mt-3 h-7 w-48" />
                <Skeleton className="mt-2 h-4 w-64" />
              </>
            ) : (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-primary text-2xl font-semibold text-primary-foreground">
                  {(profile.first_name?.[0] ?? "?").toUpperCase()}
                </div>
                <h1 className="mt-3 font-display text-2xl font-semibold">
                  {profile.is_anonymous ? "Anonyme" : `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || "Utilisateur"}
                </h1>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {profileType}
                </span>
              </>
            )}
          </div>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Users className="h-5 w-5 text-primary" />} label="Communautés" value={stats.loading ? null : stats.communities} />
          <StatCard icon={<MessageCircle className="h-5 w-5 text-primary" />} label="Conversations" value={stats.loading ? null : stats.conversations} />
          <Card className="p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Langue</p>
            <p className="mt-1 text-base font-medium">{profile?.preferred_language?.toUpperCase() ?? "FR"}</p>
          </Card>
        </div>

        {stats.expertStatus && stats.expertStatus !== "approved" && (
          <Card className="mt-6 p-5">
            <div className="flex items-start gap-3">
              {stats.expertStatus === "pending" ? (
                <Clock className="h-5 w-5 text-secondary" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-medium">
                  {stats.expertStatus === "pending" ? "Candidature expert en cours d'examen" : "Candidature expert refusée"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stats.expertStatus === "pending"
                    ? "Notre équipe valide votre dossier. Vous serez notifié dès la décision."
                    : "Vous pouvez soumettre une nouvelle candidature."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {stats.expertStatus === "approved" && roles.includes("expert") && (
          <Card className="mt-6 p-5">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <p className="font-medium">Compte professionnel validé</p>
            </div>
          </Card>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/dashboard"><Settings className="h-4 w-4" /> Tableau de bord</Link>
          </Button>
          <Button
            variant="destructive"
            aria-label="Se déconnecter"
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          {value === null ? (
            <Skeleton className="mt-1 h-7 w-10" />
          ) : (
            <p className="text-2xl font-semibold">{value}</p>
          )}
        </div>
      </div>
    </Card>
  );
}