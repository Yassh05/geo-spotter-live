import { useState, useEffect, useCallback, useRef } from 'react';
import { GPSPosition, Device, Geofence, Alert, TrackingState } from '@/types/tracking';

const mockDevice: Device = {
  id: 'device-001',
  name: 'My Device',
  type: 'smartphone',
  lastPosition: null,
  isOnline: true,
  lastSeen: new Date(),
};

const createGeofenceAroundPosition = (lat: number, lng: number): Geofence[] => [
  {
    id: 'geofence-001',
    name: 'Current Area Perimeter',
    center: { lat, lng },
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
    geofences: [],
    alerts: [],
    isPlaying: false,
    playbackIndex: -1,
    playbackSpeed: 1,
  });

  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const playbackRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const initialPositionSet = useRef(false);

  // Use browser Geolocation API for real-time location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    const handlePosition = (position: GeolocationPosition) => {
      setIsLocating(false);
      setLocationError(null);

      const newPosition: GPSPosition = {
        id: `pos-${Date.now()}`,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date(position.timestamp),
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // Convert m/s to km/h
        heading: position.coords.heading || 0,
        altitude: position.coords.altitude || 0,
        accuracy: position.coords.accuracy,
        battery: 100, // Battery API is deprecated in most browsers
      };

      setState(prev => {
        // Don't update during playback
        if (prev.isPlaying) return prev;

        // Set initial geofence around first position
        let geofences = prev.geofences;
        if (!initialPositionSet.current) {
          initialPositionSet.current = true;
          geofences = createGeofenceAroundPosition(newPosition.latitude, newPosition.longitude);
        }

        const newHistory = [...prev.trackHistory.slice(-119), newPosition];
        
        // Check geofence violations
        const newAlerts = [...prev.alerts];
        const lastPos = prev.currentPosition;
        
        geofences.forEach(fence => {
          if (!fence.isActive || !lastPos) return;
          
          const currentDistance = getDistance(
            fence.center.lat, fence.center.lng,
            newPosition.latitude, newPosition.longitude
          );
          
          const wasInside = getDistance(
            fence.center.lat, fence.center.lng,
            lastPos.latitude, lastPos.longitude
          ) <= fence.radius;
          
          const isInside = currentDistance <= fence.radius;
          
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
          geofences,
          alerts: newAlerts.slice(0, 50),
          device: {
            ...prev.device!,
            lastPosition: newPosition,
            lastSeen: new Date(),
            isOnline: true,
          },
        };
      });
    };

    const handleError = (error: GeolocationPositionError) => {
      setIsLocating(false);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setLocationError('Location permission denied. Please enable location access.');
          break;
        case error.POSITION_UNAVAILABLE:
          setLocationError('Location information is unavailable.');
          break;
        case error.TIMEOUT:
          setLocationError('Location request timed out.');
          break;
        default:
          setLocationError('An unknown error occurred.');
      }
    };

    // Watch position for real-time updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true, // Uses best available positioning (GPS, GLONASS, NavIC, etc.)
        timeout: 10000,
        maximumAge: 1000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
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
    locationError,
    isLocating,
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
