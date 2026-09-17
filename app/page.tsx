import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Header } from "@/components/Header";
import { VisionMap } from "@/components/VisionMap";
import { CoffeeStorm } from "@/components/CoffeeStorm";
import { MotionDirector } from "@/components/MotionDirector";
import { GoldWaves } from "@/components/GoldWaves";
import { RitualJourney } from "@/components/RitualJourney";
import { getVisionGeometry } from "@/lib/vision-geometry";
import { GoldSparkle, WordmarkDust } from "@/components/GoldAtmosphere";

import { images } from "@/lib/images";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">Zum Inhalt springen</a>
      <CoffeeStorm />
      <MotionDirector />
      <GoldSparkle />
      <Header />
      <main id="main-content">
      <section className="hero" id="start" aria-labelledby="hero-title">
        <div className="hero__glow" data-ambient aria-hidden="true" />
        <div className="hero__stage shell">
          <div className="hero__overline"><span>Die neue Kultur des Coffee to go</span><span>Geplanter Markenstart 2029</span></div>
          <div className="hero__wordmark-wrap"><p className="hero__wordmark">LACACCINO</p><WordmarkDust /></div>
          <div className="hero__composition">
            <div className="hero__content">
              <p className="eyebrow hero__eyebrow">Aus einem goldenen<br />Kaffeesturm geboren.</p>
              <h1 id="hero-title">Ein Moment.<br /><em>Ganz deiner.</em></h1>
              <p className="hero__intro">Kaffee to go, als Luxus gedacht. Eine neue Markenwelt für die leisen Pausen, die im Gedächtnis bleiben.</p>
              <a id="discover" className="button button--light" href="#marke">
                <span>Die Welt von LACACCINO entdecken</span> <ArrowDownRight aria-hidden="true" size={18} />
              </a>
              <p className="launch-note"><span>2029</span> Geplanter Markenstart</p>
            </div>
            <figure className="hero__product">
              <div className="hero__photograph">
                <Image src={images.hero} alt="Schwarze LACACCINO-Espressomaschine mit goldenen Wellenlinien und glänzenden Siebträgern" fill preload sizes="(max-width: 900px) 100vw, 65vw" className="hero__image" />
              </div>
              <figcaption><span>Die Kunst des Augenblicks</span><span>Designkonzept / 01</span></figcaption>
            </figure>
          </div>
          <div className="hero__bottom"><a href="#marke"><ArrowDown size={15} aria-hidden="true" /> Weiterscrollen & entdecken</a><span>Leise im Auftritt. Bleibend im Gefühl.</span></div>
        </div>
        <div className="hero__waves" data-ambient><GoldWaves /></div>
      </section>

      <section className="brand section" id="marke" aria-labelledby="brand-title">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <div data-reveal>
              <p className="eyebrow">01 — Die Marke</p>
              <h2 id="brand-title">Genuss bekommt<br />seinen eigenen Raum.</h2>
            </div>
            <p className="lead" data-reveal data-delay="140">
              LACACCINO denkt Kaffee als bewusst gestalteten Moment — ruhig, warm und mit einem feinen Gespür für Details.
            </p>
          </div>

          <div className="brand-story">
            <div className="brand-story__image reveal-frame" data-reveal data-drift>
              <Image
                src={images.interior}
                alt="Dunkler Stuhl und runder Tisch mit LACACCINO-Tasse in einem ruhigen Interieur"
                fill
                sizes="(max-width: 800px) 100vw, 65vw"
                className="cover-image"
              />
              <span className="image-index">01 / Raum für Genuss</span>
            </div>
            <div className="brand-story__copy" data-reveal data-delay="160">
              <span className="gold-rule" data-line aria-hidden="true" />
              <h3>Design, das<br />zur Ruhe kommt.</h3>
              <p>
                Tiefe Töne, weiche Linien und klare Formen geben dem Ritual eine Bühne, ohne sich in den Vordergrund zu drängen.
              </p>
              <p>
                Im Zentrum steht nicht das Tempo. Sondern der Augenblick dazwischen.
              </p>
              <p>Unsere Vision: eine Luxusmarke für Kaffee to go. Mit einer unverwechselbaren Designsprache, die den Genuss begleitet — wohin dein Tag dich führt.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="manifesto" aria-label="Markenhaltung">
        <GoldWaves className="manifesto__waves" />
        <div className="shell manifesto__inner">
          <p className="eyebrow">Unsere Haltung</p>
          <blockquote data-reveal>
            „Weniger Eile.<br />Mehr von dem, was bleibt.“
          </blockquote>
          <p>Ein feiner Rahmen für persönliche Genussmomente.</p>
        </div>
      </section>

      <section className="rituals section" id="rituale" aria-labelledby="rituals-title">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <div data-reveal>
              <p className="eyebrow">02 — Kaffee & Rituale</p>
              <h2 id="rituals-title">Das Besondere<br />liegt <em>im Moment.</em></h2>
            </div>
            <p className="lead" data-reveal data-delay="150">Vom ersten Duft bis zum letzten Schluck. Drei kleine Kapitel für eine Pause, die ganz dir gehört.</p>
          </div>
          <RitualJourney />
        </div>
      </section>

      <section className="collection section" id="kollektion" aria-labelledby="collection-title">
        <div className="shell">
          <div className="section-heading section-heading--collection">
            <div data-reveal>
              <p className="eyebrow">03 — Kollektion</p>
              <h2 id="collection-title">Eine Markenwelt<br />nimmt Form an.</h2>
            </div>
            <p className="concept-note" data-reveal data-delay="160">
              Einblicke in Designkonzepte einer entstehenden Kollektion — noch kein Produktangebot.
            </p>
          </div>

          <div className="editorial-grid">
            <article className="editorial-card editorial-card--city" data-reveal>
              <div className="editorial-card__image">
                <Image
                  src={images.city}
                  alt="Drei LACACCINO City-Edition-Becher mit Motiven aus Stuttgart, Mallorca und Bangkok"
                  fill
                  sizes="(max-width: 800px) 100vw, 57vw"
                  className="cover-image"
                />
              </div>
              <div className="editorial-card__label">
                <span>01</span>
                <div><h3>City Editions</h3><p>Orte, übersetzt in Farbe und Linie.</p></div>
              </div>
            </article>

            <article className="editorial-card editorial-card--cups" data-reveal data-delay="120">
              <div className="editorial-card__image">
                <Image
                  src={images.cups}
                  alt="Entwürfe schwarzer LACACCINO Mehrwegbecher mit goldenen Linien"
                  fill
                  sizes="(max-width: 800px) 100vw, 32vw"
                  className="cover-image"
                />
              </div>
              <div className="editorial-card__label">
                <span>02</span>
                <div><h3>Signature Cups</h3><p>Ein ruhiger Begleiter für unterwegs.</p></div>
              </div>
            </article>

            <article className="editorial-card editorial-card--syrup" data-reveal>
              <div className="editorial-card__image">
                <Image
                  src={images.syrups}
                  alt="Fünf LACACCINO Sirupflaschen in unterschiedlichen Farbtönen"
                  fill
                  sizes="(max-width: 800px) 100vw, 48vw"
                  className="cover-image"
                />
              </div>
              <div className="editorial-card__label editorial-card__label--light">
                <span>03</span>
                <div><h3>Flavour Notes</h3><p>Nuancen für das persönliche Ritual.</p></div>
              </div>
            </article>

            <article className="editorial-card editorial-card--biscuits" data-reveal data-delay="120">
              <div className="editorial-card__image">
                <Image
                  src={images.biscuits}
                  alt="LACACCINO Kaffeegebäck in schwarzer Verpackung neben einer Tasse"
                  fill
                  sizes="(max-width: 800px) 100vw, 40vw"
                  className="cover-image"
                />
              </div>
              <div className="editorial-card__label editorial-card__label--light">
                <span>04</span>
                <div><h3>Coffee Biscuits</h3><p>Ein kleines Detail zum Kaffee.</p></div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="vision section" id="vision" aria-labelledby="vision-title">
        <div className="shell">
          <div className="vision__heading" data-reveal>
            <p className="eyebrow">04 — Unsere Vision</p>
            <h2 id="vision-title">Eine Idee.<br />Viele Horizonte.</h2>
            <p>
              Diese Orte beschreiben eine Zukunftsvision der Markenwelt. Sie sind keine bestätigten oder angekündigten Filialen.
            </p>
          </div>
          <VisionMap geometry={getVisionGeometry()} />
        </div>
      </section>

      <section className="community section" id="dabei" aria-labelledby="community-title">
        <div className="shell community-grid">
          <div><p className="eyebrow">05 — In Verbindung bleiben</p><h2 id="community-title">Der Anfang.<br /><em>Mit dir.</em></h2><p className="community-intro">Begleite LACACCINO auf dem Weg zum geplanten Markenstart 2029.</p></div>
          <div className="community-card"><p className="eyebrow">Die Warteliste</p><h3>Von Anfang an dabei.</h3><p>Erstelle dein Konto, bestätige deine E-Mail-Adresse und trage dich in die Warteliste ein. Deine Anmeldung kannst du dort jederzeit zurücknehmen.</p><Link className="button" href="/konto">Zum Konto & zur Warteliste <ArrowUpRight aria-hidden="true" size={17} /></Link><Link className="text-link" href="/kontakt">Eine Nachricht an LACACCINO</Link></div>
        </div>
      </section>

      <section className="closing" aria-labelledby="closing-title">
        <GoldWaves className="closing__waves" />
        <div className="shell closing__inner" data-reveal>
          <p className="eyebrow">Der Anfang eines Rituals</p>
          <h2 id="closing-title">LACACCINO</h2>
          <p>Ein Moment. Ganz deiner.</p>
          <a className="text-link" href="#start">
            Zurück nach oben <ArrowUpRight aria-hidden="true" size={17} />
          </a>
        </div>
      </section>

      </main>
      <footer className="footer">
        <div className="shell footer__inner">
          <a className="wordmark wordmark--footer" href="#start" aria-label="LACACCINO – zum Seitenanfang">LACACCINO</a>
          <nav aria-label="Fußnavigation">
            <a href="#marke">Die Marke</a>
            <a href="#rituale">Kaffee & Rituale</a>
            <a href="#kollektion">Kollektion</a>
            <a href="#vision">Unsere Vision</a>
            <Link href="/kontakt">Kontakt</Link>
            <Link href="/konto">Mein Konto</Link>
          </nav>
          <p>Markenstudie · Designkonzepte</p>
        </div>
      </footer>
    </>
  );
}
