import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, MapPin, Languages } from "lucide-react";

type ExpertRow = {
  id: string;
  user_id: string;
  display_name: string;
  expert_type: "psychiatre" | "psychologue" | "coach" | "autre";
  description: string;
  cabinet_name: string | null;
  address: string;
  languages: string[];
  consultation_price: number | null;
  subscription_tier: "standard" | "premium";
  avatar_url: string | null;
};

export const Route = createFileRoute("/experts")({
  component: ExpertsSearchPage,
});

function ExpertsSearchPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [lang, setLang] = useState<string>("all");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setBusy(true);
    // Premium boosted first
    supabase
      .from("expert_profiles")
      .select("id,user_id,display_name,expert_type,description,cabinet_name,address,languages,consultation_price,subscription_tier,avatar_url")
      .order("subscription_tier", { ascending: false }) // 'premium' > 'standard' alphabetically
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setExperts((data ?? []) as ExpertRow[]);
        setBusy(false);
      });
  }, [user]);

  const filtered = experts.filter((e) => {
    if (type !== "all" && e.expert_type !== type) return false;
    if (lang !== "all" && !e.languages.includes(lang)) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!e.display_name.toLowerCase().includes(s) && !e.description.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-semibold">Trouver un professionnel</h1>
        <p className="mt-2 text-muted-foreground">Recherchez un expert par spécialité, nom ou langue.</p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Input placeholder="Rechercher par nom ou mot-clé..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue placeholder="Spécialité" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes spécialités</SelectItem>
              <SelectItem value="psychiatre">Psychiatre</SelectItem>
              <SelectItem value="psychologue">Psychologue</SelectItem>
              <SelectItem value="coach">Coach</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger><SelectValue placeholder="Langue" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes langues</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">Anglais</SelectItem>
              <SelectItem value="fon">Fon</SelectItem>
              <SelectItem value="gun">Goun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 space-y-4">
          {busy && <p className="text-muted-foreground">Chargement...</p>}
          {!busy && filtered.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              Aucun professionnel ne correspond à votre recherche.
            </Card>
          )}
          {filtered.map((e) => (
            <Card key={e.id} className={`p-6 transition-all hover:shadow-[var(--shadow-calm)] ${e.subscription_tier === "premium" ? "border-primary/40 bg-primary/5" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-semibold">{e.display_name}</h3>
                    {e.subscription_tier === "premium" && (
                      <Badge className="bg-primary text-primary-foreground"><Sparkles className="mr-1 h-3 w-3" />Premium</Badge>
                    )}
                    <Badge variant="secondary" className="capitalize">{e.expert_type}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.address}</span>
                    <span className="inline-flex items-center gap-1"><Languages className="h-3 w-3" />{e.languages.join(", ")}</span>
                    {e.consultation_price != null && (
                      <span>Consultation : {e.consultation_price} FCFA</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}