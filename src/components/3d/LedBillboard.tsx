import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';
import { getAdVideoTexture, isAdVideoReady, onAdVideoReady } from './adVideo';

interface LedBillboardProps {
  position: [number, number, number];
  rotationY?: number;
  /** Which advertising creative to show (see AD_MODES). */
  mode?: number;
}

const SCREEN_W = 5.0;   // display width (m)
const SCREEN_H = 3.6;   // display height (m)
const SCREEN_CY = 6.5;  // display centre height (m)
const FRAME_D = 0.38;   // cabinet depth (m)
const POLE_TOP = SCREEN_CY - SCREEN_H / 2 - 0.25;

// ---- Animated soda-ad "video" screens --------------------------------------
// Instead of shipping a real video file (which would mean sourcing copyrighted
// Coca-Cola / Fanta footage and encoding an .mp4), the ad is drawn every frame
// to a small canvas and used as an emissive screen texture — a real-time,
// zero-byte "video". A SINGLE shared rAF loop animates exactly two canvases
// (cola, fanta) that every billboard reuses, so cost stays flat no matter how
// many billboards are on screen. The creatives are original soda-themed art
// (brand names as plain text), not the trademarked logos.
export const AD_MODES = 2; // 0 = Coca-Cola, 1 = Fanta
type Brand = 'cola' | 'fanta';
const AD_VW = 384; // small canvas (kept cheap to redraw + upload each frame)
const AD_VH = 276;

interface SodaAd {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  tex: THREE.CanvasTexture;
}
const sodaAds: Partial<Record<Brand, SodaAd>> = {};
let sodaRunning = false;
let sodaStart = 0;
let sodaLast = 0;

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** Draw one animated frame of a soda ad. `t` is seconds; the spot loops at 5 s. */
function drawSoda(ctx: CanvasRenderingContext2D, brand: Brand, t: number): void {
  const W = AD_VW;
  const H = AD_VH;
  const cola = brand === 'cola';
  const loop = (t % 5) / 5; // 0..1 over 5 seconds

  // Background gradient.
  const g = ctx.createLinearGradient(0, 0, W, H);
  if (cola) {
    g.addColorStop(0, '#e51431');
    g.addColorStop(1, '#8a0a17');
  } else {
    g.addColorStop(0, '#ff9500');
    g.addColorStop(1, '#d64200');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Rising carbonation bubbles.
  for (let i = 0; i < 26; i++) {
    const s = i * 97 + 13;
    const bx = (s * 7) % W;
    const speed = 26 + (s % 34);
    const by = H + 16 - ((t * speed + (s % H)) % (H + 32));
    const r = 2 + (s % 5);
    ctx.globalAlpha = 0.12 + (i % 5) * 0.07;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Can silhouette on the right, gently bobbing.
  const bob = Math.sin(t * 2.2) * 5;
  const cx = W * 0.66;
  const cy = H * 0.24 + bob;
  const cw = 78;
  const ch = 150;
  ctx.fillStyle = cola ? '#c00e26' : '#e85a00';
  roundRect(ctx, cx, cy, cw, ch, 14);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  roundRect(ctx, cx + 10, cy + 12, 16, ch - 24, 8);
  ctx.fill();
  ctx.fillStyle = '#d7d7d7';
  roundRect(ctx, cx - 2, cy - 8, cw + 4, 12, 5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(cola ? 'COLA' : 'FANTA', cx + cw / 2, cy + ch / 2 + 8);
  ctx.textAlign = 'left';

  // Brand wordmark + tagline (plain text, not the trademarked logo art).
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(cola ? 'Coca-Cola' : 'Fanta', 24, H * 0.46);
  ctx.fillStyle = cola ? '#ffd7dd' : '#fff0d0';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText(cola ? 'MAZASINI HIS QIL' : "TO'LA APELSIN TA'MI", 26, H * 0.46 + 30);

  // Diagonal glare that sweeps across once per loop (the "playing" feel).
  const sweep = loop * (W + 200) - 100;
  const sg = ctx.createLinearGradient(sweep - 70, 0, sweep + 70, H);
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(0.5, 'rgba(255,255,255,0.16)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);

  // Bezel.
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, W - 12, H - 12);
}

function ensureSodaAd(brand: Brand): SodaAd {
  const existing = sodaAds[brand];
  if (existing) return existing;
  const canvas = document.createElement('canvas');
  canvas.width = AD_VW;
  canvas.height = AD_VH;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const ad: SodaAd = { canvas, ctx, tex };
  if (ctx) drawSoda(ctx, brand, 0);
  sodaAds[brand] = ad;
  return ad;
}

// One shared ~30 fps loop redraws whichever soda canvases exist (max two).
function sodaTick(): void {
  if (sodaRunning) requestAnimationFrame(sodaTick);
  const now = performance.now();
  if (!sodaStart) sodaStart = now;
  if (now - sodaLast < 33) return; // throttle to ~30 fps
  sodaLast = now;
  const t = (now - sodaStart) / 1000;
  (Object.keys(sodaAds) as Brand[]).forEach((b) => {
    const ad = sodaAds[b];
    if (ad?.ctx) {
      drawSoda(ad.ctx, b, t);
      ad.tex.needsUpdate = true;
    }
  });
}

function getSodaAdTexture(brand: Brand): THREE.CanvasTexture {
  const ad = ensureSodaAd(brand);
  if (!sodaRunning && typeof requestAnimationFrame !== 'undefined') {
    sodaRunning = true;
    requestAnimationFrame(sodaTick);
  }
  return ad.tex;
}

/**
 * The screen texture: the shared ad VIDEO once it's playing, otherwise the
 * animated soda canvas as a fallback poster (so a missing/still-loading video
 * never shows a black screen). All boards share the one video texture.
 */
function useScreenTexture(brand: Brand): THREE.Texture {
  const video = getAdVideoTexture();
  const [ready, setReady] = useState(isAdVideoReady());
  useEffect(() => {
    if (ready) return undefined;
    return onAdVideoReady(() => setReady(true));
  }, [ready]);
  return ready && video ? video : getSodaAdTexture(brand);
}

/**
 * A modern outdoor LED advertising billboard: concrete plinth, tapered steel
 * pole and a framed self-illuminated display. Built procedurally (no model) so
 * it's cheap; the screen is emissive + `toneMapped=false` so it reads as a real
 * bright LED panel day or night. Wrap usages in <SafeModel>.
 */
export const LedBillboard: React.FC<LedBillboardProps> = ({ position, rotationY = 0, mode = 0 }) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);
  const isNight = useWorldStore((s) => s.timeOfDay === 'night');

  // All screens play the shared ad video; the soda canvas (cola/fanta by chunk)
  // is only the fallback poster until the video is available and playing.
  const brand: Brand = mode % 2 === 0 ? 'cola' : 'fanta';
  const adTex = useScreenTexture(brand);

  const inspect: InspectableObject = useMemo(
    () => ({
      id: `led_billboard_${position[0]}_${position[2]}`,
      title: 'Raqamli LED Reklama Ekrani',
      category: 'infrastructure',
      badge: 'REKLAMA',
      description:
        "Ko'cha chorrahasidagi zamonaviy tashqi LED reklama ekrani (Outdoor LED Display) — yuqori yorqinlikdagi to'liq rangli panel.",
      streetName: currentStreet?.name,
      details: [
        { label: 'Turi', value: 'Tashqi LED Display' },
        { label: "O'lchami", value: `${SCREEN_W} x ${SCREEN_H} m` },
        { label: 'Ish rejimi', value: '24/7 reklama' },
      ],
    }),
    [position, currentStreet?.name],
  );

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspect);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RigidBody type="fixed" colliders={false}>
        {/* One cheap collider around the base + lower pole (the only part the
            player can reach); the cabinet/screen up high need none. Keeps every
            street-corner billboard to a single collider. */}
        <CuboidCollider args={[0.95, 1.2, 0.95]} position={[0, 1.2, 0]} />

        {/* Concrete plinth */}
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.6, 1.8]} />
          <meshStandardMaterial color="#b7b7b2" roughness={0.95} metalness={0.02} />
        </mesh>

        {/* Tapered steel pole */}
        <mesh position={[0, (1.6 + POLE_TOP) / 2, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.38, POLE_TOP - 1.6, 18]} />
          <meshStandardMaterial color="#484c52" roughness={0.4} metalness={0.55} />
        </mesh>

        {/* Junction hub + two support arms up to the cabinet */}
        <mesh position={[0, POLE_TOP + 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.5, 0.5, 18]} />
          <meshStandardMaterial color="#3c4046" roughness={0.5} metalness={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            position={[s * 1.1, POLE_TOP + 0.55, 0]}
            rotation={[0, 0, s * 0.5]}
            castShadow
          >
            <boxGeometry args={[0.18, 1.4, 0.18]} />
            <meshStandardMaterial color="#3c4046" roughness={0.5} metalness={0.5} />
          </mesh>
        ))}

        {/* Display cabinet (dark frame) */}
        <mesh position={[0, SCREEN_CY, -0.02]} castShadow>
          <boxGeometry args={[SCREEN_W + 0.44, SCREEN_H + 0.44, FRAME_D]} />
          <meshStandardMaterial color="#26292e" roughness={0.55} metalness={0.45} />
        </mesh>

        {/* Self-illuminated LED display face */}
        <mesh position={[0, SCREEN_CY, FRAME_D / 2 + 0.01]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshStandardMaterial
            color="#000000"
            emissive="#ffffff"
            emissiveMap={adTex}
            emissiveIntensity={isNight ? 1.75 : 1.15}
            roughness={1}
            metalness={0}
            toneMapped={false}
          />
        </mesh>
      </RigidBody>

      {/* Clickable inspect target over the screen. */}
      <mesh
        position={[0, SCREEN_CY, FRAME_D / 2 + 0.05]}
        visible={false}
        userData={{ inspectData: inspect }}
        onClick={handleInspect}
        onPointerOver={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      </mesh>
    </group>
  );
};
