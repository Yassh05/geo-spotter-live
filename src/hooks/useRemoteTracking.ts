import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GPSPosition, Device, Geofence, Alert, MineZone } from '@/types/tracking';

type TrackingMode = 'tracker' | 'viewer';

const miningVehicle: Device = {
  id: 'rc-car-001',
  name: 'RC Car Tracker',
  type: 'mining_vehicle',
  lastPosition: null,
  isOnline: true,
  lastSeen: new Date(),
  status: 'operational',
};

const createMineZones = (lat: number, lng: number): MineZone[] => [
  {
    id: 'zone-track',
    name: 'Track Area',
    level: 0,
    coordinates: [{ lat, lng }],
    type: 'tunnel',
    beaconCount: 1,
  },
];

const createMineGeofences = (lat: number, lng: number): Geofence[] => [
  {
    id: 'geofence-safe-zone',
    name: 'Safe Zone',
    center: { lat, lng },
    radius: 200,
    isActive: true,
    alertOnEnter: false,
    alertOnExit: true,
    zoneType: 'safe',
  },
];

export const useRemoteTracking = (mode: TrackingMode, deviceId: string = 'default') => {
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [trackHistory, setTrackHistory] = useState<GPSPosition[]>([]);
  const [device, setDevice] = useState<Device>(miningVehicle);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mineZones, setMineZones] = useState<MineZone[]>([]);
  const [isUnderground, setIsUnderground] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const initialPositionSet = useRef(false);

  // Send location to database (tracker mode)
  const sendLocationToDb = useCallback(async (position: GPSPosition) => {
    try {
      const { error } = await supabase.from('vehicle_locations').insert({
        device_id: deviceId,
        latitude: position.latitude,
        longitude: position.longitude,
        altitude: position.altitude,
        accuracy: position.accuracy,
        heading: position.heading,
        speed: position.speed,
        depth: position.depth || 0,
        signal_strength: position.signalStrength || 100,
        zone: position.zone || 'Surface',
        status: 'active',
      });
      
      if (error) {
        console.error('Error sending location:', error);
      } else {
        console.log('Location sent successfully');
      }
    } catch (err) {
      console.error('Failed to send location:', err);
    }
  }, [deviceId]);

  // Tracker mode: Use GPS and send to database
  useEffect(() => {
    if (mode !== 'tracker') return;

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    const handlePosition = (position: GeolocationPosition) => {
      setIsLocating(false);
      setLocationError(null);
      setIsConnected(true);

      const newPosition: GPSPosition = {
        id: `pos-${Date.now()}`,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date(position.timestamp),
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
        heading: position.coords.heading || 0,
        altitude: position.coords.altitude || 0,
        accuracy: position.coords.accuracy,
        battery: 100,
        depth: 0,
        zone: 'Surface',
        signalStrength: Math.max(0, 100 - position.coords.accuracy),
      };

      if (!initialPositionSet.current) {
        initialPositionSet.current = true;
        setMineZones(createMineZones(position.coords.latitude, position.coords.longitude));
        setGeofences(createMineGeofences(position.coords.latitude, position.coords.longitude));
      }

      setCurrentPosition(newPosition);
      setTrackHistory(prev => [...prev.slice(-199), newPosition]);
      setDevice(prev => ({
        ...prev,
        lastPosition: newPosition,
        lastSeen: new Date(),
        isOnline: true,
      }));

      // Send to database
      sendLocationToDb(newPosition);
    };

    const handleError = (error: GeolocationPositionError) => {
      setIsLocating(false);
      setIsConnected(false);
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

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 500,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [mode, sendLocationToDb]);

  // Viewer mode: Subscribe to realtime updates
  useEffect(() => {
    if (mode !== 'viewer') return;

    setIsLocating(true);

    // Fetch initial history
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('vehicle_locations')
        .select('*')
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Error fetching history:', error);
        setLocationError('Failed to fetch location history');
        setIsLocating(false);
        return;
      }

      if (data && data.length > 0) {
        const positions: GPSPosition[] = data.reverse().map((loc, i) => ({
          id: loc.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          timestamp: new Date(loc.created_at),
          speed: loc.speed || 0,
          heading: loc.heading || 0,
          altitude: loc.altitude || 0,
          accuracy: loc.accuracy || 0,
          battery: 100,
          depth: loc.depth || 0,
          zone: loc.zone || 'Surface',
          signalStrength: loc.signal_strength || 100,
        }));

        setTrackHistory(positions);
        const latest = positions[positions.length - 1];
        setCurrentPosition(latest);
        
        if (!initialPositionSet.current && latest) {
          initialPositionSet.current = true;
          setMineZones(createMineZones(latest.latitude, latest.longitude));
          setGeofences(createMineGeofences(latest.latitude, latest.longitude));
        }
        
        setIsConnected(true);
      }
      
      setIsLocating(false);
      setLocationError(null);
    };

    fetchHistory();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('vehicle-locations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_locations',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          console.log('Received realtime update:', payload);
          const loc = payload.new as any;
          
          const newPosition: GPSPosition = {
            id: loc.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            timestamp: new Date(loc.created_at),
            speed: loc.speed || 0,
            heading: loc.heading || 0,
            altitude: loc.altitude || 0,
            accuracy: loc.accuracy || 0,
            battery: 100,
            depth: loc.depth || 0,
            zone: loc.zone || 'Surface',
            signalStrength: loc.signal_strength || 100,
          };

          setCurrentPosition(newPosition);
          setTrackHistory(prev => [...prev.slice(-199), newPosition]);
          setDevice(prev => ({
            ...prev,
            lastPosition: newPosition,
            lastSeen: new Date(),
            isOnline: true,
          }));
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, deviceId]);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, isRead: true } : a
    ));
  }, []);

  const triggerEmergency = useCallback(() => {
    if (!currentPosition) return;
    
    const emergencyAlert: Alert = {
      id: `alert-emergency-${Date.now()}`,
      type: 'emergency',
      message: `EMERGENCY: ${device?.name} at ${currentPosition.zone || 'Unknown Zone'}`,
      timestamp: new Date(),
      isRead: false,
      deviceId: device?.id || '',
      priority: 'critical',
      location: {
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
        depth: currentPosition.depth,
      },
    };

    setAlerts(prev => [emergencyAlert, ...prev].slice(0, 50));
    setDevice(prev => ({ ...prev, status: 'emergency' }));
  }, [currentPosition, device]);

  const reportBreakdown = useCallback(() => {
    if (!currentPosition) return;
    
    const breakdownAlert: Alert = {
      id: `alert-breakdown-${Date.now()}`,
      type: 'breakdown',
      message: `BREAKDOWN: ${device?.name} at ${currentPosition.zone || 'Unknown Zone'}`,
      timestamp: new Date(),
      isRead: false,
      deviceId: device?.id || '',
      priority: 'high',
      location: {
        lat: currentPosition.latitude,
        lng: currentPosition.longitude,
        depth: currentPosition.depth,
      },
    };

    setAlerts(prev => [breakdownAlert, ...prev].slice(0, 50));
    setDevice(prev => ({ ...prev, status: 'breakdown' }));
  }, [currentPosition, device]);

  const clearEmergency = useCallback(() => {
    setDevice(prev => ({ ...prev, status: 'operational' }));
  }, []);

  return {
    currentPosition,
    trackHistory,
    device,
    geofences,
    alerts,
    mineZones,
    isUnderground,
    locationError,
    isLocating,
    isConnected,
    dismissAlert,
    triggerEmergency,
    reportBreakdown,
    clearEmergency,
  };
};
