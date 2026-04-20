import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/experts")({
  component: AdminExperts,
});

type Application = {
  id: string;
  user_id: string;
  expert_type: string;
  description: string;
  cabinet_name: string | null;
  address: string;
  diploma_path: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string; email: string } | null;
};

function AdminExperts() {
  const { t } = useTranslation();
  const { roles, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
    if (!authLoading && user && !roles.includes("admin")) navigate({ to: "/dashboard" });
  }, [authLoading, user, roles, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("expert_applications")
      .select("*, profiles:profiles!expert_applications_user_id_fkey(first_name,last_name,email)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setApps((data ?? []) as Application[]);
    setLoading(false);
  };

  useEffect(() => {
    if (roles.includes("admin")) load();
  }, [roles]);

  if (!roles.includes("admin")) return null;

  const pending = apps.filter((a) => a.status === "pending");
  const approved = apps.filter((a) => a.status === "approved");
  const rejected = apps.filter((a) => a.status === "rejected");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-semibold">{t("admin.title")}</h1>
        <Tabs defaultValue="pending" className="mt-8">
          <TabsList>
            <TabsTrigger value="pending">{t("admin.pending")} ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">{t("admin.approved")} ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">{t("admin.rejected")} ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-6 space-y-4">
            {loading ? <p className="text-muted-foreground">{t("common.loading")}</p> :
              pending.map((a) => <AppCard key={a.id} app={a} onChange={load} />)}
          </TabsContent>
          <TabsContent value="approved" className="mt-6 space-y-4">
            {approved.map((a) => <AppCard key={a.id} app={a} onChange={load} readonly />)}
          </TabsContent>
          <TabsContent value="rejected" className="mt-6 space-y-4">
            {rejected.map((a) => <AppCard key={a.id} app={a} onChange={load} readonly />)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function AppCard({ app, onChange, readonly }: { app: Application; onChange: () => void; readonly?: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const viewDiploma = async () => {
    const { data, error } = await supabase.storage.from("diplomas").createSignedUrl(app.diploma_path, 60);
    if (error || !data) { toast.error(error?.message ?? "?"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const approve = async () => {
    setBusy(true);
    const { error: e1 } = await supabase.from("expert_applications").update({
      status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString(),
    }).eq("id", app.id);
    if (e1) { setBusy(false); toast.error(e1.message); return; }
    const { error: e2 } = await supabase.from("user_roles").insert({ user_id: app.user_id, role: "expert" });
    setBusy(false);
    if (e2 && !e2.message.includes("duplicate")) { toast.error(e2.message); return; }
    toast.success(t("admin.approve"));
    onChange();
  };

  const reject = async () => {
    if (!reason.trim()) { toast.error(t("admin.rejectReason")); return; }
    setBusy(true);
    const { error } = await supabase.from("expert_applications").update({
      status: "rejected", rejection_reason: reason, reviewed_by: user!.id, reviewed_at: new Date().toISOString(),
    }).eq("id", app.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("admin.reject"));
    onChange();
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold">
            {app.profiles?.first_name} {app.profiles?.last_name}
          </p>
          <p className="text-sm text-muted-foreground">{app.profiles?.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{t(`expert.${app.expert_type}` as const)}</Badge>
            {app.cabinet_name && <Badge variant="outline">{app.cabinet_name}</Badge>}
          </div>
          <p className="mt-3 text-sm">{app.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">{app.address}</p>
          {app.rejection_reason && (
            <p className="mt-2 text-sm text-destructive">{t("expert.reason")} : {app.rejection_reason}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={viewDiploma}>{t("admin.viewDiploma")}</Button>
      </div>
      {!readonly && (
        <div className="mt-5 space-y-3 border-t border-border pt-4">
          <Textarea placeholder={t("admin.rejectReason")} value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={approve} disabled={busy}>{t("admin.approve")}</Button>
            <Button variant="destructive" onClick={reject} disabled={busy}>{t("admin.reject")}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}