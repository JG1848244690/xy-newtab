import { useEffect, useRef, useState } from 'react';
import type { SceneInstance } from 'webwallgl';
import { useI18n } from '@/src/i18n';
import { loadBackgroundScene } from '@/src/utils/sceneStorage';
import { fitFor, type SceneWallpaperProps } from '@/src/utils/sceneWallpaper';

export function DirectSceneWallpaper({ id, size, opacity }: SceneWallpaperProps) {
  const { t } = useI18n();
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneInstance | null>(null);
  const fit = fitFor(size);
  const fitRef = useRef(fit);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fitRef.current = fit;
    sceneRef.current?.setFit(fit);
  }, [fit]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let active = true;
    let started = false;
    let ready = false;
    let scene: SceneInstance | undefined;

    const fail = (error: unknown) => {
      if (!active) return;
      console.error('[scene-wallpaper]', error);
      setFailed(true);
      scene?.pause();
    };

    const syncVisibility = () => {
      if (ready) {
        if (document.hidden) scene?.pause();
        else scene?.resume();
      } else if (!started && !document.hidden) {
        started = true;
        void start();
      }
    };

    async function start() {
      try {
        const [stored, renderer] = await Promise.all([loadBackgroundScene(id), import('webwallgl')]);
        if (!active || !host) return;
        if (!stored) throw new Error('Scene file is missing');
        if (document.hidden) {
          started = false;
          return;
        }

        scene = renderer.createScene(host, {
          fit: fitRef.current,
          fps: 30,
          renderDpr: 1,
          scripts: false,
          audio: null,
          media: null,
          volume: 0,
          onError: fail,
        });
        sceneRef.current = scene;
        await scene.load(renderer.fileSource(stored.packageFile, stored.project));
        if (!active) return;
        ready = true;
        syncVisibility();
      } catch (error) {
        fail(error);
      }
    }

    const movePointer = (event: PointerEvent) => {
      if (!ready || document.hidden || !host.clientWidth || !host.clientHeight) return;
      scene?.pushPointer(event.clientX / host.clientWidth, event.clientY / host.clientHeight);
    };

    document.addEventListener('visibilitychange', syncVisibility);
    window.addEventListener('pointermove', movePointer, { passive: true });
    syncVisibility();
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', syncVisibility);
      window.removeEventListener('pointermove', movePointer);
      sceneRef.current = null;
      scene?.destroy({ releasePkgCache: true });
    };
  }, [id]);

  return (
    <>
      <div ref={hostRef} aria-hidden="true" data-scene-wallpaper={id}
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ opacity: opacity ?? 1 }} />
      {failed && (
        <p role="status" className="bookmark-surface pointer-events-none fixed bottom-12 left-3 z-30 max-w-64 rounded-lg px-3 py-2 text-xs">
          {t('settings.bg.scene.renderFailed')}
        </p>
      )}
    </>
  );
}
