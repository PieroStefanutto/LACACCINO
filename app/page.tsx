import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { VisionMap } from "@/components/VisionMap";
import { MotionDirector } from "@/components/MotionDirector";
import { RitualJourney } from "@/components/RitualJourney";
import { getVisionGeometry } from "@/lib/vision-geometry";
import { GoldSparkle, WordmarkDust } from "@/components/GoldAtmosphere";
import { images } from "@/lib/images";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Zum Inhalt springen
      </a>
      <MotionDirector />
      <Header />
      <main id="main-content">
        <section className="hero shell" id="start" aria-labelledby="hero-title">
          <div className="hero__content">
            <p className="eyebrow">Coffee to go. Neu gedacht.</p>
            <h1 id="hero-title">
              Der Tag zieht weiter.
              <br />
              <em>
                Dein Moment
                <br /> bleibt.
              </em>
            </h1>
            <p className="hero__intro">
              Eine neue Perspektive auf Kaffee to go.
              <br />
              Für die kleine Pause mit eigenem Stil.
            </p>
            <Link className="button" href="/konto#warteliste">
              Zur Warteliste <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <p className="launch-note">
              <span className="material-dot" /> Marktstart 2029{" "}
              <span>in Planung</span>
            </p>
          </div>
          <figure className="hero__product">
            <div className="hero__photograph signature-crop">
              <Image
                src={images.cups}
                alt="Drei schwarze LACACCINO-Becher mit feinen goldenen Linien und schwarzen, cremefarbenen und goldenen Deckeln"
                fill
                preload
                sizes="(max-width: 700px) 130vw, 75vw"
              />
              <WordmarkDust />
              <GoldSparkle />
              <span className="image-index">LACACCINO — Signature</span>
            </div>
            <figcaption>
              <span>Eine Form. Eine Haltung.</span>
              <span>Designstudie / 01</span>
            </figcaption>
          </figure>
          <div className="hero__bottom">
            <a href="#marke">
              <ArrowDown size={14} aria-hidden="true" /> Die Idee entdecken
            </a>
            <span>Kaffee. Form. Augenblick.</span>
          </div>
        </section>

        <section
          className="brand section shell"
          id="marke"
          aria-labelledby="brand-title"
        >
          <p className="eyebrow section-index">01 / Die Marke</p>
          <div className="brand__copy" data-reveal>
            <p className="eyebrow">Unterwegs ist auch ein Ort.</p>
            <h2 id="brand-title">
              Nicht jeder Moment
              <br />
              braucht <em>einen Anlass.</em>
            </h2>
            <p>
              Zwischen zwei Terminen. Auf dem Weg nach Hause. Oder einfach, weil
              gerade Zeit ist. LACACCINO entsteht für diese kleinen
              Unterbrechungen des Alltags.
            </p>
            <p className="brand__signature">
              Eine Marke im Entstehen. Mit Sinn für das Wesentliche.
            </p>
          </div>
        </section>

        <RitualJourney />

        <section
          className="collection section shell"
          id="kollektion"
          aria-labelledby="collection-title"
        >
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow">03 / Die Form</p>
              <h2 id="collection-title">
                Ein Becher.
                <br />
                <em>Eine eigene Sprache.</em>
              </h2>
            </div>
            <p>
              Klare Formen, dunkle Oberflächen und eine feine goldene Linie. Ein
              erster Blick auf die geplante Designwelt.
            </p>
          </div>
          <div className="collection-grid">
            <figure data-reveal>
              <div className="collection-image signature-crop">
                <Image
                  src={images.cups}
                  alt="Signature-Becherentwürfe mit feinen goldenen Wellenlinien"
                  fill
                  sizes="(max-width: 700px) 130vw, 65vw"
                />
              </div>
              <figcaption>
                <div>
                  <span className="eyebrow">01 / Signature</span>
                  <h3>Auf das Wesentliche reduziert.</h3>
                </div>
                <span className="caption-tag">Designstudie</span>
              </figcaption>
            </figure>
            <figure data-reveal>
              <div className="collection-image">
                <Image
                  src={images.city}
                  alt="Drei City-Edition-Becherentwürfe für Stuttgart, Mallorca und Bangkok"
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                />
              </div>
              <figcaption>
                <div>
                  <span className="eyebrow">02 / City Edition</span>
                  <h3>Inspiriert vom Unterwegssein.</h3>
                </div>
                <span className="caption-tag">Designstudie</span>
              </figcaption>
            </figure>
          </div>
          <p className="collection-note">
            Die gezeigten Entwürfe sind Teil der Markenentwicklung. Sortiment
            und Ausführung stehen noch nicht fest.
          </p>
        </section>

        <section
          className="vision section"
          id="vision"
          aria-labelledby="vision-title"
        >
          <div className="shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">04 / Der Horizont</p>
                <h2 id="vision-title">
                  Eine Idee.
                  <br />
                  <em>Mit weitem Blick.</em>
                </h2>
              </div>
              <p>
                LACACCINO ist für unterwegs gedacht. Sechs Orte dienen als
                Inspiration für die Markenwelt – als gedankliche Horizonte, ohne
                angekündigte Standorte.
              </p>
            </div>
            <details className="vision-disclosure">
              <summary>
                <span>Die Orte unserer Inspiration</span>
                <span>
                  06 Horizonte <Plus size={19} aria-hidden="true" />
                </span>
              </summary>
              <VisionMap geometry={getVisionGeometry()} />
            </details>
          </div>
        </section>

        <section
          className="invitation section"
          aria-labelledby="invitation-title"
        >
          <div className="shell invitation__inner" data-reveal>
            <p className="eyebrow">Marktstart 2029 / in Planung</p>
            <h2 id="invitation-title">
              Am Anfang <em>dabei.</em>
            </h2>
            <p>
              Erfahre per E-Mail, wenn es Neuigkeiten zum geplanten Start gibt.
              Mit deinem Konto kannst du deinen Platz auf der Warteliste
              jederzeit verwalten.
            </p>
            <Link className="button button--light" href="/konto#warteliste">
              Zur Warteliste <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <p className="invitation__note">
              Für bestehende, bestätigte Konten. Neue Registrierungen öffnen zu
              einem späteren Zeitpunkt.
            </p>
          </div>
        </section>
      </main>
      <footer className="site-footer shell">
        <div className="footer-top">
          <Link className="footer-brand" href="/">
            LACACCINO
          </Link>
          <p>
            Der Tag zieht weiter.
            <br />
            <em>Dein Moment bleibt.</em>
          </p>
          <nav aria-label="Footernavigation">
            <Link href="/kontakt">Kontakt</Link>
            <Link href="/konto">Mein Konto</Link>
            <a href="#start">Nach oben ↑</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} LACACCINO</span>
          <span>Eine Marke im Entstehen. Geplanter Marktstart 2029.</span>
        </div>
      </footer>
    </>
  );
}
