import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/src/i18n';
import { loadBackgroundScene } from '@/src/utils/sceneStorage';
import {
  fitFor, sceneSandboxConnect, sceneSandboxHello, sceneSandboxUrl,
  type SceneSandboxCommand, type SceneWallpaperProps,
} from '@/src/utils/sceneWallpaper';

export function SandboxedSceneWallpaper({ id, size, opacity }: SceneWallpaperProps) {
  const { t } = useI18n();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const portRef = useRef<MessagePort | null>(null);
  const fit = fitFor(size);
  const fitRef = useRef(fit);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fitRef.current = fit;
    portRef.current?.postMessage({ type: 'fit', fit } satisfies SceneSandboxCommand);
  }, [fit]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let active = true;
    let started = false;
    let ready = false;
    let failed = false;
    let pointerFrame = 0;
    let handshakeTimer = 0;
    let pendingPointer: SceneSandboxCommand | undefined;

    const send = (command: SceneSandboxCommand) => portRef.current?.postMessage(command);

    const clearPointer = () => {
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      pendingPointer = undefined;
    };

    const fail = () => {
      if (!active || failed) return;
      failed = true;
      ready = false;
      window.clearTimeout(handshakeTimer);
      clearPointer();
      portRef.current?.close();
      portRef.current = null;
      frame.removeAttribute('src');
      setFailed(true);
    };

    const syncVisibility = () => {
      if (!started && !document.hidden) {
        started = true;
        frame.src = new URL(sceneSandboxUrl, browser.runtime.getURL('/')).href;
        handshakeTimer = window.setTimeout(fail, 15_000);
      }
      if (document.hidden) clearPointer();
      send({ type: 'visibility', visible: !document.hidden });
    };

    const connect = (event: MessageEvent) => {
      const sceneWindow = frame.contentWindow;
      if (failed || !started || !sceneWindow || event.source !== sceneWindow ||
        event.origin !== 'null' || event.data !== sceneSandboxHello || portRef.current) return;

      window.clearTimeout(handshakeTimer);
      const { port1, port2 } = new MessageChannel();
      portRef.current = port1;
      port1.onmessage = ({ data }) => {
        if (data === 'error') fail();
        if (data === 'ready') ready = true;
      };
      // Chrome sends messages from manifest sandbox pages with an opaque origin.
      sceneWindow.postMessage(sceneSandboxConnect, '*', [port2]);
      void loadBackgroundScene(id).then((stored) => {
        if (!active || failed) return;
        if (!stored) {
          fail();
          return;
        }
        syncVisibility();
        send({ type: 'load', file: stored.packageFile, project: stored.project, fit: fitRef.current });
      }).catch(fail);
    };

    const movePointer = (event: PointerEvent) => {
      if (!ready || document.hidden) return;
      const { left, top, width, height } = frame.getBoundingClientRect();
      if (!width || !height) return;
      const onControl = event.target instanceof Element &&
        event.target.closest('a,button,input,select,textarea,[role="menu"],[role="dialog"],[contenteditable],[draggable="true"]');
      pendingPointer = {
        type: 'pointer',
        x: Math.max(0, Math.min(1, (event.clientX - left) / width)),
        y: Math.max(0, Math.min(1, (event.clientY - top) / height)),
        buttons: onControl ? 0 : event.buttons,
      };
      if (event.type !== 'pointermove') {
        send(pendingPointer);
        clearPointer();
      } else if (!pointerFrame) {
        pointerFrame = window.requestAnimationFrame(() => {
          if (pendingPointer) send(pendingPointer);
          clearPointer();
        });
      }
    };

    const leavePointer = () => {
      clearPointer();
      if (ready) send({ type: 'pointer-leave' });
    };

    window.addEventListener('message', connect);
    document.addEventListener('visibilitychange', syncVisibility);
    document.documentElement.addEventListener('pointerleave', leavePointer);
    window.addEventListener('blur', leavePointer);
    window.addEventListener('pointercancel', leavePointer, true);
    window.addEventListener('pointermove', movePointer, { passive: true, capture: true });
    window.addEventListener('pointerdown', movePointer, { passive: true, capture: true });
    window.addEventListener('pointerup', movePointer, { passive: true, capture: true });
    syncVisibility();
    return () => {
      active = false;
      window.clearTimeout(handshakeTimer);
      clearPointer();
      window.removeEventListener('message', connect);
      document.removeEventListener('visibilitychange', syncVisibility);
      document.documentElement.removeEventListener('pointerleave', leavePointer);
      window.removeEventListener('blur', leavePointer);
      window.removeEventListener('pointercancel', leavePointer, true);
      window.removeEventListener('pointermove', movePointer, true);
      window.removeEventListener('pointerdown', movePointer, true);
      window.removeEventListener('pointerup', movePointer, true);
      portRef.current?.close();
      portRef.current = null;
      frame.removeAttribute('src');
    };
  }, [id]);

  return (
    <>
      <iframe ref={frameRef} aria-hidden="true" tabIndex={-1} data-scene-wallpaper={id}
        title={t('settings.bg.type.scene')} sandbox="allow-scripts"
        className="pointer-events-none fixed inset-0 h-full w-full border-0"
        style={{ opacity: opacity ?? 1 }} />
      {failed && (
        <p role="status" className="bookmark-surface pointer-events-none fixed bottom-12 left-3 z-30 max-w-64 rounded-lg px-3 py-2 text-xs">
          {t('settings.bg.scene.renderFailed')}
        </p>
      )}
    </>
  );
}
