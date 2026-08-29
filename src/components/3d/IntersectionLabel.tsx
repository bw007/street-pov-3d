import React from 'react';
import { Billboard, Text } from '@react-three/drei';

interface IntersectionLabelProps {
  position: [number, number, number];
  label: string;
}

/**
 * A floating, always-camera-facing number sign marking one intersection
 * (a chunk crossroads). The text/plates use unlit materials, so the number
 * stays equally readable in day, sunset and night lighting. Raycasting is
 * disabled so the sign never blocks the crosshair object inspector behind it.
 */
export const IntersectionLabel: React.FC<IntersectionLabelProps> = ({ position, label }) => (
  <Billboard position={position}>
    {/* Amber frame */}
    <mesh position={[0, 0, -0.01]} raycast={() => null}>
      <planeGeometry args={[9, 3.6]} />
      <meshBasicMaterial color="#f59e0b" transparent opacity={0.9} depthWrite={false} />
    </mesh>
    {/* Dark plate for contrast */}
    <mesh raycast={() => null}>
      <planeGeometry args={[8.4, 3]} />
      <meshBasicMaterial color="#0f172a" transparent opacity={0.78} depthWrite={false} />
    </mesh>
    <Text
      position={[0, 0, 0.05]}
      fontSize={1.5}
      color="#fde68a"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.05}
      outlineColor="#000000"
    >
      {label}
    </Text>
  </Billboard>
);
