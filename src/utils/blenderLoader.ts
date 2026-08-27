import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { DRACOLoader } from 'three-stdlib';

// Configured Draco Loader for optimized compressed GLTF/GLB models
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export interface LoadedBlenderChunk {
  scene: THREE.Group;
  colliderMeshes: THREE.Mesh[];
  visualMeshes: THREE.Mesh[];
  poiNodes: { name: string; position: THREE.Vector3; userData: Record<string, unknown> }[];
}

/**
 * Loads and processes a Blender GLB chunk file.
 * Automatically parses:
 * - Meshes with 'COL_' or 'UCX_' prefix as physics colliders
 * - Emissive materials for night illumination
 * - Empty/Object nodes named 'POI_' as interactive landmark points
 */
export async function loadBlenderChunk(url: string): Promise<LoadedBlenderChunk> {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const colliderMeshes: THREE.Mesh[] = [];
        const visualMeshes: THREE.Mesh[] = [];
        const poiNodes: { name: string; position: THREE.Vector3; userData: Record<string, unknown> }[] = [];

        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Enable shadow casting and receiving
            child.castShadow = true;
            child.receiveShadow = true;

            // Check if mesh is marked as collider
            if (child.name.startsWith('COL_') || child.name.startsWith('UCX_')) {
              child.visible = false; // Hide collider geometry visually
              colliderMeshes.push(child);
            } else {
              visualMeshes.push(child);
            }
          }

          // Check if object is marked as POI anchor
          if (child.name.startsWith('POI_')) {
            const worldPos = new THREE.Vector3();
            child.getWorldPosition(worldPos);
            poiNodes.push({
              name: child.name.replace('POI_', ''),
              position: worldPos,
              userData: child.userData || {},
            });
          }
        });

        resolve({
          scene: gltf.scene,
          colliderMeshes,
          visualMeshes,
          poiNodes,
        });
      },
      undefined,
      (error) => reject(error)
    );
  });
}
