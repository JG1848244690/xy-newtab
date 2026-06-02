import { useState, useEffect, useCallback } from 'react';
import { storage } from '@wxt-dev/storage';
import type { SearchEngineType, SearchEngineOption } from '@/src/utils/types';
import { LOCAL_STORAGE_KEY, DEFAULT_SETTINGS, SEARCH_ENGINES } from '@/src/utils/constants';
import { notifyNewtabNavigated } from '@/src/utils/navigationReset';

const SETTINGS_KEY = LOCAL_STORAGE_KEY.SETTINGS;

/**
 * 搜索引擎切换 Hook
 */
export function useSearchEngine() {
  const [engine, setEngineState] = useState<SearchEngineType>(DEFAULT_SETTINGS.searchEngine);
  const [engineOption, setEngineOption] = useState<SearchEngineOption>(SEARCH_ENGINES[0]);

  // 加载搜索引擎设置
  useEffect(() => {
    storage.getItem<{ searchEngine: SearchEngineType }>(SETTINGS_KEY).then((settings) => {
      const savedEngine = settings?.searchEngine || DEFAULT_SETTINGS.searchEngine;
      setEngineState(savedEngine);
      const option = SEARCH_ENGINES.find(e => e.id === savedEngine) || SEARCH_ENGINES[0];
      setEngineOption(option);
    });
  }, []);

  // 设置搜索引擎
  const setEngine = useCallback(async (newEngine: SearchEngineType) => {
    setEngineState(newEngine);
    const option = SEARCH_ENGINES.find(e => e.id === newEngine) || SEARCH_ENGINES[0];
    setEngineOption(option);

    const settings = await storage.getItem<{ searchEngine: SearchEngineType }>(SETTINGS_KEY) || DEFAULT_SETTINGS;
    await storage.setItem(SETTINGS_KEY, { ...settings, searchEngine: newEngine });
  }, []);

  // 执行搜索
  const search = useCallback((query: string) => {
    if (!query.trim()) return;
    const searchUrl = engineOption.url + encodeURIComponent(query.trim());
    window.open(searchUrl, '_blank');
    notifyNewtabNavigated();
  }, [engineOption]);

  // 获取所有搜索引擎选项
  const engineOptions = SEARCH_ENGINES;

  return {
    engine,
    engineOption,
    setEngine,
    search,
    engineOptions,
  };
}
