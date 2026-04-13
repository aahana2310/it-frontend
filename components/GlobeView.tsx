"use client";

import { useEffect, useRef } from "react";
import Globe, { GlobeInstance } from "globe.gl";
import { EnrichedFlightState } from "@/types/flight";

interface GlobeViewProps {
  flights: EnrichedFlightState[];
}

export default function GlobeView({ flights }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the globe
    const globe = new Globe(containerRef.current)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
      .backgroundColor("#000000")
      .showAtmosphere(true)
      .atmosphereColor("#1e40af") // A subtle blue atmosphere
      .atmosphereAltitude(0.15);

    globeRef.current = globe;

    // Optional: add a slight rotation for visual effect
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    
    // Zoom in a little bit by default
    globe.pointOfView({ altitude: 2.5 });

    // Handle window resize to keep globe responsive
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        globe.width(entry.contentRect.width);
        globe.height(entry.contentRect.height);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (globeRef.current) {
        // Cleanup if needed, though globe.gl doesn't have an explicit destroy method usually
        // we just remove the DOM node inside React
      }
    };
  }, []);

  useEffect(() => {
    if (!globeRef.current) return;

    // Status to color mapping
    const getStatusColor = (status: EnrichedFlightState["status"]) => {
      switch (status) {
        case "en-route":
          return "#22c55e"; // Green
        case "spoofed":
          return "#ef4444"; // Red
        case "rejected":
          return "#f97316"; // Orange
        case "arrived":
          return "#3b82f6"; // Blue
        default:
          return "#ffffff";
      }
    };

    // Build tooltip HTML
    const getTooltip = (flight: EnrichedFlightState) => {
      const color = flight.status === "arrived" ? "#3b82f6" : flight.color; // use status color for border
      const spoofedBadge = flight.spoofed ? `<div class="bg-red-600/20 text-red-500 border border-red-500/50 px-1 py-0.5 rounded text-[10px] mt-1 text-center animate-pulse font-bold tracking-wider">SPOOFED</div>` : "";
      return `
        <div style="background: rgba(0, 0, 0, 0.85); border-left: 3px solid ${color}; padding: 8px 12px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #fff; display: flex; flex-direction: column; gap: 4px;">
          <div style="font-weight: bold; letter-spacing: 0.5px; color: ${color};">${flight.callsign}</div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: #9ca3af;">ALT</span>
            <span>${flight.altitude} ft</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: #9ca3af;">SPD</span>
            <span>${flight.speed} kt</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: #9ca3af;">HDG</span>
            <span>${Math.round(flight.heading)}°</span>
          </div>
          ${spoofedBadge}
        </div>
      `;
    };

    // Prepare rings for both source and destination
    const rings: { lat: number; lng: number; color: string; isSource: boolean }[] = [];
    flights.forEach((f) => {
      if (f.status !== "arrived" && f.destination) {
        // Destination ring
        rings.push({
          lat: f.destination.lat,
          lng: f.destination.lng,
          color: f.color,
          isSource: false,
        });
        // Source ring
        rings.push({
          lat: f.source.lat,
          lng: f.source.lng,
          color: f.color,
          isSource: true,
        });
      }
    });

    // Apply data to globe
    globeRef.current
      .pointsData(flights)
      .pointLat("lat")
      .pointLng("lng")
      .pointRadius(0.8) // Increased from 0.4 for pronounced planes
      .pointColor((d) => (d as EnrichedFlightState).status === "arrived" ? "#3b82f6" : (d as EnrichedFlightState).color)
      .pointAltitude(0.04) // Increased from 0.02 to pop off the surface
      .pointLabel((d) => getTooltip(d as EnrichedFlightState))
      
      // Pronounced Trajectories
      .arcsData(flights.filter(f => f.destination && f.status !== "arrived"))
      .arcStartLat("lat")
      .arcStartLng("lng")
      .arcEndLat((d: object) => (d as EnrichedFlightState).destination.lat)
      .arcEndLng((d: object) => (d as EnrichedFlightState).destination.lng)
      .arcColor((d: object) => (d as EnrichedFlightState).color)
      .arcStroke(0.6) // Make the lines thicker and bolder
      .arcDashLength(0.6) // Longer dashes
      .arcDashGap(0.3) // Wider gaps
      .arcDashAnimateTime(2000) // Slightly slower, more deliberate animation
      .arcAltitudeAutoScale(0.4) // Slightly higher arc apex
      
      // Pronounced Destinations and Sources (Target Beacons)
      .ringsData(rings)
      .ringLat("lat")
      .ringLng("lng")
      .ringColor("color")
      .ringMaxRadius(2.5) // Expand to a decent size
      .ringPropagationSpeed(1.5) // Speed of the outward pulse
      .ringRepeatPeriod(1000); // Pulse every second
  }, [flights]);

  return <div ref={containerRef} className="w-full h-full" />;
}