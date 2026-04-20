import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full" style={{ background: "var(--gradient-warm)" }} />
          <span className="font-display text-xl font-semibold tracking-tight">{t("brand")}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
                {t("nav.dashboard")}
              </Button>
              <Button variant="outline" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate({ to: "/login" })}>{t("nav.login")}</Button>
              <Button onClick={() => navigate({ to: "/signup" })}>{t("nav.signup")}</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}