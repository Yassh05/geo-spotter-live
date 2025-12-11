import { useState, useEffect } from 'react';
import { useRemoteTracking } from '@/hooks/useRemoteTracking';
import TrackingMap from '@/components/tracking/TrackingMap';
import Mine3DView from '@/components/tracking/Mine3DView';
import StatusPanel from '@/components/tracking/StatusPanel';
import AlertsPanel from '@/components/tracking/AlertsPanel';
import { HardHat, Maximize2, Minimize2, AlertTriangle, Loader2, Wifi, WifiOff, Wrench, Map, Box, Radio, Eye, QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';

const Index = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showQR, setShowQR] = useState(false);
  
  // Check URL params for mode on load
  const [trackingMode, setTrackingMode] = useState<'tracker' | 'viewer'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'tracker' ? 'tracker' : 'viewer';
  });

  const trackerUrl = `${window.location.origin}${window.location.pathname}?mode=tracker`;
  
  const {
    currentPosition,
    trackHistory,
    device,
    geofences,
    alerts,
    locationError,
    isLocating,
    isUnderground,
    mineZones,
    isConnected,
    dismissAlert,
    triggerEmergency,
    reportBreakdown,
    clearEmergency,
  } = useRemoteTracking(trackingMode, 'rc-car-001');

  const isEmergencyActive = device?.status === 'emergency' || device?.status === 'breakdown';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 glass-panel rounded-none border-x-0 border-t-0 ${isEmergencyActive ? 'border-b-destructive/50' : ''}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEmergencyActive ? 'bg-destructive/20 animate-pulse' : 'bg-primary/20 glow-primary'}`}>
              <HardHat className={`w-5 h-5 ${isEmergencyActive ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Mining Intelligence</h1>
              <p className="text-xs text-muted-foreground">Underground Vehicle Tracking System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Underground/Surface indicator */}
            {isUnderground ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-xs font-medium text-warning">UNDERGROUND</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-xs font-medium text-success">SURFACE</span>
              </div>
            )}

            {/* Signal status */}
            {isLocating ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                <span className="text-xs font-medium text-muted-foreground">LOCATING</span>
              </div>
            ) : locationError ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/30">
                <WifiOff className="w-3 h-3 text-destructive" />
                <span className="text-xs font-medium text-destructive">NO SIGNAL</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                <Wifi className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">{currentPosition?.signalStrength || 0}%</span>
              </div>
            )}
            
            {/* Tracking Mode toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
              <Button
                variant={trackingMode === 'tracker' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTrackingMode('tracker')}
                className="gap-1 h-7 px-2"
              >
                <Radio className="w-3 h-3" />
                Tracker
              </Button>
              <Button
                variant={trackingMode === 'viewer' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTrackingMode('viewer')}
                className="gap-1 h-7 px-2"
              >
                <Eye className="w-3 h-3" />
                Viewer
              </Button>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
              <Button
                variant={viewMode === '2d' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('2d')}
                className="gap-1 h-7 px-2"
              >
                <Map className="w-3 h-3" />
                2D
              </Button>
              <Button
                variant={viewMode === '3d' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('3d')}
                className="gap-1 h-7 px-2"
              >
                <Box className="w-3 h-3" />
                3D
              </Button>
            </div>

            {/* QR Code button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQR(true)}
              title="Show QR Code for Tracker Mode"
            >
              <QrCode className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden md:flex"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setShowQR(false)}>
            <div className="glass-panel p-6 rounded-2xl max-w-sm mx-4 text-center" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Scan to Track</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowQR(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCodeSVG value={trackerUrl} size={200} level="H" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Scan this QR code on your phone to open the app in <span className="text-primary font-medium">Tracker Mode</span>
              </p>
              <p className="text-xs text-muted-foreground/70 break-all">{trackerUrl}</p>
            </div>
          </div>
        )}
      </header>

      {/* Emergency Banner */}
      {isEmergencyActive && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-destructive/90 text-destructive-foreground py-2 px-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">
              {device?.status === 'emergency' ? 'EMERGENCY ACTIVE' : 'BREAKDOWN REPORTED'} - 
              Location: {currentPosition?.zone || 'Unknown'} | 
              Depth: {currentPosition?.depth || 0}m
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearEmergency}
            className="bg-background/20 border-background/50 text-destructive-foreground hover:bg-background/30"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Main content */}
      <main className={`${isEmergencyActive ? 'pt-28' : 'pt-16'} h-[calc(100vh-4rem)] flex`}>
        {/* Map area */}
        <div className={`flex-1 flex flex-col relative transition-all duration-300 ${isFullscreen ? '' : 'md:mr-80'}`}>
          {/* Map/3D container */}
          <div className="flex-1 relative">
            {viewMode === '2d' ? (
              <TrackingMap
                currentPosition={currentPosition}
                trackHistory={trackHistory}
                geofences={geofences}
                playbackIndex={-1}
                mineZones={mineZones}
                isUnderground={isUnderground}
              />
            ) : (
              <Mine3DView
                currentPosition={currentPosition}
                trackHistory={trackHistory}
                mineZones={mineZones}
                isUnderground={isUnderground}
              />
            )}
          </div>
          
          {/* Mode info and controls */}
          <div className="p-4 bg-background/80 backdrop-blur-sm border-t border-border/50">
            <div className="flex items-center gap-4 flex-wrap justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isConnected ? 'bg-success/10 border border-success/30' : 'bg-muted/50 border border-border'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${isConnected ? 'text-success' : 'text-muted-foreground'}`}>
                    {trackingMode === 'tracker' ? 'SENDING GPS' : 'RECEIVING'} {isConnected ? '• LIVE' : '• OFFLINE'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {trackingMode === 'tracker' 
                    ? 'Place this device in your RC car to track its location' 
                    : 'Viewing RC car location from database'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="default"
                  onClick={triggerEmergency}
                  disabled={device?.status === 'emergency'}
                  className="shadow-lg font-bold gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  EMERGENCY
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={reportBreakdown}
                  disabled={device?.status === 'breakdown'}
                  className="shadow-lg font-bold gap-2 border-warning text-warning hover:bg-warning/10"
                >
                  <Wrench className="w-4 h-4" />
                  BREAKDOWN
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={`fixed right-0 top-16 bottom-0 w-80 p-4 space-y-4 overflow-y-auto transition-transform duration-300 border-l border-border/50 bg-background/50 backdrop-blur-sm ${
          isFullscreen ? 'translate-x-full' : 'translate-x-0'
        } hidden md:block`}>
          <StatusPanel position={currentPosition} device={device} isUnderground={isUnderground} />
          <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />
        </aside>
      </main>
    </div>
  );
};

export default Index;