import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ExpertType = "psychiatre" | "psychologue" | "coach" | "autre";
type ProfileRow = {
  id: string;
  user_id: string;
  expert_type: ExpertType;
  display_name: string;
  description: string;
  cabinet_name: string | null;
  address: string;
  languages: string[];
  consultation_price: number | null;
  subscription_tier: "none" | "standard" | "premium";
  subscription_expires_at: string | null;
};
type PostRow = {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  published: boolean;
  created_at: string;
};

export const Route = createFileRoute("/expert")({
  component: ExpertSpace,
});

function ExpertSpace() {
  const { user, roles, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [eProfile, setEProfile] = useState<ProfileRow | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (!roles.includes("expert")) { navigate({ to: "/dashboard" }); return; }

    supabase.from("expert_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setEProfile(data as ProfileRow | null);
        setBusy(false);
      });
  }, [user, roles, loading, navigate]);

  if (loading || busy) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Chargement...</div>;
  }

  const active = eProfile && eProfile.subscription_tier !== "none" &&
    (!eProfile.subscription_expires_at || new Date(eProfile.subscription_expires_at) > new Date());

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-semibold">Espace expert</h1>
          {eProfile?.subscription_tier === "premium" && (
            <Badge className="bg-primary text-primary-foreground"><Sparkles className="mr-1 h-3 w-3" />Premium</Badge>
          )}
          {eProfile?.subscription_tier === "standard" && <Badge variant="secondary">Standard</Badge>}
          {!active && <Badge variant="outline" className="border-destructive/40 text-destructive">Abonnement inactif</Badge>}
        </div>
        <p className="mt-2 text-muted-foreground">Bonjour {profile?.first_name}.</p>

        {!active && (
          <Card className="mt-6 border-accent/40 bg-accent/10 p-5">
            <p className="font-medium">Activez votre abonnement</p>
            <p className="text-sm text-muted-foreground">
              Sans abonnement actif, vous n'apparaissez pas dans la recherche et ne pouvez pas publier d'articles. Le système de paiement (FedaPay/KKiaPay) sera intégré en Phase 3.
            </p>
          </Card>
        )}

        <Tabs defaultValue="profile" className="mt-8">
          <TabsList>
            <TabsTrigger value="profile">Mon profil public</TabsTrigger>
            <TabsTrigger value="posts" disabled={!active}>Publications</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileForm
              userId={user!.id}
              defaults={eProfile}
              defaultName={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()}
              onSaved={(p) => setEProfile(p)}
            />
          </TabsContent>

          <TabsContent value="posts" className="mt-6">
            {active ? <PostsManager userId={user!.id} /> : (
              <Card className="p-8 text-center text-muted-foreground">Activez un abonnement pour publier.</Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ProfileForm({
  userId, defaults, defaultName, onSaved,
}: { userId: string; defaults: ProfileRow | null; defaultName: string; onSaved: (p: ProfileRow) => void }) {
  const [form, setForm] = useState({
    expert_type: (defaults?.expert_type ?? "psychologue") as ExpertType,
    display_name: defaults?.display_name ?? defaultName,
    description: defaults?.description ?? "",
    cabinet_name: defaults?.cabinet_name ?? "",
    address: defaults?.address ?? "",
    consultation_price: defaults?.consultation_price?.toString() ?? "",
    languages: defaults?.languages ?? ["fr"],
  });
  const [saving, setSaving] = useState(false);

  const toggleLang = (l: string) => {
    setForm((f) => ({
      ...f,
      languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l],
    }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.languages.length === 0) { toast.error("Sélectionnez au moins une langue."); return; }
    setSaving(true);
    const payload = {
      user_id: userId,
      expert_type: form.expert_type,
      display_name: form.display_name,
      description: form.description,
      cabinet_name: form.cabinet_name || null,
      address: form.address,
      consultation_price: form.consultation_price ? Number(form.consultation_price) : null,
      languages: form.languages,
    };
    const { data, error } = defaults
      ? await supabase.from("expert_profiles").update(payload).eq("user_id", userId).select().maybeSingle()
      : await supabase.from("expert_profiles").insert(payload).select().maybeSingle();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil enregistré.");
    if (data) onSaved(data as ProfileRow);
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nom affiché</Label>
          <Input required value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Type de profil</Label>
          <Select value={form.expert_type} onValueChange={(v) => setForm({ ...form, expert_type: v as ExpertType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="psychiatre">Psychiatre</SelectItem>
              <SelectItem value="psychologue">Psychologue</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Cabinet (optionnel)</Label>
          <Input value={form.cabinet_name} onChange={(e) => setForm({ ...form, cabinet_name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Adresse</Label>
          <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Tarif consultation (FCFA)</Label>
        <Input type="number" min="0" value={form.consultation_price} onChange={(e) => setForm({ ...form, consultation_price: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Langues parlées</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { v: "fr", l: "Français" },
            { v: "en", l: "Anglais" },
            { v: "fon", l: "Fon" },
            { v: "gun", l: "Goun" },
          ].map((x) => (
            <button
              key={x.v}
              type="button"
              onClick={() => toggleLang(x.v)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                form.languages.includes(x.v) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
              }`}
            >
              {x.l}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={saving} className="h-11">
        {saving ? "Enregistrement..." : "Enregistrer le profil"}
      </Button>
    </form>
  );
}

function PostsManager({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [form, setForm] = useState({ title: "", content: "" });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id,title,content,cover_image_url,published,created_at")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    setPosts((data ?? []) as PostRow[]);
  };

  useEffect(() => { reload(); }, [userId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast.error("Titre et contenu requis."); return; }
    setBusy(true);
    let cover_image_url: string | null = null;
    if (coverFile) {
      const ext = coverFile.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("post-images").upload(path, coverFile);
      if (upErr) { setBusy(false); toast.error(upErr.message); return; }
      cover_image_url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
    }
    const excerpt = form.content.slice(0, 200);
    const { error } = await supabase.from("posts").insert({
      author_id: userId,
      title: form.title,
      content: form.content,
      excerpt,
      cover_image_url,
      published: true,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Article publié.");
    setForm({ title: "", content: "" });
    setCoverFile(null);
    reload();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Supprimé.");
    reload();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-xl font-semibold">Nouvel article</h3>
        <div className="space-y-2">
          <Label>Titre</Label>
          <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Contenu</Label>
          <Textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Image de couverture (optionnel)</Label>
          <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
        </div>
        <Button type="submit" disabled={busy} className="h-11">
          {busy ? "Publication..." : "Publier"}
        </Button>
      </form>

      <div className="space-y-3">
        <h3 className="font-display text-xl font-semibold">Mes publications</h3>
        {posts.length === 0 && <Card className="p-6 text-center text-muted-foreground">Aucune publication.</Card>}
        {posts.map((p) => (
          <Card key={p.id} className="flex items-start justify-between gap-4 p-5">
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold">{p.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString("fr-FR")} {p.published ? "· publié" : "· brouillon"}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.content}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(p.id)} aria-label="Supprimer">
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}