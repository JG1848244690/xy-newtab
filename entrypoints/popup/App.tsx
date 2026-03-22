import { EXTENSION_NAME, STORAGE_KEY, DEFAULT_SETTINGS } from '@/src/utils/constants';
import { useState, useEffect } from 'react';
import { ExternalLink, Plus, BookOpen, Palette } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { BackgroundDialog } from '@/src/components/BackgroundDialog';
import { cn } from '@/src/lib/utils';
import { useTheme } from '@/src/hooks/useTheme';
import type { BackgroundSetting } from '@/src/utils/types';
import { storage } from '@wxt-dev/storage';

// 完整的存储键
const SETTINGS_KEY = `local:${STORAGE_KEY.SETTINGS}` as const;

function App() {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'settings'>('shortcuts');
  const [backgroundSetting, setBackgroundSetting] = useState<BackgroundSetting>(DEFAULT_SETTINGS.background!);
  const [bgDialogOpen, setBgDialogOpen] = useState(false);
  const { theme, setTheme, mounted } = useTheme();

  // 加载背景设置
  useEffect(() => {
    storage.getItem<{ background?: BackgroundSetting }>(SETTINGS_KEY).then((settings) => {
      if (settings?.background) {
        setBackgroundSetting(settings.background);
      }
    });
  }, []);

  const handleSaveBackground = async (setting: BackgroundSetting) => {
    setBackgroundSetting(setting);
    const current = await storage.getItem(SETTINGS_KEY) || {};
    await storage.setItem(SETTINGS_KEY, { ...current, background: setting });
  };

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

            <div className="flex items-center justify-between">
              <span className="text-sm">新标签页背景</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBgDialogOpen(true)}
                className="gap-1"
              >
                <Palette className="w-3 h-3" />
                {backgroundSetting.type === 'none' ? '默认' :
                  backgroundSetting.type === 'color' ? '纯色' : '图片'}
              </Button>
            </div>
          </div>
        )}
      </div>

        <BackgroundDialog
          open={bgDialogOpen}
          onOpenChange={setBgDialogOpen}
          setting={backgroundSetting}
          onSave={handleSaveBackground}
        />
    </div>
  );
}

export default App;
