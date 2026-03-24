import { useState, useMemo } from 'react';
import { Plus, Trash2, X, Move, Search, Download } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import { Input } from '@/src/components/ui/input';
import { ShortcutGroupCard } from './ShortcutGroupCard';
import { ShortcutCard } from './ShortcutCard';
import { ShortcutDialog } from './ShortcutDialog';
import { GroupDialog } from './GroupDialog';
import { MigrateDialog } from './MigrateDialog';
import { ImportExportDialog } from './ImportExportDialog';
import { useDebounce } from '@/src/hooks/useDebounce';
import { UI_CONFIG } from '@/src/utils/constants';
import type { Shortcut, ShortcutGroup } from '@/src/utils/types';

interface GroupLayoutProps {
  groups: ShortcutGroup[];
  shortcuts: Shortcut[];
  onToggleGroupExpand: (id: string) => void;
  onAddGroup: (data: { name: string; color?: string }) => void;
  onUpdateGroup: (id: string, data: Partial<Omit<ShortcutGroup, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onRemoveGroup: (id: string) => void;
  onAddShortcutToGroup: (groupId: string, shortcutId: string) => void;
  onAddShortcut: (data: { name: string; url: string }) => Promise<Shortcut>;
  onUpdateShortcut: (id: string, data: Partial<Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onRemoveShortcut: (id: string) => void;
  onBatchRemoveShortcuts?: (ids: string[]) => void;
  onMoveShortcutsToGroup?: (sourceGroupId: string | null, targetGroupId: string | null, shortcutIds: string[]) => void;
  onImportData?: (shortcuts: Shortcut[], groups: ShortcutGroup[]) => void;
  getUngroupedShortcutIds: (ids: string[]) => string[];
}

export function GroupLayout({
  groups,
  shortcuts,
  onToggleGroupExpand,
  onAddGroup,
  onUpdateGroup,
  onRemoveGroup,
  onAddShortcutToGroup,
  onAddShortcut,
  onUpdateShortcut,
  onRemoveShortcut,
  onBatchRemoveShortcuts,
  onMoveShortcutsToGroup,
  onImportData,
  getUngroupedShortcutIds,
}: GroupLayoutProps) {
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [shortcutDialogOpen, setShortcutDialogOpen] = useState(false);
  const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ShortcutGroup | null>(null);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 防抖搜索
  const debouncedQuery = useDebounce(searchQuery, UI_CONFIG.SEARCH_DEBOUNCE_DELAY);

  // 未分组批量管理状态
  const [isUngroupedSelectMode, setIsUngroupedSelectMode] = useState(false);
  const [ungroupedSelectedIds, setUngroupedSelectedIds] = useState<Set<string>>(new Set());
  const [ungroupedMigrateDialogOpen, setUngroupedMigrateDialogOpen] = useState(false);

  // 获取分组内的快捷方式
  const getGroupShortcuts = (group: ShortcutGroup): Shortcut[] => {
    return shortcuts.filter(s => group.shortcutIds.includes(s.id));
  };

  // 获取未分组的快捷方式（使用 useMemo 避免重复计算）
  const ungroupedShortcuts = useMemo(() => {
    const ids = getUngroupedShortcutIds(shortcuts.map(s => s.id));
    return shortcuts.filter(s => ids.includes(s.id));
  }, [shortcuts, getUngroupedShortcutIds]);

  // 搜索过滤逻辑
  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return {
        groups: groups.map(group => ({
          group,
          shortcuts: getGroupShortcuts(group),
        })),
        ungroupedShortcuts,
        totalResults: shortcuts.length,
      };
    }

    const query = debouncedQuery.toLowerCase();
    const matchesSearch = (s: Shortcut) =>
      s.name.toLowerCase().includes(query) ||
      s.url.toLowerCase().includes(query);

    // 过滤分组
    const filteredGroups = groups.map(group => {
      const groupShortcuts = getGroupShortcuts(group).filter(matchesSearch);
      return { group, shortcuts: groupShortcuts };
    }).filter(item => item.shortcuts.length > 0);

    // 过滤未分组
    const filteredUngrouped = ungroupedShortcuts.filter(matchesSearch);

    const totalResults = filteredGroups.reduce((sum, item) => sum + item.shortcuts.length, 0) + filteredUngrouped.length;

    return {
      groups: filteredGroups,
      ungroupedShortcuts: filteredUngrouped,
      totalResults,
    };
  }, [groups, shortcuts, ungroupedShortcuts, debouncedQuery]);

  // 添加分组
  const handleAddGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  // 编辑分组
  const handleEditGroup = (group: ShortcutGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  // 保存分组
  const handleSaveGroup = (data: { name: string; color?: string }) => {
    if (editingGroup) {
      onUpdateGroup(editingGroup.id, data);
    } else {
      onAddGroup(data);
    }
  };

  // 添加快捷方式到分组
  const handleAddShortcutToGroup = (groupId: string) => {
    setCurrentGroupId(groupId);
    setEditingShortcut(null);
    setIsQuickMode(true);
    setShortcutDialogOpen(true);
  };

  // 添加未分组快捷方式
  const handleAddUngroupedShortcut = () => {
    setCurrentGroupId(null);
    setEditingShortcut(null);
    setIsQuickMode(true);
    setShortcutDialogOpen(true);
  };

  // 保存快捷方式（区分新建和编辑）
  const handleSaveShortcut = async (data: { name: string; url: string }) => {
    if (editingShortcut) {
      // 编辑模式：更新现有快捷方式
      onUpdateShortcut(editingShortcut.id, data);
    } else {
      // 新建模式：创建新快捷方式
      const shortcut = await onAddShortcut(data);
      // 如果是在分组内添加，则添加到分组
      if (currentGroupId && shortcut) {
        onAddShortcutToGroup(currentGroupId, shortcut.id);
      }
    }
  };

  // 未分组批量选择
  const toggleUngroupedSelect = (id: string) => {
    const newSelected = new Set(ungroupedSelectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setUngroupedSelectedIds(newSelected);
  };

  const toggleUngroupedSelectMode = () => {
    setIsUngroupedSelectMode(!isUngroupedSelectMode);
    setUngroupedSelectedIds(new Set());
  };

  const handleUngroupedSelectAll = () => {
    if (ungroupedSelectedIds.size === ungroupedShortcuts.length) {
      setUngroupedSelectedIds(new Set());
    } else {
      setUngroupedSelectedIds(new Set(ungroupedShortcuts.map(s => s.id)));
    }
  };

  const handleUngroupedBatchDelete = () => {
    if (ungroupedSelectedIds.size === 0) return;
    if (onBatchRemoveShortcuts) {
      onBatchRemoveShortcuts(Array.from(ungroupedSelectedIds));
    } else {
      ungroupedSelectedIds.forEach(id => onRemoveShortcut(id));
    }
    setUngroupedSelectedIds(new Set());
    setIsUngroupedSelectMode(false);
  };

  const handleUngroupedMigrate = (targetGroupId: string | null) => {
    if (ungroupedSelectedIds.size === 0 || !onMoveShortcutsToGroup) return;
    onMoveShortcutsToGroup(null, targetGroupId, Array.from(ungroupedSelectedIds));
    setUngroupedSelectedIds(new Set());
    setIsUngroupedSelectMode(false);
  };

  return (
    <div className="w-full max-w-4xl space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索快捷方式..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setImportExportDialogOpen(true)}
            title="导入导出"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddGroup}>
            <Plus className="w-4 h-4 mr-1" />
            新建分组
          </Button>
        </div>
      </div>

      {/* 搜索结果提示 */}
      {debouncedQuery.trim() && (
        <div className="text-sm text-muted-foreground">
          {filteredData.totalResults > 0
            ? `找到 ${filteredData.totalResults} 个结果`
            : '无匹配结果'}
        </div>
      )}

      {/* 分组列表 - 固定高度，内部滚动 */}
      <div className="space-y-4 scroll-container max-h-70 overflow-y-auto pr-2">
        {filteredData.groups.map(({ group, shortcuts: groupShortcuts }) => (
          <ShortcutGroupCard
            key={group.id}
            group={group}
            shortcuts={groupShortcuts}
            allGroups={groups}
            onToggleExpand={() => onToggleGroupExpand(group.id)}
            onEdit={() => handleEditGroup(group)}
            onRemove={() => onRemoveGroup(group.id)}
            onAddShortcut={() => handleAddShortcutToGroup(group.id)}
            onEditShortcut={(shortcut) => {
              setEditingShortcut(shortcut);
              setIsQuickMode(false); // 编辑时使用完整表单模式
              setShortcutDialogOpen(true);
            }}
            onRemoveShortcut={onRemoveShortcut}
            onBatchRemoveShortcuts={onBatchRemoveShortcuts}
            onMigrateShortcuts={(targetGroupId, shortcutIds) => {
              onMoveShortcutsToGroup?.(group.id, targetGroupId, shortcutIds);
            }}
          />
        ))}

        {/* 未分组的快捷方式 */}
        {(filteredData.ungroupedShortcuts.length > 0 || (isUngroupedSelectMode && !debouncedQuery.trim())) && (
          <div className="rounded-xl border border-dashed border-border bg-muted/20">
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 border-b border-border/50 bg-muted/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                {isUngroupedSelectMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={handleUngroupedSelectAll}
                    >
                      <Checkbox
                        checked={ungroupedSelectedIds.size === ungroupedShortcuts.length && ungroupedShortcuts.length > 0}
                        onCheckedChange={handleUngroupedSelectAll}
                        className="mr-1 h-3 w-3"
                      />
                      {ungroupedSelectedIds.size === ungroupedShortcuts.length ? '取消' : '全选'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      已选择 {ungroupedSelectedIds.size} 项
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium text-sm text-muted-foreground">
                      未分组
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({ungroupedShortcuts.length})
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isUngroupedSelectMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setUngroupedMigrateDialogOpen(true)}
                      disabled={ungroupedSelectedIds.size === 0}
                    >
                      <Move className="w-3 h-3 mr-1" />
                      迁移
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 px-2"
                      onClick={handleUngroupedBatchDelete}
                      disabled={ungroupedSelectedIds.size === 0}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      删除
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={toggleUngroupedSelectMode}
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
                      onClick={toggleUngroupedSelectMode}
                    >
                      批量管理
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={handleAddUngroupedShortcut}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {filteredData.ungroupedShortcuts.map((shortcut) => (
                  <div key={shortcut.id} className="relative">
                    {isUngroupedSelectMode && (
                      <div className="absolute top-1 left-1 z-10">
                        <Checkbox
                          checked={ungroupedSelectedIds.has(shortcut.id)}
                          onCheckedChange={() => toggleUngroupedSelect(shortcut.id)}
                          className="bg-background border-border"
                        />
                      </div>
                    )}
                    <ShortcutCard
                      shortcut={shortcut}
                      onEdit={(s) => {
                        setEditingShortcut(s);
                        setIsQuickMode(false); // 编辑时使用完整表单模式
                        setShortcutDialogOpen(true);
                      }}
                      onRemove={onRemoveShortcut}
                      isSelectMode={isUngroupedSelectMode}
                      isSelected={ungroupedSelectedIds.has(shortcut.id)}
                      onSelect={() => toggleUngroupedSelect(shortcut.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 空状态 */}
        {filteredData.groups.length === 0 && filteredData.ungroupedShortcuts.length === 0 && (
          debouncedQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">无匹配结果</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm mb-4">暂无快捷方式</p>
              <Button variant="outline" onClick={handleAddUngroupedShortcut}>
                <Plus className="w-4 h-4 mr-1" />
                添加快捷方式
              </Button>
            </div>
          )
        )}
      </div>

      {/* 分组弹窗 */}
      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editingGroup}
        onSave={handleSaveGroup}
      />

      {/* 快捷方式弹窗 */}
      <ShortcutDialog
        open={shortcutDialogOpen}
        onOpenChange={setShortcutDialogOpen}
        shortcut={editingShortcut}
        onSave={handleSaveShortcut}
        quickMode={isQuickMode}
      />

      {/* 未分组迁移弹窗 */}
      <MigrateDialog
        open={ungroupedMigrateDialogOpen}
        onOpenChange={setUngroupedMigrateDialogOpen}
        groups={groups}
        currentGroupId={null}
        onMigrate={handleUngroupedMigrate}
        selectedCount={ungroupedSelectedIds.size}
      />

      {/* 导入导出弹窗 */}
      <ImportExportDialog
        open={importExportDialogOpen}
        onOpenChange={setImportExportDialogOpen}
        shortcuts={shortcuts}
        groups={groups}
        onImport={(newShortcuts, newGroups) => {
          onImportData?.(newShortcuts, newGroups);
        }}
      />
    </div>
  );
}
