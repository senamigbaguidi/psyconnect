import type { ReactNode } from "react";
import { TopTabs } from "@/components/TopTabs";

/** Layout commun pour les écrans authentifiés (TopTabs + container). */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopTabs />
      <main className="container mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</main>
    </div>
  );
}