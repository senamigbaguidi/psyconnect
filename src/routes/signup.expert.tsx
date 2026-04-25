import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { ShieldHeartGlyph } from "@/components/icons/MindIcons";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { FileUpload, type FileUploadStatus } from "@/components/FileUpload";

export const Route = createFileRoute("/signup/expert")({
  component: ExpertSignup,
});

function ExpertSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    expertType: "psychologue" as "psychiatre" | "psychologue" | "coach" | "autre",
    description: "",
    cabinet: "",
    address: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [diploma, setDiploma] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<FileUploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateStep1 = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      toast.error("Merci de remplir tous les champs.");
      return false;
    }
    if (form.password.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères.");
      return false;
    }
    return true;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!diploma) {
      toast.error("Veuillez joindre votre diplôme.");
      return;
    }
    setLoading(true);

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          preferred_language: "fr",
          requested_role: "expert",
        },
      },
    });
    if (signUpErr || !signUpData.user) {
      setLoading(false);
      toast.error(signUpErr?.message ?? "Une erreur est survenue");
      return;
    }
    const userId = signUpData.user.id;
    if (!signUpData.session) {
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
    }
    const ext = diploma.name.split(".").pop() ?? "bin";
    const path = `${userId}/diploma-${Date.now()}.${ext}`;
    setUploadStatus("uploading");
    setUploadProgress(10);
    // Simulate progress (Supabase JS SDK doesn't expose granular progress).
    const tick = setInterval(() => {
      setUploadProgress((p) => (p < 85 ? p + 8 : p));
    }, 250);
    const { error: upErr } = await supabase.storage
      .from("diplomas")
      .upload(path, diploma, { upsert: true });
    clearInterval(tick);
    if (upErr) {
      setUploadStatus("error");
      setLoading(false);
      toast.error(upErr.message);
      return;
    }
    setUploadProgress(100);
    setUploadStatus("done");

    const { error: appErr } = await supabase.from("expert_applications").insert({
      user_id: userId,
      expert_type: form.expertType,
      description: form.description,
      cabinet_name: form.cabinet || null,
      address: form.address,
      diploma_path: path,
    });
    setLoading(false);
    if (appErr) {
      toast.error(appErr.message);
      return;
    }
    toast.success("Dossier envoyé. Vous serez notifié après validation.");
    navigate({ to: "/login" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[700px] opacity-60"
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
          {/* Left side */}
          <aside className="hidden md:block">
            <div className="sticky top-24">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/15 text-secondary ring-1 ring-secondary/25">
                <ShieldHeartGlyph size={36} />
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight">
                Rejoignez un{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "var(--gradient-sage)" }}
                >
                  réseau de confiance.
                </span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Votre dossier sera examiné manuellement par notre équipe. Une
                fois validé, vous apparaîtrez dans l'annuaire et recevrez les
                demandes de mise en relation.
              </p>
              <ol className="mt-8 space-y-4 text-sm">
                {[
                  ["1", "Identité", "Vos informations personnelles"],
                  ["2", "Pratique", "Votre profil professionnel & diplôme"],
                  ["3", "Validation", "Examen manuel sous 48h"],
                ].map(([n, t, d]) => (
                  <li key={n} className="flex gap-4">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-secondary/15 font-display text-sm font-semibold text-secondary">
                      {n}
                    </span>
                    <div>
                      <p className="font-medium">{t}</p>
                      <p className="text-xs text-muted-foreground">{d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>

          {/* Right side — multi-step form */}
          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)] md:p-10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-secondary">
                Inscription expert · Étape {step}/2
              </p>
              <div className="flex gap-1.5">
                <span
                  className={`h-1.5 w-10 rounded-full transition-colors ${step >= 1 ? "bg-secondary" : "bg-muted"}`}
                />
                <span
                  className={`h-1.5 w-10 rounded-full transition-colors ${step >= 2 ? "bg-secondary" : "bg-muted"}`}
                />
              </div>
            </div>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              {step === 1 ? "Votre identité" : "Votre pratique"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 1
                ? "Ces informations restent privées."
                : "Ces informations apparaîtront sur votre profil public."}
            </p>

            {step === 1 ? (
              <div className="mt-7 space-y-4">
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
                  label="Email professionnel"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  required
                />
                <Field
                  label="Téléphone"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  required
                />
                <div className="space-y-2">
                  <Label htmlFor="exp-pwd">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="exp-pwd"
                      type={showPwd ? "text" : "password"}
                      minLength={8}
                      className="h-11 pr-10"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                  type="button"
                  className="h-12 w-full text-base shadow-[var(--shadow-calm)]"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                >
                  Continuer
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-7 space-y-4">
                <div className="space-y-2">
                  <Label>Type de profil</Label>
                  <Select
                    value={form.expertType}
                    onValueChange={(v) =>
                      setForm({ ...form, expertType: v as typeof form.expertType })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychiatre">Psychiatre</SelectItem>
                      <SelectItem value="psychologue">Psychologue</SelectItem>
                      <SelectItem value="coach">Coach motivateur</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description de votre pratique</Label>
                  <Textarea
                    required
                    rows={4}
                    placeholder="Spécialités, approche thérapeutique, années d'expérience…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <Field
                  label="Nom du cabinet (optionnel)"
                  value={form.cabinet}
                  onChange={(v) => setForm({ ...form, cabinet: v })}
                />
                <Field
                  label="Adresse"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  required
                />
                <div className="space-y-2">
                  <Label htmlFor="diploma">Diplôme ou attestation</Label>
                  <FileUpload
                    id="diploma"
                    accept="application/pdf,image/*"
                    required
                    label="Téléverser votre diplôme"
                    helper="PDF ou image (jusqu'à 8 Mo). Les images sont automatiquement optimisées."
                    status={uploadStatus}
                    progress={uploadProgress}
                    onFileChange={setDiploma}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 flex-[2] text-base shadow-[var(--shadow-calm)]"
                    disabled={loading}
                  >
                    {loading ? "Envoi…" : "Soumettre mon dossier"}
                  </Button>
                </div>
              </form>
            )}

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