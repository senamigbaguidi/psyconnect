import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full" style={{ background: "var(--gradient-warm)" }} />
          <span className="font-display text-xl font-semibold tracking-tight">PsyConnect</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/feed" })}>Fil</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/experts" })}>Experts</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>Tableau de bord</Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/login" })}>Connexion</Button>
              <Button onClick={() => navigate({ to: "/signup" })}>S'inscrire</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}