import { Circle } from 'react-leaflet';
import { Geofence } from '@/types/tracking';

interface GeofenceCircleProps {
  geofence: Geofence;
}

const GeofenceCircle = ({ geofence }: GeofenceCircleProps) => {
  if (!geofence.isActive) return null;

  return (
    <>
      {/* Outer dashed border */}
      <Circle
        center={[geofence.center.lat, geofence.center.lng]}
        radius={geofence.radius}
        pathOptions={{
          color: 'hsl(38, 92%, 50%)',
          fillColor: 'hsl(38, 92%, 50%)',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '10, 6',
          opacity: 0.7,
        }}
      />
      
      {/* Inner glow */}
      <Circle
        center={[geofence.center.lat, geofence.center.lng]}
        radius={geofence.radius * 0.95}
        pathOptions={{
          color: 'transparent',
          fillColor: 'hsl(38, 92%, 50%)',
          fillOpacity: 0.03,
          weight: 0,
        }}
      />
      
      {/* Center marker */}
      <Circle
        center={[geofence.center.lat, geofence.center.lng]}
        radius={8}
        pathOptions={{
          color: 'hsl(38, 92%, 50%)',
          fillColor: 'hsl(38, 92%, 50%)',
          fillOpacity: 0.8,
          weight: 2,
        }}
      />
    </>
  );
};

export default GeofenceCircle;
