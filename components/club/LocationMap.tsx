import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryObject, Topology } from "topojson-specification";
import worldData from "world-atlas/countries-110m.json";
import type { Location } from "@/lib/club/types";

// Locally bundled geography: no third-party map request or tracking cookie.
export function LocationMap({ locations }: { locations: Location[] }) {
  const confirmed = locations.filter(
    (l) =>
      l.status === "open" &&
      l.confirmed &&
      l.latitude !== null &&
      l.longitude !== null,
  );
  if (!confirmed.length) return null;
  const topology = worldData as unknown as Topology<{
    countries: GeometryObject;
  }>;
  const countries = feature(topology, topology.objects.countries);
  const projection = geoNaturalEarth1().fitExtent(
    [
      [18, 18],
      [982, 482],
    ],
    countries,
  );
  return (
    <section className="club-panel club-location-map">
      <div className="club-section-heading">
        <h2>Auf der Karte.</h2>
        <span>Alle Orte auch in der Liste darunter</span>
      </div>
      <svg viewBox="0 0 1000 500" role="group" aria-labelledby="club-map-title">
        <title id="club-map-title">Karte der bestätigten Standorte</title>
        <path
          d={geoPath(projection)(countries) || ""}
          fill="#3b3026"
          stroke="#6b5842"
          strokeWidth=".5"
        />
        {confirmed.map((l) => {
          const point = projection([Number(l.longitude), Number(l.latitude)])!;
          return (
            <a
              key={l.id}
              href={"#location-" + l.id}
              aria-label={l.name + " in der Standortliste"}
            >
              <circle cx={point[0]} cy={point[1]} r="16" fill="transparent" />
              <circle
                cx={point[0]}
                cy={point[1]}
                r="5"
                fill="#e4c48a"
                stroke="#18120e"
                strokeWidth="2"
              />
            </a>
          );
        })}
      </svg>
      <p className="club-small">
        Übersichtskarte · Für Straßendetails öffne „Karte & Anfahrt“ beim
        jeweiligen Standort.
      </p>
    </section>
  );
}
