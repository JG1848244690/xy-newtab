import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import type { Shortcut, ShortcutGroup, ExportData } from '@/src/utils/types';
import { exportData, parseImportFile, mergeImportData, replaceImportData, type ImportMode } from '@/src/utils/importExport';

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
  groups: ShortcutGroup[];
  onImport: (shortcuts: Shortcut[], groups: ShortcutGroup[]) => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  shortcuts,
  groups,
  onImport,
}: ImportExportDialogProps) {
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [previewData, setPreviewData] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData(shortcuts, groups);
    onOpenChange(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const data = await parseImportFile(file);
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败');
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
    setPreviewData(null);
    setError(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setPreviewData(null);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>导入导出书签</DialogTitle>
          <DialogDescription>
            备份或恢复你的分组和书签数据
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 导出按钮 */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div>
              <p className="font-medium">导出数据</p>
              <p className="text-sm text-muted-foreground">
                导出 {shortcuts.length} 个书签，{groups.length} 个分组
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>
          </div>

          {/* 导入区域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">导入数据</p>
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
                选择文件
              </Button>
            </div>

            {/* 预览数据 */}
            {previewData && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>
                    {previewData.shortcuts.length} 个书签，{previewData.groups.length} 个分组
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
                    合并
                  </Button>
                  <Button
                    variant={importMode === 'replace' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('replace')}
                    className="flex-1"
                  >
                    替换
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {importMode === 'merge'
                    ? '合并：保留现有数据，添加新数据（跳过重复URL）'
                    : '替换：清空现有数据，使用导入的数据'}
                </p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleImport} disabled={!previewData}>
            确认导入
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
