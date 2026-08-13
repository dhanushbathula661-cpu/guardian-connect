import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Crosshair, MapTrifold, SpinnerGap } from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { EmptyState } from "@/components/phoenix/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentPosition, distanceKm } from "@/lib/phoenix/geolocation";

export const Route = createFileRoute("/_app/map")({
  head: () => ({
    meta: [
      { title: "Nearby Emergency Services — PHOENIX" },
      { name: "description", content: "Find police stations, hospitals and fire stations near you." },
      { property: "og:title", content: "Nearby Emergency Services — PHOENIX" },
      { property: "og:description", content: "Find emergency services near your live location." },
    ],
  }),
  component: MapPage,
});

interface Place {
  id: string;
  name: string;
  kind: string;
  lat: number;
  lon: number;
  km: number;
}

const KINDS: Record<string, string> = {
  police: "Police",
  hospital: "Hospital",
  fire_station: "Fire station",
  clinic: "Clinic",
};

function MapPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await getCurrentPosition();
      setOrigin(position);
      const query = `[out:json][timeout:25];(
        node["amenity"~"police|hospital|fire_station|clinic"](around:5000,${position.latitude},${position.longitude});
      );out body 40;`;
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      if (!response.ok) throw new Error("Could not load nearby services right now.");
      const payload = (await response.json()) as {
        elements: { id: number; lat: number; lon: number; tags?: Record<string, string> }[];
      };
      const results = payload.elements
        .filter((element) => element.tags?.["amenity"])
        .map((element) => ({
          id: String(element.id),
          name: element.tags?.["name"] ?? KINDS[element.tags?.["amenity"] ?? ""] ?? "Service",
          kind: KINDS[element.tags?.["amenity"] ?? ""] ?? "Service",
          lat: element.lat,
          lon: element.lon,
          km: distanceKm(
            { lat: position.latitude, lon: position.longitude },
            { lat: element.lat, lon: element.lon },
          ),
        }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 20);
      setPlaces(results);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title="Nearby emergency services"
        description="Police, hospitals and fire stations within 5km of your position."
        action={
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <SpinnerGap size={18} className="animate-spin" /> : <Crosshair size={18} />}
            Refresh
          </Button>
        }
      />

      {origin ? (
        <p className="mb-4 text-xs text-muted-foreground">
          Searching around {origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)}
        </p>
      ) : null}

      {error ? (
        <EmptyState icon={MapTrifold} title="Couldn't load services" description={error} />
      ) : places.length === 0 && !loading ? (
        <EmptyState
          icon={MapTrifold}
          title="No services found nearby"
          description="Try refreshing, or move to an area with better GPS accuracy."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Card key={place.id} className="gap-1 p-5">
              <p className="font-semibold">{place.name}</p>
              <p className="text-xs text-muted-foreground">
                {place.kind} · {place.km.toFixed(1)} km away
              </p>
              <a
                href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=17/${place.lat}/${place.lon}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Open in map
              </a>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
