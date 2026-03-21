import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { SearchBar } from '@/src/components/SearchBar';
import { ShortcutGrid } from '@/src/components/ShortcutGrid';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { Button } from '@/src/components/ui/button';
import { useShortcuts } from '@/src/hooks/useShortcuts';
import { useSearchEngine } from '@/src/hooks/useSearchEngine';
import { useTheme } from '@/src/hooks/useTheme';
import { sendMessage } from '@/messaging';

function App() {
  const { shortcuts, addShortcut, addShortcuts, updateShortcut, removeShortcut } = useShortcuts();
  const { engine, engineOption, engineOptions, setEngine, search } = useSearchEngine();
  const { theme, setTheme, mounted } = useTheme();
  const [isImporting, setIsImporting] = useState(false);

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

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 ">
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
