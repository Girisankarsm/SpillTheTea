"use client";

import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { Fragment, useEffect, useMemo } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import Link from "next/link";
import { distanceKm, formatDistanceKm } from "@/lib/geo";
import {
  hotspotRadiusMeters,
  isNearby,
  isPlottable,
  NEARBY_RADIUS_KM,
} from "@/lib/explore-map-utils";
import type { Topic } from "@/lib/types";
import type { RideWithOffers } from "@/lib/types/ride";

const FALLBACK_CENTER: LatLngExpression = [19.076, 72.8777];

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

function ridePinIcon(): L.DivIcon {
  return L.divIcon({
    className: "snap-tea-pin-wrap",
    html: `<div class="snap-tea-pin snap-tea-pin--ride" aria-hidden="true">
      <span class="snap-tea-pin__bubble">🚗</span>
      <span class="snap-tea-pin__tail"></span>
    </div>`,
    iconSize: [48, 56],
    iconAnchor: [24, 52],
    popupAnchor: [0, -52],
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

function FocusOnUser({
  userLocate,
  focusPoints,
}: {
  userLocate: { lat: number; lng: number } | null;
  focusPoints: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocate) return;

    const points: [number, number][] = [
      [userLocate.lat, userLocate.lng],
      ...focusPoints,
    ];

    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
      return;
    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [56, 56],
      maxZoom: 15,
      animate: true,
    });
  }, [userLocate, focusPoints, map]);

  return null;
}

type ExploreMapProps = {
  topics: Topic[];
  rides?: RideWithOffers[];
  topicActivity?: Record<string, number>;
  hotThreshold: number;
  onViewportCenter: (lat: number, lng: number) => void;
  userLocate?: { lat: number; lng: number } | null;
  showTea?: boolean;
  showRides?: boolean;
  nearbyOnly?: boolean;
};

export function ExploreMap({
  topics,
  rides = [],
  topicActivity = {},
  hotThreshold,
  onViewportCenter,
  userLocate = null,
  showTea = true,
  showRides = true,
  nearbyOnly = true,
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

  const rideIcon = useMemo(() => ridePinIcon(), []);

  const plottableTopics = useMemo(() => {
    return topics.filter((topic) => {
      if (!isPlottable(topic.lat, topic.lng)) return false;
      if (!nearbyOnly || !userLocate) return true;
      return isNearby(topic.lat, topic.lng, userLocate.lat, userLocate.lng);
    });
  }, [topics, userLocate, nearbyOnly]);

  const plottableRides = useMemo(() => {
    return rides.filter((ride) => {
      if (ride.status !== "open") return false;
      if (ride.pickupLat == null || ride.pickupLng == null) return false;
      if (!isPlottable(ride.pickupLat, ride.pickupLng)) return false;
      if (!nearbyOnly || !userLocate) return true;
      return isNearby(ride.pickupLat, ride.pickupLng, userLocate.lat, userLocate.lng);
    });
  }, [rides, userLocate, nearbyOnly]);

  const focusPoints = useMemo(() => {
    const points: [number, number][] = [];
    if (showTea) {
      for (const topic of plottableTopics) {
        points.push([topic.lat, topic.lng]);
      }
    }
    if (showRides) {
      for (const ride of plottableRides) {
        points.push([ride.pickupLat!, ride.pickupLng!]);
      }
    }
    return points;
  }, [plottableTopics, plottableRides, showTea, showRides]);

  const initialCenter: LatLngExpression = userLocate
    ? [userLocate.lat, userLocate.lng]
    : FALLBACK_CENTER;

  return (
    <MapContainer
      center={initialCenter}
      zoom={userLocate ? 15 : 13}
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
      <FocusOnUser userLocate={userLocate} focusPoints={focusPoints} />

      {userLocate ? (
        <>
          <Circle
            center={[userLocate.lat, userLocate.lng]}
            radius={NEARBY_RADIUS_KM * 1000}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.06,
              weight: 1.5,
              dashArray: "6 8",
            }}
          />
          <Circle
            center={[userLocate.lat, userLocate.lng]}
            radius={80}
            pathOptions={{
              color: "#3b82f6",
              fillColor: "#60a5fa",
              fillOpacity: 0.18,
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
            zIndexOffset={2000}
          />
        </>
      ) : null}

      {showTea
        ? plottableTopics.map((topic) => {
            const msgs = topicActivity[topic.id] ?? 0;
            const trending = msgs >= hotThreshold;
            const radius = hotspotRadiusMeters(msgs, trending);

            return (
              <Fragment key={topic.id}>
                <Circle
                  center={[topic.lat, topic.lng]}
                  radius={radius}
                  pathOptions={{
                    color: trending ? "#ff6b35" : "#ffc800",
                    fillColor: trending ? "#ff9f43" : "#ffe066",
                    fillOpacity: trending ? 0.22 : 0.16,
                    weight: 1,
                    className: trending ? "snap-hotspot" : undefined,
                  }}
                />
                <Marker
                  position={[topic.lat, topic.lng]}
                  icon={pinIcons(trending)}
                  zIndexOffset={trending ? 500 : 100}
                >
                  <Popup className="snap-map-popup" closeButton={false}>
                    <div className="snap-popup-card">
                      <p className="snap-popup-card__title">{topic.title}</p>
                      <p className="snap-popup-card__meta">
                        {msgs} {msgs === 1 ? "message" : "messages"}
                        {trending ? " · 🔥 trending" : ""}
                        {userLocate
                          ? ` · ${formatDistanceKm(
                              distanceKm(
                                userLocate.lat,
                                userLocate.lng,
                                topic.lat,
                                topic.lng,
                              ),
                            )}`
                          : ""}
                      </p>
                      <Link href={`/topics/${topic.id}`} className="snap-popup-card__cta">
                        Join discussion →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              </Fragment>
            );
          })
        : null}

      {showRides
        ? plottableRides.map((ride) => {
            const hasDrop =
              ride.dropLat != null &&
              ride.dropLng != null &&
              isPlottable(ride.dropLat, ride.dropLng);

            return (
              <Fragment key={ride.id}>
                {hasDrop ? (
                  <Polyline
                    positions={[
                      [ride.pickupLat!, ride.pickupLng!],
                      [ride.dropLat!, ride.dropLng!],
                    ]}
                    pathOptions={{
                      color: "#3b82f6",
                      weight: 3,
                      opacity: 0.65,
                      dashArray: "8 6",
                    }}
                  />
                ) : null}
                <Marker
                  position={[ride.pickupLat!, ride.pickupLng!]}
                  icon={rideIcon}
                  zIndexOffset={300}
                >
                  <Popup className="snap-map-popup" closeButton={false}>
                    <div className="snap-popup-card">
                      <p className="snap-popup-card__title">
                        {ride.pickupLabel} → {ride.dropLabel}
                      </p>
                      <p className="snap-popup-card__meta">
                        {ride.offers.length}{" "}
                        {ride.offers.length === 1 ? "offer" : "offers"}
                        {userLocate
                          ? ` · ${formatDistanceKm(
                              distanceKm(
                                userLocate.lat,
                                userLocate.lng,
                                ride.pickupLat!,
                                ride.pickupLng!,
                              ),
                            )}`
                          : ""}
                      </p>
                      <Link href={`/rides/${ride.id}`} className="snap-popup-card__cta">
                        View ride →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              </Fragment>
            );
          })
        : null}
    </MapContainer>
  );
}
