"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  Gift,
  UserRound,
  Coffee,
  MapPin,
  Newspaper,
  Bell,
  ScanLine,
  Settings2,
  ArrowUpRight,
} from "lucide-react";
import type { ReactNode } from "react";
import { ClubForm } from "./ClubForm";

const navigation = [
  { path: "/club", title: "Start", icon: Home },
  { path: "/club/karte", title: "Karte", icon: CreditCard },
  { path: "/club/vorteile", title: "Vorteile", icon: Gift },
  { path: "/club/profil", title: "Profil", icon: UserRound },
];
const more = [
  { path: "/club/getraenke", title: "Lieblingsgetränke", icon: Coffee },
  { path: "/club/standorte", title: "Standorte", icon: MapPin },
  { path: "/club/neuigkeiten", title: "Journal & Events", icon: Newspaper },
  { path: "/club/nachrichten", title: "Nachrichten", icon: Bell },
];
export function ClubMark() {
  return (
    <svg viewBox="0 0 52 62" fill="none" aria-hidden="true">
      <rect
        x="8"
        y="3"
        width="36"
        height="56"
        rx="18"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M17 53V11M35 53V11M8 28H44M26 3V59"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}
export function ClubShell({
  children,
  demo,
  role = "customer",
  unread = 0,
}: {
  children: ReactNode;
  demo: boolean;
  role?: string;
  unread?: number;
}) {
  const current = usePathname();
  const staff = ["employee", "manager", "administrator"].includes(role);
  const primary = staff
    ? [
        { path: "/club", title: "Start", icon: Home },
        { path: "/club/team", title: "Service", icon: ScanLine },
        ...(role === "administrator"
          ? [{ path: "/club/admin", title: "Verwaltung", icon: Settings2 }]
          : []),
        {
          path: demo ? "/club/anmelden" : "/mitarbeiter",
          title: demo ? "Testrollen" : "Personal",
          icon: UserRound,
        },
      ]
    : navigation;
  function nav(items: typeof navigation) {
    return items.map(({ path, title, icon: Icon }) => (
      <Link
        key={path}
        href={path}
        aria-current={current === path ? "page" : undefined}
      >
        <Icon size={19} aria-hidden="true" />
        <span>{title}</span>
        {path === "/club/nachrichten" && unread > 0 && (
          <span className="club-badge">{unread}</span>
        )}
      </Link>
    ));
  }
  return (
    <div className="club-shell">
      <a className="skip-link" href="#club-main">
        Zum Inhalt
      </a>
      {demo && (
        <div className="club-demo-banner">
          <span>LOKALE DEMO · Ausschließlich fiktive Daten. Kein Verkauf.</span>
          <Link href="/club/anmelden">Testperson wechseln</Link>
        </div>
      )}
      <header className="club-header">
        <Link className="club-brand" href="/">
          <ClubMark />
          <span>
            LACACCINO<small>THE CLUB</small>
          </span>
        </Link>
        <div>
          {!staff && (
            <Link
              href="/club/nachrichten"
              aria-label={`Nachrichten${unread ? `, ${unread} ungelesen` : ""}`}
            >
              <Bell size={21} />
              {unread > 0 && <i className="club-dot" />}
            </Link>
          )}
          <ClubForm
            operation="logout"
            label="Abmelden"
            className="club-logout"
          />
        </div>
      </header>
      <div className="club-frame">
        <aside className="club-sidebar">
          <p className="club-overline">Dein tägliches Ritual</p>
          <nav aria-label="Club Navigation">
            {nav(primary)}
            <span className="club-nav-rule" />
            {!staff && nav(more)}
          </nav>
          <Link className="club-world-link" href="/">
            Zur Markenwelt <ArrowUpRight size={16} />
          </Link>
          <p className="club-small">Geplanter Markenstart 2029</p>
        </aside>
        <main id="club-main" className="club-main">
          {children}
        </main>
      </div>
      <nav
        className="club-mobile-nav"
        aria-label="Mobile Club Navigation"
        style={{ gridTemplateColumns: "repeat(" + primary.length + ",1fr)" }}
      >
        {nav(primary)}
      </nav>
    </div>
  );
}
