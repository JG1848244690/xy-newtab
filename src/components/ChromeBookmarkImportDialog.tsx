import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Folder, Loader2, Search } from 'lucide-react';
import type { ChromeBookmark } from '@/messaging';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { useI18n } from '@/src/i18n';
import { listChromeBookmarks } from '@/src/services/chromeBookmarks';

interface ChromeBookmarkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addShortcuts: (items: { name: string; url: string }[]) => number;
  returnFocus: RefObject<HTMLElement | null>;
}

export function ChromeBookmarkImportDialog({ open, onOpenChange, addShortcuts, returnFocus }: ChromeBookmarkImportDialogProps) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1.5rem)] w-[calc(100%_-_1.5rem)] min-w-0 flex-col gap-3 overflow-hidden rounded-xl p-4 sm:max-w-xl sm:p-5"
        onCloseAutoFocus={(event) => {
          if (!returnFocus.current?.isConnected) return;
          event.preventDefault();
          returnFocus.current.focus({ preventScroll: true });
        }}>
        <DialogHeader className="shrink-0 pr-7 text-left">
          <DialogTitle>{t('importExport.chromeImportTitle')}</DialogTitle>
          <DialogDescription>{t('importExport.chromeChooseDescription')}</DialogDescription>
        </DialogHeader>
        {open && <BookmarkChoices addShortcuts={addShortcuts} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function BookmarkChoices({ addShortcuts, onClose }: Pick<ChromeBookmarkImportDialogProps, 'addShortcuts'> & { onClose: () => void }) {
  const { t } = useI18n();
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>();
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ added: number; skipped: number }>();
  const all = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const term = query.trim().toLocaleLowerCase();
  const matches = useMemo(() => (bookmarks ?? []).filter(({ name, url, folder }) => (
    !term || [name, url, ...folder].some((value) => value.toLocaleLowerCase().includes(term))
  )), [bookmarks, term]);
  const folders = useMemo(() => {
    const groups = new Map<string, ChromeBookmark[]>();
    for (const bookmark of matches) {
      const key = JSON.stringify(bookmark.folder);
      const group = groups.get(key);
      if (group) group.push(bookmark);
      else groups.set(key, [bookmark]);
    }
    return Array.from(groups);
  }, [matches]);
  const visibleSelected = matches.filter(({ id }) => selected.has(id)).length;
  const allSelected = matches.length > 0 && visibleSelected === matches.length;

  useEffect(() => {
    let active = true;
    listChromeBookmarks().then((items) => {
      if (active) setBookmarks(items);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (all.current) all.current.indeterminate = visibleSelected > 0 && !allSelected;
  }, [allSelected, visibleSelected]);

  useEffect(() => {
    if (result) closeButton.current?.focus();
  }, [result]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirm() {
    const items = bookmarks?.filter(({ id }) => selected.has(id));
    if (!items?.length || result) return;
    const added = addShortcuts(items);
    setResult({ added, skipped: items.length - added });
  }

  const checkboxStyle = 'size-4 shrink-0 cursor-pointer accent-primary';
  return (
    <>
      {result ? (
        <div role="status" className="rounded-lg border bg-muted/30 p-4 text-sm">
          <p>{t(result.added ? 'importExport.chromeImportSuccess' : 'importExport.chromeImportSkipAll', { n: result.added })}</p>
          {result.added > 0 && result.skipped > 0 && <p className="mt-1 text-muted-foreground">{t('importExport.chromeImportSkip', { n: result.skipped })}</p>}
        </div>
      ) : failed ? (
        <p role="alert" className="p-3 text-sm text-destructive">{t('importExport.chromeReadFail')}</p>
      ) : !bookmarks ? (
        <p role="status" className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 motion-safe:animate-spin" />{t('importExport.chromeReadPending')}
        </p>
      ) : bookmarks.length === 0 ? (
        <p role="status" className="p-3 text-sm text-muted-foreground">{t('importExport.chromeImportNone')}</p>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-muted/20">
          <label className="relative m-3 block shrink-0">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <span className="sr-only">{t('importExport.chromeSearch')}</span>
            <input type="search" className="h-10 w-full min-w-0 rounded-md border bg-background pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
              placeholder={t('importExport.chromeSearch')} value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 border-b px-3">
            <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium">
              <input ref={all} type="checkbox" className={checkboxStyle} checked={allSelected} disabled={!matches.length}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setSelected((current) => {
                    const next = new Set(current);
                    for (const { id } of matches) checked ? next.add(id) : next.delete(id);
                    return next;
                  });
                }} />
              {t(term ? 'importExport.chromeSelectResults' : 'importExport.chromeSelectAll')}
            </label>
            <span className="text-right text-xs tabular-nums text-muted-foreground" role="status">
              {t('importExport.chromeSelected', { n: selected.size, total: bookmarks.length })}
            </span>
          </div>
          <div className="min-h-0 max-h-[50dvh] min-w-0 overflow-x-hidden overflow-y-auto overscroll-y-contain px-2 pb-2">
            {!matches.length && <p role="status" className="px-3 py-4 text-sm text-muted-foreground">{t('importExport.chromeNoMatches')}</p>}
            {folders.map(([key, items]) => {
              const folder = items[0].folder.join(' / ');
              return (
                <section key={key} className="pt-2">
                  {folder && <h3 className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Folder className="size-3.5 shrink-0" /> <span className="truncate" title={folder}>{folder}</span>
                  </h3>}
                  {items.map(({ id, name, url }) => (
                    <label key={id} className="flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted focus-within:bg-muted">
                      <input type="checkbox" className={checkboxStyle} checked={selected.has(id)} onChange={() => toggle(id)} aria-label={name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium" title={name}>{name}</span>
                        <span className="block truncate text-xs text-muted-foreground" title={url}>{url}</span>
                      </span>
                    </label>
                  ))}
                </section>
              );
            })}
          </div>
        </div>
      )}
      <DialogFooter className="shrink-0 gap-2 sm:gap-0">
        <Button ref={closeButton} variant="outline" onClick={onClose}>{t(result ? 'common.close' : 'common.cancel')}</Button>
        {!result && <Button onClick={confirm} disabled={selected.size === 0}>{t('importExport.confirmImport')}</Button>}
      </DialogFooter>
    </>
  );
}
