import { Polyline, CircleMarker } from 'react-leaflet';
import { GPSPosition } from '@/types/tracking';

interface TrackPolylineProps {
  positions: GPSPosition[];
  playbackIndex?: number;
}

const TrackPolyline = ({ positions, playbackIndex = -1 }: TrackPolylineProps) => {
  if (positions.length < 2) return null;

  const displayPositions = playbackIndex >= 0 
    ? positions.slice(0, playbackIndex + 1)
    : positions;

  const coordinates = displayPositions.map(pos => [pos.latitude, pos.longitude] as [number, number]);

  // Create gradient effect by using multiple polylines with decreasing opacity
  const segments: JSX.Element[] = [];
  
  for (let i = 1; i < coordinates.length; i++) {
    const opacity = 0.3 + (i / coordinates.length) * 0.7;
    const weight = 2 + (i / coordinates.length) * 2;
    
    segments.push(
      <Polyline
        key={`segment-${i}`}
        positions={[coordinates[i - 1], coordinates[i]]}
        pathOptions={{
          color: `hsl(185, 85%, ${45 + (i / coordinates.length) * 10}%)`,
          weight: weight,
          opacity: opacity,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
    );
  }

  // Add waypoint markers every 10 points
  const waypoints = displayPositions.filter((_, i) => i % 10 === 0 && i !== displayPositions.length - 1);

  return (
    <>
      {/* Shadow layer */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: 'hsl(220, 80%, 30%)',
          weight: 8,
          opacity: 0.3,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      
      {/* Gradient segments */}
      {segments}
      
      {/* Glow layer */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: 'hsl(185, 85%, 50%)',
          weight: 1,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      
      {/* Waypoint markers */}
      {waypoints.map((pos, i) => (
        <CircleMarker
          key={`waypoint-${pos.id}`}
          center={[pos.latitude, pos.longitude]}
          radius={3}
          pathOptions={{
            color: 'hsl(185, 85%, 50%)',
            fillColor: 'hsl(222, 47%, 10%)',
            fillOpacity: 1,
            weight: 1,
          }}
        />
      ))}
      
      {/* Start marker */}
      {displayPositions.length > 0 && (
        <CircleMarker
          center={[displayPositions[0].latitude, displayPositions[0].longitude]}
          radius={6}
          pathOptions={{
            color: 'hsl(185, 85%, 60%)',
            fillColor: 'hsl(222, 47%, 10%)',
            fillOpacity: 1,
            weight: 2,
          }}
        />
      )}
    </>
  );
};

export default TrackPolyline;
