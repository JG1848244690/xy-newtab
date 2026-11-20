import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, Check, Chrome, ArrowDownUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import type { Shortcut, ShortcutGroup, ExportData, Settings } from '@/src/utils/types';
import { bookmarkBackup, exportData, parseImportFile, mergeImportData, replaceImportData, type ImportMode, type RestoredBookmarks } from '@/src/utils/importExport';
import { ChromeBookmarkImportDialog } from './ChromeBookmarkImportDialog';
import { useI18n } from '@/src/i18n';
import { BookmarkAutoBackup } from './BookmarkAutoBackup';
import { autoBackupSupported } from '@/src/services/bookmarkAutoBackup';
import { DOCK_GROUP_ID } from '@/src/utils/constants';
import { getDockIds } from '@/src/services/groups';

interface ImportExportDialogProps {
  compact?: boolean;
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  settings: Settings;
  onImport: (restored: RestoredBookmarks) => Promise<void>;
  addShortcuts: (items: { name: string; url: string }[]) => number;
}

export function ImportExportDialog({
  compact = false,
  shortcuts,
  groups,
  settings,
  onImport,
  addShortcuts,
}: ImportExportDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [previewData, setPreviewData] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [chromeOpen, setChromeOpen] = useState(false);
  const chromeTrigger = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parseRequest = useRef(0);

  const handleExport = () => {
    exportData(bookmarkBackup(shortcuts, groups, settings));
    handleClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const request = ++parseRequest.current;
    e.target.value = '';
    setPreviewData(null);
    setError(null);
    try {
      const data = await parseImportFile(file);
      if (request === parseRequest.current) setPreviewData(data);
    } catch {
      if (request === parseRequest.current) setError(t('importExport.parseFail'));
    }
  };

  const handleImport = async () => {
    if (!previewData || importing) return;
    setImporting(true);
    setError(null);
    try {
      const result = importMode === 'merge'
        ? mergeImportData(shortcuts, groups, previewData, settings)
        : replaceImportData(previewData);
      await onImport(result);
      handleClose();
    } catch {
      setError(t('importExport.restoreFailed'));
    } finally {
      setImporting(false);
    }
  };


  const handleClose = () => {
    parseRequest.current++;
    setImportMode('merge');
    setPreviewData(null);
    setError(null);
    setChromeOpen(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!importing) nextOpen ? setOpen(true) : handleClose();
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size={compact ? 'icon' : 'sm'} className="bookmark-action gap-1.5 rounded-lg"
          aria-label={t('layout.importExport')} title={compact ? t('layout.importExport') : undefined}>
          <ArrowDownUp className="h-3.5 w-3.5" />
          {!compact && t('layout.importExport')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('importExport.title')}</DialogTitle>
          <DialogDescription>
            {t('importExport.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4" inert={importing}>
          {/* 导出按钮 */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div>
              <p className="font-medium">{t('importExport.exportTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('importExport.exportSummary', {
                  shortcuts: shortcuts.length,
                  groups: groups.filter(({ id }) => id !== DOCK_GROUP_ID).length,
                  dock: getDockIds(groups).length,
                })}
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              {t('importExport.export')}
            </Button>
          </div>

          {/* 从 Chrome 书签导入 */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div>
              <p className="font-medium">{t('importExport.chromeImportTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('importExport.chromeImportDesc')}
              </p>
            </div>
            <Button
              ref={chromeTrigger}
              onClick={() => setChromeOpen(true)}
              variant="outline"
              size="sm"
            >
              <Chrome className="size-4" />
              {t('importExport.chromeImport')}
            </Button>
          </div>
          <ChromeBookmarkImportDialog open={chromeOpen} onOpenChange={setChromeOpen}
            addShortcuts={addShortcuts} returnFocus={chromeTrigger} />

          {/* 从文件导入 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('importExport.fileImportTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('importExport.fileImportDesc')}</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('importExport.selectFile')}
              </Button>
            </div>

            {/* 预览数据 */}
            {previewData && (
              <div className="p-3 rounded-xl border bg-muted/30 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>
                    {t('importExport.previewSummary', {
                      shortcuts: previewData.shortcuts.length,
                      groups: previewData.groups.filter(({ id }) => id !== DOCK_GROUP_ID).length,
                      dock: previewData.layouts?.dock.pinnedIds.length ?? getDockIds(previewData.groups).length,
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(previewData.layouts ? 'importExport.completeLayout' : 'importExport.legacyLayout')}
                </p>

                {/* 导入模式选择 */}
                <div className="flex gap-2">
                  <Button
                    variant={importMode === 'merge' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('merge')}
                    className="flex-1"
                  >
                    {t('importExport.mergeMode')}
                  </Button>
                  <Button
                    variant={importMode === 'replace' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('replace')}
                    className="flex-1"
                  >
                    {t('importExport.replaceMode')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {importMode === 'merge'
                    ? t('importExport.mergeModeDesc')
                    : t('importExport.replaceModeDesc')}
                </p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/50 bg-destructive/10 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
          {open && autoBackupSupported && <BookmarkAutoBackup />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            {t('common.close')}
          </Button>
          <Button onClick={() => void handleImport()} disabled={!previewData || importing}>
            {t('importExport.confirmImport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
