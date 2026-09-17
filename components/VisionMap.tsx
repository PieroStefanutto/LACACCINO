"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { places } from "@/lib/places";
import { reducedMotionQuery, reveal } from "@/lib/motion";
import type { VisionGeometry } from "@/lib/vision-geometry";
import { images } from "@/lib/images";

export function VisionMap({ geometry }: { geometry: VisionGeometry }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = places[activeIndex];
  const detail = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const element = detail.current;
    const preference = window.matchMedia(reducedMotionQuery);
    if (!element || preference.matches || document.hidden || !element.animate) return;
    const animation = reveal(element);
    const cancel = () => animation.cancel();
    document.addEventListener("visibilitychange", cancel);
    preference.addEventListener("change", cancel);
    return () => { cancel(); document.removeEventListener("visibilitychange", cancel); preference.removeEventListener("change", cancel); };
  }, [activeIndex]);

  const renderPoint = (index: number, inset = false) => {
    const place = places[index];
    const point = (inset ? geometry.europePoints : geometry.points)[index];
    const selected = index === activeIndex;
    return (
      <g key={place.name} className={`map-point ${selected ? "map-point--active" : ""}`} transform={`translate(${point.x} ${point.y})`}
        role="button" tabIndex={inset ? -1 : 0} aria-label={`${place.name}, ${place.country} auswählen`} aria-pressed={selected}
        onClick={() => setActiveIndex(index)}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveIndex(index); } }}>
        <title>{place.name}</title>
        <circle className="map-point__hit" r={inset ? 14 : 7} />
        <circle className="map-point__halo" r={inset ? 10 : 7} />
        <circle className="map-point__dot" r={inset ? 3.5 : 2.5} />
      </g>
    );
  };

  return (
    <div className="map-experience" data-reveal>
      <div className="map-panel">
        <div className="map-panel__meta"><span>Zukunftsvision / 06 Orte</span><span>Orte einer Idee · keine Filialen</span></div>
        <div className="map-panel__geography">
          <svg className="world-map" viewBox="0 0 1000 500" role="group" aria-labelledby="map-title map-description">
            <title id="map-title">Weltkarte der LACACCINO Zukunftsvision</title>
            <desc id="map-description">Geografische Punkte für Stuttgart, Hamburg, Palma auf Mallorca, Bangkok, London und Dubai. Alle Orte sind auch über die Ortsliste auswählbar.</desc>
            <path className="world-map__land" d={geometry.path} />
            {places.map((_, index) => renderPoint(index))}
          </svg>
          <div className="europe-inset">
            <span>Europa im Detail</span>
            <svg viewBox="0 0 320 220" aria-label="Vergrößerter Kartenausschnitt von Europa" role="group">
              <path className="world-map__land" d={geometry.europePath} />
              {[0, 1, 2, 4].map((index) => renderPoint(index, true))}
            </svg>
          </div>
        </div>
      </div>
      <div className="place-list" role="group" aria-label="Orte der Zukunftsvision">
        {places.map((place, index) => (
          <button key={place.name} type="button" className={`place-list__item ${index === activeIndex ? "place-list__item--active" : ""}`}
            onClick={() => setActiveIndex(index)} aria-pressed={index === activeIndex} aria-controls="place-detail">
            <span>0{index + 1}</span><strong>{place.name}</strong><small>{place.country}</small>
          </button>
        ))}
      </div>
      <div id="place-detail" className="place-detail" ref={detail}>
        <div className="place-detail__copy" aria-live="polite" aria-atomic="true">
          <p className="eyebrow">0{activeIndex + 1} / {active.country}</p>
          <h3>{active.name}</h3>
          <p className="place-detail__note">{active.note}</p>
          <p className="place-detail__disclaimer">Ein gedanklicher Horizont für LACACCINO.<br />Keine bestehende oder angekündigte Filiale.</p>
        </div>
        <figure className="place-detail__figure">
          <div className="place-detail__image">
            <Image src={active.image === "city" ? images.city : images.cups}
              alt={active.image === "city" ? "Vorhandenes City-Edition-Design für Stuttgart, Mallorca und Bangkok" : "Vorhandene Signature- und Botanical-Becherentwürfe, keine ortsspezifische Edition"}
              fill sizes="(max-width: 700px) 90vw, 48vw" style={{ objectPosition: active.position }} />
          </div>
          <figcaption>{active.imageNote}</figcaption>
        </figure>
      </div>
      <p className="map-source">Kartengeometrie: Natural Earth / World Atlas · lokal eingebunden</p>
    </div>
  );
}
