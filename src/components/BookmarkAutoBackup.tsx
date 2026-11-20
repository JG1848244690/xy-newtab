import { useEffect, useState } from 'react';
import { sendMessage } from '@/messaging';
import { Button } from '@/src/components/ui/button';
import { useI18n } from '@/src/i18n';
import { BACKUP_STATE_KEY, type BackupStatus } from '@/src/services/bookmarkAutoBackup';

export function BookmarkAutoBackup() {
  const { locale, t } = useI18n();
  const [status, setStatus] = useState<BackupStatus>();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      void sendMessage('backup/status').then((value) => {
        if (active) {
          setStatus(value);
          setFailed(false);
        }
      }).catch(() => {
        if (active) setFailed(true);
      });
    };
    const changed: Parameters<typeof browser.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area === 'local' && changes[BACKUP_STATE_KEY]) refresh();
    };
    refresh();
    browser.storage.onChanged.addListener(changed);
    return () => {
      active = false;
      browser.storage.onChanged.removeListener(changed);
    };
  }, []);

  async function change(action: 'enable' | 'disable' | 'save') {
    setBusy(true);
    setFailed(false);
    try {
      if (action === 'enable' && !await browser.permissions.request({ permissions: ['downloads'] })) {
        setFailed(true);
        return;
      }
      const next = action === 'save'
        ? await sendMessage('backup/save')
        : await sendMessage('backup/enable', action === 'enable');
      setStatus(next);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-w-0 space-y-2 rounded-xl border bg-muted/30 p-3">
      <h3 className="text-sm font-medium">{t('importExport.autoBackupTitle')}</h3>
      <p className="text-xs text-muted-foreground">{t('importExport.autoBackupDesc')}</p>
      {status?.folder && <p className="break-all font-mono text-xs text-muted-foreground">{status.folder}/</p>}
      {status?.lastSavedAt && (
        <p className="text-xs text-muted-foreground">{t('importExport.autoBackupLast', {
          time: new Intl.DateTimeFormat(locale.replace('_', '-'), { dateStyle: 'short', timeStyle: 'short' }).format(status.lastSavedAt),
        })}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={!status || busy}
          onClick={() => void change(status?.enabled ? 'disable' : 'enable')}>
          {t(status?.enabled ? 'importExport.autoBackupDisable' : 'importExport.autoBackupEnable')}
        </Button>
        {status?.enabled && (
          <Button variant="outline" size="sm" disabled={busy || status.pending} onClick={() => void change('save')}>
            {t('importExport.autoBackupSave')}
          </Button>
        )}
      </div>
      {status?.pending && <p role="status" className="text-xs">{t('importExport.autoBackupPending')}</p>}
      {status?.outcome === 'empty' && <p role="status" className="text-xs">{t('importExport.autoBackupEmpty')}</p>}
      {(failed || status?.outcome === 'error') && (
        <p role="alert" className="text-xs text-destructive">{t('importExport.autoBackupFailed')}</p>
      )}
    </section>
  );
}
