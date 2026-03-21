import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import type { Shortcut } from '@/src/utils/types';
import { getGoogleFaviconUrl, extractDomain } from '@/src/utils/faviconCache';

interface ShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcut?: Shortcut | null;
  onSave: (data: { name: string; url: string; icon?: string }) => void;
}

export function ShortcutDialog({ open, onOpenChange, shortcut, onSave }: ShortcutDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('');
  const isEditing = !!shortcut;

  // 当打开弹窗时，初始化表单数据
  useEffect(() => {
    if (open) {
      if (shortcut) {
        setName(shortcut.name);
        setUrl(shortcut.url);
        setIcon(shortcut.icon || '');
      } else {
        setName('');
        setUrl('');
        setIcon('');
      }
    }
  }, [open, shortcut]);

  // 预览图标（直接使用 Google Favicon URL）
  const previewIcon = url ? getGoogleFaviconUrl(extractDomain(url), 64) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    // 不传 icon，让 ShortcutCard 通过三级 fallback 自己获取和缓存
    onSave({
      name: name.trim(),
      url: url.trim(),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑快捷方式' : '添加快捷方式'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                placeholder="例如：Google"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">网址</Label>
              <Input
                id="url"
                placeholder="例如：google.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            {/* 图标预览 */}
            {previewIcon && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">图标预览：</span>
                <img
                  src={previewIcon}
                  alt="Favicon"
                  className="w-8 h-8 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!name.trim() || !url.trim()}>
              {isEditing ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
