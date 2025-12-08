import { useState } from 'react';
import { useTracking } from '@/hooks/useTracking';
import TrackingMap from '@/components/tracking/TrackingMap';
import StatusPanel from '@/components/tracking/StatusPanel';
import PlaybackControls from '@/components/tracking/PlaybackControls';
import AlertsPanel from '@/components/tracking/AlertsPanel';
import { Radio, Maximize2, Minimize2 } from 'lucide-react';
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
    startPlayback,
    stopPlayback,
    setPlaybackIndex,
    setPlaybackSpeed,
    dismissAlert,
  } = useTracking();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel rounded-none border-x-0 border-t-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
              <Radio className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">GPS Tracker</h1>
              <p className="text-xs text-muted-foreground">Real-time Fleet Monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">LIVE</span>
            </div>
            
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

      {/* Main content */}
      <main className="pt-16 h-screen flex">
        {/* Map area */}
        <div className={`flex-1 relative transition-all duration-300 ${isFullscreen ? '' : 'md:mr-80'}`}>
          <TrackingMap
            currentPosition={currentPosition}
            trackHistory={trackHistory}
            geofences={geofences}
            playbackIndex={playbackIndex}
          />
          
          {/* Playback controls overlay */}
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96">
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

        {/* Sidebar */}
        <aside className={`fixed right-0 top-16 bottom-0 w-80 p-4 space-y-4 overflow-y-auto transition-transform duration-300 ${
          isFullscreen ? 'translate-x-full' : 'translate-x-0'
        } hidden md:block`}>
          <StatusPanel position={currentPosition} device={device} />
          <AlertsPanel alerts={alerts} onDismiss={dismissAlert} />
        </aside>

        {/* Mobile bottom sheet for status */}
        <div className="fixed bottom-0 left-0 right-0 md:hidden">
          <div className="p-4 pb-safe">
            {/* Mobile playback controls are handled in the map overlay */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
