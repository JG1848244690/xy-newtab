import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import type { ShortcutGroup } from '@/src/utils/types';
import { GROUP_COLORS } from '@/src/utils/constants';
import { cn } from '@/src/lib/utils';

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: ShortcutGroup | null;
  onSave: (data: { name: string; color?: string }) => void;
}

export function GroupDialog({ open, onOpenChange, group, onSave }: GroupDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>('');
  const isEditing = !!group;

  useEffect(() => {
    if (open) {
      if (group) {
        setName(group.name);
        setColor(group.color || '');
      } else {
        setName('');
        setColor('');
      }
    }
  }, [open, group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      color: color || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑分组' : '新建分组'}</DialogTitle>
          <DialogDescription>
            {isEditing ? '修改分组名称和颜色' : '创建一个新的快捷方式分组'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">分组名称</Label>
              <Input
                id="name"
                placeholder="例如：工作、学习、娱乐"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>分组颜色</Label>
              <div className="flex flex-wrap gap-2">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      `bg-${c.value}-500`,
                      color === c.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    title={c.name}
                    style={{
                      backgroundColor: c.value === 'blue' ? '#3b82f6' :
                        c.value === 'green' ? '#22c55e' :
                        c.value === 'purple' ? '#a855f7' :
                        c.value === 'orange' ? '#f97316' :
                        c.value === 'red' ? '#ef4444' :
                        c.value === 'cyan' ? '#06b6d4' : undefined
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setColor('')}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all bg-muted',
                    !color
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  title="默认"
                >
                  <span className="text-xs text-muted-foreground">×</span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
