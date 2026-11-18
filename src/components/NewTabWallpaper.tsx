import { useEffect, useRef } from 'react';
import type { BackgroundSetting } from '@/src/utils/types';
import { loadBackgroundVideo } from '@/src/utils/videoStorage';
import { SceneWallpaper } from './SceneWallpaper';

export function NewTabWallpaper({ setting }: { setting?: BackgroundSetting }) {
  if (setting?.type === 'scene' && setting.sceneId) {
    return <SceneWallpaper key={setting.sceneId} id={setting.sceneId} size={setting.size} opacity={setting.opacity} />;
  }
  if (setting?.type === 'video') return <VideoWallpaper key={setting.videoFileName} setting={setting} />;
  if (setting?.type === 'color') {
    return <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ backgroundColor: setting.color }} />;
  }
  if (setting?.type !== 'image' || !setting.imageUrl) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(' + setting.imageUrl + ')', backgroundSize: setting.size || 'cover' }}>
      <div className="absolute inset-0 bg-black" style={{ opacity: 1 - (setting.opacity ?? 1) }} />
    </div>
  );
}

function VideoWallpaper({ setting }: { setting: BackgroundSetting }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let blobUrl: string | undefined;
    let unloadTimer: number | undefined;

    function syncVisibility() {
      if (!video || !blobUrl) return;
      window.clearTimeout(unloadTimer);
      if (document.hidden) {
        video.pause();
        unloadTimer = window.setTimeout(() => {
          video.removeAttribute('src');
          video.load();
        }, 10_000);
      } else {
        if (!video.hasAttribute('src')) video.src = blobUrl;
        void video.play().catch(() => undefined);
      }
    }

    async function loadVideo() {
      try {
        const stored = await loadBackgroundVideo();
        if (!cancelled && stored) {
          blobUrl = URL.createObjectURL(stored.blob);
          syncVisibility();
        }
      } catch (error) {
        console.error('[wallpaper] video load failed:', error);
      }
    }

    document.addEventListener('visibilitychange', syncVisibility);
    void loadVideo();
    return () => {
      cancelled = true;
      window.clearTimeout(unloadTimer);
      document.removeEventListener('visibilitychange', syncVisibility);
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, []);

  return (
    <video ref={videoRef} autoPlay loop muted={setting.muted ?? true} playsInline aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full object-cover"
      style={{ opacity: setting.opacity ?? 1 }} />
  );
}
