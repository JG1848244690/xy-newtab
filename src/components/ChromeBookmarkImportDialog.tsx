import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Folder, Loader2 } from 'lucide-react';
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
      <DialogContent className="grid max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 rounded-xl p-4 sm:max-w-xl sm:p-6"
        onCloseAutoFocus={(event) => {
          if (!returnFocus.current?.isConnected) return;
          event.preventDefault();
          returnFocus.current.focus({ preventScroll: true });
        }}>
        <DialogHeader className="pr-6 text-left">
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
  const [result, setResult] = useState<{ added: number; skipped: number }>();
  const all = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const folders = useMemo(() => {
    const groups = new Map<string, ChromeBookmark[]>();
    for (const bookmark of bookmarks ?? []) {
      const key = JSON.stringify(bookmark.folder);
      const group = groups.get(key);
      if (group) group.push(bookmark);
      else groups.set(key, [bookmark]);
    }
    return Array.from(groups);
  }, [bookmarks]);
  const allSelected = !!bookmarks?.length && selected.size === bookmarks.length;

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
    if (all.current) all.current.indeterminate = selected.size > 0 && !allSelected;
  }, [allSelected, selected.size]);

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
        <div className="flex min-h-0 flex-col rounded-xl border bg-muted/20">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b px-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium">
              <input ref={all} type="checkbox" className={checkboxStyle} checked={allSelected}
                onChange={(event) => setSelected(new Set(event.target.checked ? bookmarks.map(({ id }) => id) : []))} />
              {t('importExport.chromeSelectAll')}
            </label>
            <span className="text-right text-xs tabular-nums text-muted-foreground" role="status">
              {t('importExport.chromeSelected', { n: selected.size, total: bookmarks.length })}
            </span>
          </div>
          <div className="min-h-0 max-h-[48dvh] overflow-y-auto overscroll-y-contain px-2 pb-2">
            {folders.map(([key, items]) => {
              const folder = items[0].folder.join(' / ');
              return (
                <section key={key} className="pt-2">
                  {folder && <h3 className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                    <Folder className="size-3.5 shrink-0" /> <span className="truncate" title={folder}>{folder}</span>
                  </h3>}
                  {items.map(({ id, name, url }) => (
                    <label key={id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted focus-within:bg-muted">
                      <input type="checkbox" className={checkboxStyle} checked={selected.has(id)} onChange={() => toggle(id)} aria-label={name} />
                      <span className="min-w-0">
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
      <DialogFooter className="gap-2 sm:gap-0">
        <Button ref={closeButton} variant="outline" onClick={onClose}>{t(result ? 'common.close' : 'common.cancel')}</Button>
        {!result && <Button onClick={confirm} disabled={selected.size === 0}>{t('importExport.confirmImport')}</Button>}
      </DialogFooter>
    </>
  );
}
