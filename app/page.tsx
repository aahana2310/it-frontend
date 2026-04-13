"use client";

import { useEffect, useState, useRef } from "react";
import { FlightState, EnrichedFlightState, Destination } from "@/types/flight";
import dynamic from "next/dynamic";
import FlightOverlay from "@/components/FlightOverlay";

const GlobeView = dynamic(() => import("@/components/GlobeView"), {
  ssr: false,
});

export default function Home() {
  const [flights, setFlights] = useState<EnrichedFlightState[]>([]);
  const flightMetaRef = useRef<Record<string, { color: string; source: Destination }>>({});

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8080/flights/stream");

    eventSource.addEventListener("flights", (event) => {
      try {
        const parsedFlights: FlightState[] = JSON.parse(event.data);
        
        const enrichedFlights: EnrichedFlightState[] = parsedFlights.map(f => {
          if (!flightMetaRef.current[f.id]) {
            const hue = Math.floor(Math.random() * 360);
            flightMetaRef.current[f.id] = {
              color: `hsl(${hue}, 80%, 60%)`,
              source: { lat: f.lat, lng: f.lng }
            };
          }
          return {
            ...f,
            color: flightMetaRef.current[f.id].color,
            source: flightMetaRef.current[f.id].source
          };
        });

        setFlights(enrichedFlights);
      } catch (error) {
        console.error("Failed to parse flight data:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
      // Optional: add reconnection logic here if needed
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <main className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center">
      <FlightOverlay flights={flights} />
      
      {/* Globe Container */}
      <div className="absolute inset-0 z-0">
        <GlobeView flights={flights} />
      </div>
    </main>
  );
}