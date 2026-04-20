import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, var(--primary) 0, transparent 40%), radial-gradient(circle at 80% 60%, var(--accent) 0, transparent 45%), radial-gradient(circle at 50% 90%, var(--secondary) 0, transparent 40%)",
          }}
        />
        <div className="container relative mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Heart className="h-3.5 w-3.5 text-primary" />
              {t("tagline")}
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              {t("home.heroSub")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-7 text-base shadow-lg">
                <Link to="/signup" search={{ as: "patient" }}>{t("home.ctaPatient")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
                <Link to="/signup" search={{ as: "expert" }}>{t("home.ctaExpert")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title={t("home.f1Title")}
            desc={t("home.f1Desc")}
            tone="primary"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t("home.f2Title")}
            desc={t("home.f2Desc")}
            tone="secondary"
          />
          <FeatureCard
            icon={<Heart className="h-5 w-5" />}
            title={t("home.f3Title")}
            desc={t("home.f3Desc")}
            tone="accent"
          />
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PsyConnect — {t("tagline")}
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon, title, desc, tone,
}: { icon: React.ReactNode; title: string; desc: string; tone: "primary" | "secondary" | "accent" }) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/30 text-accent-foreground",
  }[tone];
  return (
    <div className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-warm)]">
      <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${toneClass}`}>
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}
