import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<"patient" | "expert">(search.as ?? "patient");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <h1 className="font-display text-3xl font-semibold">{t("auth.signupTitle")}</h1>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "patient" | "expert")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patient">{t("auth.asPatient")}</TabsTrigger>
              <TabsTrigger value="expert">{t("auth.asExpert")}</TabsTrigger>
            </TabsList>
            <TabsContent value="patient" className="mt-6">
              <PatientForm onDone={() => navigate({ to: "/login" })} lang={i18n.language} />
            </TabsContent>
            <TabsContent value="expert" className="mt-6">
              <ExpertForm onDone={() => navigate({ to: "/login" })} lang={i18n.language} />
            </TabsContent>
          </Tabs>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">{t("nav.login")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function PatientForm({ onDone, lang }: { onDone: () => void; lang: string }) {
  const { t } = useTranslation();
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
          preferred_language: lang.split("-")[0],
          requested_role: "patient",
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("auth.checkEmail"));
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("auth.firstName")} value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
        <Field label={t("auth.lastName")} value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
      </div>
      <Field label={t("auth.email")} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
      <Field label={t("auth.phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <Field label={t("auth.password")} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={form.anonymous} onCheckedChange={(c) => setForm({ ...form, anonymous: !!c })} />
        {t("auth.anonymous")}
      </label>
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? t("common.loading") : t("auth.signUp")}
      </Button>
    </form>
  );
}

function ExpertForm({ onDone, lang }: { onDone: () => void; lang: string }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", password: "",
    expertType: "psychologue" as "psychiatre" | "psychologue" | "coach" | "autre",
    description: "", cabinet: "", address: "",
  });
  const [diploma, setDiploma] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!diploma) { toast.error(t("expert.diploma")); return; }
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
          preferred_language: lang.split("-")[0],
          requested_role: "expert",
        },
      },
    });
    if (signUpErr || !signUpData.user) {
      setLoading(false);
      toast.error(signUpErr?.message ?? t("common.error"));
      return;
    }
    const userId = signUpData.user.id;
    // Need a session to upload — sign in immediately if email confirmation disabled, else attempt
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
    toast.success(t("expert.applicationSent"));
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="rounded-lg border border-accent/40 bg-accent/15 p-3 text-sm text-accent-foreground">
        {t("auth.expertNote")}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("auth.firstName")} value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
        <Field label={t("auth.lastName")} value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} required />
      </div>
      <Field label={t("auth.email")} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
      <Field label={t("auth.phone")} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
      <Field label={t("auth.password")} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
      <div className="space-y-2">
        <Label>{t("expert.type")}</Label>
        <Select value={form.expertType} onValueChange={(v) => setForm({ ...form, expertType: v as typeof form.expertType })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="psychiatre">{t("expert.psychiatre")}</SelectItem>
            <SelectItem value="psychologue">{t("expert.psychologue")}</SelectItem>
            <SelectItem value="coach">{t("expert.coach")}</SelectItem>
            <SelectItem value="autre">{t("expert.autre")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("expert.description")}</Label>
        <Textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <Field label={t("expert.cabinet")} value={form.cabinet} onChange={(v) => setForm({ ...form, cabinet: v })} />
      <Field label={t("expert.address")} value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
      <div className="space-y-2">
        <Label>{t("expert.diploma")}</Label>
        <Input type="file" accept="application/pdf,image/*" required onChange={(e) => setDiploma(e.target.files?.[0] ?? null)} />
      </div>
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? t("common.loading") : t("auth.signUp")}
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