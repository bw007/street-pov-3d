import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface VehicleProps {
  position: [number, number, number];
  rotationY: number;
  type: 'sedan' | 'suv' | 'bus' | 'taxi';
  color: string;
  isActiveChunk?: boolean;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';

const SPORTS_CAR_PATH = `${BASE_URL}models/vehicles/sports_car.glb`;
const TRUCK_PATH = `${BASE_URL}models/vehicles/truck.glb`;

export const VehicleMesh: React.FC<VehicleProps> = ({
  position,
  rotationY,
  type,
  color,
  isActiveChunk = true,
}) => {
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const isTruckOrBus = type === 'bus';
  const isTaxi = type === 'taxi';

  // Load 3D GLTF Model based on vehicle type
  const sportsGltf = useGLTF(SPORTS_CAR_PATH);
  const truckGltf = useGLTF(TRUCK_PATH);

  const activeGltf = isTruckOrBus ? truckGltf : sportsGltf;

  // Clone, scale, and apply realistic automotive paint materials
  const { modelGroup, colliderSize } = useMemo(() => {
    const cloned = activeGltf.scene.clone(true);

    const actualColor = isTaxi ? '#eab308' : color;

    // Premium Automotive Clearcoat Paint Material
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: actualColor,
      metalness: 0.9,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 0.9,
    });

    // Plain transparent tint instead of `transmission` (transmission forces an
    // extra offscreen render pass per object and is very costly when there are
    // many vehicles on screen at once).
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      metalness: 0.2,
      roughness: 0.05,
      transparent: true,
      opacity: 0.75,
    });

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // The sports car model alone is ~358,000 triangles across 51 meshes;
        // the crosshair raycaster tests the whole scene every frame, so skip
        // it here — the invisible collider box below handles click/hover.
        child.raycast = () => {};

        const matName = (child.material?.name || child.name || '').toLowerCase();

        if (matName.includes('body') || matName.includes('paint') || matName.includes('car_paint') || matName.includes('red')) {
          child.material = bodyMaterial;
        } else if (matName.includes('glass') || matName.includes('window') || matName.includes('windshield')) {
          child.material = glassMaterial;
        }
      }
    });

    // Compute bounding box and normalize to realistic dimensions
    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Target Length: 4.6m for sports car, 7.5m for truck/bus
    const TARGET_LENGTH = isTruckOrBus ? 7.5 : 4.6;
    const rawLength = Math.max(size.x, size.z, 0.001);
    const autoScale = TARGET_LENGTH / rawLength;

    const group = new THREE.Group();
    // Center squarely and align base at ground level Y=0
    cloned.position.set(
      -center.x * autoScale,
      -bbox.min.y * autoScale,
      -center.z * autoScale
    );
    cloned.scale.set(autoScale, autoScale, autoScale);
    group.add(cloned);

    const actualHeight = size.y * autoScale;
    const actualWidth = Math.min(size.x, size.z) * autoScale;

    return {
      modelGroup: group,
      colliderSize: [actualWidth * 0.9, actualHeight, TARGET_LENGTH * 0.9] as [number, number, number],
    };
  }, [activeGltf, isTruckOrBus, isTaxi, color]);

  // Inspection Data for real 3D vehicles
  const inspectData: InspectableObject = useMemo(() => {
    if (isTaxi) {
      return {
        id: `taxi_${position[0]}_${position[2]}`,
        title: "Yandex / Shahar Smart Taksisi (3D Model)",
        category: 'vehicle',
        badge: "AVTOMOBIL",
        description: `${currentStreet?.name || "Markaziy ko'cha"} bo'ylab harakatlanuvchi zamonaviy shahar taksisi. Konditsioner, GPS monitoring va naqdsiz to'lov mavjud.`,
        streetName: currentStreet?.name,
        details: [
          { label: "Model", value: "Modern Sport Sedan (PBR 3D)" },
          { label: "Tarif", value: "Komfort / Start 8,000 so'm" },
          { label: "Dvigatel", value: "1.5L Turbo Hybrid (Evro-6)" },
          { label: "Holati", value: "Buyurtma kutmoqda" },
        ],
      };
    }
    if (isTruckOrBus) {
      return {
        id: `truck_${position[0]}_${position[2]}`,
        title: "Xizmat Ko'rsatish Yuk Avtomobili (3D Model)",
        category: 'vehicle',
        badge: "MAXSUS TRANSPORT",
        description: "Shahar do'konlari va savdo markazlariga tovar va mahsulotlarni yetkazib beruvchi maxsus logistika transporti.",
        streetName: currentStreet?.name,
        details: [
          { label: "Model", value: "Cesium Logistics Heavy Truck" },
          { label: "Yuk ko'tarish", value: "5.5 Tonna" },
          { label: "Yoqilg'i turi", value: "Metan gaz / Dizel Evro-5" },
        ],
      };
    }
    return {
      id: `car_${position[0]}_${position[2]}`,
      title: "Premium Sport Sedan Avtomobili (3D Model)",
      category: 'vehicle',
      badge: "3D REAL MODEL",
      description: `${currentStreet?.name || "Markaziy ko'cha"}da turgan fotorealistik metall qoplamali zamonaviy sport avtomobili.`,
      streetName: currentStreet?.name,
      details: [
        { label: "Model", value: "V8 Twin-Turbo Sport Sedan" },
        { label: "Tezlanish (0-100)", value: "3.4 soniya" },
        { label: "Quvvat", value: "620 Ot kuchi (HP)" },
        { label: "Rangi", value: color.toUpperCase() },
      ],
    };
  }, [isTaxi, isTruckOrBus, position, currentStreet?.name, color]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Solid Physics Vehicle Body (also doubles as the cheap raycast target
          for click/hover, instead of the ~358,000-triangle visual model) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[0, colliderSize[1] / 2, 0]}
          visible={false}
          userData={{ inspectData }}
          onClick={handleInspect}
          onPointerOver={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <boxGeometry args={[colliderSize[0], colliderSize[1], colliderSize[2]]} />
        </mesh>
      </RigidBody>

      {/* Render Real 3D GLTF Vehicle Model */}
      <primitive object={modelGroup} />

      {/* Taxi Roof Beacon Light */}
      {isTaxi && (
        <group position={[0, 1.45, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 0.15, 0.2]} />
            <meshStandardMaterial
              color="#eab308"
              emissive="#eab308"
              emissiveIntensity={isNight ? 3 : 1}
            />
          </mesh>
        </group>
      )}

      {/* Dynamic Headlights Lighting System (Illuminates the road at night/sunset) */}
      {isActiveChunk && (isNight || isSunset) && (
        <>
          {/* Left Headlight */}
          <spotLight
            position={[-0.7, 0.6, colliderSize[2] / 2 + 0.2]}
            target-position={[-0.7, 0, colliderSize[2] / 2 + 18]}
            angle={0.4}
            penumbra={0.4}
            color="#fef08a"
            intensity={isNight ? 35 : 18}
            distance={30}
            decay={2}
          />
          {/* Right Headlight */}
          <spotLight
            position={[0.7, 0.6, colliderSize[2] / 2 + 0.2]}
            target-position={[0.7, 0, colliderSize[2] / 2 + 18]}
            angle={0.4}
            penumbra={0.4}
            color="#fef08a"
            intensity={isNight ? 35 : 18}
            distance={30}
            decay={2}
          />

          {/* Rear Red Taillights */}
          <pointLight
            position={[0, 0.65, -colliderSize[2] / 2 - 0.2]}
            color="#ef4444"
            intensity={isNight ? 12 : 5}
            distance={10}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

useGLTF.preload(SPORTS_CAR_PATH);
useGLTF.preload(TRUCK_PATH);
