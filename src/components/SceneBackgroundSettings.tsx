import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { FolderOpen, Trash2, Upload } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select';
import { useI18n } from '@/src/i18n';
import { readSceneFiles, removeBackgroundScene, saveBackgroundScene } from '@/src/utils/sceneStorage';
import { sceneSandboxEnabled } from '@/src/utils/sceneWallpaper';
import type { BackgroundSetting, BackgroundSize } from '@/src/utils/types';

export function SceneBackgroundSettings({ setting, onSave }: {
  setting: BackgroundSetting;
  onSave: (setting: BackgroundSetting) => void;
}) {
  const { t } = useI18n();
  const filesRef = useRef<HTMLInputElement>(null);
  const directoryRef = useRef<HTMLInputElement>(null);
  const active = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<'invalid' | 'saveFailed' | null>(null);
  const opacity = setting.opacity ?? 1;
  const size = setting.size === 'auto' ? 'cover' : setting.size ?? 'cover';

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  async function handleSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length || busy) return;
    setError(null);
    setBusy(true);
    try {
      const scene = await readSceneFiles(files).catch(() => null);
      if (!scene) {
        if (active.current) setError('invalid');
        return;
      }
      await saveBackgroundScene(scene);
      if (!active.current) {
        await removeBackgroundScene(scene.id);
        return;
      }
      onSave({ type: 'scene', sceneId: scene.id, sceneName: scene.name, size, opacity });
      if (setting.sceneId) void removeBackgroundScene(setting.sceneId).catch(console.error);
    } catch (error) {
      console.error('[scene-import]', error);
      if (active.current) setError('saveFailed');
    } finally {
      if (active.current) setBusy(false);
    }
  }

  async function handleRemove() {
    if (!setting.sceneId || busy) return;
    setError(null);
    setBusy(true);
    try {
      await removeBackgroundScene(setting.sceneId);
      onSave({ type: 'none' });
    } catch (error) {
      console.error('[scene-remove]', error);
      if (active.current) setError('saveFailed');
    } finally {
      if (active.current) setBusy(false);
    }
  }

  return (
    <div className="space-y-4" aria-busy={busy}>
      <div className="space-y-2">
        <input ref={filesRef} type="file" accept=".pkg,.json" multiple hidden onChange={handleSelection} />
        <input ref={(input) => {
          directoryRef.current = input;
          input?.setAttribute('webkitdirectory', '');
        }} type="file" multiple hidden onChange={handleSelection} />
        <Button variant="outline" size="sm" className="w-full justify-start" disabled={busy}
          onClick={() => directoryRef.current?.click()}>
          <FolderOpen className="size-4" />{t('settings.bg.scene.chooseFolder')}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" disabled={busy}
          onClick={() => filesRef.current?.click()}>
          <Upload className="size-4" />{t('settings.bg.scene.choosePackage')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('settings.bg.scene.hint')}</p>
        <p className="text-xs text-muted-foreground">
          {t(sceneSandboxEnabled ? 'settings.bg.scene.effects' : 'settings.bg.scene.effectsWithoutScripts')}
        </p>
        {busy && <p role="status" className="text-sm">{t('common.loading')}</p>}
        {error && <p role="alert" className="text-sm text-destructive">{t('settings.bg.scene.' + error)}</p>}
      </div>
      {setting.sceneId && (
        <>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm" title={setting.sceneName}>{setting.sceneName}</span>
            <Button variant="ghost" size="icon" disabled={busy}
              aria-label={t('settings.bg.scene.remove')} onClick={handleRemove}>
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scene-fit">{t('settings.bg.size')}</Label>
            <Select value={size} disabled={busy} onValueChange={(value) => onSave({ ...setting, size: value as BackgroundSize })}>
              <SelectTrigger id="scene-fit" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">{t('settings.bg.sizeOptions.cover')}</SelectItem>
                <SelectItem value="contain">{t('settings.bg.sizeOptions.contain')}</SelectItem>
                <SelectItem value="100% 100%">{t('settings.bg.sizeOptions.stretch')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scene-opacity">{t('settings.bg.opacityPercent', { p: Math.round(opacity * 100) })}</Label>
            <Input type="range" id="scene-opacity" min="0.1" max="1" step="0.05" value={opacity} disabled={busy}
              onChange={(event) => onSave({ ...setting, opacity: Number(event.target.value) })} />
          </div>
        </>
      )}
    </div>
  );
}
