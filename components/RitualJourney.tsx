"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { reducedMotionQuery } from "@/lib/motion";
import { images } from "@/lib/images";

const rituals = [
  { title: "Die Vorfreude.", text: "Ein vertrautes Geräusch. Der erste Duft. Noch bevor die Tasse vor dir steht, beginnt dein Moment.", image: images.machine, alt: "LACACCINO-Siebträgermaschine mit glänzenden Metallteilen und feinen goldenen Linien", label: "01 / Der erste Augenblick" },
  { title: "Das Innehalten.", text: "Ein Platz, der sich richtig anfühlt. Eine warme Tasse. Und für einen Augenblick darf alles andere warten.", image: images.interior, alt: "LACACCINO-Tasse auf einem dunklen Tisch neben einem elegant geschwungenen Stuhl", label: "02 / Ganz bei dir" },
  { title: "Die kleine Zugabe.", text: "Ein feines Detail macht den Moment vollständig. Kaffee, etwas Süßes und Zeit, die dir gehört.", image: images.biscuits, alt: "LACACCINO Kaffeegebäck und eine schwarze Kaffeetasse", label: "03 / Was bleibt" },
];

export function RitualJourney() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || !window.IntersectionObserver) return;
    const desktop = window.matchMedia("(min-width: 901px)");
    const preference = window.matchMedia(reducedMotionQuery);
    let observer: IntersectionObserver | undefined;
    const configure = () => {
      observer?.disconnect();
      delete element.dataset.enhanced;
      if (!desktop.matches || preference.matches) return;
      const steps = [...element.querySelectorAll<HTMLElement>(".ritual-step")];
      const photographs = [...element.querySelectorAll<HTMLElement>(".ritual-photo")];
      element.dataset.enhanced = "true";
      const select = (index: number) => {
        photographs.forEach((photo, number) => {
          photo.dataset.active = String(number === index);
          photo.setAttribute("aria-hidden", String(number !== index));
        });
        steps.forEach((step, number) => { step.dataset.active = String(number === index); });
      };
      select(0);
      observer = new IntersectionObserver((entries) => {
        if (document.hidden) return;
        for (const entry of entries) if (entry.isIntersecting) select(steps.indexOf(entry.target as HTMLElement));
      }, { rootMargin: "-35% 0px -35% 0px", threshold: 0 });
      steps.forEach((step) => observer?.observe(step));
    };
    configure();
    desktop.addEventListener("change", configure);
    preference.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      delete element.dataset.enhanced;
      desktop.removeEventListener("change", configure);
      preference.removeEventListener("change", configure);
    };
  }, []);

  return (
    <div className="ritual-journey" ref={root}>
      <div className="ritual-visual">
        {rituals.map((ritual, index) => (
          <div className="ritual-photo" data-active={index === 0} key={ritual.title}>
            <Image src={ritual.image} alt={ritual.alt} fill sizes="(max-width: 900px) 1px, 58vw" className="cover-image" />
            <span className="image-index">{ritual.label}</span>
          </div>
        ))}
        <span className="ritual-visual__edge" aria-hidden="true" />
      </div>
      <div className="ritual-steps">
        {rituals.map((ritual, index) => (
          <article className="ritual-step" key={ritual.title}>
            <div className="ritual-step__image">
              <Image src={ritual.image} alt={ritual.alt} fill sizes="(max-width: 900px) 100vw, 34vw" className="cover-image" />
            </div>
            <div className="ritual-step__copy" data-reveal>
              <span className="ritual-step__number">0{index + 1}</span>
              <span className="gold-rule" data-line aria-hidden="true" />
              <h3>{ritual.title}</h3>
              <p>{ritual.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
