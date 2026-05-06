import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopTabs } from "@/components/TopTabs";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/communities/$id/settings")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: CommunitySettingsScreen,
});

/** Modification des paramètres d'une communauté — accessible uniquement au créateur (RLS UPDATE). */
function CommunitySettingsScreen() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [canMembersPost, setCanMembersPost] = useState(true);
  const [canMembersComment, setCanMembersComment] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("communities").select("*").eq("id", id).maybeSingle();
      if (data && user && data.creator_id === user.id) {
        setAllowed(true);
        setName(data.name); setDescription(data.description ?? "");
        setCanMembersPost(data.can_members_post); setCanMembersComment(data.can_members_comment);
      }
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) {
    return <div className="min-h-screen bg-background"><TopTabs /><main className="container mx-auto py-16 text-center text-muted-foreground">Chargement...</main></div>;
  }
  if (!allowed) {
    return (
      <div className="min-h-screen bg-background"><TopTabs />
        <main className="container mx-auto max-w-md px-4 py-16 text-center">
          <Card className="p-6">
            <h1 className="font-display text-xl font-semibold">Accès restreint</h1>
            <p className="mt-2 text-sm text-muted-foreground">Seul le créateur peut modifier les paramètres.</p>
          </Card>
        </main>
      </div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("communities").update({
      name: name.trim(), description: description.trim(),
      can_members_post: canMembersPost, can_members_comment: canMembersComment,
    }).eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Paramètres enregistrés"); navigate({ to: "/communities/$id", params: { id } }); }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopTabs />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Paramètres de la communauté</h1>
        <Card className="mt-6 p-6">
          <form onSubmit={save} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="s-name">Nom</Label>
              <Input id="s-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Description</Label>
              <Textarea id="s-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Membres peuvent publier</p>
                <p className="text-xs text-muted-foreground">Désactivé : seul vous pouvez publier.</p>
              </div>
              <Switch checked={canMembersPost} onCheckedChange={setCanMembersPost} aria-label="Membres peuvent publier" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Membres peuvent commenter</p>
                <p className="text-xs text-muted-foreground">Désactivé : section commentaires fermée pour les membres.</p>
              </div>
              <Switch checked={canMembersComment} onCheckedChange={setCanMembersComment} aria-label="Membres peuvent commenter" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/communities/$id", params: { id } })}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}