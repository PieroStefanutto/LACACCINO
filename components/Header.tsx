"use client";

import { useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#marke", label: "Die Marke" },
  { href: "#rituale", label: "Kaffee & Rituale" },
  { href: "#kollektion", label: "Kollektion" },
  { href: "#vision", label: "Unsere Vision" },
  { href: "/konto", label: "Mein Konto" },
];

export function Header() {
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const onResize = () => {
      if (desktop.matches && disclosure.current)
        disclosure.current.open = false;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && disclosure.current?.open) {
        disclosure.current.open = false;
        disclosure.current.querySelector("summary")?.focus();
      }
    };
    desktop.addEventListener("change", onResize);
    document.addEventListener("keydown", onKey);
    return () => {
      desktop.removeEventListener("change", onResize);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__inner shell">
        <a
          className="wordmark"
          href="#start"
          aria-label="LACACCINO – zum Seitenanfang"
        >
          LACACCINO
        </a>
        <nav className="desktop-nav" aria-label="Hauptnavigation">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <a className="header-waitlist" href="/konto#warteliste">
          Warteliste <span aria-hidden="true">↗</span>
        </a>
        <details className="mobile-menu" ref={disclosure}>
          <summary
            className="menu-button"
            aria-label="Menü öffnen oder schließen"
          >
            <span>Menü</span>
            <Menu className="menu-open-icon" aria-hidden="true" size={21} />
            <X className="menu-close-icon" aria-hidden="true" size={21} />
          </summary>
          <nav className="mobile-nav" aria-label="Mobile Navigation">
            <p>Die Welt von LACACCINO</p>
            {links.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (disclosure.current) disclosure.current.open = false;
                }}
              >
                <span>0{index + 1}</span>
                {link.label}
              </a>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
