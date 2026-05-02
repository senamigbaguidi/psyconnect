import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
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
  const location = useLocation();
  const { as } = Route.useSearch();
  const isChoiceRoute = location.pathname === "/signup";

  // Backwards-compat: if someone lands on /signup?as=patient|expert, redirect them.
  useEffect(() => {
    if (!isChoiceRoute) return;
    if (as === "patient") navigate({ to: "/signup/patient", replace: true });
    else if (as === "expert") navigate({ to: "/signup/expert", replace: true });
  }, [as, isChoiceRoute, navigate]);

  if (!isChoiceRoute) {
    return <Outlet />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ backgroundImage: "var(--gradient-aurora)" }}
      />
      <SiteHeader />
      <div className="container mx-auto px-4 py-10 md:py-16">
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

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:gap-6 md:grid-cols-2">
          <ChoiceCard
            to="/signup/patient"
            icon={<BloomGlyph size={36} />}
            tone="primary"
            title="Je cherche du soutien"
            subtitle="Patient"
            desc="Parlez à PsyBot, trouvez un expert, prenez soin de votre bien-être mental."
            features={["PsyBot illimité", "Annuaire d'experts validés", "Anonymat possible"]}
            ctaLabel="Créer un compte patient"
          />
          <ChoiceCard
            to="/signup/expert"
            icon={<ShieldHeartGlyph size={36} />}
            tone="secondary"
            title="Je suis un professionnel"
            subtitle="Expert"
            desc="Psychologue, psychiatre ou coach ? Rejoignez notre annuaire vérifié."
            features={["Profil pro vérifié", "Mises en relation", "Outils dédiés"]}
            ctaLabel="Postuler comme expert"
          />
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
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
  ctaLabel,
}: {
  to: "/signup/patient" | "/signup/expert";
  icon: React.ReactNode;
  tone: "primary" | "secondary";
  title: string;
  subtitle: string;
  desc: string;
  features: string[];
  ctaLabel: string;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/10 text-primary ring-primary/20"
      : "bg-secondary/15 text-secondary ring-secondary/20";
  return (
    <Link
      to={to}
      aria-label={`${title} — ${ctaLabel}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 p-6 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-calm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-8"
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
      <span
        className={`relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-[var(--shadow-calm)] transition-transform group-hover:scale-[1.02] ${
          tone === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        }`}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}