import { SearchBar } from '@/src/components/SearchBar';
import { ShortcutGrid } from '@/src/components/ShortcutGrid';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { useShortcuts } from '@/src/hooks/useShortcuts';
import { useSearchEngine } from '@/src/hooks/useSearchEngine';
import { useTheme } from '@/src/hooks/useTheme';

function App() {
  const { shortcuts, addShortcut, updateShortcut, removeShortcut } = useShortcuts();
  const { engine, engineOption, engineOptions, setEngine, search } = useSearchEngine();
  const { theme, setTheme, mounted } = useTheme();

  // 等待主题加载完成
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 ">
      {/* 顶部工具栏 */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle theme={theme} onThemeChange={setTheme} />
      </div>

      {/* 主要内容 */}
      <div className="flex flex-col items-center pt-32 px-8 ">
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

        {/* 快捷图标网格 */}
        <ShortcutGrid
          shortcuts={shortcuts}
          onAdd={addShortcut}
          onUpdate={updateShortcut}
          onRemove={removeShortcut}
        />
      </div>

      {/* 底部信息 */}
      <div className="fixed bottom-4 left-0 right-0 text-center text-muted-foreground text-sm">
        序言 · {shortcuts.length} 个快捷方式
      </div>
    </div>
  );
}

export default App;
