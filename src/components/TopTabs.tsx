import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Home, Search, Users, MessageCircle, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PsyConnectMark } from "@/components/icons/MindIcons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Accueil", icon: Home },
  { to: "/search", label: "Recherche", icon: Search },
  { to: "/communities", label: "Communautés", icon: Users },
  { to: "/chat", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profil", icon: UserIcon },
] as const;

/** Barre horizontale supérieure (tabs en haut) — affichée pour les utilisateurs connectés. */
export function TopTabs() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/home" className="flex items-center gap-2.5 shrink-0" aria-label="Accueil PsyConnect">
          <PsyConnectMark size={28} />
          <span className="hidden font-display text-lg font-semibold tracking-tight sm:inline">
            PsyConnect
          </span>
        </Link>

        <nav
          aria-label="Navigation principale"
          className="flex flex-1 items-center justify-center gap-1 overflow-x-auto"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = location.pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="hidden md:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
          size="sm"
          aria-label="Déconnexion"
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden lg:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}