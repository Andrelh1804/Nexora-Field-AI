import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useListTechnicianLocations, useListOrderLocations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const techIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const orderIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const CITY_COORDS: Record<string, [number, number]> = {
  "São Paulo": [-23.5505, -46.6333],
  "Rio de Janeiro": [-22.9068, -43.1729],
  "Belo Horizonte": [-19.9191, -43.9386],
  "Brasília": [-15.7975, -47.8919],
  "Salvador": [-12.9714, -38.5014],
  "Curitiba": [-25.4284, -49.2733],
  "Porto Alegre": [-30.0346, -51.2177],
  "Manaus": [-3.1190, -60.0217],
  "Fortaleza": [-3.7172, -38.5434],
  "Recife": [-8.0476, -34.8770],
};

function getCityCoords(city?: string | null, state?: string | null): [number, number] {
  if (city && CITY_COORDS[city]) return CITY_COORDS[city];
  if (state === "SP") return [-23.5505, -46.6333];
  if (state === "RJ") return [-22.9068, -43.1729];
  if (state === "MG") return [-19.9191, -43.9386];
  return [-23.5505 + (Math.random() - 0.5) * 2, -46.6333 + (Math.random() - 0.5) * 2];
}

const RADIUS_OPTIONS = [5, 10, 20, 50];

const CATEGORY_COLORS: Record<string, string> = {
  fibra_optica: "bg-blue-500/20 text-blue-400",
  redes: "bg-purple-500/20 text-purple-400",
  cftv: "bg-orange-500/20 text-orange-400",
  automacao_industrial: "bg-yellow-500/20 text-yellow-400",
  infraestrutura: "bg-gray-500/20 text-gray-400",
  telecom: "bg-green-500/20 text-green-400",
};

export default function Mapa() {
  const [radius, setRadius] = useState<number | null>(null);
  const [showTechnicians, setShowTechnicians] = useState(true);
  const [showOrders, setShowOrders] = useState(true);
  const [centerCoords] = useState<[number, number]>([-23.5505, -46.6333]);

  const { data: techLocations = [] } = useListTechnicianLocations();
  const { data: orderLocations = [] } = useListOrderLocations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mapa Operacional</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Técnicos
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block ml-2" /> Chamados
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filtrar raio:</span>
              {RADIUS_OPTIONS.map(r => (
                <Button key={r} size="sm" variant={radius === r ? "default" : "outline"} onClick={() => setRadius(radius === r ? null : r)}>
                  {r} km
                </Button>
              ))}
              {radius && <Button size="sm" variant="ghost" onClick={() => setRadius(null)}>Limpar</Button>}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={showTechnicians} onChange={e => setShowTechnicians(e.target.checked)} className="rounded" />
                Técnicos ({techLocations.length})
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={showOrders} onChange={e => setShowOrders(e.target.checked)} className="rounded" />
                Chamados ({orderLocations.length})
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border" style={{ height: "600px" }}>
        <MapContainer center={centerCoords} zoom={6} style={{ height: "100%", width: "100%" }} className="z-0">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {radius && <Circle center={centerCoords} radius={radius * 1000} pathOptions={{ color: "#1A6FE8", fillOpacity: 0.05 }} />}

          {showTechnicians && techLocations.map((loc: any, i: number) => {
            const coords: [number, number] = [
              Number(loc.latitude) || getCityCoords(loc.city, loc.state)[0],
              Number(loc.longitude) || getCityCoords(loc.city, loc.state)[1],
            ];
            return (
              <Marker key={`tech-${loc.technician_id}-${i}`} position={coords} icon={techIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-base">{loc.name}</p>
                    <p className="text-gray-600">{loc.city}, {loc.state}</p>
                    {loc.rating && <p>⭐ {Number(loc.rating).toFixed(1)}</p>}
                    {loc.specialties?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{(loc.specialties as string[]).join(", ")}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {showOrders && orderLocations.map((order: any, i: number) => {
            const coords: [number, number] = getCityCoords(order.city, order.state);
            return (
              <Marker key={`order-${order.id}-${i}`} position={coords} icon={orderIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-bold text-base">{order.title}</p>
                    <p className="text-gray-600">{order.city}, {order.state}</p>
                    <p>💰 R$ {Number(order.value || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500 capitalize">{String(order.category).replace(/_/g, " ")}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Técnicos no Mapa</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-blue-400">{techLocations.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Chamados Ativos</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-400">{orderLocations.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Raio Selecionado</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{radius ? `${radius} km` : "—"}</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
