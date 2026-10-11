"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Sighting } from "@/lib/types";

export function MapCanvas({
  sightings,
  selectedId,
  onSelect,
}: {
  sightings: Sighting[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    const onSelectRef = onSelect;
    void (async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default;
      if (cancelled || !holder.current) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      const map = L.map(holder.current, { scrollWheelZoom: false, zoomControl: true });
      mapRef.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
        maxZoom: 19,
      }).addTo(map);
      const points: [number, number][] = [];
      for (const sighting of sightings) {
        if (sighting.lat == null || sighting.lng == null) continue;
        points.push([sighting.lat, sighting.lng]);
        const selected = sighting.id === selectedId;
        if (sighting.precision === "coarse") {
          L.circle([sighting.lat, sighting.lng], {
            radius: 11000,
            color: "#c4622d",
            weight: selected ? 2.5 : 1.5,
            fillColor: "#c4622d",
            fillOpacity: selected ? 0.22 : 0.12,
          }).addTo(map);
        }
        const marker = L.marker([sighting.lat, sighting.lng], {
          icon: L.divIcon({
            className: "field-pin",
            html: `<span style="display:block;width:${selected ? 18 : 14}px;height:${selected ? 18 : 14}px;border-radius:999px;background:${sighting.precision === "coarse" ? "#c4622d" : "#1e4a38"};border:2px solid #fffaf3;box-shadow:0 2px 8px rgba(18,36,28,.35)"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
        }).addTo(map);
        marker.on("click", () => onSelectRef(sighting.id));
      }
      if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 8 });
      else if (points.length === 1) map.setView(points[0], 8);
      else map.setView([9.1, 8.6], 6);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [sightings, selectedId, onSelect]);

  return <div ref={holder} className="h-full w-full" />;
}
