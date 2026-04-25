import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Check, MessageCircleHeart, LifeBuoy, NotebookPen } from "lucide-react";
import { BloomGlyph } from "@/components/icons/MindIcons";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const STEPS = [
  {
    icon: MessageCircleHeart,
    title: "Parlez à PsyBot, sans jugement",
    desc: "Notre assistant d'écoute est disponible 24h/24. Confiez-lui ce que vous traversez en français, anglais, fon ou goun. Il vous proposera des techniques simples et pourra vous orienter vers un expert humain.",
    cta: "Découvrir le chat",
    href: "/chat",
  },
  {
    icon: LifeBuoy,
    title: "Bouton SOS en cas d'urgence",
    desc: "À tout moment, le bouton SOS en haut de l'écran affiche les numéros d'aide locaux et les ressources d'urgence. Vous n'êtes jamais seul·e.",
    cta: "Voir les ressources SOS",
    href: "/dashboard",
  },
  {
    icon: NotebookPen,
    title: "Votre journal émotionnel",
    desc: "Notez ce que vous ressentez, suivez votre humeur dans le temps et identifiez ce qui vous aide. Le journal reste 100% privé — visible uniquement par vous.",
    cta: "Commencer mon journal",
    href: "/dashboard",
  },
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login", replace: true });
  }, [loading, session, navigate]);

  const next = () => {
    setDone((d) => {
      const copy = [...d];
      copy[step] = true;
      return copy;
    });
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else navigate({ to: "/dashboard" });
  };

  const skip = () => navigate({ to: "/dashboard" });

  const Current = STEPS[step];
  const Icon = Current.icon;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[600px] opacity-70"
        style={{ backgroundImage: "var(--gradient-aurora)" }}
      />
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 md:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <BloomGlyph size={28} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
                Bienvenue
              </p>
              <h1 className="font-display text-2xl font-semibold md:text-3xl">
                Faisons connaissance en 3 étapes
              </h1>
            </div>
          </div>

          {/* Progress dots */}
          <ol
            className="mb-8 grid grid-cols-3 gap-3"
            aria-label={`Étape ${step + 1} sur ${STEPS.length}`}
          >
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-semibold ring-1 ${
                    done[i]
                      ? "bg-secondary text-secondary-foreground ring-secondary/40"
                      : i === step
                        ? "bg-primary text-primary-foreground ring-primary/40"
                        : "bg-muted text-muted-foreground ring-border"
                  }`}
                  aria-current={i === step ? "step" : undefined}
                >
                  {done[i] ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                </span>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    i === step ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {i === 0 ? "PsyBot" : i === 1 ? "SOS" : "Journal"}
                </span>
              </li>
            ))}
          </ol>
          <div className="mb-8 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <article className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold md:text-3xl">
              {Current.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {Current.desc}
            </p>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={skip}
                className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Passer
              </Button>
              <div className="flex gap-3">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    Précédent
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={next}
                  className="shadow-[var(--shadow-calm)]"
                >
                  {step < STEPS.length - 1 ? (
                    <>
                      Suivant
                      <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                    </>
                  ) : (
                    "Commencer"
                  )}
                </Button>
              </div>
            </div>
          </article>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link
              to={Current.href}
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Aperçu rapide : {Current.cta}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}