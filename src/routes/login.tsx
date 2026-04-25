import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";
import { LotusGlyph, PsyConnectMark } from "@/components/icons/MindIcons";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-70"
        style={{ backgroundImage: "var(--gradient-aurora)" }}
      />
      <SiteHeader />
      <div className="container mx-auto flex items-center justify-center px-4 py-12 md:py-20">
        <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
          {/* Left — emotional welcome */}
          <aside className="hidden md:block">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/30 text-accent-foreground ring-1 ring-accent/40">
              <LotusGlyph size={36} />
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-tight">
              Heureux de vous{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-calm)" }}
              >
                revoir.
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Reprenez là où vous vous étiez arrêté·e. Votre espace est resté
              à l'écoute, prêt à accueillir vos pensées.
            </p>
            <blockquote className="mt-10 border-l-2 border-secondary pl-4 font-display text-lg italic text-muted-foreground">
              « Le voyage de mille lieues commence par un seul pas. »
              <footer className="mt-2 text-xs not-italic text-muted-foreground/70">— Lao Tseu</footer>
            </blockquote>
          </aside>

          {/* Right — form */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
            <div className="md:hidden mb-6 flex items-center gap-2">
              <PsyConnectMark size={32} />
              <span className="font-display text-xl font-semibold">PsyConnect</span>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
              Connexion
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              Accéder à mon espace
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Saisissez vos identifiants.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary"
                    onClick={() =>
                      toast.info("La réinitialisation arrive bientôt.")
                    }
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    required
                    className="h-11 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="Toggle password"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="h-12 w-full text-base shadow-[var(--shadow-calm)]"
                disabled={loading}
              >
                {loading ? "Connexion…" : "Se connecter"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}