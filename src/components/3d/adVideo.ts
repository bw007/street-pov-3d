import * as THREE from 'three';

// One shared, muted, looping ad video — decoded ONCE by a single <video> element
// and reused as a THREE.VideoTexture by every LED screen in the scene (billboards
// + Xiyobon panels). Sharing one element is what keeps dozens of screens cheap:
// the browser decodes the clip a single time and every screen samples a GPU
// texture that wraps it. Keep the source file small (see the ffmpeg step in the
// handoff) so the decode stays light and the page never hitches.
//
// Two texture variants are exposed off the same element: flipY=true for our own
// plane geometry (billboards) and flipY=false for glTF UVs (the panel model),
// so the video is upright on both.

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
export const AD_VIDEO_SRC = `${BASE_URL}videos/fuse_tea.mp4`;

let videoEl: HTMLVideoElement | null = null;
const texByFlip = new Map<boolean, THREE.VideoTexture>();
let ready = false;
const readyCbs = new Set<() => void>();

/** Create the shared <video> once and start (muted) playback. */
export function initAdVideo(): void {
  if (videoEl || typeof document === 'undefined') return;

  const v = document.createElement('video');
  v.src = AD_VIDEO_SRC;
  v.loop = true;
  v.muted = true;
  v.defaultMuted = true;
  v.autoplay = true;
  v.preload = 'auto';
  v.crossOrigin = 'anonymous';
  // iOS/Safari need these set literally to allow inline muted autoplay.
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  (v as HTMLVideoElement & { playsInline: boolean }).playsInline = true;

  const markReady = () => {
    if (!ready) {
      ready = true;
      readyCbs.forEach((f) => f());
    }
  };
  v.addEventListener('playing', markReady);

  const tryPlay = () => {
    v.play().then(markReady).catch(() => {
      /* blocked until a user gesture — handled below */
    });
  };
  tryPlay();
  // Browsers that still block muted autoplay start it on the first interaction
  // (the game needs a click/key to lock the pointer anyway).
  window.addEventListener('pointerdown', tryPlay, { once: true });
  window.addEventListener('keydown', tryPlay, { once: true });

  videoEl = v;
}

function makeTexture(flipY: boolean): THREE.VideoTexture {
  const tex = new THREE.VideoTexture(videoEl as HTMLVideoElement);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.flipY = flipY;
  return tex;
}

/**
 * The shared video texture (initialising the element on first call).
 * @param flipY true for plane geometry (billboards), false for glTF UVs (panels).
 */
export function getAdVideoTexture(flipY = true): THREE.VideoTexture | null {
  initAdVideo();
  if (!videoEl) return null;
  let tex = texByFlip.get(flipY);
  if (!tex) {
    tex = makeTexture(flipY);
    texByFlip.set(flipY, tex);
  }
  return tex;
}

export function isAdVideoReady(): boolean {
  return ready;
}

/** Subscribe to the "video is now playing" event; returns an unsubscribe fn. */
export function onAdVideoReady(cb: () => void): () => void {
  readyCbs.add(cb);
  return () => {
    readyCbs.delete(cb);
  };
}
