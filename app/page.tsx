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
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;

    const connect = () => {
      eventSource = new EventSource("http://localhost:8080/flights/stream");

      eventSource.addEventListener("flights", (event) => {
        // Reset retry count on successful connection and message
        retryCount = 0;
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
        // Immediately close the connection to stop default browser auto-retry loop
        eventSource?.close();

        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retrying connection in 3 seconds... (Attempt ${retryCount} of ${MAX_RETRIES})`);
          reconnectTimer = setTimeout(connect, 3000);
        } else {
          console.error(`Max retries (${MAX_RETRIES}) reached. Stopping reconnection attempts.`);
        }
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
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