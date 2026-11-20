import { DirectSceneWallpaper } from './DirectSceneWallpaper';
import { SandboxedSceneWallpaper } from './SandboxedSceneWallpaper';

export const SceneWallpaper = import.meta.env.MANIFEST_VERSION === 3 && (import.meta.env.CHROME || import.meta.env.EDGE)
  ? SandboxedSceneWallpaper
  : DirectSceneWallpaper;
