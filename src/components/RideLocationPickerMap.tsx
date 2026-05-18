"use client";

import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngExpression = [12.9716, 77.5946];
const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export type MapPoint = { lat: number; lng: number };

type RideLocationPickerMapProps = {
  pickup: MapPoint | null;
  drop: MapPoint | null;
  activeField: "pickup" | "drop";
  onMapClick: (lat: number, lng: number) => void;
  userLocation?: MapPoint | null;
};

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

function pinIcon(label: string, active: boolean): L.DivIcon {
  return L.divIcon({
    className: "snap-tea-pin-wrap",
    html: `<div class="snap-tea-pin ${active ? "snap-tea-pin--hot" : ""}" aria-hidden="true">
      <span class="snap-tea-pin__bubble">${label}</span>
      <span class="snap-tea-pin__tail"></span>
    </div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
  });
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FitPoints({
  pickup,
  drop,
  userLocation,
}: {
  pickup: MapPoint | null;
  drop: MapPoint | null;
  userLocation?: MapPoint | null;
}) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (drop) points.push([drop.lat, drop.lng]);
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);

    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 15 });
  }, [map, pickup, drop, userLocation]);
  return null;
}

export function RideLocationPickerMap({
  pickup,
  drop,
  activeField,
  onMapClick,
  userLocation,
}: RideLocationPickerMapProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const pickupIcon = useMemo(() => pinIcon("A", activeField === "pickup"), [activeField]);
  const dropIcon = useMemo(() => pinIcon("B", activeField === "drop"), [activeField]);

  const center: LatLngExpression = userLocation
    ? [userLocation.lat, userLocation.lng]
    : pickup
      ? [pickup.lat, pickup.lng]
      : DEFAULT_CENTER;

  const routeLine =
    pickup && drop
      ? ([
          [pickup.lat, pickup.lng],
          [drop.lat, drop.lng],
        ] as LatLngExpression[])
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        className="h-52 w-full cursor-crosshair sm:h-56"
      >
        <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url={CARTO_VOYAGER} />
        <MapClickHandler onMapClick={onMapClick} />
        <FitPoints pickup={pickup} drop={drop} userLocation={userLocation} />
        {routeLine ? (
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: "#16a34a",
              weight: 4,
              opacity: 0.7,
              dashArray: "8 8",
            }}
          />
        ) : null}
        {pickup ? (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} zIndexOffset={400} />
        ) : null}
        {drop ? <Marker position={[drop.lat, drop.lng]} icon={dropIcon} zIndexOffset={500} /> : null}
        {userLocation ? (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: "snap-user-pin-wrap",
              html: `<div class="snap-user-pin"><span class="snap-user-pin__core"></span></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
            zIndexOffset={300}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
