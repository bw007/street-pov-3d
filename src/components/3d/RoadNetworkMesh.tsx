import React from 'react';
import { RigidBody } from '@react-three/rapier';
import { CHUNK_SIZE } from '../../data/streetsData';

interface RoadNetworkMeshProps {
  chunkX: number;
  chunkZ: number;
}

export const RoadNetworkMesh: React.FC<RoadNetworkMeshProps> = ({ chunkX, chunkZ }) => {
  const worldX = chunkX * CHUNK_SIZE;
  const worldZ = chunkZ * CHUNK_SIZE;

  const roadWidth = 14; // 14m wide road (4 lanes)

  return (
    <group position={[worldX, 0, worldZ]}>
      {/* 1. Ground / Base Plane with Physics */}
      <RigidBody type="fixed" colliders="cuboid">
        {/* Asphalt Ground Plane */}
        <mesh receiveShadow position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CHUNK_SIZE, CHUNK_SIZE]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} metalness={0.1} />
        </mesh>
      </RigidBody>

      {/* 2. Asphalt Road Surfaces (East-West & North-South crossing) */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roadWidth, CHUNK_SIZE]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CHUNK_SIZE, roadWidth]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* 3. Road Lane Markings (White dashed lines & Yellow double center line) */}
      {/* North-South Yellow Center Line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.25, CHUNK_SIZE]} />
        <meshStandardMaterial color="#eab308" roughness={0.5} />
      </mesh>
      {/* East-West Yellow Center Line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CHUNK_SIZE, 0.25]} />
        <meshStandardMaterial color="#eab308" roughness={0.5} />
      </mesh>

      {/* 4. Zebra Crosswalks at 4 Road Intersection approaches */}
      {[-roadWidth / 2 - 2, roadWidth / 2 + 2].map((offsetZ, i) => (
        <group key={`crosswalk-z-${i}`} position={[0, 0.025, offsetZ]}>
          {[-5, -3, -1, 1, 3, 5].map((stripX) => (
            <mesh key={stripX} position={[stripX, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.0, 2.5]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {[-roadWidth / 2 - 2, roadWidth / 2 + 2].map((offsetX, i) => (
        <group key={`crosswalk-x-${i}`} position={[offsetX, 0.025, 0]}>
          {[-5, -3, -1, 1, 3, 5].map((stripZ) => (
            <mesh key={stripZ} position={[0, 0, stripZ]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[2.5, 1.0]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 5. Elevated Sidewalk Curbs (15cm height with physics) */}
      {[0, 1, 2, 3].map((idx) => {
        const cornerSize = (CHUNK_SIZE - roadWidth) / 2;
        const posX = idx % 2 === 0 ? (roadWidth / 2 + cornerSize / 2) : -(roadWidth / 2 + cornerSize / 2);
        const posZ = idx < 2 ? (roadWidth / 2 + cornerSize / 2) : -(roadWidth / 2 + cornerSize / 2);
        
        return (
          <RigidBody key={idx} type="fixed" colliders="cuboid" position={[posX, 0.08, posZ]}>
            <mesh receiveShadow>
              <boxGeometry args={[cornerSize, 0.16, cornerSize]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.7} />
            </mesh>
            {/* Green lawn / planter patch on sidewalk corner */}
            <mesh position={[0, 0.09, 0]}>
              <boxGeometry args={[cornerSize - 6, 0.02, cornerSize - 6]} />
              <meshStandardMaterial color="#166534" roughness={0.9} />
            </mesh>
          </RigidBody>
        );
      })}
    </group>
  );
};
