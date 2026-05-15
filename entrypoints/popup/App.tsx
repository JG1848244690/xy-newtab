import { useState, useEffect } from 'react';
import { Search, Globe, ExternalLink, Settings as SettingsIcon, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { storage } from '@wxt-dev/storage';
import { STORAGE_KEY } from '@/src/utils/constants';
import type { Shortcut, ShortcutGroup } from '@/src/utils/types';
import { cn } from '@/src/lib/utils';

const SHORTCUTS_KEY = `local:${STORAGE_KEY.SHORTCUTS}` as const;
const GROUPS_KEY = `local:${STORAGE_KEY.GROUPS}` as const;

function App() {
  const [activeTab, setActiveTab] = useState<'search' | 'settings'>('search');
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [groups, setGroups] = useState<ShortcutGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    Promise.all([
      storage.getItem<Shortcut[]>(SHORTCUTS_KEY),
      storage.getItem<ShortcutGroup[]>(GROUPS_KEY),
    ]).then(([savedShortcuts, savedGroups]) => {
      setShortcuts(savedShortcuts || []);
      setGroups(savedGroups || []);
      setLoading(false);
    });

    // 监听数据变化
    const unwatchShortcuts = storage.watch<Shortcut[]>(SHORTCUTS_KEY, (newVal) => {
      setShortcuts(newVal || []);
    });
    const unwatchGroups = storage.watch<ShortcutGroup[]>(GROUPS_KEY, (newVal) => {
      setGroups(newVal || []);
    });

    return () => {
      unwatchShortcuts();
      unwatchGroups();
    };
  }, []);

  // 打开网站
  const openUrl = (url: string) => {
    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
    browser.tabs.create({ url: finalUrl });
  };

  // 搜索
  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    // 判断是否是 URL
    if (query.includes('.') && !query.includes(' ')) {
      openUrl(query);
    } else {
      // 使用默认搜索引擎搜索
      browser.tabs.create({ url: `https://www.bing.com/search?q=${encodeURIComponent(query)}` });
    }
  };

  // 过滤快捷方式
  const getShortcutById = (id: string): Shortcut | undefined => {
    return shortcuts.find(s => s.id === id);
  };

  const filteredGroups = groups.map(group => ({
    ...group,
    shortcuts: group.shortcutIds
      .map(id => getShortcutById(id))
      .filter((s): s is Shortcut => s !== undefined)
      .filter(s => 
        !searchQuery || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.url.toLowerCase().includes(searchQuery.toLowerCase())
      ),
  })).filter(group => group.shortcuts.length > 0);

  // 未分组的快捷方式
  const groupedShortcutIds = new Set(groups.flatMap(g => g.shortcutIds));
  const ungroupedShortcuts = shortcuts
    .filter(s => !groupedShortcutIds.has(s.id))
    .filter(s => 
      !searchQuery || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // 设置组件
  const SettingsTab = () => {
    const [background, setBackground] = useState<{ type: string }>({ type: 'none' });

    useEffect(() => {
      storage.getItem<{ background?: { type: string } }>(`local:${STORAGE_KEY.SETTINGS}`).then(settings => {
        if (settings?.background) {
          setBackground(settings.background);
        }
      });
    }, []);

    return (
      <div className="space-y-4">
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          更多设置（背景、布局等）请在 <strong>新标签页</strong> 中点击右上角设置图标进行配置
        </div>

        <Button
          onClick={() => browser.tabs.create({ url: browser.runtime.getURL('newtab.html') })}
          className="w-full gap-2"
        >
          <ExternalLink className="w-4 h-4" />
          打开新标签页
        </Button>
      </div>
    );
  };

  return (
    <div className="w-[380px] h-[480px] bg-background text-foreground flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-white/20 dark:border-black/10">
        <h1 className="text-base font-bold">序言</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => browser.tabs.create({ url: browser.runtime.getURL('newtab.html') })}
          title="打开新标签页"
          className="h-7 w-7"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-white/20 dark:border-black/10">
        <button
          onClick={() => setActiveTab('search')}
          className={cn(
            'flex-1 py-2 text-sm transition-colors',
            activeTab === 'search'
              ? 'text-primary border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          快捷搜索
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            'flex-1 py-2 text-sm transition-colors',
            activeTab === 'settings'
              ? 'text-primary border-b-2 border-primary font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          设置
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'search' && (
          <div className="p-3 space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索快捷方式或网址..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearch(searchQuery);
                  }
                }}
                className="pl-9 h-9"
                autoFocus
              />
            </div>

            {/* 快捷方式列表 */}
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                加载中...
              </div>
            ) : filteredGroups.length === 0 && ungroupedShortcuts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Globe className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">暂无快捷方式</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => browser.tabs.create({ url: browser.runtime.getURL('newtab.html') })}
                >
                  去添加
                </Button>
              </div>
            ) : (
              <>
                {/* 未分组的快捷方式 */}
                {ungroupedShortcuts.length > 0 && (
                  <div className="space-y-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      {ungroupedShortcuts.map(shortcut => (
                        <button
                          key={shortcut.id}
                          onClick={() => openUrl(shortcut.url)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                          title={shortcut.url}
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-xs truncate w-full text-center">{shortcut.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 分组列表 */}
                {filteredGroups.map(group => (
                  <GroupItem
                    key={group.id}
                    group={group}
                    onOpenUrl={openUrl}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// 分组组件
function GroupItem({ group, onOpenUrl }: { group: ShortcutGroup & { shortcuts: Shortcut[] }, onOpenUrl: (url: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const groupColorMap: Record<string, string> = {
    blue: 'border-blue-500/30',
    green: 'border-green-500/30',
    purple: 'border-purple-500/30',
    orange: 'border-orange-500/30',
    red: 'border-red-500/30',
    cyan: 'border-cyan-500/30',
  };

  const colorClass = group.color ? groupColorMap[group.color] || '' : '';

  return (
    <div className={cn(
      "rounded-lg border bg-white/10 dark:bg-black/10 backdrop-blur-xl",
      colorClass || 'border-white/20 dark:border-black/10'
    )}>
      {/* 分组头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-muted/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-1.5">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{group.name}</span>
          <span className="text-xs text-muted-foreground">({group.shortcuts.length})</span>
        </div>
      </button>

      {/* 分组内容 */}
      {isExpanded && (
        <div className="p-2 pt-0">
          <div className="grid grid-cols-4 gap-1.5">
            {group.shortcuts.map(shortcut => (
              <button
                key={shortcut.id}
                onClick={() => onOpenUrl(shortcut.url)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                title={shortcut.url}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-xs truncate w-full text-center">{shortcut.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
