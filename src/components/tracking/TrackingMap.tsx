import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GPSPosition, Geofence } from '@/types/tracking';
import LiveMarker from './LiveMarker';
import TrackPolyline from './TrackPolyline';
import GeofenceCircle from './GeofenceCircle';

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
  const center = currentPosition 
    ? [currentPosition.latitude, currentPosition.longitude] as [number, number]
    : [40.7128, -74.006] as [number, number];

  return (
    <MapContainer
      center={center}
      zoom={16}
      className="w-full h-full rounded-xl overflow-hidden"
      zoomControl={true}
      attributionControl={true}
    >
      {/* Dark-themed map tiles */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Geofences */}
      {geofences.map(geofence => (
        <GeofenceCircle key={geofence.id} geofence={geofence} />
      ))}

      {/* Track polyline */}
      {trackHistory.length > 1 && (
        <TrackPolyline 
          positions={trackHistory} 
          playbackIndex={playbackIndex}
        />
      )}

      {/* Current position marker */}
      {currentPosition && (
        <LiveMarker 
          position={currentPosition} 
          followMode={playbackIndex < 0}
        />
      )}
    </MapContainer>
  );
};

export default TrackingMap;
