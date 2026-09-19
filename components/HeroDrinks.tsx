"use client";

import Image from "next/image";
import { useState } from "react";
import { images } from "@/lib/images";
import { DrinkSteam } from "@/components/DrinkSteam";

// Viewports into the unchanged originals exclude the collage's white dividers.
const drinks = [
  { name: "Café Crema", src: images.hero, crop: [100, 320, 1125, 875], alt: "Café Crema in einer schwarzen LACACCINO-Tasse mit goldenem Henkel und Untertasse" },
  { name: "Cappuccino", src: images.drinks, crop: [444, 232, 426, 388], alt: "Cappuccino mit Milchschaum in einer schwarzen LACACCINO-Tasse" },
  { name: "Latte Macchiato", src: images.drinks, crop: [879, 166, 430, 446], alt: "Latte Macchiato im hohen LACACCINO-Glas mit sichtbaren Kaffeeschichten" },
  { name: "Matcha Latte", src: images.drinks, crop: [62, 798, 526, 360], alt: "Grüner Matcha Latte mit Blattmotiv im Milchschaum" },
  { name: "Heiße Schokolade", src: images.drinks, crop: [710, 795, 570, 365], alt: "Heiße Schokolade im LACACCINO-Glas mit Sahne und Schokoladenstückchen" },
] as const;

// Surface positions in the original photographs keep the steam over each drink.
const surfaces = [[650, 520], [653, 313], [1100, 226], [332, 858], [966, 862]] as const;

export function HeroDrinks() {
  const [active, setActive] = useState(0);
  const drink = drinks[active];
  const [x, y, width, height] = drink.crop;
  const [surfaceX, surfaceY] = surfaces[active];

  return (
    <figure className="hero__product">
      <div className="hero__photograph">
        <div className="drink-scene" id="hero-drink" aria-live="polite" aria-atomic="true">
          <div className="drink-scene__frame" style={{ aspectRatio: `${width} / ${height}`, width: `${Math.min(100, width / height / 1.25 * 100)}%` }}>
            <div className="drink-scene__crop">
              <div className="drink-scene__source" style={{ width: `${1312 / width * 100}%`, height: `${1199 / height * 100}%`, left: `${-x / width * 100}%`, top: `${-y / height * 100}%` }}>
                <Image key={drink.src} src={drink.src} alt={drink.alt} fill preload={active === 0} sizes={active === 0 ? "(max-width: 900px) 110vw, 75vw" : "(max-width: 900px) 240vw, 150vw"} />
              </div>
            </div>
            <DrinkSteam left={(surfaceX - x) / width * 100} top={(surfaceY - y) / height * 100} />
          </div>
        </div>
        <div className="launch-emblem" role="img" aria-label="Geplanter Markenstart 2029">
          <span className="launch-emblem__label" aria-hidden="true">Geplanter<br /><span>Markenstart</span></span>
          <span className="launch-emblem__year" aria-hidden="true">2029</span>
          <span className="launch-emblem__detail" aria-hidden="true">LACACCINO</span>
        </div>
      </div>
      <figcaption><span>Dein Moment. Dein Geschmack.</span><span>Getränkevision / 2029</span></figcaption>
      <div className="drink-selector" role="group" aria-label="Getränkemotiv auswählen">
        {drinks.map((item, index) => (
          <button key={item.name} type="button" aria-pressed={active === index} aria-controls="hero-drink" onClick={() => setActive(index)}>{item.name}</button>
        ))}
      </div>
      <p className="drink-concept">Designkonzepte für 2029 · Noch kein Produktangebot.</p>
    </figure>
  );
}
