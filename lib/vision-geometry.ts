import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryObject, Topology } from "topojson-specification";
import worldData from "world-atlas/countries-110m.json";
import { places } from "./places";

export type VisionGeometry = { path: string; points: { x: number; y: number }[]; europePath: string; europePoints: { x: number; y: number }[] };

// Natural Earth / world-atlas local data; calculated on the server, not sent as a JS library.
export function getVisionGeometry(): VisionGeometry {
  const topology = worldData as unknown as Topology<{ countries: GeometryObject }>;
  const countries = feature(topology, topology.objects.countries);
  const projection = geoNaturalEarth1().fitExtent([[24, 24], [976, 476]], countries);
  const europe = geoNaturalEarth1().center([5, 47]).scale(1000).translate([160, 110]).clipExtent([[1, 1], [319, 219]]);
  const project = (projector: typeof projection) => places.map((place) => {
    const point = projector([...place.coordinates]);
    return { x: point?.[0] ?? 0, y: point?.[1] ?? 0 };
  });
  return { path: geoPath(projection)(countries) ?? "", points: project(projection), europePath: geoPath(europe)(countries) ?? "", europePoints: project(europe) };
}
