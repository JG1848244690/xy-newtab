import { EXTENSION_NAME } from '@/src/utils/constants';
import { useState } from 'react';
import { ExternalLink, Plus, BookOpen } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

function App() {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'settings'>('shortcuts');

  const openNewTab = () => {
    browser.tabs.create({});
  };

  return (
    <div className="w-80 min-h-96 bg-background text-foreground">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-black/10">
        <h1 className="text-lg font-bold">{EXTENSION_NAME}</h1>
        <div className="flex items-center gap-1">
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
      <div className="flex border-b border-white/20 dark:border-black/10">
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
            <div className="border border-white/20 dark:border-black/10 rounded-lg p-3 space-y-3">
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
                <ExternalLink className="w-3 w-3 mr-2" />
                打开新标签页导入
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
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
