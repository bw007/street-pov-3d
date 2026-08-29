import React from 'react';
import { Text } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

interface HighwaySignProps {
  /** Base of the gantry pole (roadside). */
  position: [number, number, number];
  /** Rotate so the panel faces the oncoming approach. */
  rotationY?: number;
  streetName?: string;
  /** Small grid code kept for referencing spots, e.g. "0 : 1". */
  code?: string;
  /** Face the panel the opposite way (−Z) while keeping the arm on +X, so the
   *  gantry pole can sit on the driver's-right curb with the panel still facing
   *  the oncoming traffic. */
  flip?: boolean;
}

const METAL = '#0f172a';
const POLE_H = 7;
const ARM_LEN = 5.5;
const SIGN_Y = 5.9;
const SIGN_X = ARM_LEN - 2.7; // panel centre along the arm

// A straight-ahead white arrow (shaft + head), pointing up.
const UpArrow: React.FC<{ x: number; y: number; z: number }> = ({ x, y, z }) => (
  <group position={[x, y, z]}>
    <mesh position={[0, -0.16, 0]}>
      <boxGeometry args={[0.13, 0.5, 0.03]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} toneMapped={false} />
    </mesh>
    <mesh position={[0, 0.28, 0]}>
      <coneGeometry args={[0.22, 0.34, 3]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} toneMapped={false} />
    </mesh>
  </group>
);

/**
 * A big highway-style overhead guide sign on a cantilever gantry over the road —
 * green panel, white border, a straight-ahead arrow and the street name. Adds the
 * "big trunk-road" feel to each intersection. Purely decorative (only the gantry
 * pole has a collider).
 */
export const HighwaySign: React.FC<HighwaySignProps> = ({ position, rotationY = 0, streetName, code, flip = false }) => {
  const label = streetName ?? '';

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Gantry pole (the only collider). */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.2, POLE_H / 2, 0.2]} position={[0, POLE_H / 2, 0]} />
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.46, 0.4, 12]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, POLE_H / 2, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.2, POLE_H, 12]} />
          <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.35} />
        </mesh>
      </RigidBody>

      {/* Cantilever arm over the road. */}
      <mesh position={[ARM_LEN / 2, POLE_H - 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, ARM_LEN, 10]} />
        <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.35} />
      </mesh>
      {/* Two hangers from the arm to the panel. */}
      {[SIGN_X - 1.6, SIGN_X + 1.6].map((hx, i) => (
        <mesh key={i} position={[hx, POLE_H - 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 6]} />
          <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.35} />
        </mesh>
      ))}

      {/* Sign panel: white border behind, green face in front. `flip` turns the
          panel to face −Z without moving it, so the pole can sit on the near curb. */}
      <group position={[SIGN_X, SIGN_Y, 0]} rotation={[0, flip ? Math.PI : 0, 0]}>
        <mesh position={[0, 0, -0.02]} castShadow>
          <boxGeometry args={[5.3, 1.7, 0.1]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.7} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[5.1, 1.5, 0.12]} />
          <meshStandardMaterial color="#15803d" metalness={0.15} roughness={0.6} />
        </mesh>

        {/* Sign face (+Z) — faces the oncoming approach. */}
        <UpArrow x={-1.85} y={0} z={0.08} />
        <Text position={[0.4, 0.02, 0.08]} fontSize={0.42} maxWidth={3.1} lineHeight={1} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.012} outlineColor="#052e16">
          {label}
        </Text>
        {code && (
          <Text position={[2.35, -0.5, 0.08]} fontSize={0.2} color="#bbf7d0" anchorX="right" anchorY="middle">
            {code}
          </Text>
        )}
      </group>
    </group>
  );
};
