import { createScene, fileSource, type SceneInstance } from 'webwallgl';
import { sceneSandboxConnect, sceneSandboxHello, type SceneSandboxCommand, type SceneSandboxStatus } from '@/src/utils/sceneWallpaper';

const host = document.querySelector<HTMLDivElement>('#scene')!;
const extensionOrigin = new URL(location.href).origin;

function connect(event: MessageEvent) {
  if (event.source !== window.parent || event.origin !== extensionOrigin ||
    event.data !== sceneSandboxConnect || event.ports.length !== 1) return;

  window.removeEventListener('message', connect);
  const [port] = event.ports;
  let scene: SceneInstance | undefined;
  let ready = false;
  let visible = true;
  let failed = false;
  let load: Extract<SceneSandboxCommand, { type: 'load' }> | undefined;

  const status = (value: SceneSandboxStatus) => port.postMessage(value);
  const fail = () => {
    failed = true;
    scene?.pause();
    status('error');
  };

  const syncVisibility = async () => {
    if (failed) return;
    if (ready) {
      if (visible) scene?.resume();
      else {
        scene?.pointerLeave();
        scene?.pause();
      }
    } else if (visible && load && !scene) {
      const { file, project, fit } = load;
      try {
        scene = createScene(host, {
          fit, fps: 30, renderDpr: 1, scripts: true,
          audio: null, media: null, volume: 0, onError: fail,
        });
        await scene.load(fileSource(file, project));
        if (failed) return;
        ready = true;
        if (!visible) scene.pause();
        status('ready');
      } catch {
        fail();
      }
    }
  };

  port.onmessage = ({ data }: MessageEvent<SceneSandboxCommand>) => {
    switch (data.type) {
      case 'load':
        load = data;
        void syncVisibility();
        break;
      case 'fit':
        if (load) load.fit = data.fit;
        scene?.setFit(data.fit);
        break;
      case 'visibility':
        visible = data.visible;
        void syncVisibility();
        break;
      case 'pointer':
        if (ready && visible) scene?.pushPointer(data.x, data.y, data.buttons);
        break;
      case 'pointer-leave':
        scene?.pointerLeave();
        break;
    }
  };

  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    failed = true;
    port.close();
    scene?.destroy({ releasePkgCache: true });
  });
}

window.addEventListener('message', connect);
window.parent.postMessage(sceneSandboxHello, extensionOrigin);
