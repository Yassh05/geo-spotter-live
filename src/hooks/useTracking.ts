import { useState, useEffect, useCallback, useRef } from 'react';
import { GPSPosition, Device, Geofence, Alert, TrackingState } from '@/types/tracking';

// Generate realistic mock GPS data for a moving vehicle
const generateMockTrack = (): GPSPosition[] => {
  const baseTime = new Date();
  const positions: GPSPosition[] = [];
  
  // Starting point (simulating a work site area)
  let lat = 40.7128;
  let lng = -74.006;
  let heading = 45;
  
  for (let i = 60; i >= 0; i--) {
    // Simulate realistic movement with some variation
    const speedVariation = Math.random() * 10 - 5;
    const speed = Math.max(5, 25 + speedVariation);
    const headingChange = (Math.random() - 0.5) * 30;
    heading = (heading + headingChange + 360) % 360;
    
    // Move based on heading and speed
    const distance = speed / 3600 * 10; // Distance in degrees (approximation)
    lat += Math.cos(heading * Math.PI / 180) * distance * 0.0001;
    lng += Math.sin(heading * Math.PI / 180) * distance * 0.0001;
    
    positions.push({
      id: `pos-${i}`,
      latitude: lat,
      longitude: lng,
      timestamp: new Date(baseTime.getTime() - i * 60000),
      speed: Math.round(speed * 10) / 10,
      heading: Math.round(heading),
      altitude: 15 + Math.random() * 5,
      accuracy: 3 + Math.random() * 2,
      battery: Math.max(20, 85 - i * 0.5 + Math.random() * 5),
    });
  }
  
  return positions;
};

const mockDevice: Device = {
  id: 'device-001',
  name: 'Drill Carrier Alpha',
  type: 'vehicle',
  lastPosition: null,
  isOnline: true,
  lastSeen: new Date(),
};

const mockGeofences: Geofence[] = [
  {
    id: 'geofence-001',
    name: 'Work Site Perimeter',
    center: { lat: 40.7128, lng: -74.006 },
    radius: 500,
    isActive: true,
    alertOnEnter: false,
    alertOnExit: true,
  },
];

export const useTracking = () => {
  const [state, setState] = useState<TrackingState>({
    currentPosition: null,
    trackHistory: [],
    device: mockDevice,
    geofences: mockGeofences,
    alerts: [],
    isPlaying: false,
    playbackIndex: -1,
    playbackSpeed: 1,
  });

  const playbackRef = useRef<NodeJS.Timeout | null>(null);
  const liveUpdateRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with mock data
  useEffect(() => {
    const track = generateMockTrack();
    const currentPos = track[track.length - 1];
    
    setState(prev => ({
      ...prev,
      trackHistory: track,
      currentPosition: currentPos,
      device: {
        ...prev.device!,
        lastPosition: currentPos,
        lastSeen: currentPos.timestamp,
      },
    }));

    // Simulate live updates
    liveUpdateRef.current = setInterval(() => {
      setState(prev => {
        if (prev.isPlaying) return prev; // Don't update during playback
        
        const lastPos = prev.currentPosition;
        if (!lastPos) return prev;
        
        const speedVariation = Math.random() * 8 - 4;
        const speed = Math.max(5, lastPos.speed + speedVariation);
        const headingChange = (Math.random() - 0.5) * 20;
        const heading = (lastPos.heading + headingChange + 360) % 360;
        
        const distance = speed / 3600 * 2;
        const newLat = lastPos.latitude + Math.cos(heading * Math.PI / 180) * distance * 0.0001;
        const newLng = lastPos.longitude + Math.sin(heading * Math.PI / 180) * distance * 0.0001;
        
        const newPosition: GPSPosition = {
          id: `pos-${Date.now()}`,
          latitude: newLat,
          longitude: newLng,
          timestamp: new Date(),
          speed: Math.round(speed * 10) / 10,
          heading: Math.round(heading),
          altitude: lastPos.altitude,
          accuracy: 3 + Math.random() * 2,
          battery: Math.max(20, (lastPos.battery || 80) - 0.01),
        };

        const newHistory = [...prev.trackHistory.slice(-59), newPosition];
        
        // Check geofence violations
        const newAlerts = [...prev.alerts];
        prev.geofences.forEach(fence => {
          if (!fence.isActive) return;
          
          const distance = getDistance(
            fence.center.lat, fence.center.lng,
            newPosition.latitude, newPosition.longitude
          );
          
          const wasInside = lastPos ? getDistance(
            fence.center.lat, fence.center.lng,
            lastPos.latitude, lastPos.longitude
          ) <= fence.radius : true;
          
          const isInside = distance <= fence.radius;
          
          if (wasInside && !isInside && fence.alertOnExit) {
            newAlerts.unshift({
              id: `alert-${Date.now()}`,
              type: 'geofence_exit',
              message: `${prev.device?.name} left ${fence.name}`,
              timestamp: new Date(),
              isRead: false,
              deviceId: prev.device?.id || '',
              geofenceId: fence.id,
            });
          }
          
          if (!wasInside && isInside && fence.alertOnEnter) {
            newAlerts.unshift({
              id: `alert-${Date.now()}`,
              type: 'geofence_enter',
              message: `${prev.device?.name} entered ${fence.name}`,
              timestamp: new Date(),
              isRead: false,
              deviceId: prev.device?.id || '',
              geofenceId: fence.id,
            });
          }
        });

        return {
          ...prev,
          currentPosition: newPosition,
          trackHistory: newHistory,
          alerts: newAlerts.slice(0, 50),
          device: {
            ...prev.device!,
            lastPosition: newPosition,
            lastSeen: newPosition.timestamp,
          },
        };
      });
    }, 2000);

    return () => {
      if (liveUpdateRef.current) clearInterval(liveUpdateRef.current);
    };
  }, []);

  const startPlayback = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: true,
      playbackIndex: 0,
    }));
  }, []);

  const stopPlayback = useCallback(() => {
    if (playbackRef.current) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
      playbackIndex: -1,
      currentPosition: prev.trackHistory[prev.trackHistory.length - 1] || null,
    }));
  }, []);

  const setPlaybackIndex = useCallback((index: number) => {
    setState(prev => {
      const pos = prev.trackHistory[index];
      return {
        ...prev,
        playbackIndex: index,
        currentPosition: pos || prev.currentPosition,
      };
    });
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, playbackSpeed: speed }));
  }, []);

  // Handle playback animation
  useEffect(() => {
    if (state.isPlaying && state.playbackIndex >= 0) {
      playbackRef.current = setInterval(() => {
        setState(prev => {
          const nextIndex = prev.playbackIndex + 1;
          if (nextIndex >= prev.trackHistory.length) {
            return {
              ...prev,
              isPlaying: false,
              playbackIndex: prev.trackHistory.length - 1,
            };
          }
          return {
            ...prev,
            playbackIndex: nextIndex,
            currentPosition: prev.trackHistory[nextIndex],
          };
        });
      }, 1000 / state.playbackSpeed);
    } else if (playbackRef.current) {
      clearInterval(playbackRef.current);
      playbackRef.current = null;
    }

    return () => {
      if (playbackRef.current) clearInterval(playbackRef.current);
    };
  }, [state.isPlaying, state.playbackSpeed]);

  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => 
        a.id === alertId ? { ...a, isRead: true } : a
      ),
    }));
  }, []);

  const addGeofence = useCallback((geofence: Omit<Geofence, 'id'>) => {
    setState(prev => ({
      ...prev,
      geofences: [...prev.geofences, { ...geofence, id: `geofence-${Date.now()}` }],
    }));
  }, []);

  return {
    ...state,
    startPlayback,
    stopPlayback,
    setPlaybackIndex,
    setPlaybackSpeed,
    dismissAlert,
    addGeofence,
  };
};

// Haversine distance calculation
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
