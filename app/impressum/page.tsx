import {
  LegalDraftNote,
  LegalPage,
  OperatorContact,
} from "@/components/LegalPage";

export const metadata = {
  title: "Impressum | LACACCINO",
  description: "Anbieterkennzeichnung und Kontaktdaten von LACACCINO.",
};

export default function Imprint() {
  return (
    <LegalPage
      title="Impressum"
      intro="Angaben zum Anbieter dieser Website nach § 5 DDG."
    >
      <LegalDraftNote />
      <section>
        <h2>Anbieter</h2>
        <p>LACACCINO ist ein Markenprojekt von:</p>
        <OperatorContact />
      </section>
      <section>
        <h2>Aufsichtsbehörde</h2>
        <p>
          Für den Betrieb des Dächle – das schwäbische Wirtshaus ist im
          bestehenden Firmenimpressum folgende Aufsichtsbehörde angegeben:
          Gewerbeamt Lauffen / Neckar.
        </p>
      </section>
      <section>
        <h2>Zum Markenauftritt</h2>
        <p>
          Der Marktstart von LACACCINO ist für 2029 geplant. Die abgebildeten
          Produkte und Räume sind Designstudien. Die genannten Orte dienen der
          Inspiration und sind keine bestehenden oder angekündigten Filialen.
          Auf dieser Website werden derzeit keine Produkte verkauft oder
          kostenpflichtigen Bestellungen entgegengenommen.
        </p>
      </section>
    </LegalPage>
  );
}
