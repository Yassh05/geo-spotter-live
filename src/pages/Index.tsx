import { useState } from 'react';
import { useTracking } from '@/hooks/useTracking';
import TrackingMap from '@/components/tracking/TrackingMap';
import StatusPanel from '@/components/tracking/StatusPanel';
import PlaybackControls from '@/components/tracking/PlaybackControls';
import AlertsPanel from '@/components/tracking/AlertsPanel';
import { HardHat, Maximize2, Minimize2, AlertTriangle, Loader2, Wifi, WifiOff, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const {
    currentPosition,
    trackHistory,
    device,
    geofences,
    alerts,
    isPlaying,
    playbackIndex,
    playbackSpeed,
    locationError,
    isLocating,
    isUnderground,
    mineZones,
    startPlayback,
    stopPlayback,
    setPlaybackIndex,
    setPlaybackSpeed,
    dismissAlert,
    triggerEmergency,
    reportBreakdown,
    clearEmergency,
  } = useTracking();

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
          {/* Map container */}
          <div className="flex-1 relative">
            <TrackingMap
              currentPosition={currentPosition}
              trackHistory={trackHistory}
              geofences={geofences}
              playbackIndex={playbackIndex}
              mineZones={mineZones}
              isUnderground={isUnderground}
            />
            
            {/* Emergency Buttons Overlay */}
            <div className="absolute bottom-24 left-4 flex flex-col gap-2 z-10">
              <Button
                variant="destructive"
                size="lg"
                onClick={triggerEmergency}
                disabled={device?.status === 'emergency'}
                className="shadow-lg font-bold gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                EMERGENCY
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={reportBreakdown}
                disabled={device?.status === 'breakdown'}
                className="shadow-lg font-bold gap-2 border-warning text-warning hover:bg-warning/10"
              >
                <Wrench className="w-5 h-5" />
                BREAKDOWN
              </Button>
            </div>
          </div>
          
          {/* Playback controls */}
          <div className="p-4 bg-background/80 backdrop-blur-sm border-t border-border/50">
            <div className="max-w-xl">
              <PlaybackControls
                positions={trackHistory}
                currentIndex={playbackIndex}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onPlay={startPlayback}
                onStop={stopPlayback}
                onSeek={setPlaybackIndex}
                onSpeedChange={setPlaybackSpeed}
              />
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