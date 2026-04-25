import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  Star,
} from "lucide-react";
import {
  BrainGlyph,
  WaveGlyph,
  ShieldHeartGlyph,
  DialogueGlyph,
  BloomGlyph,
  NeuronGlyph,
  PulseGlyph,
  SunriseGlyph,
  LotusGlyph,
} from "@/components/icons/MindIcons";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: "var(--gradient-aurora)" }}
        />
        {/* floating glyphs */}
        <BrainGlyph
          aria-hidden
          className="absolute left-[6%] top-32 hidden text-primary/20 md:block"
          size={64}
        />
        <BloomGlyph
          aria-hidden
          className="absolute right-[8%] top-44 hidden text-secondary/25 md:block"
          size={72}
        />
        <WaveGlyph
          aria-hidden
          className="absolute bottom-10 left-[12%] hidden text-accent-foreground/20 md:block"
          size={56}
        />

        <div className="container relative mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
              </span>
              PsyBot disponible 24h/24 — gratuit
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl lg:text-[5.5rem]">
              Votre esprit mérite{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-calm)" }}
              >
                d'être écouté.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Parlez librement à PsyBot — une présence bienveillante, sans
              jugement. Quand vous êtes prêt·e, accédez à des experts validés
              dans votre langue.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 text-base shadow-[var(--shadow-calm)]"
              >
                <Link to="/signup">
                  Commencer gratuitement
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 border-secondary/40 px-8 text-base text-secondary hover:bg-secondary/10 hover:text-secondary"
              >
                <Link to="/signup">Je suis un professionnel</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-4 w-4 text-secondary" /> Sans carte bancaire
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldHeartGlyph size={16} /> 100 % confidentiel
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BloomGlyph size={16} /> Anonyme si vous voulez
              </span>
            </div>
          </div>

          {/* Conversation mockup */}
          <div className="mx-auto mt-16 max-w-2xl">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-calm)]">
              <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-primary-foreground"
                  style={{ background: "var(--gradient-calm)" }}
                >
                  <BrainGlyph size={22} />
                </div>
                <div>
                  <p className="font-display text-base font-semibold">PsyBot</p>
                  <p className="text-xs text-muted-foreground">
                    En ligne · répond en quelques secondes
                  </p>
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
                    Je vous entends. Une semaine sans sommeil, c'est épuisant.
                    Voulez-vous me parler de ce qui occupe vos pensées le soir ?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border/60 bg-muted/40 py-8">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 md:grid-cols-4">
          <Stat icon={<NeuronGlyph size={22} />} value="120+" label="Experts validés" />
          <Stat icon={<DialogueGlyph size={22} />} value="3 200" label="Conversations / mois" />
          <Stat icon={<PulseGlyph size={22} />} value="24h/24" label="Disponibilité PsyBot" />
          <Stat icon={<Star className="h-5 w-5" />} value="4.8/5" label="Satisfaction patients" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
            Comment ça marche
          </span>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            Trois étapes vers l'apaisement
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Step
            n="01"
            icon={<DialogueGlyph size={28} />}
            title="Vous parlez à PsyBot"
            desc="Décrivez ce que vous ressentez en français, anglais, fon ou goun. PsyBot écoute, reformule, propose des pistes."
          />
          <Step
            n="02"
            icon={<NeuronGlyph size={28} />}
            title="Recommandation personnalisée"
            desc="Selon votre situation, PsyBot vous oriente vers le type d'expert adapté : psychologue, psychiatre, coach…"
          />
          <Step
            n="03"
            icon={<SunriseGlyph size={28} />}
            title="Vous prenez contact"
            desc="Consultez les profils, tarifs, et démarrez un échange privé en quelques clics."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-muted/40 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
              Pourquoi PsyConnect
            </span>
            <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
              Conçu pour la santé mentale en Afrique
            </h2>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<BrainGlyph size={22} />}
              title="Écoute IA bienveillante"
              desc="PsyBot vous accueille à toute heure, dans votre langue, avec patience et empathie."
              tone="primary"
            />
            <FeatureCard
              icon={<ShieldHeartGlyph size={22} />}
              title="Experts validés à la main"
              desc="Chaque professionnel est vérifié manuellement, diplôme à l'appui."
              tone="secondary"
            />
            <FeatureCard
              icon={<LotusGlyph size={22} />}
              title="Confidentiel & anonyme"
              desc="Vos conversations sont chiffrées. Restez anonyme face aux experts."
              tone="accent"
            />
            <FeatureCard
              icon={<PulseGlyph size={22} />}
              title="SOS d'urgence"
              desc="En cas de crise, accès direct aux lignes d'écoute locales (136 au Bénin, 3114 en France)."
              tone="primary"
            />
            <FeatureCard
              icon={<WaveGlyph size={22} />}
              title="Multilingue"
              desc="Français, anglais, fon, goun — parlez la langue dans laquelle vous êtes vous-même."
              tone="secondary"
            />
            <FeatureCard
              icon={<BloomGlyph size={22} />}
              title="Mobile money"
              desc="Paiements via FedaPay et KKiaPay — pas besoin de carte bancaire."
              tone="accent"
            />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
            Ils ont franchi le pas
          </span>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            Des témoignages qui comptent
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Testimonial
            quote="Pour la première fois, j'ai pu parler de mon anxiété sans avoir peur d'être jugée. L'experte recommandée a été formidable."
            name="Aïcha, 27 ans"
            location="Cotonou"
          />
          <Testimonial
            quote="J'avais des nuits sans sommeil depuis des mois. En deux semaines, j'ai retrouvé un équilibre."
            name="Komlan, 34 ans"
            location="Lomé"
          />
          <Testimonial
            quote="Pouvoir parler en fon, c'est rassurant. Je me sens compris·e, dans ma langue, ma culture."
            name="Justine, 41 ans"
            location="Porto-Novo"
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container mx-auto px-4 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl border border-border p-10 text-center md:p-16"
          style={{ background: "var(--gradient-calm)" }}
        >
          <LotusGlyph
            aria-hidden
            className="absolute right-8 top-8 text-primary-foreground/20"
            size={120}
          />
          <div className="relative mx-auto max-w-2xl text-primary-foreground">
            <h2 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
              Faites le premier pas, maintenant.
            </h2>
            <p className="mt-4 text-lg opacity-90">
              C'est gratuit, ça prend 30 secondes, et c'est peut-être la chose
              la plus importante que vous ferez aujourd'hui.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-base"
              >
                <Link to="/signup">
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
          <p className="mt-2">
            © {new Date().getFullYear()} — Une oreille, un expert, à portée de cœur.
          </p>
          <p className="mt-1 text-xs">
            En cas d'urgence vitale, appelez le 136 (Bénin) ou les services
            d'urgence locaux.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tone: "primary" | "secondary" | "accent";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary ring-primary/20",
    secondary: "bg-secondary/15 text-secondary ring-secondary/20",
    accent: "bg-accent/40 text-accent-foreground ring-accent/40",
  }[tone];
  return (
    <div className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-calm)]">
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${toneClass}`}
      >
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
        {icon}
      </div>
      <div>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  desc,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-calm)]">
      <div className="flex items-start justify-between">
        <span className="font-display text-5xl font-semibold text-primary/20">
          {n}
        </span>
        <span className="text-secondary">{icon}</span>
      </div>
      <h3 className="mt-2 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  location,
}: {
  quote: string;
  name: string;
  location: string;
}) {
  return (
    <figure className="rounded-2xl border border-border bg-card p-7">
      <div className="flex gap-0.5 text-accent-foreground">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <blockquote className="mt-3 text-base leading-relaxed">
        « {quote} »
      </blockquote>
      <figcaption className="mt-4 text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground"> · {location}</span>
      </figcaption>
    </figure>
  );
}
