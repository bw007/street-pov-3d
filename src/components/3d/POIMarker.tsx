import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { POIData } from '../../types';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { MapPin, Coffee, Landmark, ShoppingBag, Building2, Trees, Sparkles } from 'lucide-react';

interface POIMarkerProps {
  poi: POIData;
}

const CATEGORY_ICONS = {
  landmark: Landmark,
  cafe: Coffee,
  shop: ShoppingBag,
  government: Building2,
  park: Trees,
  station: MapPin,
  historical: Sparkles,
};

export const POIMarker: React.FC<POIMarkerProps> = ({ poi }) => {
  const markerRef = useRef<THREE.Group>(null);
  const setSelectedPOI = useWorldStore((s) => s.setSelectedPOI);

  // Player position updates every physics frame (~60/s). Subscribing to it
  // reactively here would re-render this component (and mount/unmount its
  // <Html> DOM portal) 60 times a second for every POI marker in the loaded
  // chunks. Instead, read it non-reactively inside useFrame and only touch
  // React state when the near/far state or the rounded distance actually
  // changes — React bails out of re-rendering when state is set to an equal
  // value, so this stays effectively idle while the player is far away.
  const [isNearby, setIsNearby] = useState(false);
  const [dist, setDist] = useState(0);

  // Animate floating & bobbing, and track proximity for the info badge
  useFrame(({ clock }) => {
    if (markerRef.current) {
      const t = clock.getElapsedTime();
      markerRef.current.position.y = poi.position[1] + 2.5 + Math.sin(t * 3) * 0.2;
      markerRef.current.rotation.y = t * 1.5;
    }

    const playerPosition = useWorldStore.getState().playerPosition;
    const d = Math.hypot(
      playerPosition[0] - poi.position[0],
      playerPosition[2] - poi.position[2]
    );
    const nowNearby = d < 35;

    if (nowNearby !== isNearby) setIsNearby(nowNearby);
    if (nowNearby) {
      const rounded = Math.round(d);
      if (rounded !== dist) setDist(rounded);
    }
  });

  const IconComponent = CATEGORY_ICONS[poi.category] || MapPin;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playPOIDiscovery();
    setSelectedPOI(poi);
  };

  return (
    <group position={poi.position}>
      {/* 3D Floating Diamond Beacon */}
      <group ref={markerRef}>
        <mesh>
          <octahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial 
            color="#3b82f6" 
            emissive="#60a5fa" 
            emissiveIntensity={1.5}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        {/* Glow Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.95, 24]} />
          <meshBasicMaterial color="#93c5fd" side={THREE.DoubleSide} transparent opacity={0.7} />
        </mesh>
      </group>

      {/* Floating 2D/3D Smart UI Badge */}
      {isNearby && (
        <Html
          position={[0, 4.0, 0]}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
        >
          <div
            onClick={handleClick}
            className="group cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-blue-600/90 text-white backdrop-blur-md border border-blue-500/40 shadow-lg shadow-blue-500/20 transition-all duration-200 transform hover:scale-110 active:scale-95 whitespace-nowrap"
          >
            <div className="p-1 rounded-full bg-blue-500/30 text-blue-300 group-hover:text-white">
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-wide pr-1">{poi.name}</span>
            <span className="text-[10px] text-blue-300 font-mono bg-blue-950/60 px-1.5 py-0.5 rounded">
              {dist}m
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
