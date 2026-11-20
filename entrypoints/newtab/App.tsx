import { useState, useEffect, useMemo, useRef } from 'react';
import { Dock, LayoutGrid, Settings } from 'lucide-react';
import { NewTabWallpaper } from '@/src/components/NewTabWallpaper';
import { DockDesktop } from '@/src/components/DockDesktop';
import { GroupLayout } from '@/src/components/GroupLayout';
import { ImportExportDialog } from '@/src/components/ImportExportDialog';
import { SettingsSheet } from '@/src/components/SettingsSheet';
import { Todos } from '@/src/components/Todos';
import { Button } from '@/src/components/ui/button';
import { useShortcutsStore } from '@/src/hooks/useShortcutsStore';
import { useGroupsStore } from '@/src/hooks/useGroupsStore';
import { useSettingsStore } from '@/src/hooks/useSettingsStore';
import { useTheme } from '@/src/hooks/useTheme';
import { useStoresReady } from '@/src/lib/useStoresReady';
import { NEWTAB_NAVIGATED_EVENT } from '@/src/utils/navigationReset';
import { useI18n } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import { persistStorageItems } from '@/src/lib/storage';
import { settingsStore } from '@/src/store/settings';
import { STORAGE_KEYS } from '@/src/store/keys';
import type { RestoredBookmarks } from '@/src/utils/importExport';

function App() {
  const storesReady = useStoresReady();
  const { t, locale } = useI18n();

  const { shortcuts, actions: shortcutActions } = useShortcutsStore();
  const { records, pinnedIds, actions: groupActions } = useGroupsStore();
  const dockShortcuts = useMemo(() => {
    const byId = new Map(shortcuts.map((shortcut) => [shortcut.id, shortcut]));
    return pinnedIds.flatMap((id) => {
      const shortcut = byId.get(id);
      return shortcut ? [shortcut] : [];
    });
  }, [shortcuts, pinnedIds]);
  const { settings, settings: { background, desktopOrder, desktopHiddenIds }, setBackground, setDesktopOrder,
    setDesktopVisible, setLayout, layout } = useSettingsStore();
  const dockMode = layout === 'dock';

  const { mounted } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsTrigger = useRef<HTMLButtonElement>(null);
  const [resetNonce, setResetNonce] = useState(0);

  useEffect(() => {
    document.documentElement.lang = locale.replace('_', '-');
    document.title = t('common.appName');
  }, [locale, t]);

  // 跳转重置
  useEffect(() => {
    const handleNavigated = () => setResetNonce((n) => n + 1);
    window.addEventListener(NEWTAB_NAVIGATED_EVENT, handleNavigated);
    return () => window.removeEventListener(NEWTAB_NAVIGATED_EVENT, handleNavigated);
  }, []);

  useEffect(() => {
    if (storesReady && dockMode) groupActions.initializeDock(shortcuts.slice(0, 6).map(({ id }) => id));
  }, [dockMode, groupActions, shortcuts, storesReady]);

  // 等主题 + stores 初始化
  if (!mounted || !storesReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }

  const handleImportData = (restored: RestoredBookmarks) => persistStorageItems({
    [STORAGE_KEYS.shortcuts]: restored.shortcuts,
    [STORAGE_KEYS.groups]: restored.groups,
    [STORAGE_KEYS.settings]: { ...settingsStore.get(), ...restored.settings },
  });

  return (
    <div className="relative min-h-screen">
      <NewTabWallpaper setting={background} />
      <div className="min-h-screen bg-transparent transition-colors duration-300 relative z-10">
        <div role="group" aria-label={t('layout.actions')} className={cn('bookmark-surface fixed right-4 top-4 z-30 flex items-center gap-0.5 rounded-xl p-1',
          dockMode && 'dock-tools')}>
          <ImportExportDialog
            shortcuts={shortcuts}
            groups={records}
            settings={settings}
            onImport={handleImportData}
            addShortcuts={shortcutActions.addMany}
            compact
          />
          <Button type="button" variant="ghost" size="icon" className="bookmark-action rounded-lg"
            aria-label={t(dockMode ? 'layout.switchToGroups' : 'layout.switchToDock')}
            title={t(dockMode ? 'layout.switchToGroups' : 'layout.switchToDock')}
            onClick={() => setLayout(dockMode ? 'group' : 'dock')}>
            {dockMode ? <LayoutGrid className="size-4" /> : <Dock className="size-4" />}
          </Button>
          <Todos />
          <Button
            ref={settingsTrigger}
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            aria-label={t('settings.title')}
            title={t('settings.title')}
            aria-haspopup="dialog"
            className="bookmark-action rounded-lg"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {dockMode ? (
          <DockDesktop shortcuts={shortcuts} dockShortcuts={dockShortcuts} desktopOrder={desktopOrder} onSort={setDesktopOrder}
            hiddenIds={desktopHiddenIds} onSetDesktopVisible={setDesktopVisible}
            onPin={groupActions.setPinned} onReorder={groupActions.reorderDock} onUpdateShortcut={shortcutActions.update}
            onManage={() => setLayout('group')} />
        ) : (
          <>
            <main className="mx-auto max-w-4xl px-3 pb-16 pt-24 sm:px-6">
              <GroupLayout key={resetNonce} />
            </main>
            <footer className="fixed inset-x-0 bottom-2 z-10 flex justify-center pointer-events-none">
              <span className="bookmark-surface bookmark-footer rounded-full px-3 py-1 text-xs tabular-nums">
                {t('common.appName')} · {t('common.shortcutCount', { n: shortcuts.length })}
              </span>
            </footer>
          </>
        )}
      </div>

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          settingsTrigger.current?.focus({ preventScroll: true });
        }}
        setting={background || { type: 'none' }}
        onSave={setBackground}
      />
    </div>
  );
}

export default App;
