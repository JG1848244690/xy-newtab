import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, Check, Chrome, Loader2, ArrowDownUp } from 'lucide-react';
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
import type { Shortcut, ShortcutGroup, ExportData } from '@/src/utils/types';
import { exportData, parseImportFile, mergeImportData, replaceImportData, type ImportMode } from '@/src/utils/importExport';
import { importChromeBookmarks } from '@/src/services/chromeBookmarks';
import { useI18n } from '@/src/i18n';

interface ImportExportDialogProps {
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  onImport: (shortcuts: Shortcut[], groups: ShortcutGroup[]) => void;
  addShortcuts: (items: { name: string; url: string }[]) => number;
}

export function ImportExportDialog({
  shortcuts,
  groups,
  onImport,
  addShortcuts,
}: ImportExportDialogProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [previewData, setPreviewData] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isChromeImporting, setIsChromeImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData(shortcuts, groups);
    handleClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg(null);
    try {
      const data = await parseImportFile(file);
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('importExport.parseFail'));
      setPreviewData(null);
    }

    // 重置 input 以允许重复选择同一文件
    e.target.value = '';
  };

  const handleImport = () => {
    if (!previewData) return;

    let result: { shortcuts: Shortcut[]; groups: ShortcutGroup[] };

    if (importMode === 'merge') {
      result = mergeImportData(shortcuts, groups, previewData);
    } else {
      result = replaceImportData(previewData);
    }

    onImport(result.shortcuts, result.groups);
    handleClose();
  };

  const handleChromeImport = async () => {
    setIsChromeImporting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { count, added, skipped } = await importChromeBookmarks(addShortcuts);
      if (count === 0) {
        setError(t('importExport.chromeImportNone'));
        return;
      }

      if (added === 0) {
        setSuccessMsg(t('importExport.chromeImportSkipAll'));
      } else {
        setSuccessMsg(t('importExport.chromeImportSuccess', { n: added }) + (skipped > 0 ? t('importExport.chromeImportSkip', { n: skipped }) : ''));
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || t('importExport.chromeImportFail'));
    } finally {
      setIsChromeImporting(false);
    }
  };

  const handleClose = () => {
    setImportMode('merge');
    setPreviewData(null);
    setError(null);
    setSuccessMsg(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => nextOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="bookmark-action gap-1.5 rounded-lg">
          <ArrowDownUp className="h-3.5 w-3.5" />
          {t('layout.importExport')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('importExport.title')}</DialogTitle>
          <DialogDescription>
            {t('importExport.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 导出按钮 */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
            <div>
              <p className="font-medium">{t('importExport.exportTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('importExport.exportSummary', { shortcuts: shortcuts.length, groups: groups.length })}
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
              onClick={handleChromeImport}
              variant="outline"
              size="sm"
              disabled={isChromeImporting}
            >
              {isChromeImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Chrome className="w-4 h-4 mr-2" />
              )}
              {t('importExport.chromeImport')}
            </Button>
          </div>

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
                    {t('importExport.previewSummary', { shortcuts: previewData.shortcuts.length, groups: previewData.groups.length })}
                  </span>
                </div>

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

            {/* 成功提示 */}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-green-500/50 bg-green-500/10 text-sm text-green-600 dark:text-green-400">
                <Check className="w-4 h-4 flex-shrink-0" />
                {successMsg}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.close')}
          </Button>
          <Button onClick={handleImport} disabled={!previewData}>
            {t('importExport.confirmImport')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
