"use client";

import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import Link from "next/link";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { RideWithOffers } from "@/lib/types/ride";

import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngExpression = [12.9716, 77.5946];

const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

function fixLeafletIcons(): void {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
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

function ridePinIcon(): L.DivIcon {
  return L.divIcon({
    className: "snap-tea-pin-wrap",
    html: `<div class="snap-tea-pin" aria-hidden="true">
      <span class="snap-tea-pin__bubble">🚗</span>
      <span class="snap-tea-pin__tail"></span>
    </div>`,
    iconSize: [48, 56],
    iconAnchor: [24, 52],
    popupAnchor: [0, -52],
  });
}

function FitRides({ rides }: { rides: RideWithOffers[] }) {
  const map = useMap();
  useEffect(() => {
    const points = rides
      .filter((ride) => ride.pickupLat != null && ride.pickupLng != null)
      .map((ride) => [ride.pickupLat!, ride.pickupLng!] as [number, number]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [map, rides]);
  return null;
}

type RidesMapProps = {
  rides: RideWithOffers[];
  userLat?: number | null;
  userLng?: number | null;
};

export function RidesMap({ rides, userLat, userLng }: RidesMapProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const mappable = rides.filter(
    (ride) => ride.pickupLat != null && ride.pickupLng != null && ride.status === "open",
  );

  const center: LatLngExpression =
    userLat != null && userLng != null
      ? [userLat, userLng]
      : mappable[0]?.pickupLat != null && mappable[0]?.pickupLng != null
        ? [mappable[0].pickupLat, mappable[0].pickupLng]
        : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-border shadow-sm">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-[min(50vh,360px)] min-h-[260px] w-full"
      >
        <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url={CARTO_VOYAGER} />
        <FitRides rides={mappable} />
        {mappable.map((ride) => (
          <Marker
            key={ride.id}
            position={[ride.pickupLat!, ride.pickupLng!]}
            icon={ridePinIcon()}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-bold">{ride.pickupLabel} → {ride.dropLabel}</p>
                <p className="text-xs text-stone-600">by {ride.riderName}</p>
                <Link href={`/rides/${ride.id}`} className="text-xs font-bold text-brand hover:underline">
                  View request →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
