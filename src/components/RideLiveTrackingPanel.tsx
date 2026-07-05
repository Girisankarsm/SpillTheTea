"use client";

import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import {
  fetchRideLiveLocations,
  mapRideLiveLocationRow,
  upsertRideLiveLocation,
} from "@/lib/backend/ride-location-remote";
import type { RideLiveLocations } from "@/lib/types/ride-location";
import type { RideWithOffers } from "@/lib/types/ride";
import type { BackendClient } from "@/lib/backend/client-types";

import "leaflet/dist/leaflet.css";

const CARTO_VOYAGER =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

type RideLiveTrackingPanelProps = {
  ride: RideWithOffers;
  backend: BackendClient;
  currentUserId: string;
  isRider: boolean;
  isDriver: boolean;
};

function carIcon(): L.DivIcon {
  return L.divIcon({
    className: "snap-tea-pin-wrap",
    html: `<div class="snap-tea-pin snap-tea-pin--hot" aria-hidden="true">
      <span class="snap-tea-pin__bubble">🚗</span>
      <span class="snap-tea-pin__tail"></span>
    </div>`,
    iconSize: [48, 56],
    iconAnchor: [24, 52],
  });
}

function personIcon(label: string): L.DivIcon {
  return L.divIcon({
    className: "snap-tea-pin-wrap",
    html: `<div class="snap-tea-pin" aria-hidden="true">
      <span class="snap-tea-pin__bubble">${label}</span>
      <span class="snap-tea-pin__tail"></span>
    </div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
  });
}

function FitTrackingPoints({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15, { animate: true });
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
  }, [map, points]);
  return null;
}

function formatUpdated(ms: number): string {
  const sec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

export function RideLiveTrackingPanel({
  ride,
  backend,
  currentUserId,
  isRider,
  isDriver,
}: RideLiveTrackingPanelProps) {
  const [locations, setLocations] = useState<RideLiveLocations>({ rider: null, driver: null });
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);
  const role = isRider ? "rider" : "driver";

  const reload = useCallback(async () => {
    try {
      setLocations(await fetchRideLiveLocations(backend, ride.id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load live locations.");
    }
  }, [backend, ride.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const channel = backend
      .channel(`ride-live-${ride.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ride_live_locations",
          filter: `ride_id=eq.${ride.id}`,
        },
        (payload) => {
          const row = payload.new as Parameters<typeof mapRideLiveLocationRow>[0] | null;
          if (!row?.role) return;
          const mapped = mapRideLiveLocationRow(row);
          setLocations((prev) => ({
            ...prev,
            [mapped.role]: mapped.sharing ? mapped : null,
          }));
        },
      )
      .subscribe();

    return () => {
      void backend.removeChannel(channel);
    };
  }, [backend, ride.id]);

  useEffect(() => {
    const mine = role === "rider" ? locations.rider : locations.driver;
    if (mine?.userId === currentUserId) {
      setSharing(mine.sharing);
    }
  }, [locations, role, currentUserId]);

  useEffect(() => {
    if (!sharing) {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError("Location is not available on this device.");
      setSharing(false);
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        void upsertRideLiveLocation(backend, ride.id, role, lat, lng, true).catch(() => {
          /* ignore transient errors */
        });
      },
      () => {
        setError("Could not access your location.");
        setSharing(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, [sharing, backend, ride.id, role]);

  async function toggleSharing() {
    const next = !sharing;
    setSharing(next);
    setError(null);

    if (!next) {
      try {
        const current = locations[role];
        const lat = current?.lat ?? ride.pickupLat;
        const lng = current?.lng ?? ride.pickupLng;
        if (lat != null && lng != null) {
          await upsertRideLiveLocation(backend, ride.id, role, lat, lng, false);
        }
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not stop sharing.");
        setSharing(true);
      }
      return;
    }
  }

  const otherRole = isRider ? "driver" : "rider";
  const other = locations[otherRole];
  const mine = locations[role];
  const otherLabel = isRider ? "Driver" : "Rider";

  const mapPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (ride.pickupLat != null && ride.pickupLng != null) {
      pts.push([ride.pickupLat, ride.pickupLng]);
    }
    if (ride.dropLat != null && ride.dropLng != null) {
      pts.push([ride.dropLat, ride.dropLng]);
    }
    if (locations.rider?.sharing) {
      pts.push([locations.rider.lat, locations.rider.lng]);
    }
    if (locations.driver?.sharing) {
      pts.push([locations.driver.lat, locations.driver.lng]);
    }
    return pts;
  }, [ride, locations]);

  const center: LatLngExpression =
    mapPoints[0] ??
    (ride.pickupLat != null && ride.pickupLng != null
      ? [ride.pickupLat, ride.pickupLng]
      : [12.9716, 77.5946]);

  const routeLine =
    ride.pickupLat != null &&
    ride.pickupLng != null &&
    ride.dropLat != null &&
    ride.dropLng != null
      ? ([
          [ride.pickupLat, ride.pickupLng],
          [ride.dropLat, ride.dropLng],
        ] as LatLngExpression[])
      : null;

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">Live tracking</h2>
          <p className="mt-1 text-xs text-subtle">
            {isDriver
              ? "See where the rider is when they share location."
              : "Share location so your driver can find you at pickup."}
          </p>
        </div>
        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
          🚗 En route
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-border">
        <MapContainer center={center} zoom={14} scrollWheelZoom className="h-56 w-full">
          <TileLayer attribution='&copy; <a href="https://carto.com/">CARTO</a>' url={CARTO_VOYAGER} />
          <FitTrackingPoints points={mapPoints} />
          {routeLine ? (
            <Polyline
              positions={routeLine}
              pathOptions={{ color: "#16a34a", weight: 3, opacity: 0.45, dashArray: "6 8" }}
            />
          ) : null}
          {ride.pickupLat != null && ride.pickupLng != null ? (
            <Marker
              position={[ride.pickupLat, ride.pickupLng]}
              icon={personIcon("A")}
              zIndexOffset={100}
            />
          ) : null}
          {ride.dropLat != null && ride.dropLng != null ? (
            <Marker
              position={[ride.dropLat, ride.dropLng]}
              icon={personIcon("B")}
              zIndexOffset={100}
            />
          ) : null}
          {locations.rider?.sharing ? (
            <Marker
              position={[locations.rider.lat, locations.rider.lng]}
              icon={personIcon("👤")}
              zIndexOffset={400}
            />
          ) : null}
          {locations.driver?.sharing ? (
            <Marker position={[locations.driver.lat, locations.driver.lng]} icon={carIcon()} zIndexOffset={500} />
          ) : null}
        </MapContainer>
      </div>

      <div className="mt-3 space-y-2 rounded-lg border border-border bg-background px-3 py-2.5 text-xs">
        <p className="text-subtle">
          <span className="font-bold text-foreground">Pickup:</span> {ride.pickupLabel}
        </p>
        {other?.sharing ? (
          <p className="text-brand">
            🚗 {otherLabel} location updated {formatUpdated(other.updatedAt)}
          </p>
        ) : (
          <p className="text-subtle">
            Waiting for {otherLabel.toLowerCase()} to share location…
          </p>
        )}
        {mine?.sharing ? (
          <p className="text-subtle">You are sharing your live location.</p>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-danger-text">{error}</p> : null}

      <button
        type="button"
        onClick={() => void toggleSharing()}
        className={`mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-bold ${
          sharing
            ? "border border-danger-border bg-danger-bg text-danger-text"
            : "bg-brand text-white hover:opacity-90"
        }`}
      >
        {sharing ? "Stop sharing my location" : "Share my live location"}
      </button>
    </section>
  );
}
