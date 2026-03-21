import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { ShortcutCard } from './ShortcutCard';
import { ShortcutDialog } from './ShortcutDialog';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import type { Shortcut } from '@/src/utils/types';

interface ShortcutGridProps {
  shortcuts: Shortcut[];
  onAdd: (data: { name: string; url: string; icon?: string }) => void;
  onUpdate: (id: string, data: Partial<Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onRemove: (id: string) => void;
  onBatchRemove?: (ids: string[]) => void;
}

export function ShortcutGrid({ shortcuts, onAdd, onUpdate, onRemove, onBatchRemove }: ShortcutGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleAddClick = () => {
    setEditingShortcut(null);
    setDialogOpen(true);
  };

  const handleEditClick = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setDialogOpen(true);
  };

  const handleSave = (data: { name: string; url: string; icon?: string }) => {
    if (editingShortcut) {
      onUpdate(editingShortcut.id, data);
    } else {
      onAdd(data);
    }
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === shortcuts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(shortcuts.map(s => s.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (onBatchRemove) {
      onBatchRemove(Array.from(selectedIds));
    } else {
      // 降级：逐个删除
      selectedIds.forEach(id => onRemove(id));
    }
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  return (
    <div className="w-full max-w-4xl">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                <Checkbox
                  checked={selectedIds.size === shortcuts.length && shortcuts.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="mr-2"
                />
                {selectedIds.size === shortcuts.length ? '取消全选' : '全选'}
              </Button>
              <span className="text-sm text-muted-foreground">
                已选择 {selectedIds.size} 项
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              共 {shortcuts.length} 个快捷方式
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                删除 ({selectedIds.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectMode}
              >
                <X className="w-4 h-4 mr-1" />
                取消
              </Button>
            </>
          ) : (
            <>
              {shortcuts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectMode}
                >
                  批量管理
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddClick}
              >
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 固定三行的网格容器 */}
      <div className="relative">
        {/* 网格容器 - 固定高度，内部滚动 */}
        <div
          className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-70 overflow-y-auto pr-2 scroll-container"
        >
          {shortcuts.map((shortcut) => (
            <div key={shortcut.id} className="relative">
              {isSelectMode && (
                <div className="absolute top-1 left-1 z-10">
                  <Checkbox
                    checked={selectedIds.has(shortcut.id)}
                    onCheckedChange={() => toggleSelect(shortcut.id)}
                    className="bg-background border-border"
                  />
                </div>
              )}
              <ShortcutCard
                shortcut={shortcut}
                onEdit={handleEditClick}
                onRemove={onRemove}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.has(shortcut.id)}
                onSelect={() => toggleSelect(shortcut.id)}
              />
            </div>
          ))}

          {/* 添加按钮 - 非选择模式时显示 */}
          {!isSelectMode && (
            <Button
              variant="outline"
              onClick={handleAddClick}
              className="flex flex-col items-center justify-center p-4 rounded-xl h-[100px] border-dashed border-2 hover:border-primary/50 hover:bg-accent/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="mt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                添加
              </span>
            </Button>
          )}
        </div>

        {/* 滚动提示 - 当内容超出时显示渐变 */}
        {shortcuts.length > 24 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      <ShortcutDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shortcut={editingShortcut}
        onSave={handleSave}
      />
    </div>
  );
}
