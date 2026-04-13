"use client";

import { EnrichedFlightState } from "@/types/flight";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FlightOverlayProps {
  flights: EnrichedFlightState[];
}

export default function FlightOverlay({ flights }: FlightOverlayProps) {
  const getStatusColor = (status: EnrichedFlightState["status"]) => {
    switch (status) {
      case "en-route":
        return "bg-green-500";
      case "spoofed":
        return "bg-red-500";
      case "rejected":
        return "bg-orange-500";
      case "arrived":
        return "bg-blue-500";
      default:
        return "bg-white";
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10 p-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-lg shadow-2xl min-w-[250px] font-mono text-sm text-white">
      <div className="flex justify-between items-center pb-2 mb-3 border-b border-white/10 uppercase tracking-widest text-xs font-bold text-gray-400">
        <span>Active Track</span>
        <span>Status</span>
      </div>
      <div className="flex flex-col gap-2">
        {flights.map((flight) => (
          <Tooltip key={flight.id} delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="flex justify-between items-center p-2 hover:bg-white/5 rounded-md cursor-pointer transition-colors duration-150">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full relative"
                    )}
                    style={{ backgroundColor: flight.status === "arrived" ? "#3b82f6" : flight.color }}
                  >
                    {flight.status !== "arrived" && (
                      <div className={cn("absolute inset-0 rounded-full animate-ping opacity-75")} style={{ backgroundColor: flight.color }} />
                    )}
                  </div>
                  <span className="font-semibold" style={{ color: flight.status === "arrived" ? "#3b82f6" : flight.color }}>{flight.callsign}</span>
                  {flight.spoofed && (
                    <span className="text-[10px] bg-red-600/20 text-red-500 border border-red-500/50 px-1.5 py-0.5 rounded ml-1 animate-pulse">SPOOFED</span>
                  )}
                </div>
                <span className="text-xs uppercase tracking-wider opacity-70">
                  {flight.status}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-black/90 border border-white/20 text-white font-mono text-xs">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">LAT</span>
                  <span>{flight.lat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">LNG</span>
                  <span>{flight.lng.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">HDG</span>
                  <span>{Math.round(flight.heading)}°</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}