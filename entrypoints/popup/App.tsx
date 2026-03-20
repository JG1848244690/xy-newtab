import { useState } from 'react';
import { ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { cn } from '@/src/lib/utils';
import { useTheme } from '@/src/hooks/useTheme';

function App() {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'settings'>('shortcuts');
  const { theme, setTheme, mounted } = useTheme();

  const openNewTab = () => {
    browser.tabs.create({});
  };

  if (!mounted) {
    return (
      <div className="w-80 min-h-96 bg-background flex items-center justify-center">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="w-80 min-h-96 bg-background text-foreground">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-lg font-bold">快捷标签</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle theme={theme} onThemeChange={setTheme} />
          <Button
            variant="ghost"
            size="icon"
            onClick={openNewTab}
            title="打开新标签页"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={cn(
            'flex-1 py-2 text-sm transition-colors',
            activeTab === 'shortcuts'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          快捷方式
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex-1 py-2 text-sm transition-colors',
            activeTab === 'settings'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          设置
        </button>
      </div>

      {/* 内容区 */}
      <div className="p-4">
        {activeTab === 'shortcuts' && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm mb-4">
              在新标签页管理你的快捷方式
            </p>
            <Button
              onClick={openNewTab}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              打开新标签页
            </Button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">主题</span>
              <ThemeToggle theme={theme} onThemeChange={setTheme} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
