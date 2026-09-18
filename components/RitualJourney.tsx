import Image from "next/image";
import { images } from "@/lib/images";

const moments = [
  ["Ankommen.", "Den Alltag einen Augenblick warten lassen."],
  ["Innehalten.", "Eine Tasse Kaffee. Ein Moment für dich."],
  ["Weitergehen.", "Mit etwas mehr Ruhe im Tag."],
];

export function RitualJourney() {
  return (
    <section
      className="ritual section"
      id="rituale"
      aria-labelledby="ritual-title"
    >
      <div className="shell ritual__grid">
        <figure className="ritual__image" data-reveal>
          <Image
            src={images.interior}
            alt="LACACCINO-Kaffee auf einem runden Tisch neben einem dunklen Sessel im warmen Licht"
            fill
            sizes="(max-width: 700px) 100vw, 48vw"
          />
          <figcaption>
            Ein möglicher Moment. Eine räumliche Designstudie.
          </figcaption>
        </figure>
        <div className="ritual__copy" data-reveal>
          <p className="eyebrow">02 / Das Ritual</p>
          <h2 id="ritual-title">
            Kurz unterwegs.
            <br />
            <em>Ganz bei dir.</em>
          </h2>
          <p>
            Ein guter Moment muss nicht lange dauern.
            <br />
            Nur dir gehören.
          </p>
          <ol className="ritual-steps">
            {moments.map(([title, description], index) => (
              <li key={title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
