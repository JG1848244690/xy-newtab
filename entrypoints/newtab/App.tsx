import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { storage } from '@wxt-dev/storage';
import { SearchBar } from '@/src/components/SearchBar';
import { ShortcutGrid } from '@/src/components/ShortcutGrid';
import { GroupLayout } from '@/src/components/GroupLayout';
import { LayoutTabs } from '@/src/components/LayoutTabs';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { Button } from '@/src/components/ui/button';
import { useShortcuts } from '@/src/hooks/useShortcuts';
import { useGroups } from '@/src/hooks/useGroups';
import { useSearchEngine } from '@/src/hooks/useSearchEngine';
import { useTheme } from '@/src/hooks/useTheme';
import { sendMessage } from '@/messaging';
import { STORAGE_KEY, DEFAULT_SETTINGS } from '@/src/utils/constants';
import type { LayoutType, BackgroundSetting } from '@/src/utils/types';

// 完整的存储键
const SETTINGS_KEY = `local:${STORAGE_KEY.SETTINGS}` as const;

function App() {
  const { shortcuts, addShortcut, addShortcuts, updateShortcut, removeShortcut, removeShortcuts } = useShortcuts();
  const { groups, addGroup, updateGroup, removeGroup, toggleGroupExpand, addShortcutToGroup, moveShortcutsToGroup, getUngroupedShortcutIds } = useGroups();
  const { engine, engineOption, engineOptions, setEngine, search } = useSearchEngine();
  const { theme, setTheme, mounted } = useTheme();
  const [isImporting, setIsImporting] = useState(false);
  const [layout, setLayout] = useState<LayoutType>(DEFAULT_SETTINGS.layout);
  const [background, setBackground] = useState<BackgroundSetting | undefined>(DEFAULT_SETTINGS.background);

  // 加载布局和背景设置
  useEffect(() => {
    storage.getItem<{ layout?: LayoutType; background?: BackgroundSetting }>(SETTINGS_KEY).then((settings) => {
      if (settings?.layout) {
        setLayout(settings.layout);
      }
      if (settings?.background) {
        setBackground(settings.background);
      }
    });

    // 监听设置变化，实时更新背景
    const unwatch = storage.watch<{ layout?: LayoutType; background?: BackgroundSetting }>(
      SETTINGS_KEY,
      (newSettings) => {
        if (newSettings?.layout) {
          setLayout(newSettings.layout);
        }
        if (newSettings?.background) {
          setBackground(newSettings.background);
        }
      }
    );

    return unwatch;
  }, []);

  // 保存布局设置
  const handleLayoutChange = async (newLayout: LayoutType) => {
    setLayout(newLayout);
    const settings = await storage.getItem<typeof DEFAULT_SETTINGS>(SETTINGS_KEY) || DEFAULT_SETTINGS;
    await storage.setItem(SETTINGS_KEY, { ...settings, layout: newLayout });
  };

  // 从 Chrome 书签导入快捷方式
  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await sendMessage('shortcuts/import-from-newtab');

      if (!result.success) {
        alert(result.error || '导入失败');
        return;
      }

      if (result.shortcuts.length === 0) {
        alert('未找到可导入的书签');
        return;
      }

      // 使用批量添加函数
      const importedCount = await addShortcuts(result.shortcuts);

      if (importedCount === 0) {
        alert('所有书签都已存在，跳过导入');
      } else {
        alert(`成功导入 ${importedCount} 个快捷方式${importedCount < result.shortcuts.length ? `（跳过 ${result.shortcuts.length - importedCount} 个重复）` : ''}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  // 等待主题加载完成
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  // 计算背景样式
  const getBackgroundStyle = (): React.CSSProperties => {
    if (!background || background.type === 'none') {
      return {};
    }

    if (background.type === 'color') {
      return { backgroundColor: background.color };
    }

    if (background.type === 'image' && background.imageUrl) {
      return {
        backgroundImage: `url(${background.imageUrl})`,
        backgroundSize: background.size || 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    return {};
  };

  // 计算背景遮罩样式
  const getOverlayStyle = (): React.CSSProperties => {
    if (!background || background.type !== 'image' || background.opacity === undefined) {
      return {};
    }
    return {
      backgroundColor: `rgba(0, 0, 0, ${1 - background.opacity})`,
    };
  };

  return (
    <div className="min-h-screen relative" style={getBackgroundStyle()}>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 -z-10" style={getOverlayStyle()} />
      {/* 主内容 */}
      <div className="min-h-screen bg-background/80 transition-colors duration-300">
        {/* 顶部工具栏 */}
        <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImport}
            disabled={isImporting}
            className="text-muted-foreground hover:text-foreground"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">导入</span>
          </Button>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>

        {/* 主要内容 */}
        <div className="flex flex-col items-center pt-32 px-8">
          {/* Logo / 标题 */}
          <h1 className="text-4xl font-bold mb-8 text-foreground">
            序言
          </h1>

          {/* 搜索栏 */}
          <div className="mb-16 w-full max-w-4xl">
            <SearchBar
              engine={engine}
              engineOption={engineOption}
              engineOptions={engineOptions}
              onEngineChange={setEngine}
              onSearch={search}
            />
          </div>

          {/* 布局切换和快捷方式区域 */}
          <div className="w-full max-w-4xl">
            {/* 布局切换标签 */}
            <div className="flex justify-center mb-4">
              <LayoutTabs layout={layout} onLayoutChange={handleLayoutChange} />
            </div>

            {/* 根据布局类型显示不同内容 */}
            {layout === 'grid' ? (
              <ShortcutGrid
                shortcuts={shortcuts}
                layout={layout}
                onLayoutChange={handleLayoutChange}
                onAdd={addShortcut}
                onUpdate={updateShortcut}
                onRemove={removeShortcut}
                onBatchRemove={removeShortcuts}
              />
            ) : (
              <GroupLayout
                groups={groups}
                shortcuts={shortcuts}
                onToggleGroupExpand={toggleGroupExpand}
                onAddGroup={addGroup}
                onUpdateGroup={updateGroup}
                onRemoveGroup={removeGroup}
                onAddShortcutToGroup={addShortcutToGroup}
                onAddShortcut={addShortcut}
                onUpdateShortcut={updateShortcut}
                onRemoveShortcut={removeShortcut}
                onBatchRemoveShortcuts={removeShortcuts}
                onMoveShortcutsToGroup={moveShortcutsToGroup}
                getUngroupedShortcutIds={getUngroupedShortcutIds}
              />
            )}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="fixed bottom-4 left-0 right-0 text-center text-muted-foreground text-sm">
          序言 · {shortcuts.length} 个快捷方式
        </div>
      </div>
    </div>
  );
}

export default App;
