import type { ReactNode } from "react";
import { PortalHeader, PortalNavigation } from "@/components/PortalShell";

export function AccountSection({
  title,
  intro,
  current,
  children,
}: {
  title: string;
  intro: string;
  current: string;
  children: ReactNode;
}) {
  return (
    <>
      <PortalHeader />
      <main className="portal shell">
        <div className="portal-welcome">
          <div>
            <p className="eyebrow">Dein LACACCINO</p>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
        </div>
        <div className="portal-layout">
          <aside className="portal-sidebar">
            <PortalNavigation current={current} />
          </aside>
          <div className="portal-content">{children}</div>
        </div>
      </main>
    </>
  );
}
