import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GPSPosition, Geofence } from '@/types/tracking';

interface TrackingMapProps {
  currentPosition: GPSPosition | null;
  trackHistory: GPSPosition[];
  geofences: Geofence[];
  playbackIndex?: number;
}

const TrackingMap = ({ 
  currentPosition, 
  trackHistory, 
  geofences,
  playbackIndex = -1 
}: TrackingMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const geofenceLayersRef = useRef<L.Circle[]>([]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = currentPosition 
      ? [currentPosition.latitude, currentPosition.longitude]
      : [40.7128, -74.006];

    mapRef.current = L.map(containerRef.current, {
      center,
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker position
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;

    const heading = currentPosition.heading || 0;
    
    const icon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 48px;
          height: 48px;
          position: relative;
          transform: rotate(${heading}deg);
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 48px;
            height: 48px;
            margin: -24px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(14, 184, 195, 0.3) 0%, transparent 70%);
            animation: pulse-ring 2s ease-out infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 32px;
            height: 32px;
            margin: -16px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(14, 184, 195, 0.4) 0%, transparent 60%);
          "></div>
          <svg 
            viewBox="0 0 24 24" 
            style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: 28px;
              height: 28px;
              margin: -14px;
              filter: drop-shadow(0 0 6px rgb(14, 184, 195));
            "
          >
            <path 
              d="M12 2L4 20L12 16L20 20L12 2Z" 
              fill="rgb(14, 184, 195)"
              stroke="rgb(77, 208, 217)"
              stroke-width="1"
            />
          </svg>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 6px;
            height: 6px;
            margin: -3px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 4px white;
          "></div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([currentPosition.latitude, currentPosition.longitude]);
      markerRef.current.setIcon(icon);
    } else {
      markerRef.current = L.marker([currentPosition.latitude, currentPosition.longitude], { icon })
        .addTo(mapRef.current);
    }

    // Pan to position if not in playback mode
    if (playbackIndex < 0) {
      mapRef.current.panTo([currentPosition.latitude, currentPosition.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [currentPosition, playbackIndex]);

  // Update track polyline
  useEffect(() => {
    if (!mapRef.current) return;

    const displayPositions = playbackIndex >= 0 
      ? trackHistory.slice(0, playbackIndex + 1)
      : trackHistory;

    const coordinates = displayPositions.map(pos => [pos.latitude, pos.longitude] as [number, number]);

    if (polylineRef.current) {
      mapRef.current.removeLayer(polylineRef.current);
    }

    if (coordinates.length > 1) {
      polylineRef.current = L.polyline(coordinates, {
        color: 'rgb(14, 184, 195)',
        weight: 4,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapRef.current);

      // Add glow effect
      L.polyline(coordinates, {
        color: 'rgb(14, 184, 195)',
        weight: 8,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapRef.current);
    }
  }, [trackHistory, playbackIndex]);

  // Update geofences
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing geofence layers
    geofenceLayersRef.current.forEach(layer => {
      mapRef.current?.removeLayer(layer);
    });
    geofenceLayersRef.current = [];

    // Add new geofences
    geofences.forEach(geofence => {
      if (!geofence.isActive || !mapRef.current) return;

      const circle = L.circle([geofence.center.lat, geofence.center.lng], {
        radius: geofence.radius,
        color: 'rgb(245, 158, 11)',
        fillColor: 'rgb(245, 158, 11)',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '10, 6',
        opacity: 0.7,
      }).addTo(mapRef.current);

      geofenceLayersRef.current.push(circle);
    });
  }, [geofences]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ background: 'hsl(222 47% 4%)' }}
    />
  );
};

export default TrackingMap;
