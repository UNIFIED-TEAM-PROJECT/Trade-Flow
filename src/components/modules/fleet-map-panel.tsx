"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(() => import("react-leaflet").then((module) => module.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((module) => module.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((module) => module.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((module) => module.Polyline), { ssr: false });

type FleetMapData = {
  vans: Array<{
    id: string;
    name: string;
    registration: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    currentLocationLabel: string | null;
    jobs: Array<{ id: string; title: string; status: string }>;
    route: Array<{ latitude: number; longitude: number; label: string | null; recordedAt: string }>;
  }>;
  requests: Array<{
    id: string;
    title: string;
    urgency: string;
    isEmergency: boolean;
    latitude: number;
    longitude: number;
    address: string;
  }>;
};

export function FleetMapPanel() {
  const query = useQuery({
    queryKey: ["fleet-map-data"],
    queryFn: async () => apiFetch<{ data: FleetMapData }>("/api/ops/fleet-map"),
    refetchInterval: 20_000,
  });

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      const L = leaflet.default;
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  const data = query.data?.data;
  const center: [number, number] = [54.66, -3.38];

  return (
    <Card className="border-white/15 bg-slate-950/80">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white">Fleet and Dispatch Map (OpenStreetMap)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[420px] overflow-hidden rounded-xl border border-white/10">
          <MapContainer center={center} zoom={9} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {(data?.vans ?? [])
              .filter((van) => van.latitude !== null && van.longitude !== null)
              .map((van) => (
                <Marker key={van.id} position={[van.latitude as number, van.longitude as number]}>
                  <Popup>
                    <strong>{van.name}</strong>
                    <br />
                    {van.registration} | {van.status}
                    <br />
                    {van.currentLocationLabel ?? "Location feed active"}
                    <br />
                    Jobs today: {van.jobs.length}
                  </Popup>
                </Marker>
              ))}
            {(data?.requests ?? []).map((request) => (
              <Marker key={request.id} position={[request.latitude, request.longitude]}>
                <Popup>
                  <strong>{request.title}</strong>
                  <br />
                  {request.address}
                  <br />
                  {request.urgency}
                  {request.isEmergency ? " | emergency" : ""}
                </Popup>
              </Marker>
            ))}
            {(data?.vans ?? []).map((van) =>
              van.route.length > 1 ? (
                <Polyline
                  key={`route-${van.id}`}
                  positions={van.route.map((point) => [point.latitude, point.longitude] as [number, number])}
                  pathOptions={{ color: "#2D7FF9", weight: 3, opacity: 0.65 }}
                />
              ) : null,
            )}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
