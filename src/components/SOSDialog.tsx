import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Heart } from "lucide-react";

export function SOSDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-destructive/40">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <Heart className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center font-display text-2xl">Vous n'êtes pas seul·e</DialogTitle>
          <DialogDescription className="text-center">
            Ce que vous ressentez est important. Parler à quelqu'un maintenant peut tout changer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <a href="tel:136" className="block">
            <Button className="h-14 w-full text-base" variant="destructive">
              <Phone className="mr-2 h-5 w-5" />
              Appeler le 136 (Bénin)
            </Button>
          </a>
          <p className="text-center text-sm text-muted-foreground">
            Disponible 24h/24 — gratuit, anonyme et confidentiel.
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="font-medium">Autres ressources d'urgence :</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>🇫🇷 France — 3114 (24h/24)</li>
              <li>🇨🇮 Côte d'Ivoire — 143</li>
              <li>🇸🇳 Sénégal — 800 00 50 50</li>
              <li>🌍 International — befrienders.org</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}