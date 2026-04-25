import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { BloomGlyph, ShieldHeartGlyph } from "@/components/icons/MindIcons";
import { ArrowRight } from "lucide-react";

type SignupSearch = { as?: "patient" | "expert" };

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>): SignupSearch => ({
    as: s.as === "patient" ? "patient" : s.as === "expert" ? "expert" : undefined,
  }),
  component: SignupChoice,
});

function SignupChoice() {
  const navigate = useNavigate();
  const { as } = Route.useSearch();

  // Backwards-compat: if someone lands on /signup?as=patient|expert, redirect them.
  useEffect(() => {
    if (as === "patient") navigate({ to: "/signup/patient", replace: true });
    else if (as === "expert") navigate({ to: "/signup/expert", replace: true });
  }, [as, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[600px] opacity-60"
        style={{ backgroundImage: "var(--gradient-aurora)" }}
      />
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block text-xs font-medium uppercase tracking-[0.2em] text-secondary">
            Bienvenue
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">
            Comment souhaitez-vous{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-calm)" }}
            >
              rejoindre PsyConnect ?
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Choisissez le parcours qui vous correspond. Vous pourrez toujours changer plus tard.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          <ChoiceCard
            to="/signup/patient"
            icon={<BloomGlyph size={36} />}
            tone="primary"
            title="Je cherche du soutien"
            subtitle="Patient"
            desc="Parlez à PsyBot, trouvez un expert, prenez soin de votre bien-être mental."
            features={["PsyBot illimité", "Annuaire d'experts validés", "Anonymat possible"]}
          />
          <ChoiceCard
            to="/signup/expert"
            icon={<ShieldHeartGlyph size={36} />}
            tone="secondary"
            title="Je suis un professionnel"
            subtitle="Expert"
            desc="Psychologue, psychiatre ou coach ? Rejoignez notre annuaire vérifié."
            features={["Profil pro vérifié", "Mises en relation", "Outils dédiés"]}
          />
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Déjà inscrit·e ?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

function ChoiceCard({
  to,
  icon,
  tone,
  title,
  subtitle,
  desc,
  features,
}: {
  to: "/signup/patient" | "/signup/expert";
  icon: React.ReactNode;
  tone: "primary" | "secondary";
  title: string;
  subtitle: string;
  desc: string;
  features: string[];
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary ring-primary/20"
      : "bg-secondary/15 text-secondary ring-secondary/20";
  return (
    <Link
      to={to}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-calm)]"
    >
      <div
        aria-hidden
        className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
        style={{
          background:
            tone === "primary" ? "var(--gradient-calm)" : "var(--gradient-sage)",
        }}
      />
      <div
        className={`relative inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${toneClass}`}
      >
        {icon}
      </div>
      <p className="relative mt-6 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {subtitle}
      </p>
      <h2 className="relative mt-1 font-display text-2xl font-semibold md:text-3xl">
        {title}
      </h2>
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">
        {desc}
      </p>
      <ul className="relative mt-5 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  tone === "primary"
                    ? "var(--primary)"
                    : "var(--secondary)",
              }}
            />
            {f}
          </li>
        ))}
      </ul>
      <div className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
        Continuer
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}