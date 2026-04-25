import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteHeader } from "@/components/SiteHeader";
import { BloomGlyph } from "@/components/icons/MindIcons";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup/patient")({
  component: PatientSignup,
});

function PatientSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    anonymous: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          is_anonymous: form.anonymous,
          preferred_language: "fr",
          requested_role: "patient",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bienvenue ! Découvrons PsyConnect ensemble.");
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[700px] opacity-70"
        style={{ backgroundImage: "var(--gradient-aurora)" }}
      />
      <SiteHeader />
      <div className="container mx-auto px-4 py-10">
        <Link
          to="/signup"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au choix
        </Link>

        <div className="mx-auto mt-8 grid w-full max-w-5xl items-start gap-10 md:grid-cols-[1fr_1.1fr]">
          {/* Left side — illustration & promise */}
          <aside className="hidden md:block">
            <div className="sticky top-24">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <BloomGlyph size={36} />
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight">
                Un espace pour{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "var(--gradient-calm)" }}
                >
                  respirer.
                </span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Rejoignez une communauté bienveillante. Parlez librement à PsyBot
                et accédez à des experts validés quand vous en avez besoin.
              </p>
              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "100 % confidentiel & chiffré",
                  "Accessible 24h/24, en plusieurs langues",
                  "Anonymat total possible",
                  "Sans engagement, sans carte bancaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="inline-block h-2 w-2 rounded-full bg-secondary"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right side — form */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
              Inscription patient
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              Créer mon compte
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quelques secondes suffisent.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Prénom"
                  value={form.firstName}
                  onChange={(v) => setForm({ ...form, firstName: v })}
                  required
                />
                <Field
                  label="Nom"
                  value={form.lastName}
                  onChange={(v) => setForm({ ...form, lastName: v })}
                  required
                />
              </div>
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
              />
              <Field
                label="Téléphone (optionnel)"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <div className="space-y-2">
                <Label htmlFor="pwd">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="pwd"
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    className="h-11 pr-10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
                <Checkbox
                  checked={form.anonymous}
                  onCheckedChange={(c) => setForm({ ...form, anonymous: !!c })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Rester anonyme face aux experts.</span>
                  <span className="block text-xs text-muted-foreground">
                    Votre nom ne sera pas partagé lors des mises en relation.
                  </span>
                </span>
              </label>
              <Button
                type="submit"
                className="h-12 w-full text-base shadow-[var(--shadow-calm)]"
                disabled={loading}
              >
                {loading ? "Création…" : "Créer mon compte"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                En continuant, vous acceptez nos conditions d'utilisation et
                notre politique de confidentialité.
              </p>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Déjà un compte ?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        className="h-11"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}