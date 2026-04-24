import { useState, useEffect } from 'react';
import { Settings, ListTodo } from 'lucide-react';
import { storage } from '@wxt-dev/storage';
import { SearchBar } from '@/src/components/SearchBar';
import { GroupLayout } from '@/src/components/GroupLayout';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { SettingsSheet } from '@/src/components/SettingsSheet';
import { TodoSheet } from '@/src/components/TodoSheet';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useShortcuts } from '@/src/hooks/useShortcuts';
import { useGroups } from '@/src/hooks/useGroups';
import { useSearchEngine } from '@/src/hooks/useSearchEngine';
import { useTheme } from '@/src/hooks/useTheme';
import { useTodos } from '@/src/hooks/useTodos';
import { STORAGE_KEY, DEFAULT_SETTINGS } from '@/src/utils/constants';
import type { BackgroundSetting } from '@/src/utils/types';

// 完整的存储键
const SETTINGS_KEY = `local:${STORAGE_KEY.SETTINGS}` as const;

function App() {
  const { shortcuts, addShortcut, addShortcuts, updateShortcut, removeShortcut, removeShortcuts, importShortcuts } = useShortcuts();
  const { groups, addGroup, updateGroup, removeGroup, toggleGroupExpand, addShortcutToGroup, moveShortcutsToGroup, getUngroupedShortcutIds, importGroups, reorderGroups, reorderShortcutsInGroup } = useGroups();
  const { engine, engineOption, engineOptions, setEngine, search } = useSearchEngine();
  const { theme, setTheme, mounted } = useTheme();
  const { todayTodos, stats, addTodo, toggleTodo, removeTodo, clearCompleted } = useTodos();
  const [background, setBackground] = useState<BackgroundSetting | undefined>(DEFAULT_SETTINGS.background);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [todoInput, setTodoInput] = useState('');

  // 加载背景设置
  useEffect(() => {
    storage.getItem<{ background?: BackgroundSetting }>(SETTINGS_KEY).then((settings) => {
      if (settings?.background) {
        setBackground(settings.background);
      }
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

  // 处理待办输入
  const handleTodoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (todoInput.trim()) {
      addTodo(todoInput.trim());
      setTodoInput('');
    }
    setTodoOpen(true);
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
      {background?.type === 'image' && background.imageUrl && (
        <div
          className="fixed inset-0 z-0 transition-colors duration-300"
          style={getOverlayStyle()}
        />
      )}

      {/* 主内容 */}
      <div className="min-h-screen bg-background/80 transition-colors duration-300 relative z-10">
        {/* 顶部工具栏 */}
        <div className="fixed top-4 right-4 z-10 flex items-center gap-2
          bg-white/60 dark:bg-card/60 backdrop-blur-xl
          border border-white/40 dark:border-border/50
          rounded-2xl p-2 shadow-lg shadow-black/5 dark:shadow-black/20">
          {/* 待办输入框 - 诱导用户添加 */}
          <form onSubmit={handleTodoSubmit} className="flex items-center">
            <div className="relative group">
              <ListTodo className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                placeholder="添加待办..."
                className="pl-9 w-44 h-9 text-sm
                  bg-transparent border-0
                  focus-visible:ring-1 focus-visible:ring-primary/50
                  placeholder:text-muted-foreground
                  transition-all duration-300"
                onClick={() => setTodoOpen(true)}
              />
            </div>
          </form>

          <div className="w-px h-6 bg-border/50" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="text-muted-foreground hover:text-foreground
              hover:bg-accent/50 rounded-xl transition-all duration-300"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
        </div>

        {/* 主要内容 */}
        <div className="min-h-screen flex flex-col items-center px-8 pt-8">

          {/* 搜索区域 */}
          <div className="w-full max-w-3xl relative z-50 mb-6">
            <SearchBar
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

      {/* 待办侧栏 - 左侧 */}
      <TodoSheet
        open={todoOpen}
        onOpenChange={setTodoOpen}
        todos={todayTodos}
        stats={stats}
        onAdd={addTodo}
        onToggle={toggleTodo}
        onRemove={removeTodo}
        onClearCompleted={clearCompleted}
      />

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
