import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { useControlsStore } from '../../stores/useControlsStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { soundManager } from '../../audio/SoundManager';
import { lerp } from '../../utils/math';

// Frame-loop scratch vectors — reused every frame so the movement math allocates
// nothing (was 4 new THREE.Vector3 per frame → ~240/s of GC pressure). Safe as
// module scope: there is a single PlayerController and the loop is synchronous.
const UP = new THREE.Vector3(0, 1, 0);
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();

export const PlayerController: React.FC = () => {
  const rbRef = useRef<RapierRigidBody>(null);
  const { camera } = useThree();

  const setPlayerPosition = useWorldStore((s) => s.setPlayerPosition);
  const setPlayerRotation = useWorldStore((s) => s.setPlayerRotation);
  const targetTeleport = useWorldStore((s) => s.targetTeleport);
  const clearTeleport = useWorldStore((s) => s.clearTeleport);

  const setPointerLocked = useSettingsStore((s) => s.setPointerLocked);

  // Rotation angles (Euler)
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // Head bobbing animation state
  const headBobTimer = useRef(0);
  const stepTriggered = useRef(false);

  // Flight / Teleport state
  const isFlying = useRef(false);
  const flyStartPos = useRef(new THREE.Vector3());
  const flyTargetPos = useRef(new THREE.Vector3());
  const flyProgress = useRef(0);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      const setKey = useControlsStore.getState().setMovementKey;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setKey('forward', true);
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setKey('backward', true);
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setKey('left', true);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setKey('right', true);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') setKey('sprint', true);
      if (e.code === 'Space') setKey('jump', true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const setKey = useControlsStore.getState().setMovementKey;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') setKey('forward', false);
      if (e.code === 'KeyS' || e.code === 'ArrowDown') setKey('backward', false);
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') setKey('left', false);
      if (e.code === 'KeyD' || e.code === 'ArrowRight') setKey('right', false);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') setKey('sprint', false);
      if (e.code === 'Space') setKey('jump', false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        const sensitivity = 0.0022;
        yawRef.current -= e.movementX * sensitivity;
        pitchRef.current -= e.movementY * sensitivity;

        // Clamp pitch between -85 and +85 degrees
        pitchRef.current = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitchRef.current));
      }
    };

    const handlePointerLockChange = () => {
      setPointerLocked(!!document.pointerLockElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [setPointerLocked]);

  // Handle Teleport & Fly-to initiation
  useEffect(() => {
    if (targetTeleport && rbRef.current) {
      const currentPos = rbRef.current.translation();
      flyStartPos.current.set(currentPos.x, currentPos.y, currentPos.z);
      flyTargetPos.current.set(targetTeleport[0], 1.2, targetTeleport[2]);
      flyProgress.current = 0;
      isFlying.current = true;
    }
  }, [targetTeleport]);

  useFrame((_, delta) => {
    if (!rbRef.current) return;

    const currentPos = rbRef.current.translation();

    // Fallback safety if fallen through
    if (currentPos.y < -5) {
      rbRef.current.setTranslation({ x: currentPos.x, y: 1.5, z: currentPos.z }, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    // 1. Cinematic Fly-to Mode
    if (isFlying.current) {
      flyProgress.current += delta * 0.9;
      const t = Math.min(1, flyProgress.current);
      const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const arcHeight = Math.sin(easeT * Math.PI) * 14;

      const currentX = lerp(flyStartPos.current.x, flyTargetPos.current.x, easeT);
      const currentY = lerp(flyStartPos.current.y, flyTargetPos.current.y, easeT) + arcHeight;
      const currentZ = lerp(flyStartPos.current.z, flyTargetPos.current.z, easeT);

      rbRef.current.setTranslation({ x: currentX, y: currentY, z: currentZ }, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

      camera.position.set(currentX, currentY + 0.55, currentZ);
      setPlayerPosition([currentX, currentY, currentZ]);

      if (t >= 1) {
        isFlying.current = false;
        clearTeleport();
      }
      return;
    }

    // 2. Touch Drag / Mobile look delta
    const lookDelta = useControlsStore.getState().lookDelta;
    if (lookDelta.x !== 0 || lookDelta.y !== 0) {
      const touchSensitivity = 0.003;
      yawRef.current -= lookDelta.x * touchSensitivity;
      pitchRef.current -= lookDelta.y * touchSensitivity;
      pitchRef.current = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitchRef.current));
      useControlsStore.getState().resetLookDelta();
    }

    // 3. Update Camera Rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yawRef.current;
    camera.rotation.x = pitchRef.current;
    camera.rotation.z = 0;

    // 4. Movement Calculation relative to Camera Yaw
    const { forward, backward, left, right, sprint, jump, joystickVector } = useControlsStore.getState();

    const forwardVec = _forward;
    camera.getWorldDirection(forwardVec);
    forwardVec.y = 0;
    forwardVec.normalize();

    const rightVec = _right;
    rightVec.crossVectors(forwardVec, UP).normalize();

    const moveForward = (forward ? 1 : 0) - (backward ? 1 : 0) + joystickVector.y;
    const moveStrafe = (right ? 1 : 0) - (left ? 1 : 0) + joystickVector.x;

    const moveDirection = _move
      .set(0, 0, 0)
      .addScaledVector(forwardVec, moveForward)
      .addScaledVector(rightVec, moveStrafe);

    if (moveDirection.length() > 1) {
      moveDirection.normalize();
    }

    const isMoving = moveDirection.length() > 0.05;
    const baseSpeed = sprint ? 8.5 : 4.5;

    const targetVelX = moveDirection.x * baseSpeed;
    const targetVelZ = moveDirection.z * baseSpeed;

    const currentVel = rbRef.current.linvel();
    const isGrounded = Math.abs(currentVel.y) < 1.5;

    let velY = currentVel.y;
    if (jump && isGrounded) {
      velY = 6.5;
    }

    // Natural physics linear velocity (smooth walking both UP and DOWN stairs)
    rbRef.current.setLinvel({
      x: targetVelX,
      y: velY,
      z: targetVelZ,
    }, true);

    // 5. Head Bobbing & Footsteps
    let headBobOffset = 0;
    if (isMoving && isGrounded) {
      const bobFreq = sprint ? 12 : 8;
      headBobTimer.current += delta * bobFreq;
      headBobOffset = Math.sin(headBobTimer.current) * (sprint ? 0.04 : 0.02);

      if (Math.sin(headBobTimer.current) < -0.85 && !stepTriggered.current) {
        soundManager.playFootstep(sprint);
        stepTriggered.current = true;
      } else if (Math.sin(headBobTimer.current) > 0) {
        stepTriggered.current = false;
      }
    }

    // 6. Camera Position at eye height
    const eyeHeight = 0.55;
    camera.position.set(
      currentPos.x,
      currentPos.y + eyeHeight + headBobOffset,
      currentPos.z
    );

    // Sync state
    setPlayerPosition([currentPos.x, currentPos.y, currentPos.z]);
    setPlayerRotation(yawRef.current);
  });

  return (
    <RigidBody
      ref={rbRef}
      colliders={false}
      mass={80}
      type="dynamic"
      ccd={true}
      // Chunk (0,0) is Amir Temur's dedicated plaza, centred at world (0,0);
      // spawning the player dead-centre would put the camera inside the
      // monument's geometry. Spawn at the plaza's edge instead, clear of its
      // ~30m footprint, so the player walks up to it from outside.
      position={[0, 1.15, -35]}
      enabledRotations={[false, false, false]}
      friction={0.0}
      restitution={0.0}
      linearDamping={0.4}
    >
      {/* Rounded bottom capsule collider glides smoothly up and down slopes */}
      <CapsuleCollider args={[0.55, 0.35]} />
    </RigidBody>
  );
};
