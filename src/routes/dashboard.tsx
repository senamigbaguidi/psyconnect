import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { BookOpen, Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  BrainGlyph,
  NeuronGlyph,
  DialogueGlyph,
  BloomGlyph,
  PulseGlyph,
} from "@/components/icons/MindIcons";

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
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[400px] opacity-50"
        style={{ backgroundImage: "var(--gradient-aurora)" }}
      />
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Espace patient
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold md:text-5xl">
          Bonjour {name || "à vous"} 🌿
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Comment vous sentez-vous aujourd'hui ? Prenez un instant pour vous.
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
          <ActionCard icon={<BrainGlyph size={24} />} title="Parler à PsyBot" desc="Une oreille bienveillante, à toute heure." to="/chat" />
          <ActionCard icon={<NeuronGlyph size={24} />} title="Trouver un expert" desc="Annuaire de pros validés près de chez vous." to="/experts" />
          <ActionCard icon={<DialogueGlyph size={24} />} title="Fil de publications" desc="Articles & conseils des professionnels." to="/feed" />
          <SoonCard icon={<BookOpen className="h-5 w-5" />} title="Journal" desc="Écrivez vos pensées en toute sécurité." />
          <SoonCard icon={<BloomGlyph size={24} />} title="Exercices guidés" desc="Respiration, ancrage, méditation." />
          <SoonCard icon={<PulseGlyph size={24} />} title="Suivi d'humeur" desc="Suivez votre état au quotidien." />
        </div>

        <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-destructive">En crise ? Vous n'êtes pas seul·e.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Appelez le <strong>136</strong> au Bénin, le <strong>3114</strong> en France,
                ou les services d'urgence locaux. Une voix humaine vous écoutera.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  useEffect(() => { navigate({ to: "/admin/experts" }); }, [navigate]);
  return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
}

function SoonCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="relative p-6 opacity-80 transition-all hover:opacity-100">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border">
        {icon}
      </div>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <span className="absolute right-4 top-4 rounded-full bg-accent/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
        Bientôt
      </span>
    </Card>
  );
}

function ActionCard({
  icon, title, desc, to,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  to: "/experts" | "/feed" | "/chat";
}) {
  return (
    <Link to={to} className="block">
      <Card className="group relative h-full overflow-hidden p-6 transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-calm)]">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
          {icon}
        </div>
        <p className="font-display text-lg font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        <span className="mt-3 inline-block text-xs font-medium uppercase tracking-wider text-primary">
          Disponible →
        </span>
      </Card>
    </Link>
  );
}