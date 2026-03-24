import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Search, Clock, X, ArrowRight, Globe, Loader2, TrendingUp } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { useSearchHistory, type SearchHistoryItem } from '@/src/hooks/useSearchHistory';
import type { SearchEngineType, SearchEngineOption, Shortcut } from '@/src/utils/types';
import { cn } from '@/src/lib/utils';

interface SearchBarProps {
  engine: SearchEngineType;
  engineOption: SearchEngineOption;
  engineOptions: SearchEngineOption[];
  onEngineChange: (engine: SearchEngineType) => void;
  onSearch: (query: string) => void;
  shortcuts?: Shortcut[];
}

// 补全建议项类型
interface SuggestionItem {
  id: string;
  text: string;
  type: 'history' | 'shortcut' | 'suggestion';
  icon: React.ReactNode;
  url?: string;
}

// 搜索引擎建议 API 配置
const SUGGESTION_APIS = {
  baidu: {
    url: (q: string) => `https://suggestion.baidu.com/su?wd=${encodeURIComponent(q)}&cb=jsonp_callback`,
    jsonp: true,
  },
  bing: {
    url: (q: string) => `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(q)}`,
    jsonp: false,
  },
  google: {
    url: (q: string) => `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`,
    jsonp: false,
  },
};

export function SearchBar({
  engine,
  engineOption,
  engineOptions,
  onEngineChange,
  onSearch,
  shortcuts = [],
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const jsonpCallbackRef = useRef<string>('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const { history, addHistory, clearHistory, removeHistoryItem } = useSearchHistory();

  // JSONP 获取百度建议
  const fetchBaiduSuggestions = useCallback((keyword: string): Promise<string[]> => {
    return new Promise((resolve) => {
      // 清理之前的 JSONP
      if (jsonpCallbackRef.current) {
        const oldScript = document.getElementById(jsonpCallbackRef.current);
        if (oldScript) oldScript.remove();
        delete (window as unknown as Record<string, unknown>)[jsonpCallbackRef.current];
      }

      const callbackName = `jsonp_callback_${Date.now()}`;
      jsonpCallbackRef.current = callbackName;

      (window as unknown as Record<string, unknown>)[callbackName] = (data: { s?: string[] }) => {
        resolve(data.s || []);
        const script = document.getElementById(callbackName);
        if (script) script.remove();
        delete (window as unknown as Record<string, unknown>)[callbackName];
      };

      const script = document.createElement('script');
      script.id = callbackName;
      script.src = SUGGESTION_APIS.baidu.url(keyword);
      script.onerror = () => {
        resolve([]);
        script.remove();
        delete (window as unknown as Record<string, unknown>)[callbackName];
      };
      document.body.appendChild(script);
    });
  }, []);

  // 获取搜索引擎建议
  const fetchSearchSuggestions = useCallback(async (keyword: string): Promise<string[]> => {
    if (!keyword.trim()) return [];

    const apiConfig = SUGGESTION_APIS[engine];
    if (!apiConfig) return [];

    try {
      if (apiConfig.jsonp) {
        // JSONP 方式（百度）
        return await fetchBaiduSuggestions(keyword);
      } else {
        // CORS 方式（Bing/Google - 可能需要代理）
        const response = await fetch(apiConfig.url(keyword));
        const data = await response.json();

        // Bing 返回格式: ["keyword", ["sug1", "sug2", ...]]
        // Google 返回格式: ["keyword", ["sug1", "sug2", ...]]
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return data[1].slice(0, 5);
        }
        return [];
      }
    } catch {
      // API 失败时静默返回空数组
      return [];
    }
  }, [engine, fetchBaiduSuggestions]);

  // 生成建议列表
  const generateSuggestions = useCallback(() => {
    const items: SuggestionItem[] = [];
    const lowerQuery = query.toLowerCase().trim();
    const addedTexts = new Set<string>();

    // 1. 搜索历史匹配
    const historyMatches = lowerQuery
      ? history.filter((h) => h.query.toLowerCase().includes(lowerQuery))
      : history.slice(0, 5);

    historyMatches.slice(0, 3).forEach((h) => {
      if (!addedTexts.has(h.query.toLowerCase())) {
        items.push({
          id: `history-${h.query}`,
          text: h.query,
          type: 'history',
          icon: <Clock className="w-3.5 h-3.5 text-muted-foreground" />,
        });
        addedTexts.add(h.query.toLowerCase());
      }
    });

    // 2. 快捷方式名称匹配
    if (lowerQuery) {
      const shortcutMatches = shortcuts.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerQuery) ||
          s.url.toLowerCase().includes(lowerQuery)
      );

      shortcutMatches.slice(0, 2).forEach((s) => {
        if (!addedTexts.has(s.name.toLowerCase())) {
          items.push({
            id: `shortcut-${s.id}`,
            text: s.name,
            type: 'shortcut',
            icon: <Globe className="w-3.5 h-3.5 text-primary" />,
            url: s.url,
          });
          addedTexts.add(s.name.toLowerCase());
        }
      });
    }

    return items;
  }, [query, history, shortcuts]);

  // 更新建议列表（包含 API 建议）
  const updateSuggestions = useCallback(async () => {
    const baseSuggestions = generateSuggestions();
    const lowerQuery = query.toLowerCase().trim();
    const addedTexts = new Set(baseSuggestions.map((s) => s.text.toLowerCase()));

    // 添加本地建议
    setSuggestions(baseSuggestions);

    // 获取搜索引擎建议
    if (lowerQuery.length >= 1) {
      setIsLoadingSuggestions(true);
      try {
        const apiSuggestions = await fetchSearchSuggestions(query);

        // 合并 API 建议
        const apiItems: SuggestionItem[] = [];
        apiSuggestions.forEach((suggestion) => {
          if (!addedTexts.has(suggestion.toLowerCase())) {
            apiItems.push({
              id: `suggestion-${suggestion}`,
              text: suggestion,
              type: 'suggestion',
              icon: <TrendingUp className="w-3.5 h-3.5 text-orange-500" />,
            });
            addedTexts.add(suggestion.toLowerCase());
          }
        });

        // 将 API 建议插入到列表中（放在历史之后，快捷方式之前）
        const historyItems = baseSuggestions.filter((s) => s.type === 'history');
        const shortcutItems = baseSuggestions.filter((s) => s.type === 'shortcut');

        setSuggestions([...historyItems, ...apiItems.slice(0, 3), ...shortcutItems]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }
  }, [query, generateSuggestions, fetchSearchSuggestions]);

  // 防抖更新建议
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (showSuggestions) {
      debounceRef.current = setTimeout(() => {
        updateSuggestions();
      }, 150);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, showSuggestions, updateSuggestions]);

  // 计算下拉菜单位置
  useEffect(() => {
    if (showSuggestions && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showSuggestions, suggestions]);

  // 执行搜索
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    addHistory(finalQuery);
    onSearch(finalQuery);
    setShowSuggestions(false);
    setQuery(finalQuery);
  };

  // 点击建议项
  const handleSuggestionClick = (item: SuggestionItem) => {
    if (item.type === 'shortcut' && item.url) {
      window.open(item.url, '_blank');
      setShowSuggestions(false);
    } else {
      setQuery(item.text);
      handleSearch(item.text);
    }
  };

  // 键盘导航
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 输入变化时重置选中
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 删除历史记录项
  const handleRemoveHistory = (e: React.MouseEvent, queryText: string) => {
    e.stopPropagation();
    removeHistoryItem(queryText);
  };

  return (
    <>
      <div ref={containerRef} className="w-full">
        <div className="flex items-center gap-2 p-2 rounded-2xl
          bg-white/60 dark:bg-card/60 backdrop-blur-xl
          border border-white/40 dark:border-border/50
          shadow-lg shadow-black/5 dark:shadow-black/20
          hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
          transition-all duration-300">
        {/* 搜索引擎选择 */}
        <Select value={engine} onValueChange={(value) => onEngineChange(value as SearchEngineType)}>
          <SelectTrigger className="w-[100px] border-0 bg-transparent focus:ring-0 shrink-0 hover:bg-accent/50 rounded-xl transition-colors">
            <SelectValue>
              <span className="text-sm truncate">{engineOption.name}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {engineOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.icon} {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 分隔线 */}
        <div className="w-px h-8 bg-border/50 shrink-0" />

        {/* 搜索输入框 */}
        <div className="flex-1 min-w-0 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="搜索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className={cn(
              "w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
              "text-base placeholder:text-muted-foreground pr-6"
            )}
          />
          {isLoadingSuggestions && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* 搜索按钮 */}
        <Button
          onClick={() => handleSearch()}
          disabled={!query.trim()}
          className="rounded-xl px-6 shrink-0
            bg-primary/90 hover:bg-primary
            shadow-md shadow-primary/20
            transition-all duration-300
            hover:shadow-lg hover:shadow-primary/30
            disabled:opacity-50 disabled:shadow-none"
        >
          <Search className="w-4 h-4 mr-2" />
          搜索
        </Button>
      </div>
    </div>

      {/* 自动补全下拉菜单 - 使用 Portal 渲染到 body */}
      {showSuggestions && suggestions.length > 0 && createPortal(
        <div
          ref={suggestionsRef}
          className="fixed z-[9999]
            bg-white/95 dark:bg-card/95 backdrop-blur-xl
            border border-border/50 rounded-xl shadow-2xl
            overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          {suggestions.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleSuggestionClick(item)}
              className={cn(
                "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors group",
                index === selectedIndex
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {item.icon}
                <span className="text-sm truncate">{item.text}</span>
                {item.type === 'shortcut' && (
                  <span className="text-xs text-muted-foreground truncate flex-shrink-0 max-w-[120px]">
                    {item.url}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {item.type === 'history' && (
                  <button
                    onClick={(e) => handleRemoveHistory(e, item.text)}
                    className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除"
                  >
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
                <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground">
            <span>↑↓ 选择 · Enter 确认 · Esc 关闭</span>
            {history.length > 0 && (
              <button
                onClick={() => {
                  clearHistory();
                  setSuggestions([]);
                }}
                className="hover:text-destructive transition-colors"
              >
                清空历史
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
