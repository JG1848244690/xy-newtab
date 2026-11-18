/**
 * 新的 settings hook：薄壳
 */

import { useStoreState } from '@/src/lib/store';
import { settingsStore, settingsActions } from '@/src/store/settings';
import type { BackgroundSetting, LayoutType } from '@/src/utils/types';
import type { Locale } from '@/src/i18n';

export function useSettingsStore() {
  const settings = useStoreState(settingsStore, (s) => s);

  return {
    settings,
    layout: settings.layout,
    setBackground: (background: BackgroundSetting) => settingsActions.patch({ background }),
    setLanguage: (language: Locale) => settingsActions.patch({ language }),
    setLayout: (layout: LayoutType) => settingsActions.patch({ layout }),
  };
}
