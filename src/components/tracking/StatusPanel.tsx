import { 
  Navigation, 
  Battery, 
  Gauge, 
  Signal, 
  Clock,
  MapPin,
  Compass
} from 'lucide-react';
import { GPSPosition, Device } from '@/types/tracking';
import { formatDistanceToNow } from 'date-fns';

interface StatusPanelProps {
  position: GPSPosition | null;
  device: Device | null;
}

const StatusPanel = ({ position, device }: StatusPanelProps) => {
  const getBatteryColor = (level: number | undefined) => {
    if (!level) return 'text-muted-foreground';
    if (level > 50) return 'text-success';
    if (level > 20) return 'text-warning';
    return 'text-destructive';
  };

  const getBatteryIcon = (level: number | undefined) => {
    if (!level) return 0;
    return Math.min(100, Math.max(0, level));
  };

  const formatCoordinate = (value: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(6)}° ${direction}`;
  };

  const getHeadingDirection = (heading: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  return (
    <div className="glass-panel p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`status-indicator ${device?.isOnline ? 'status-online' : 'status-offline'}`} />
          <div>
            <h3 className="font-semibold text-foreground">{device?.name || 'Unknown Device'}</h3>
            <p className="text-xs text-muted-foreground capitalize">{device?.type || 'tracker'}</p>
          </div>
        </div>
        <Signal className="w-4 h-4 text-primary" />
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Speed */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Speed</span>
          </div>
          <div className="font-mono text-xl font-semibold text-foreground">
            {position?.speed?.toFixed(1) || '0.0'}
            <span className="text-xs text-muted-foreground ml-1">km/h</span>
          </div>
        </div>

        {/* Heading */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Heading</span>
          </div>
          <div className="font-mono text-xl font-semibold text-foreground">
            {position?.heading || 0}°
            <span className="text-xs text-muted-foreground ml-1">
              {position ? getHeadingDirection(position.heading) : 'N'}
            </span>
          </div>
        </div>

        {/* Battery */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Battery className={`w-3.5 h-3.5 ${getBatteryColor(position?.battery)}`} />
            <span className="text-xs uppercase tracking-wide">Battery</span>
          </div>
          <div className={`font-mono text-xl font-semibold ${getBatteryColor(position?.battery)}`}>
            {position?.battery?.toFixed(0) || '--'}
            <span className="text-xs ml-0.5">%</span>
          </div>
          {/* Battery bar */}
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                (position?.battery || 0) > 50 ? 'bg-success' :
                (position?.battery || 0) > 20 ? 'bg-warning' : 'bg-destructive'
              }`}
              style={{ width: `${getBatteryIcon(position?.battery)}%` }}
            />
          </div>
        </div>

        {/* Last Seen */}
        <div className="bg-secondary/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Last Seen</span>
          </div>
          <div className="font-mono text-sm font-medium text-foreground">
            {device?.lastSeen 
              ? formatDistanceToNow(device.lastSeen, { addSuffix: true })
              : '--'
            }
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/50" />

      {/* Coordinates */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs uppercase tracking-wide">Position</span>
        </div>
        <div className="font-mono text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">LAT</span>
            <span className="text-foreground">
              {position ? formatCoordinate(position.latitude, 'lat') : '--'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">LNG</span>
            <span className="text-foreground">
              {position ? formatCoordinate(position.longitude, 'lng') : '--'}
            </span>
          </div>
          {position?.altitude && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">ALT</span>
              <span className="text-foreground">{position.altitude.toFixed(1)} m</span>
            </div>
          )}
          {position?.accuracy && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">ACC</span>
              <span className="text-foreground">±{position.accuracy.toFixed(1)} m</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
