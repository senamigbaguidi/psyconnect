import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Heart, Sparkles, BookOpen, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const { user, profile, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
  }

  if (roles.includes("admin")) return <AdminDashboard />;
  if (roles.includes("expert")) return <ExpertRedirect />;
  return <PatientDashboard name={profile?.is_anonymous ? "" : (profile?.first_name ?? "")} userId={user.id} />;
}

function ExpertRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to: "/expert" }); }, [navigate]);
  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
}

function PatientDashboard({ name, userId }: { name: string; userId: string }) {
  const [pendingExpert, setPendingExpert] = useState<null | { status: string; rejection_reason: string | null }>(null);

  useEffect(() => {
    supabase.from("expert_applications").select("status,rejection_reason").eq("user_id", userId).maybeSingle()
      .then(({ data }) => setPendingExpert(data));
  }, [userId]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-semibold">Espace patient</h1>
        <p className="mt-2 text-muted-foreground">
          Bonjour {name || "🌿"}, comment vous sentez-vous aujourd'hui ?
        </p>

        {pendingExpert?.status === "pending" && (
          <Card className="mt-6 border-accent/40 bg-accent/10 p-5">
            <p className="font-medium">Dossier en attente de validation</p>
            <p className="text-sm text-muted-foreground">Notre équipe examine votre dossier. Vous serez notifié par email.</p>
          </Card>
        )}
        {pendingExpert?.status === "rejected" && (
          <Card className="mt-6 border-destructive/40 bg-destructive/10 p-5">
            <p className="font-medium">Dossier rejeté</p>
            {pendingExpert.rejection_reason && (
              <p className="text-sm text-muted-foreground">Motif : {pendingExpert.rejection_reason}</p>
            )}
          </Card>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <SoonCard icon={<Sparkles />} title="PsyBot" />
          <SoonCard icon={<BookOpen />} title="Journal" />
          <SoonCard icon={<Heart />} title="Exercices" />
          <SoonCard icon={<Phone />} title="SOS" tone="destructive" />
        </div>
      </main>
    </div>
  );
}

function ExpertDashboard({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-semibold">Espace expert</h1>
        <p className="mt-2 text-muted-foreground">Bonjour {name}.</p>
        <Card className="mt-8 p-8 text-center text-muted-foreground">Bientôt disponible</Card>
      </main>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to: "/admin/experts" }); }, [navigate]);
  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
}

function SoonCard({ icon, title, tone }: { icon: React.ReactNode; title: string; tone?: "destructive" }) {
  const cls = tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
  return (
    <Card className="p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-warm)]">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${cls}`}>{icon}</div>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Bientôt disponible</p>
    </Card>
  );
}