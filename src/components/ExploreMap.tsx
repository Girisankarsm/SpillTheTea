"use client";

import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Link from "next/link";
import type { Topic } from "@/lib/types";

const DEFAULT_CENTER: LatLngExpression = [19.076, 72.8777];

const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

function fixLeafletIcons(): void {
  const proto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: string;
  };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

function teaPinIcon(hot: boolean): L.DivIcon {
  const size = hot ? 56 : 48;
  const emoji = hot ? "🔥" : "🍵";
  return L.divIcon({
    className: "snap-tea-pin-wrap",
    html: `<div class="snap-tea-pin ${hot ? "snap-tea-pin--hot" : ""}" aria-hidden="true">
      <span class="snap-tea-pin__bubble">${emoji}</span>
      <span class="snap-tea-pin__tail"></span>
    </div>`,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 4],
    popupAnchor: [0, -(size + 4)],
  });
}

function ViewportReporter({
  onMoveEnd,
}: {
  onMoveEnd: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  useMapEvents({
    moveend() {
      const c = map.getCenter();
      onMoveEnd(c.lat, c.lng);
    },
    load() {
      const c = map.getCenter();
      onMoveEnd(c.lat, c.lng);
    },
  });
  return null;
}

function Recenter({
  lat,
  lng,
}: {
  lat: number | null;
  lng: number | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

type ExploreMapProps = {
  topics: Topic[];
  topicActivity?: Record<string, number>;
  topicJoinCounts?: Record<string, number>;
  hotThreshold: number;
  onViewportCenter: (lat: number, lng: number) => void;
  userLocate?: { lat: number; lng: number } | null;
};

export function ExploreMap({
  topics,
  topicActivity = {},
  hotThreshold,
  onViewportCenter,
  userLocate,
}: ExploreMapProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const pinIcons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    return (hot: boolean) => {
      const key = hot ? "hot" : "normal";
      if (!cache.has(key)) cache.set(key, teaPinIcon(hot));
      return cache.get(key)!;
    };
  }, []);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={14}
      className="snap-map z-0 h-full min-h-[320px] w-full"
      scrollWheelZoom
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        attribution=""
        url={CARTO_VOYAGER}
        className="snap-map-tiles"
      />
      <ViewportReporter onMoveEnd={onViewportCenter} />
      <Recenter lat={userLocate?.lat ?? null} lng={userLocate?.lng ?? null} />

      {userLocate ? (
        <>
          <Circle
            center={[userLocate.lat, userLocate.lng]}
            radius={80}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#60a5fa",
              fillOpacity: 0.15,
              weight: 2,
              className: "snap-user-halo",
            }}
          />
          <Marker
            position={[userLocate.lat, userLocate.lng]}
            icon={L.divIcon({
              className: "snap-user-pin-wrap",
              html: `<div class="snap-user-pin"><span class="snap-user-pin__core"></span></div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            })}
            zIndexOffset={1000}
          />
        </>
      ) : null}

      {topics.map((t) => {
        const msgs = topicActivity[t.id] ?? 0;
        const trending = msgs >= hotThreshold;
        return (
          <Marker
            key={t.id}
            position={[t.lat, t.lng]}
            icon={pinIcons(trending)}
            zIndexOffset={trending ? 500 : 100}
          >
            <Popup className="snap-map-popup" closeButton={false}>
              <div className="snap-popup-card">
                <p className="snap-popup-card__title">{t.title}</p>
                <p className="snap-popup-card__meta">
                  {msgs} {msgs === 1 ? "message" : "messages"}
                  {trending ? " · 🔥 hot" : ""}
                </p>
                <Link href={`/topics/${t.id}`} className="snap-popup-card__cta">
                  Spill the tea →
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
