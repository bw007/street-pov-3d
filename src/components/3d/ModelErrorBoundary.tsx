import React, { Suspense } from 'react';

interface Props {
  /** Label used in the console error, e.g. the model/component name. */
  name?: string;
  children: React.ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Catches render-time errors from a single 3D model so one bad or incompatible
 * GLB can't tear down the whole <Canvas> — which is what shows up as a sudden
 * black screen when the player walks up to it. On error the model is simply
 * omitted and the rest of the world keeps running.
 *
 * NOTE: this only catches React render / lifecycle errors (e.g. a throw while
 * building geometry or materials). A lost WebGL context or a physics/WASM crash
 * is NOT a React error and won't be caught here — see TashkentCircus.tsx, which
 * also uses a cheap cuboid collider to avoid convex-hull cooking on the mesh.
 */
export class ModelErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[ModelErrorBoundary] "${this.props.name ?? 'model'}" failed to render:`, error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/**
 * Wrapper for a streamed showcase model: an error boundary (a broken model is
 * omitted instead of blacking out the whole <Canvas>) plus a local Suspense with
 * a null fallback (while THIS model loads, only it is missing — the rest of the
 * scene keeps rendering, instead of the app-level Suspense blanking everything to
 * the dark "loading" screen when a far chunk's model mounts mid-game).
 */
export const SafeModel: React.FC<{ name?: string; children: React.ReactNode }> = ({ name, children }) => (
  <ModelErrorBoundary name={name}>
    <Suspense fallback={null}>{children}</Suspense>
  </ModelErrorBoundary>
);
