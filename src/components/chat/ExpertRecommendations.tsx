import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

type ExpertType = "psychologue" | "psychiatre" | "coach" | "autre";

type Expert = {
  id: string;
  display_name: string;
  expert_type: ExpertType;
  description: string;
  cabinet_name: string | null;
  address: string;
  languages: string[];
  consultation_price: number | null;
  subscription_tier: "standard" | "premium";
  avatar_url: string | null;
};

export function ExpertRecommendations({
  type,
  conversationId,
}: {
  type: ExpertType;
  conversationId: string | null;
}) {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [createdFor, setCreatedFor] = useState<Set<string>>(new Set());
  const [genericCreated, setGenericCreated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`/api/referrals?type=${type}`, {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      if (cancelled) return;
      if (resp.ok) {
        const json = await resp.json();
        setExperts(json.experts ?? []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [type]);

  const createTicket = async (expertId: string | null) => {
    setCreating(expertId ?? "__generic__");
    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch("/api/referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({
        conversationId,
        expertType: type,
        expertId,
        message: `Demande de mise en relation suite à un échange avec PsyBot.`,
      }),
    });
    setCreating(null);
    if (resp.ok) {
      toast.success("Ticket de mise en relation créé. Un professionnel vous contactera.");
      if (expertId) {
        setCreatedFor((prev) => new Set(prev).add(expertId));
      } else {
        setGenericCreated(true);
      }
    } else {
      const err = await resp.json().catch(() => ({ error: "Erreur" }));
      toast.error(err.error ?? "Impossible de créer le ticket");
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
      <p className="text-xs font-medium text-muted-foreground">
        {type.charAt(0).toUpperCase() + type.slice(1)}s recommandé·e·s
      </p>
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Chargement...
        </div>
      )}
      {!loading && experts.length === 0 && (
        <div className="rounded-md border border-border bg-background/60 p-3 text-xs">
          <p className="text-muted-foreground">
            Aucun {type} disponible pour le moment. Créez quand même une demande, l'équipe vous orientera.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-xs"
            disabled={genericCreated || creating === "__generic__"}
            onClick={() => createTicket(null)}
          >
            {genericCreated ? (<><Check className="mr-1 h-3 w-3" /> Demande envoyée</>) : "Demander une mise en relation"}
          </Button>
        </div>
      )}
      {!loading && experts.slice(0, 3).map((e) => {
        const created = createdFor.has(e.id);
        return (
          <div key={e.id} className="rounded-md border border-border bg-background/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">{e.display_name}</span>
                  {e.subscription_tier === "premium" && (
                    <Badge className="h-4 px-1.5 text-[10px]"><Sparkles className="mr-0.5 h-2.5 w-2.5" />Premium</Badge>
                  )}
                </div>
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {e.address}
                </p>
              </div>
              <Button
                size="sm"
                variant={created ? "secondary" : "default"}
                className="h-7 shrink-0 text-xs"
                disabled={created || creating === e.id}
                onClick={() => createTicket(e.id)}
              >
                {creating === e.id
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : created
                    ? <><Check className="mr-1 h-3 w-3" /> Demandé</>
                    : "Mettre en relation"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}