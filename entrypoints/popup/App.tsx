import { EXTENSION_NAME } from '@/src/utils/constants';
import { useState } from 'react';
import { ExternalLink, Plus, BookOpen } from 'lucide-react';
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
        <h1 className="text-lg font-bold">{EXTENSION_NAME}</h1>
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
          <div className="space-y-4">
            <Button
              onClick={openNewTab}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              打开新标签页
            </Button>

            {/* 导入教程 */}
            <div className="border border-border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="w-4 h-4" />
                从 Chrome 书签导入
              </div>
              <p className="text-xs text-muted-foreground">
                一键导入浏览器书签中的所有网站快捷方式
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openNewTab}
                className="w-full"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                打开新标签页导入
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">主题</span>
              <ThemeToggle theme={theme} onThemeChange={setTheme} />
            </div>

            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
              更多设置请在 <strong>新标签页</strong> 右上角点击设置图标
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
