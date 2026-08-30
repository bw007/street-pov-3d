import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

export const InteractionRaycaster: React.FC = () => {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const centerCoord = useRef(new THREE.Vector2(0, 0)); // Center of screen (crosshair)
  const rayAccum = useRef(0); // seconds since the last crosshair raycast (throttle)

  const setHoveredObject = useWorldStore((s) => s.setHoveredObject);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);

  // Global Key & Click Listeners for interacting with focused object
  useEffect(() => {
    const handleTriggerInspect = () => {
      const hovered = useWorldStore.getState().hoveredObject;
      const isAlreadyInspecting = !!useWorldStore.getState().inspectedObject || !!useWorldStore.getState().selectedPOI;

      if (hovered && !isAlreadyInspecting) {
        soundManager.playClick();
        setInspectedObject(hovered);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      if (e.code === 'KeyE' || e.code === 'KeyF' || e.code === 'Enter') {
        handleTriggerInspect();
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      // Only if clicked on canvas / viewport and pointer locked
      if (document.pointerLockElement) {
        if (e.button === 0) { // Left click
          handleTriggerInspect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [setInspectedObject]);

  // Center-crosshair raycasting, throttled to ~15 Hz: walking the whole scene
  // graph (intersectObjects(scene.children, true)) + allocating the hit array
  // every frame is wasteful for a hover check, and 15 Hz still feels instant
  // (~75% less CPU on this path).
  useFrame((_, delta) => {
    if (!camera || !scene) return;
    rayAccum.current += delta;
    if (rayAccum.current < 1 / 15) return;
    rayAccum.current = 0;

    // Raycast from camera center
    raycaster.current.setFromCamera(centerCoord.current, camera);
    raycaster.current.far = 40; // 40m interaction distance

    const intersects = raycaster.current.intersectObjects(scene.children, true);

    let foundInspectData: InspectableObject | null = null;

    for (const hit of intersects) {
      // Ignore road ground plane or sky
      let currentObj: THREE.Object3D | null = hit.object;
      while (currentObj) {
        if (currentObj.userData && currentObj.userData.inspectData) {
          foundInspectData = currentObj.userData.inspectData as InspectableObject;
          break;
        }
        currentObj = currentObj.parent;
      }
      if (foundInspectData) break;
    }

    const currentHovered = useWorldStore.getState().hoveredObject;
    if (foundInspectData?.id !== currentHovered?.id) {
      setHoveredObject(foundInspectData);
    }
  });

  return null;
};
