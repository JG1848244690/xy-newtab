import { useState, useEffect, useRef } from 'react';
import { Download, Loader2, Settings, ListTodo, ChevronUp, X } from 'lucide-react';
import { gsap } from 'gsap';
import { storage } from '@wxt-dev/storage';
import { SearchBar } from '@/src/components/SearchBar';
import { ShortcutGrid } from '@/src/components/ShortcutGrid';
import { GroupLayout } from '@/src/components/GroupLayout';
import { LayoutTabs } from '@/src/components/LayoutTabs';
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
  const { todayTodos, stats, addTodo, toggleTodo, removeTodo, clearCompleted } = useTodos();
  const [isImporting, setIsImporting] = useState(false);
  const [layout, setLayout] = useState<LayoutType>(DEFAULT_SETTINGS.layout);
  const [background, setBackground] = useState<BackgroundSetting | undefined>(DEFAULT_SETTINGS.background);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [todoInput, setTodoInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // GSAP refs
  const searchRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // 保存背景设置
  const handleSaveBackground = async (setting: BackgroundSetting) => {
    setBackground(setting);
    const settings = await storage.getItem<typeof DEFAULT_SETTINGS>(SETTINGS_KEY) || DEFAULT_SETTINGS;
    await storage.setItem(SETTINGS_KEY, { ...settings, background: setting });
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

  // 展开动画
  const handleExpand = () => {
    if (isExpanded) return;
    setIsExpanded(true);

    // 搜索框归位动画
    gsap.to(searchRef.current, {
      scale: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
    });

    // 标题隐藏
    gsap.to(titleRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.4,
      ease: 'power2.out',
    });

    // Grid 区域显示
    gsap.to(contentRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay: 0.15,
      ease: 'power2.out',
      onComplete: () => {
        // 动画完成后启用点击
        if (contentRef.current) {
          contentRef.current.style.pointerEvents = 'auto';
        }
      },
    });
  };

  // 收起动画
  const handleCollapse = () => {
    if (!isExpanded) return;

    // 立即禁用点击，防止动画过程中的干扰
    if (contentRef.current) {
      contentRef.current.style.pointerEvents = 'none';
    }

    // Grid 区域隐藏
    gsap.to(contentRef.current, {
      opacity: 0,
      y: 60,
      duration: 0.3,
      ease: 'power2.in',
    });

    // 搜索框放大并向下偏移到视口中间
    gsap.to(searchRef.current, {
      scale: 1.25,
      y: '35vh',
      duration: 0.4,
      delay: 0.1,
      ease: 'power2.out',
    });

    // 标题显示
    gsap.to(titleRef.current, {
      opacity: 1,
      scale: 1,
      duration: 0.4,
      delay: 0.15,
      ease: 'power2.out',
    });

    setTimeout(() => setIsExpanded(false), 400);
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
            onClick={handleImport}
            disabled={isImporting}
            className="text-muted-foreground hover:text-foreground
              hover:bg-accent/50 rounded-xl transition-all duration-300"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">导入</span>
          </Button>
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
        <div className="min-h-screen flex flex-col items-center px-8 pt-16">

          {/* 中央搜索区域 */}
          <div
            ref={searchRef}
            className="flex flex-col items-center w-full max-w-3xl"
            style={{ transform: 'scale(1.25) translateY(25vh)' }}
          >
            {/* Logo / 标题 */}
            <h1
              ref={titleRef}
              className="text-6xl font-bold mb-8 text-foreground tracking-[0.3em] drop-shadow-lg"
            >
              序言
            </h1>

            {/* 搜索栏 */}
            <div className="w-full">
              <SearchBar
                engine={engine}
                engineOption={engineOption}
                engineOptions={engineOptions}
                onEngineChange={setEngine}
                onSearch={search}
              />
            </div>

            {/* 展开提示 - 箭头 (仅在未展开时显示) */}
            {!isExpanded && (
              <div
                className="flex flex-col items-center mt-6 cursor-pointer select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand();
                }}
              >
                <ChevronUp className="w-5 h-5 text-muted-foreground/60  animate-bounce rotate-180" />

              </div>
            )}

            {/* 收起提示 - 箭头 (仅在展开时显示) */}
            {isExpanded && (
              <div
                className="flex flex-col items-center mt-6 cursor-pointer select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCollapse();
                }}
              >


                <ChevronUp className="w-5 h-5 text-muted-foreground/60   " />
              </div>
            )}
          </div>

          {/* 布局切换和快捷方式区域 */}
          <div
            ref={contentRef}
            className="w-full max-w-4xl"
            style={{ opacity: 0, transform: 'translateY(60px)', pointerEvents: 'none' }}
          >
            {/* 布局切换标签 */}
            <div className="flex justify-center mb-4 mt-8">
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
