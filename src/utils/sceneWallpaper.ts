import type { Fit } from 'webwallgl';
import type { BackgroundSize } from './types';

export interface SceneWallpaperProps {
  id: string;
  size?: BackgroundSize;
  opacity?: number;
}

export const fitFor = (size?: BackgroundSize): Fit =>
  size === 'contain' ? 'contain' : size === '100% 100%' ? 'stretch' : 'cover';

export const sceneSandboxEnabled = import.meta.env.MANIFEST_VERSION === 3 &&
  (import.meta.env.CHROME || import.meta.env.EDGE);
export const sceneSandboxUrl = '/sandbox.html';
export const sceneSandboxHello = 'scene-sandbox:hello';
export const sceneSandboxConnect = 'scene-sandbox:connect';

export type SceneSandboxCommand =
  | { type: 'load'; file: File; project: Record<string, unknown>; fit: Fit }
  | { type: 'fit'; fit: Fit }
  | { type: 'visibility'; visible: boolean }
  | { type: 'pointer'; x: number; y: number; buttons: number }
  | { type: 'pointer-leave' };

export type SceneSandboxStatus = 'ready' | 'error';
