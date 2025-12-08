import { useEffect, useMemo } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GPSPosition } from '@/types/tracking';

interface LiveMarkerProps {
  position: GPSPosition;
  followMode?: boolean;
}

const LiveMarker = ({ position, followMode = true }: LiveMarkerProps) => {
  const map = useMap();

  // Create custom arrow marker that rotates based on heading
  const icon = useMemo(() => {
    const heading = position.heading || 0;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 48px;
          height: 48px;
          position: relative;
          transform: rotate(${heading}deg);
        ">
          <!-- Outer pulse ring -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 48px;
            height: 48px;
            margin: -24px;
            border-radius: 50%;
            background: radial-gradient(circle, hsl(185 85% 50% / 0.3) 0%, transparent 70%);
            animation: pulse-ring 2s ease-out infinite;
          "></div>
          
          <!-- Inner glow -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            width: 32px;
            height: 32px;
            margin: -16px;
            border-radius: 50%;
            background: radial-gradient(circle, hsl(185 85% 50% / 0.4) 0%, transparent 60%);
          "></div>
          
          <!-- Arrow/Direction indicator -->
          <svg 
            viewBox="0 0 24 24" 
            style="
              position: absolute;
              top: 50%;
              left: 50%;
              width: 28px;
              height: 28px;
              margin: -14px;
              filter: drop-shadow(0 0 6px hsl(185 85% 50%));
            "
          >
            <path 
              d="M12 2L4 20L12 16L20 20L12 2Z" 
              fill="hsl(185 85% 50%)"
              stroke="hsl(185 85% 70%)"
              stroke-width="1"
            />
          </svg>
          
          <!-- Center dot -->
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
  }, [position.heading]);

  // Pan to position if follow mode is enabled
  useEffect(() => {
    if (followMode) {
      map.panTo([position.latitude, position.longitude], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [position.latitude, position.longitude, followMode, map]);

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={icon}
    />
  );
};

export default LiveMarker;
