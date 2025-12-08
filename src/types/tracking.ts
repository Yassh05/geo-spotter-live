export interface GPSPosition {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  speed: number; // km/h
  heading: number; // degrees 0-360
  altitude?: number; // meters
  accuracy?: number; // meters
  battery?: number; // percentage 0-100
}

export interface Device {
  id: string;
  name: string;
  type: 'vehicle' | 'smartphone' | 'tracker';
  lastPosition: GPSPosition | null;
  isOnline: boolean;
  lastSeen: Date;
}

export interface Geofence {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // meters
  isActive: boolean;
  alertOnEnter: boolean;
  alertOnExit: boolean;
}

export interface Alert {
  id: string;
  type: 'geofence_enter' | 'geofence_exit' | 'low_battery' | 'connection_lost' | 'speeding';
  message: string;
  timestamp: Date;
  isRead: boolean;
  deviceId: string;
  geofenceId?: string;
}

export interface TrackingState {
  currentPosition: GPSPosition | null;
  trackHistory: GPSPosition[];
  device: Device | null;
  geofences: Geofence[];
  alerts: Alert[];
  isPlaying: boolean;
  playbackIndex: number;
  playbackSpeed: number;
}
