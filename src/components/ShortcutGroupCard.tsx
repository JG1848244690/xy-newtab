import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, FolderOpen, Move, X } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { MigrateDialog } from './MigrateDialog';
import { ShortcutCard } from './ShortcutCard';
import type { Shortcut, ShortcutGroup } from '@/src/utils/types';
import { cn } from '@/src/lib/utils';

interface ShortcutGroupCardProps {
  group: ShortcutGroup;
  shortcuts: Shortcut[];
  allGroups: ShortcutGroup[]; // 所有分组，用于迁移
  onToggleExpand: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onAddShortcut: () => void;
  onEditShortcut: (shortcut: Shortcut) => void;
  onRemoveShortcut: (id: string) => void;
  onBatchRemoveShortcuts?: (ids: string[]) => void;
  onMigrateShortcuts?: (targetGroupId: string | null, shortcutIds: string[]) => void;
}

export function ShortcutGroupCard({
  group,
  shortcuts,
  allGroups,
  onToggleExpand,
  onEdit,
  onRemove,
  onAddShortcut,
  onEditShortcut,
  onRemoveShortcut,
  onBatchRemoveShortcuts,
  onMigrateShortcuts,
}: ShortcutGroupCardProps) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [migrateDialogOpen, setMigrateDialogOpen] = useState(false);

  const groupColorMap: Record<string, string> = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
  };

  const colorClass = group.color ? groupColorMap[group.color] || '' : '';

  // sticky 头部背景色映射
  const stickyBgMap: Record<string, string> = {
    blue: 'bg-blue-500/20',
    green: 'bg-green-500/20',
    purple: 'bg-purple-500/20',
    orange: 'bg-orange-500/20',
    red: 'bg-red-500/20',
    cyan: 'bg-cyan-500/20',
  };
  const stickyBg = group.color ? stickyBgMap[group.color] || 'bg-muted/80' : 'bg-muted/80';

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedIds(new Set());
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
    if (onBatchRemoveShortcuts) {
      onBatchRemoveShortcuts(Array.from(selectedIds));
    } else {
      selectedIds.forEach(id => onRemoveShortcut(id));
    }
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleMigrate = (targetGroupId: string | null) => {
    if (selectedIds.size === 0 || !onMigrateShortcuts) return;
    onMigrateShortcuts(targetGroupId, Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  return (
    <div className={cn(
      "rounded-xl border bg-gradient-to-br",
      colorClass || 'from-muted/50 to-muted/30 border-border'
    )}>
      {/* 分组头部 - sticky 吸顶 */}
      <div className={cn(
        "sticky top-0 z-10 flex items-center justify-between p-3 border-b border-border/50 backdrop-blur-sm",
        stickyBg
      )}>
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {group.isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <FolderOpen className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{group.name}</span>
          <span className="text-xs text-muted-foreground">
            ({shortcuts.length})
          </span>
        </button>

        <div className="flex items-center gap-1">
          {isSelectMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={handleSelectAll}
              >
                <Checkbox
                  checked={selectedIds.size === shortcuts.length && shortcuts.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="mr-1 h-3 w-3"
                />
                {selectedIds.size === shortcuts.length ? '取消' : '全选'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setMigrateDialogOpen(true)}
                disabled={selectedIds.size === 0}
              >
                <Move className="w-3 h-3 mr-1" />
                迁移
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2"
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                删除
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={toggleSelectMode}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  if (!group.isExpanded) {
                    onToggleExpand();
                  }
                  setTimeout(() => toggleSelectMode(), 100);
                }}
                disabled={shortcuts.length === 0}
              >
                批量管理
              </Button>
              {group.isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={onAddShortcut}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <span className="text-xs">⋯</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    编辑分组
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除分组
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* 选择模式提示 */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="px-3 py-1 bg-primary/10 text-xs text-primary border-b border-border/50">
          已选择 {selectedIds.size} 项
        </div>
      )}

      {/* 分组内容 */}
      {group.isExpanded && (
        <div className="p-3">
          {shortcuts.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
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
                    onEdit={onEditShortcut}
                    onRemove={onRemoveShortcut}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.has(shortcut.id)}
                    onSelect={() => toggleSelect(shortcut.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FolderOpen className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">分组为空</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onAddShortcut}
              >
                <Plus className="w-3 h-3 mr-1" />
                添加快捷方式
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 迁移弹窗 */}
      <MigrateDialog
        open={migrateDialogOpen}
        onOpenChange={setMigrateDialogOpen}
        groups={allGroups}
        currentGroupId={group.id}
        onMigrate={handleMigrate}
        selectedCount={selectedIds.size}
      />
    </div>
  );
}
