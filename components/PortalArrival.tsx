"use client";
import { useEffect } from "react";
import { CoffeeStorm } from "@/components/CoffeeStorm";

export function PortalArrival() {
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);
  return <CoffeeStorm force focusTarget="portal-heading" />;
}
