import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GPSPosition, MineZone } from '@/types/tracking';

interface Mine3DViewProps {
  currentPosition: GPSPosition | null;
  mineZones: MineZone[];
  trackHistory: GPSPosition[];
  isUnderground: boolean;
}

// Ground surface with terrain texture
const GroundSurface = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100, 50, 50]} />
      <meshStandardMaterial 
        color="#3a4a3a" 
        roughness={0.9}
        metalness={0.1}
        wireframe={false}
      />
    </mesh>
  );
};

// Mine entrance building
const MineEntrance = () => {
  return (
    <group position={[0, 1, 0]}>
      {/* Main building structure */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[8, 3, 6]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.8} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <boxGeometry args={[9, 0.5, 7]} />
        <meshStandardMaterial color="#333" roughness={0.7} />
      </mesh>
      {/* Entrance */}
      <mesh position={[0, 0.5, 3.5]}>
        <boxGeometry args={[4, 2, 1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <Text position={[0, 4.5, 0]} fontSize={0.8} color="#00d4ff">
        MINE ENTRANCE
      </Text>
    </group>
  );
};

// Vertical shaft with cage
const Shaft = ({ position, depth, name }: { position: [number, number, number]; depth: number; name: string }) => {
  const shaftRef = useRef<THREE.Group>(null);
  
  return (
    <group position={position} ref={shaftRef}>
      {/* Shaft walls */}
      <mesh position={[0, -depth / 2, 0]}>
        <cylinderGeometry args={[2.5, 2.5, depth, 16, 1, true]} />
        <meshStandardMaterial color="#2a2a2a" side={THREE.DoubleSide} roughness={0.9} />
      </mesh>
      {/* Shaft opening ring */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3, 16]} />
        <meshStandardMaterial color="#555" roughness={0.7} />
      </mesh>
      {/* Elevator rails */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, -depth / 2, 0]}>
          <boxGeometry args={[0.1, depth, 0.1]} />
          <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <Text position={[0, 2, 0]} fontSize={0.5} color="#ffaa00">
        {name}
      </Text>
    </group>
  );
};

// Underground tunnel
const Tunnel = ({ 
  start, 
  end, 
  level,
  type 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  level: number;
  type: 'tunnel' | 'extraction' | 'station';
}) => {
  const length = Math.sqrt(
    Math.pow(end[0] - start[0], 2) + 
    Math.pow(end[2] - start[2], 2)
  );
  
  const angle = Math.atan2(end[2] - start[2], end[0] - start[0]);
  const midX = (start[0] + end[0]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  
  const colors = {
    tunnel: '#3d3d3d',
    extraction: '#5a3d2b',
    station: '#2d4a5a'
  };
  
  return (
    <group position={[midX, level, midZ]} rotation={[0, -angle, 0]}>
      {/* Tunnel tube */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.5, 1.5, length, 8, 1, true, 0, Math.PI]} />
        <meshStandardMaterial 
          color={colors[type]} 
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <planeGeometry args={[length, 3]} />
        <meshStandardMaterial color="#222" roughness={1} />
      </mesh>
      {/* Rail tracks */}
      {[-0.5, 0.5].map((z, i) => (
        <mesh key={i} position={[0, -1.4, z]}>
          <boxGeometry args={[length, 0.1, 0.1]} />
          <meshStandardMaterial color="#555" metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

// Underground chamber/station
const Chamber = ({ 
  position, 
  size, 
  name, 
  type 
}: { 
  position: [number, number, number]; 
  size: [number, number, number];
  name: string;
  type: 'station' | 'extraction' | 'emergency_exit';
}) => {
  const colors = {
    station: '#2d4a6a',
    extraction: '#6a4a2d',
    emergency_exit: '#4a6a2d'
  };
  
  const glowColors = {
    station: '#00aaff',
    extraction: '#ffaa00',
    emergency_exit: '#00ff00'
  };
  
  return (
    <group position={position}>
      {/* Chamber walls */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial 
          color={colors[type]} 
          transparent 
          opacity={0.7}
          roughness={0.8}
        />
      </mesh>
      {/* Glow effect */}
      <pointLight color={glowColors[type]} intensity={0.5} distance={10} />
      <Text position={[0, size[1] / 2 + 0.5, 0]} fontSize={0.4} color={glowColors[type]}>
        {name}
      </Text>
    </group>
  );
};

// Level platform with label
const LevelPlatform = ({ depth, label }: { depth: number; label: string }) => {
  return (
    <group position={[0, -depth, 0]}>
      {/* Level indicator ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 3.5, 32]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.3} />
      </mesh>
      <Text position={[5, 0, 0]} fontSize={0.6} color="#00d4ff">
        {label}
      </Text>
    </group>
  );
};

// Vehicle marker (mining truck)
const VehicleMarker = ({ 
  position, 
  depth,
  isUnderground 
}: { 
  position: GPSPosition | null; 
  depth: number;
  isUnderground: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  if (!position) return null;
  
  // Convert lat/lng offset to 3D position (simplified mapping)
  const x = 0; // Center for demo
  const y = isUnderground ? -depth : 0.5;
  const z = 0;
  
  return (
    <group position={[x, y, z]}>
      {/* Vehicle body */}
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[1.2, 0.6, 0.8]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          emissive="#ffaa00"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Cabin */}
      <mesh position={[0.3, 0.4, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Position light */}
      <pointLight color="#ffaa00" intensity={1} distance={5} />
      {/* Info label */}
      <Text position={[0, 1.2, 0]} fontSize={0.3} color="#00ff00">
        DEPTH: {depth.toFixed(0)}m
      </Text>
    </group>
  );
};

// Track history line
const TrackLine = ({ history, isUnderground }: { history: GPSPosition[]; isUnderground: boolean }) => {
  const lineRef = useRef<THREE.Line>(null);
  
  const lineGeometry = useMemo(() => {
    if (history.length < 2) return null;
    
    // Simplified track visualization - create path along tunnels
    const points = history.slice(-20).map((pos, i) => {
      const depth = pos.depth || 0;
      const x = (i - 10) * 0.5;
      const y = isUnderground ? -depth : 0.3;
      return new THREE.Vector3(x, y, 0);
    });
    
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [history, isUnderground]);
  
  if (!lineGeometry) return null;
  
  return (
    <primitive object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: '#00ffaa' }))} ref={lineRef} />
  );
};

// Main 3D Scene
const MineScene = ({ 
  currentPosition, 
  mineZones, 
  trackHistory,
  isUnderground 
}: Mine3DViewProps) => {
  const currentDepth = currentPosition?.depth || 0;
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[25, 15, 25]} fov={60} />
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <pointLight position={[0, -20, 0]} color="#ffaa66" intensity={0.3} />
      <pointLight position={[0, -40, 0]} color="#ff6666" intensity={0.2} />
      
      {/* Environment */}
      <fog attach="fog" args={['#1a1a2e', 30, 100]} />
      
      {/* Ground and entrance */}
      <GroundSurface />
      <MineEntrance />
      
      {/* Main shaft */}
      <Shaft position={[0, 0, 8]} depth={50} name="MAIN SHAFT" />
      
      {/* Level indicators */}
      <LevelPlatform depth={10} label="LEVEL -1 (10m)" />
      <LevelPlatform depth={25} label="LEVEL -2 (25m)" />
      <LevelPlatform depth={40} label="LEVEL -3 (40m)" />
      
      {/* Level 1 tunnels and chambers */}
      <Tunnel start={[0, 0, 8]} end={[-15, 0, 8]} level={-10} type="tunnel" />
      <Tunnel start={[0, 0, 8]} end={[15, 0, 8]} level={-10} type="tunnel" />
      <Tunnel start={[-15, 0, 8]} end={[-15, 0, 20]} level={-10} type="extraction" />
      <Chamber position={[-15, -10, 15]} size={[6, 4, 6]} name="EXTRACTION ZONE A" type="extraction" />
      <Chamber position={[15, -10, 8]} size={[5, 3, 5]} name="STATION 1" type="station" />
      
      {/* Level 2 tunnels and chambers */}
      <Tunnel start={[0, 0, 8]} end={[-20, 0, 8]} level={-25} type="tunnel" />
      <Tunnel start={[0, 0, 8]} end={[20, 0, 8]} level={-25} type="tunnel" />
      <Tunnel start={[-20, 0, 8]} end={[-20, 0, -10]} level={-25} type="tunnel" />
      <Chamber position={[-20, -25, 0]} size={[8, 5, 8]} name="EXTRACTION ZONE B" type="extraction" />
      <Chamber position={[20, -25, 8]} size={[5, 3, 5]} name="STATION 2" type="station" />
      <Chamber position={[10, -25, 15]} size={[4, 3, 4]} name="EMERGENCY EXIT" type="emergency_exit" />
      
      {/* Level 3 tunnels and chambers */}
      <Tunnel start={[0, 0, 8]} end={[-25, 0, 8]} level={-40} type="tunnel" />
      <Tunnel start={[-25, 0, 8]} end={[-25, 0, 25]} level={-40} type="extraction" />
      <Chamber position={[-25, -40, 18]} size={[10, 6, 10]} name="MAIN EXTRACTION" type="extraction" />
      <Chamber position={[0, -40, 15]} size={[5, 3, 5]} name="STATION 3" type="station" />
      
      {/* Secondary shaft */}
      <Shaft position={[12, 0, 0]} depth={30} name="VENT SHAFT" />
      
      {/* Vehicle marker */}
      <VehicleMarker 
        position={currentPosition} 
        depth={currentDepth}
        isUnderground={isUnderground}
      />
      
      {/* Track history */}
      <TrackLine history={trackHistory} isUnderground={isUnderground} />
    </>
  );
};

const Mine3DView = (props: Mine3DViewProps) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-900 to-slate-950">
      <Canvas shadows>
        <MineScene {...props} />
      </Canvas>
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
          <span className="text-cyan-400">Stations</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-amber-500">Extraction Zones</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-green-500">Emergency Exits</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-400">Vehicle</span>
        </div>
      </div>
      
      {/* Depth indicator */}
      <div className="absolute top-4 right-4 glass-panel p-3">
        <div className="text-xs text-muted-foreground mb-1">CURRENT DEPTH</div>
        <div className="text-2xl font-bold text-primary">
          {props.currentPosition?.depth?.toFixed(0) || 0}m
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute top-4 left-4 glass-panel p-2 text-xs text-muted-foreground">
        🖱️ Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};

export default Mine3DView;
