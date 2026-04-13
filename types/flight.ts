export type FlightStatus = "en-route" | "spoofed" | "rejected" | "arrived";

export interface Destination {
  lat: number;
  lng: number;
}

export interface FlightState {
  id: string;
  callsign: string;
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  heading: number;
  status: FlightStatus;
  destination: Destination;
  spoofed: boolean;
}

export interface EnrichedFlightState extends FlightState {
  color: string;
  source: Destination;
}
