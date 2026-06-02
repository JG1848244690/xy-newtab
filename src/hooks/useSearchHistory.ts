import { useState, useEffect, useCallback } from 'react';
import { storage } from '@wxt-dev/storage';
import { LOCAL_STORAGE_KEY } from '@/src/utils/constants';

// 搜索历史项
export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  count: number; // 搜索次数
}

const HISTORY_KEY = LOCAL_STORAGE_KEY.SEARCH_HISTORY;
const MAX_HISTORY = 50; // 最多保存50条历史

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // 加载历史记录
  useEffect(() => {
    storage.getItem<SearchHistoryItem[]>(HISTORY_KEY).then((saved) => {
      if (saved) {
        setHistory(saved);
      }
    });

    // 监听变化
    const unwatch = storage.watch<SearchHistoryItem[]>(
      HISTORY_KEY,
      (newHistory) => {
        if (newHistory) {
          setHistory(newHistory);
        }
      }
    );

    return unwatch;
  }, []);

  // 添加搜索记录
  const addHistory = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    const current = await storage.getItem<SearchHistoryItem[]>(HISTORY_KEY) || [];
    const now = Date.now();

    // 查找是否已存在
    const existingIndex = current.findIndex(
      (item) => item.query.toLowerCase() === trimmedQuery.toLowerCase()
    );

    let updated: SearchHistoryItem[];

    if (existingIndex !== -1) {
      // 更新已存在的记录
      updated = current.map((item, index) =>
        index === existingIndex
          ? { ...item, timestamp: now, count: item.count + 1 }
          : item
      );
      // 移到最前面
      const [existing] = updated.splice(existingIndex, 1);
      updated = [existing, ...updated];
    } else {
      // 添加新记录
      const newItem: SearchHistoryItem = {
        query: trimmedQuery,
        timestamp: now,
        count: 1,
      };
      updated = [newItem, ...current].slice(0, MAX_HISTORY);
    }

    await storage.setItem(HISTORY_KEY, updated);
    setHistory(updated);
  }, []);

  // 清空历史
  const clearHistory = useCallback(async () => {
    await storage.setItem(HISTORY_KEY, []);
    setHistory([]);
  }, []);

  // 删除单条历史
  const removeHistoryItem = useCallback(async (query: string) => {
    const current = await storage.getItem<SearchHistoryItem[]>(HISTORY_KEY) || [];
    const updated = current.filter(
      (item) => item.query.toLowerCase() !== query.toLowerCase()
    );
    await storage.setItem(HISTORY_KEY, updated);
    setHistory(updated);
  }, []);

  // 搜索匹配的历史
  const searchHistory = useCallback(
    (keyword: string, limit = 5): SearchHistoryItem[] => {
      if (!keyword.trim()) {
        return history.slice(0, limit);
      }
      const lowerKeyword = keyword.toLowerCase();
      return history
        .filter((item) => item.query.toLowerCase().includes(lowerKeyword))
        .slice(0, limit);
    },
    [history]
  );

  return {
    history,
    addHistory,
    clearHistory,
    removeHistoryItem,
    searchHistory,
  };
}
