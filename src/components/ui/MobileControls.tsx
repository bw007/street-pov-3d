import React, { useRef, useState, useEffect } from 'react';
import { useControlsStore } from '../../stores/useControlsStore';
import { ArrowUp, Zap } from 'lucide-react';

export const MobileControls: React.FC = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const setJoystickVector = useControlsStore((s) => s.setJoystickVector);
  const setLookDelta = useControlsStore((s) => s.setLookDelta);
  const setMovementKey = useControlsStore((s) => s.setMovementKey);

  const [sprintActive, setSprintActive] = useState(false);

  const joystickCenter = useRef<{ x: number; y: number } | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }
  }, []);

  if (!isTouchDevice) return null;

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    joystickCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    handleJoystickTouchMove(e);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (!joystickCenter.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - joystickCenter.current.x;
    const dy = touch.clientY - joystickCenter.current.y;
    const maxRadius = 45;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * (clampedDist / maxRadius);
    const ny = Math.sin(angle) * (clampedDist / maxRadius);

    setKnobPos({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });

    setJoystickVector({ x: nx, y: -ny });
  };

  const handleJoystickTouchEnd = () => {
    joystickCenter.current = null;
    setKnobPos({ x: 0, y: 0 });
    setJoystickVector({ x: 0, y: 0 });
  };

  // Right side touch look drag handlers
  const handleLookTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;

    setLookDelta({ x: dx, y: dy });
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchEnd = () => {
    touchStartPos.current = null;
  };

  const toggleSprint = () => {
    const next = !sprintActive;
    setSprintActive(next);
    setMovementKey('sprint', next);
  };

  const handleJump = () => {
    setMovementKey('jump', true);
    setTimeout(() => setMovementKey('jump', false), 200);
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-none select-none">
      {/* 1. Left Side: Virtual Analog Joystick */}
      <div
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
        className="pointer-events-auto absolute bottom-8 left-8 w-32 h-32 rounded-full glass-panel border border-white/20 flex items-center justify-center shadow-2xl"
      >
        <div
          style={{ transform: `translate(${knobPos.x}px, ${knobPos.y}px)` }}
          className="w-14 h-14 rounded-full bg-blue-500/80 backdrop-blur border-2 border-white/40 shadow-lg pointer-events-none"
        />
      </div>

      {/* 2. Right Side: Touch Look Area */}
      <div
        onTouchStart={handleLookTouchStart}
        onTouchMove={handleLookTouchMove}
        onTouchEnd={handleLookTouchEnd}
        className="pointer-events-auto absolute top-20 right-0 w-1/2 h-3/5"
      />

      {/* 3. Action Buttons (Jump & Sprint) */}
      <div className="pointer-events-auto absolute bottom-28 right-8 flex flex-col gap-3">
        {/* Sprint Button */}
        <button
          onClick={toggleSprint}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl backdrop-blur transition ${
            sprintActive
              ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
              : 'glass-panel text-white border-white/20'
          }`}
        >
          <Zap className="w-6 h-6" />
        </button>

        {/* Jump Button */}
        <button
          onClick={handleJump}
          className="w-14 h-14 rounded-2xl glass-panel text-white border border-white/20 flex items-center justify-center shadow-xl active:bg-blue-600 transition"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
