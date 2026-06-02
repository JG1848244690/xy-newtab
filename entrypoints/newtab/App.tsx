import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { storage } from '@wxt-dev/storage';
import { SearchBar } from '@/src/components/SearchBar';
import { GroupLayout } from '@/src/components/GroupLayout';
import { SettingsSheet } from '@/src/components/SettingsSheet';
import { Button } from '@/src/components/ui/button';
import { useShortcuts } from '@/src/hooks/useShortcuts';
import { useGroups } from '@/src/hooks/useGroups';
import { useSearchEngine } from '@/src/hooks/useSearchEngine';
import { useTheme } from '@/src/hooks/useTheme';
import { STORAGE_KEY, DEFAULT_SETTINGS } from '@/src/utils/constants';
import { NEWTAB_NAVIGATED_EVENT } from '@/src/utils/navigationReset';
import type { BackgroundSetting } from '@/src/utils/types';

// 完整的存储键
const SETTINGS_KEY = `local:${STORAGE_KEY.SETTINGS}` as const;

function App() {
  const { shortcuts, addShortcut, addShortcuts, updateShortcut, removeShortcut, removeShortcuts, importShortcuts } = useShortcuts();
  const { groups, addGroup, updateGroup, removeGroup, toggleGroupExpand, addShortcutToGroup, moveShortcutsToGroup, getUngroupedShortcutIds, importGroups, reorderGroups, reorderShortcutsInGroup } = useGroups();
  const { engine, engineOption, engineOptions, setEngine, search } = useSearchEngine();
  const { mounted } = useTheme();
  const [background, setBackground] = useState<BackgroundSetting | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  // 加载背景设置
  useEffect(() => {
    storage.getItem<{ background?: BackgroundSetting }>(SETTINGS_KEY).then((settings) => {
      if (settings?.background) {
        setBackground(settings.background);
      }
      setBackgroundLoaded(true);
    });

    // 监听设置变化，实时更新背景
    const unwatch = storage.watch<{ background?: BackgroundSetting }>(
      SETTINGS_KEY,
      (newSettings) => {
        if (newSettings?.background) {
          setBackground(newSettings.background);
        }
      }
    );

    return unwatch;
  }, []);

  // 在新标签页触发“跳转到目标网址”后，重置本页面的 UI 状态
  useEffect(() => {
    const handleNavigated = () => setResetNonce((n) => n + 1);
    window.addEventListener(NEWTAB_NAVIGATED_EVENT, handleNavigated);
    return () => window.removeEventListener(NEWTAB_NAVIGATED_EVENT, handleNavigated);
  }, []);

  // 保存背景设置
  const handleSaveBackground = async (setting: BackgroundSetting) => {
    setBackground(setting);
    const settings = await storage.getItem<typeof DEFAULT_SETTINGS>(SETTINGS_KEY) || DEFAULT_SETTINGS;
    await storage.setItem(SETTINGS_KEY, { ...settings, background: setting });
  };

  // 处理导入数据（从导入导出对话框）
  const handleImportData = async (newShortcuts: typeof shortcuts, newGroups: typeof groups) => {
    await Promise.all([
      importShortcuts(newShortcuts),
      importGroups(newGroups),
    ]);
  };

  // 等待主题和背景设置加载完成
  if (!mounted || !backgroundLoaded) {
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
      {background?.type === 'image' && background.imageUrl && (
        <div
          className="fixed inset-0 z-0"
          style={getOverlayStyle()}
        />
      )}

      {/* 主内容 */}
      <div className="min-h-screen bg-transparent transition-colors duration-300 relative z-10">
        {/* 顶部工具栏 */}
        <div className="fixed top-4 right-4 z-10
          bg-white/20 dark:bg-black/20 backdrop-blur-xl
          border border-white/20 dark:border-black/10
          rounded-2xl p-2 shadow-lg shadow-black/5 dark:shadow-black/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground
              hover:bg-accent/50 rounded-xl transition-all duration-300"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* 主要内容 */}
        <div className="min-h-screen flex flex-col items-center px-8 pt-8">

          {/* 搜索区域 */}
          <div className="w-full max-w-3xl relative z-50 mb-6">
            <SearchBar
              key={`search-${resetNonce}`}
              engine={engine}
              engineOption={engineOption}
              engineOptions={engineOptions}
              onEngineChange={setEngine}
              onSearch={search}
              shortcuts={shortcuts}
            />
          </div>

          {/* 分组布局 */}
          <div className="w-full max-w-4xl flex-1 mt-16">
            <GroupLayout
              key={`groups-${resetNonce}`}
              groups={groups}
              shortcuts={shortcuts}
              onToggleGroupExpand={toggleGroupExpand}
              onAddGroup={addGroup}
              onUpdateGroup={updateGroup}
              onRemoveGroup={removeGroup}
              onAddShortcutToGroup={addShortcutToGroup}
              onAddShortcut={addShortcut}
              onAddShortcuts={addShortcuts}
              onUpdateShortcut={updateShortcut}
              onRemoveShortcut={removeShortcut}
              onBatchRemoveShortcuts={removeShortcuts}
              onMoveShortcutsToGroup={moveShortcutsToGroup}
              onImportData={handleImportData}
              onReorderGroups={reorderGroups}
              onReorderShortcutsInGroup={reorderShortcutsInGroup}
              getUngroupedShortcutIds={getUngroupedShortcutIds}
            />
          </div>

        </div>

        {/* 底部信息 */}
        <div className="fixed bottom-4 left-0 right-0 text-center text-muted-foreground text-sm">
          序言 · {shortcuts.length} 个快捷方式
        </div>
      </div>

      {/* 设置侧栏 - 右侧 */}
      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        setting={background || { type: 'none' }}
        onSave={handleSaveBackground}
      />
    </div>
  );
}

export default App;
