import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { getIntersectionSignal } from '../../utils/trafficSignal';

interface TrafficLightProps {
  /** Base of the pole. */
  position: [number, number, number];
  /** Rotate so the lenses face the oncoming approach. */
  rotationY?: number;
  /** Which signal group this light shows. */
  group: 'ns' | 'ew';
  /** Shared per-intersection phase (must match the cars and the other lights). */
  phase?: number;
  isActiveChunk?: boolean;
}

const POLE_H = 6.4;
const METAL = '#111827';

/**
 * One traffic signal on a pole. Its lamps are driven by the shared
 * getIntersectionSignal(), so all four signals at an intersection — and the cars
 * — stay in sync. Built from primitives; only the pole has a collider.
 */
export const TrafficLight: React.FC<TrafficLightProps> = ({
  position, rotationY = 0, group, phase = 0, isActiveChunk = true,
}) => {
  const redRef = useRef<THREE.MeshStandardMaterial>(null);
  const amberRef = useRef<THREE.MeshStandardMaterial>(null);
  const greenRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const color = getIntersectionSignal(state.clock.elapsedTime, phase)[group];
    const on = 3.4;
    const off = 0.07;
    if (greenRef.current) greenRef.current.emissiveIntensity = color === 'green' ? on : off;
    if (amberRef.current) amberRef.current.emissiveIntensity = color === 'amber' ? on : off;
    if (redRef.current) redRef.current.emissiveIntensity = color === 'red' ? on : off;
    if (glowRef.current) {
      glowRef.current.color.set(color === 'green' ? '#22c55e' : color === 'amber' ? '#f59e0b' : '#ef4444');
    }
  });

  const headX = 0.55; // short bracket toward the road (local +X)
  const headY = 5.4;

  const lens = (y: number, ref: React.RefObject<THREE.MeshStandardMaterial>, base: string, glow: string) => (
    <mesh position={[0.2, y, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <cylinderGeometry args={[0.16, 0.16, 0.07, 16]} />
      <meshStandardMaterial ref={ref} color={base} emissive={glow} emissiveIntensity={0.07} toneMapped={false} />
    </mesh>
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Base + pole (only the pole is a collider). */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.16, POLE_H / 2, 0.16]} position={[0, POLE_H / 2, 0]} />
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.4, 0.36, 12]} />
          <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0, POLE_H / 2, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, POLE_H, 12]} />
          <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.35} />
        </mesh>
      </RigidBody>

      {/* Bracket to the signal head. */}
      <mesh position={[headX / 2, headY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, headX, 8]} />
        <meshStandardMaterial color={METAL} metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Signal head — lenses face local +X (toward oncoming traffic). */}
      <group position={[headX + 0.15, headY, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 1.9, 0.42]} />
          <meshStandardMaterial color="#0b0f19" metalness={0.5} roughness={0.6} />
        </mesh>
        {lens(0.58, redRef, '#7f1d1d', '#ef4444')}
        {lens(0.0, amberRef, '#78350f', '#f59e0b')}
        {lens(-0.58, greenRef, '#14532d', '#22c55e')}
        {isActiveChunk && (
          <pointLight ref={glowRef} position={[0.4, 0, 0]} color="#ef4444" intensity={0.7} distance={7} decay={2} />
        )}
      </group>
    </group>
  );
};
