import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { toast } from "sonner";

type SignupSearch = { as?: "patient" | "expert" };

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>): SignupSearch => ({
    as: s.as === "expert" ? "expert" : "patient",
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<"patient" | "expert">(search.as ?? "patient");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <h1 className="font-display text-3xl font-semibold">Rejoignez PsyConnect</h1>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "patient" | "expert")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patient">Patient</TabsTrigger>
              <TabsTrigger value="expert">Expert</TabsTrigger>
            </TabsList>
            <TabsContent value="patient" className="mt-6">
              <PatientForm onDone={() => navigate({ to: "/login" })} />
            </TabsContent>
            <TabsContent value="expert" className="mt-6">
              <ExpertForm onDone={() => navigate({ to: "/login" })} />
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PatientForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", anonymous: false });
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
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
    if (error) { toast.error(error.message); return; }
    toast.success("Vérifiez votre email pour confirmer votre inscription.");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
        <Field label="Nom" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
      </div>
      <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
      <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <Field label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.anonymous} onCheckedChange={(c) => setForm({ ...form, anonymous: !!c })} />
        Rester anonyme face aux experts
      </label>
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? "Chargement..." : "Créer mon compte"}
      </Button>
    </form>
  );
}

function ExpertForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
    expertType: "psychologue" as "psychiatre" | "psychologue" | "coach" | "autre",
    description: "", cabinet: "", address: "",
  });
  const [diploma, setDiploma] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!diploma) { toast.error("Veuillez joindre votre diplôme."); return; }
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
      await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    }
    const ext = diploma.name.split(".").pop() ?? "bin";
    const path = `${userId}/diploma-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("diplomas").upload(path, diploma, { upsert: true });
    if (upErr) { setLoading(false); toast.error(upErr.message); return; }

    const { error: appErr } = await supabase.from("expert_applications").insert({
      user_id: userId,
      expert_type: form.expertType,
      description: form.description,
      cabinet_name: form.cabinet || null,
      address: form.address,
      diploma_path: path,
    });
    setLoading(false);
    if (appErr) { toast.error(appErr.message); return; }
    toast.success("Dossier envoyé. Vous recevrez une notification après validation.");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg border border-accent/40 bg-accent/15 p-3 text-sm text-accent-foreground">
        Votre dossier sera examiné manuellement par un administrateur.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
        <Field label="Nom" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
      </div>
      <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
      <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
      <Field label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
      <div className="space-y-2">
        <Label>Type de profil</Label>
        <Select value={form.expertType} onValueChange={(v) => setForm({ ...form, expertType: v as typeof form.expertType })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
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
        <Textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <Field label="Nom du cabinet (optionnel)" value={form.cabinet} onChange={(v) => setForm({ ...form, cabinet: v })} />
      <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
      <div className="space-y-2">
        <Label>Diplôme ou attestation (PDF/Image)</Label>
        <Input type="file" accept="application/pdf,image/*" required onChange={(e) => setDiploma(e.target.files?.[0] ?? null)} />
      </div>
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? "Chargement..." : "Créer mon compte"}
      </Button>
    </form>
  );
}

function Field({
  label, value, onChange, type = "text", required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} required={required} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}