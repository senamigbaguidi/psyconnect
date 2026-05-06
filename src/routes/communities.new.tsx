import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/communities/new")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: CreateCommunityScreen,
});

/**
 * Création d'une communauté.
 * Règle métier : seuls les admins et les experts validés peuvent créer.
 * (Vérifié côté UI ET côté DB via RLS + can_create_community().)
 */
function CreateCommunityScreen() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [canMembersPost, setCanMembersPost] = useState(true);
  const [canMembersComment, setCanMembersComment] = useState(true);
  const [loading, setLoading] = useState(false);

  const allowed = roles.includes("admin") || roles.includes("expert");

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background">
        <TopTabs />
        <main className="container mx-auto max-w-md px-4 py-16">
          <Card className="p-6 text-center">
            <h1 className="font-display text-xl font-semibold">Accès restreint</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              La création de communauté est réservée aux professionnels validés et aux administrateurs.
            </p>
          </Card>
        </main>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("communities")
      .insert({
        creator_id: user.id,
        name: name.trim(),
        description: description.trim(),
        can_members_post: canMembersPost,
        can_members_comment: canMembersComment,
      })
      .select("id").single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Communauté créée");
    navigate({ to: "/communities/$id", params: { id: data!.id } });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopTabs />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Nouvelle communauté</h1>
        <Card className="mt-6 p-6">
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nom</Label>
              <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea id="c-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Membres peuvent publier</p>
                <p className="text-xs text-muted-foreground">Si désactivé, seul vous pourrez publier.</p>
              </div>
              <Switch checked={canMembersPost} onCheckedChange={setCanMembersPost} aria-label="Membres peuvent publier" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Membres peuvent commenter</p>
                <p className="text-xs text-muted-foreground">Si désactivé, les commentaires sont fermés pour les membres.</p>
              </div>
              <Switch checked={canMembersComment} onCheckedChange={setCanMembersComment} aria-label="Membres peuvent commenter" />
            </div>
            <Button type="submit" disabled={loading || !name.trim()} className="w-full">
              {loading ? "Création..." : "Créer la communauté"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}