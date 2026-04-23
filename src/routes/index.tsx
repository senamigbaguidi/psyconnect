import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Heart, ShieldCheck, Sparkles, MessageCircle, Clock, Users, Star, ArrowRight, Lock, Phone, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero — emotional + clear CTA */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 15% 10%, var(--primary) 0, transparent 45%), radial-gradient(ellipse at 85% 50%, var(--accent) 0, transparent 50%), radial-gradient(ellipse at 50% 95%, var(--secondary) 0, transparent 45%)",
          }}
        />
        <div className="container relative mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
              </span>
              PsyBot disponible maintenant — gratuit
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl lg:text-[5.5rem]">
              Quand le poids devient trop lourd,{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-warm)" }}>
                quelqu'un est là.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Parlez à PsyBot — une oreille bienveillante, sans jugement, à toute heure.
              Et quand vous serez prêt·e, mettez-vous en relation avec un expert validé près de chez vous.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-14 px-8 text-base shadow-[var(--shadow-warm)]">
                <Link to="/signup" search={{ as: "patient" }}>
                  <MessageCircle className="mr-1 h-5 w-5" />
                  Commencer gratuitement
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base">
                <Link to="/signup" search={{ as: "expert" }}>
                  Je suis un professionnel
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-secondary" /> Sans carte bancaire</span>
              <span className="inline-flex items-center gap-1.5"><Lock className="h-4 w-4 text-secondary" /> 100 % confidentiel</span>
              <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4 text-secondary" /> Anonyme si vous voulez</span>
            </div>
          </div>

          {/* Conversation preview mockup */}
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-warm)]">
              <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--gradient-warm)" }}>
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display text-base font-semibold">PsyBot</p>
                  <p className="text-xs text-muted-foreground">En ligne · répond en quelques secondes</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    Je n'arrive plus à dormir depuis une semaine…
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-sm">
                    Je vous entends. Une semaine sans sommeil, c'est épuisant — physiquement et émotionnellement.
                    Voulez-vous me parler de ce qui occupe vos pensées le soir ?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border/60 bg-muted/30 py-8">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 md:grid-cols-4">
          <Stat icon={<Users className="h-5 w-5" />} value="120+" label="Experts validés" />
          <Stat icon={<MessageCircle className="h-5 w-5" />} value="3 200" label="Conversations / mois" />
          <Stat icon={<Clock className="h-5 w-5" />} value="24h/24" label="Disponibilité PsyBot" />
          <Stat icon={<Star className="h-5 w-5" />} value="4.8/5" label="Satisfaction patients" />
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium uppercase tracking-widest text-secondary">Comment ça marche</span>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">3 étapes vers le mieux-être</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Step n="01" title="Vous parlez à PsyBot" desc="Décrivez ce que vous ressentez, en français, anglais, fon ou goun. PsyBot écoute, reformule et propose des techniques simples." />
          <Step n="02" title="Recommandation personnalisée" desc="Selon votre situation, PsyBot vous oriente vers le type d'expert adapté : psychologue, psychiatre, coach…" />
          <Step n="03" title="Vous prenez contact" desc="Consultez les profils des experts validés, leurs tarifs, et démarrez un échange privé en quelques clics." />
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-medium uppercase tracking-widest text-secondary">Pourquoi PsyConnect</span>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Pensé pour l'Afrique de l'Ouest</h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="Écoute IA bienveillante" desc="PsyBot vous accueille à toute heure, dans votre langue, avec patience et empathie." tone="primary" />
            <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Experts validés à la main" desc="Chaque psychologue, psychiatre ou coach est vérifié manuellement par notre équipe — diplôme à l'appui." tone="secondary" />
            <FeatureCard icon={<Lock className="h-5 w-5" />} title="Confidentiel & anonyme" desc="Vos conversations sont chiffrées. Restez anonyme face aux experts si vous le souhaitez." tone="accent" />
            <FeatureCard icon={<Phone className="h-5 w-5" />} title="Bouton SOS d'urgence" desc="En cas de crise, accès direct aux lignes d'écoute locales (136 au Bénin, 3114 en France…)." tone="primary" />
            <FeatureCard icon={<Heart className="h-5 w-5" />} title="Multilingue" desc="Français, anglais, fon, goun. Parlez la langue dans laquelle vous êtes vous-même." tone="secondary" />
            <FeatureCard icon={<Users className="h-5 w-5" />} title="Mobile money" desc="Paiements via FedaPay et KKiaPay — pas besoin de carte bancaire." tone="accent" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-medium uppercase tracking-widest text-secondary">Ils ont essayé</span>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">Des témoignages qui comptent</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Testimonial quote="Pour la première fois, j'ai pu parler de mon anxiété sans avoir peur d'être jugée. PsyBot m'a aidée à mettre des mots, et l'experte qu'on m'a recommandée a été formidable." name="Aïcha, 27 ans" location="Cotonou" />
          <Testimonial quote="J'avais des nuits sans sommeil depuis des mois. En deux semaines de discussions et d'exercices guidés, j'ai retrouvé un équilibre." name="Komlan, 34 ans" location="Lomé" />
          <Testimonial quote="C'est rassurant de pouvoir parler en fon. Je me sens vraiment compris·e, dans ma langue, ma culture." name="Justine, 41 ans" location="Porto-Novo" />
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border p-10 text-center md:p-16" style={{ background: "var(--gradient-earth)" }}>
          <div className="relative mx-auto max-w-2xl text-primary-foreground">
            <h2 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
              Faites le premier pas, maintenant.
            </h2>
            <p className="mt-4 text-lg opacity-90">
              C'est gratuit, ça prend 30 secondes, et c'est peut-être la chose la plus importante que vous ferez aujourd'hui.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="h-14 px-8 text-base">
                <Link to="/signup" search={{ as: "patient" }}>
                  Commencer ma première conversation
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p className="font-display text-base text-foreground">PsyConnect</p>
          <p className="mt-2">© {new Date().getFullYear()} — Une oreille, un expert, à portée de cœur.</p>
          <p className="mt-1 text-xs">En cas d'urgence vitale, appelez le 136 (Bénin) ou les services d'urgence locaux.</p>
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

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-7">
      <span className="font-display text-5xl font-semibold text-primary/20">{n}</span>
      <h3 className="mt-2 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Testimonial({ quote, name, location }: { quote: string; name: string; location: string }) {
  return (
    <figure className="rounded-2xl border border-border bg-card p-7">
      <div className="flex gap-0.5 text-accent">
        {Array.from({ length: 5 }).map((_, i) => (<Star key={i} className="h-4 w-4 fill-current" />))}
      </div>
      <blockquote className="mt-3 text-base leading-relaxed">« {quote} »</blockquote>
      <figcaption className="mt-4 text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground"> · {location}</span>
      </figcaption>
    </figure>
  );
}
