import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, Pencil, Search, X } from 'lucide-react';
import { DesktopClock } from './DesktopClock';
import { desktopShortcutDragId, type DesktopDrop } from './desktopDrag';
import { ShortcutIcon } from './ShortcutIcon';
import { useI18n } from '@/src/i18n';
import { notifyNewtabNavigated } from '@/src/utils/navigationReset';
import type { Shortcut } from '@/src/utils/types';
import { filterShortcuts } from '@/src/services/shortcuts';

export function DesktopShortcutFace({ shortcut }: { shortcut: Shortcut }) {
  return (
    <span className="desktop-icon grid place-items-center">
      <ShortcutIcon url={shortcut.url} name={shortcut.name} className="desktop-glyph text-xl" />
    </span>
  );
}

function DesktopShortcut({ shortcut, page, index, searching, onEdit, onMovePage }: {
  shortcut: Shortcut;
  page: number;
  index: number;
  searching: boolean;
  onEdit: (shortcut: Shortcut, trigger: HTMLButtonElement) => void;
  onMovePage: (shortcut: Shortcut, page: number) => void;
}) {
  const { t } = useI18n();
  const { active, attributes, setNodeRef, setActivatorNodeRef, listeners, isDragging, isOver, transform, transition } = useSortable({
    id: desktopShortcutDragId(shortcut.id),
    disabled: searching,
    data: { kind: 'shortcut', shortcut, page, index } satisfies DesktopDrop,
  });
  const editLabel = t('desktop.editShortcut', { name: shortcut.name });

  return (
    <div ref={setNodeRef} className="desktop-tile" data-dragging={isDragging || undefined}
      data-sort-over={isOver && active?.data.current?.page !== page ? '' : undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}>
      <a ref={setActivatorNodeRef} {...listeners} href={shortcut.url} target="_blank" rel="noopener noreferrer"
        draggable={false} onClick={notifyNewtabNavigated} className="desktop-link" title={shortcut.name}
        data-desktop-link={shortcut.id} aria-describedby={searching ? undefined : attributes['aria-describedby']}
        aria-keyshortcuts={searching ? undefined : 'Space Alt+PageUp Alt+PageDown'} onKeyDown={(event) => {
          if (searching) return;
          if (!isDragging && event.altKey && (event.key === 'PageUp' || event.key === 'PageDown')) {
            event.preventDefault();
            onMovePage(shortcut, page + (event.key === 'PageUp' ? -1 : 1));
            return;
          }
          listeners?.onKeyDown?.(event);
        }}>
        <DesktopShortcutFace shortcut={shortcut} />
        <span className="desktop-label">{shortcut.name}</span>
      </a>
      <button type="button" className="desktop-edit" aria-label={editLabel} title={editLabel} aria-haspopup="dialog"
        onClick={(event) => onEdit(shortcut, event.currentTarget)}>
        <Pencil size={13} />
      </button>
    </div>
  );
}

const wheelIdleMs = 180;

function PageMarker({ page, index, label, current, goTo }: {
  page: number;
  index: number;
  label: string;
  current: boolean;
  goTo: (page: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `desktop-marker:${page}`,
    data: { kind: 'marker', page, index, showPage: () => goTo(page) } satisfies DesktopDrop,
  });
  useEffect(() => {
    if (!isOver || current) return;
    const timer = setTimeout(() => goTo(page), 420);
    return () => clearTimeout(timer);
  }, [current, goTo, isOver, page]);

  return (
    <button ref={setNodeRef} type="button" aria-current={current ? 'page' : undefined}
      data-sort-over={isOver ? '' : undefined} aria-label={label} onClick={() => goTo(page)}>
      <span />
    </button>
  );
}

function DesktopPage({ page, items, start, columns, label, roleDescription, children }: {
  page: number;
  items: Shortcut[];
  start: number;
  columns: number;
  label: string;
  roleDescription: string;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: `desktop-page:${page}`,
    data: { kind: 'page', page, index: start + items.length - 1 } satisfies DesktopDrop,
  });
  return (
    <div ref={setNodeRef} className="desktop-page" role="group" aria-roledescription={roleDescription} aria-label={label}
      style={{ '--desktop-columns': Math.max(1, Math.min(columns, items.length)) } as CSSProperties}>
      <SortableContext items={items.map(({ id }) => desktopShortcutDragId(id))} strategy={rectSortingStrategy}>
        {children}
      </SortableContext>
    </div>
  );
}

export function DesktopPages({ shortcuts, onEdit, onMove }: {
  shortcuts: Shortcut[];
  onEdit: (shortcut: Shortcut, trigger: HTMLButtonElement) => void;
  onMove: (shortcut: Shortcut, index: number, page: number) => boolean;
}) {
  const { t } = useI18n();
  const desktop = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const searchBar = useRef<HTMLElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const markers = useRef<HTMLDivElement>(null);
  const focusAfterMove = useRef<string | null>(null);
  const pending = useRef<number | null>(null);
  const settled = useRef(0);
  const previousCapacity = useRef(0);
  const previousQuery = useRef('');
  const [search, setSearch] = useState('');
  const query = search.trim();
  const results = useMemo(() => filterShortcuts(shortcuts, query), [shortcuts, query]);
  const [grid, setGrid] = useState<{ columns: number; rows: number; trackHeight?: number }>({ columns: 8, rows: 3 });
  const [page, setPage] = useState(0);
  const [announcedPage, setAnnouncedPage] = useState<number>();
  const capacity = grid.columns * grid.rows;
  const pages = useMemo(() => Array.from({ length: Math.max(1, Math.ceil(results.length / capacity)) }, (_, index) =>
    results.slice(index * capacity, (index + 1) * capacity)), [results, capacity]);
  const last = pages.length - 1;

  useLayoutEffect(() => {
    const element = content.current;
    const bar = searchBar.current;
    const firstPage = track.current?.firstElementChild;
    if (!element || !bar || !firstPage) return;
    const tile = firstPage.querySelector('.desktop-link');
    const measure = () => {
      const columns = Math.max(1, Math.min(8, Math.floor((element.clientWidth - 24) / 106)));
      if (!tile) {
        setGrid((current) => current.columns === columns ? current : { ...current, columns });
        return;
      }
      const searchGap = Number.parseFloat(getComputedStyle(element).rowGap);
      const pageStyle = getComputedStyle(firstPage);
      const pagePadding = Number.parseFloat(pageStyle.paddingTop) + Number.parseFloat(pageStyle.paddingBottom);
      const rowGap = Number.parseFloat(pageStyle.rowGap);
      const tileHeight = tile.getBoundingClientRect().height;
      const availableHeight = Math.max(0, element.clientHeight - bar.clientHeight - searchGap);
      const rows = Math.max(1, Math.min(3, Math.floor((availableHeight - pagePadding + rowGap) / (tileHeight + rowGap))));
      const trackHeight = Math.min(availableHeight, Math.ceil(rows * tileHeight + (rows - 1) * rowGap + pagePadding));
      setGrid((current) => current.columns === columns && current.rows === rows && current.trackHeight === trackHeight
        ? current : { columns, rows, trackHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(bar);
    if (tile) observer.observe(tile);
    return () => observer.disconnect();
  }, [results[0]?.id]);

  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    const next = query !== previousQuery.current ? 0 : Math.min(last, Math.floor(settled.current * previousCapacity.current / capacity));
    previousQuery.current = query;
    previousCapacity.current = capacity;
    settled.current = next;
    pending.current = null;
    setPage(next);
    setAnnouncedPage(undefined);
    element.scrollTo({ left: (element.children[next] as HTMLElement).offsetLeft, behavior: 'instant' });
  }, [capacity, last, query]);

  const goTo = useCallback((index: number) => {
    const element = track.current;
    const next = Math.max(0, Math.min(last, index));
    const slide = element?.children[next] as HTMLElement | undefined;
    if (!element || !slide || next === (pending.current ?? settled.current)) return;
    pending.current = next;
    setPage(next);
    element.scrollTo({ left: slide.offsetLeft });
  }, [last]);

  function moveToPage(shortcut: Shortcut, nextPage: number) {
    if (nextPage < 0 || nextPage > last) return;
    if (!onMove(shortcut, nextPage * capacity, nextPage)) return;
    focusAfterMove.current = shortcut.id;
    goTo(nextPage);
  }

  useLayoutEffect(() => {
    const id = focusAfterMove.current;
    if (id === null) return;
    focusAfterMove.current = null;
    const links = track.current?.querySelectorAll<HTMLAnchorElement>('[data-desktop-link]');
    Array.from(links ?? []).find((link) => link.dataset.desktopLink === id)?.focus({ preventScroll: true });
  }, [shortcuts]);

  useEffect(() => {
    const element = track.current;
    const surface = desktop.current;
    if (!element || !surface) return;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let previousWheel = -Infinity;
    let wheelTotal = 0;
    let gesturePaged = false;
    const nativeScrollEnd = 'onscrollend' in element;

    const settle = () => {
      if (!element.clientWidth) return;
      const visible = Math.max(0, Math.min(last, Math.round(element.scrollLeft / element.clientWidth)));
      pending.current = null;
      setPage(visible);
      if (visible !== settled.current) setAnnouncedPage(visible);
      settled.current = visible;
    };

    const onScroll = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 120);
    };

    const onWheel = (event: WheelEvent) => {
      if (!last || event.ctrlKey || event.metaKey) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      const now = performance.now();
      if (now - previousWheel > wheelIdleMs) {
        wheelTotal = 0;
        gesturePaged = false;
      }
      previousWheel = now;
      if (gesturePaged) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1;
      wheelTotal += delta * unit;
      if (Math.abs(wheelTotal) < 24) return;
      gesturePaged = true;
      goTo((pending.current ?? settled.current) + Math.sign(wheelTotal));
    };

    surface.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener(nativeScrollEnd ? 'scrollend' : 'scroll', nativeScrollEnd ? settle : onScroll);
    return () => {
      surface.removeEventListener('wheel', onWheel);
      element.removeEventListener(nativeScrollEnd ? 'scrollend' : 'scroll', nativeScrollEnd ? settle : onScroll);
      clearTimeout(settleTimer);
    };
  }, [goTo, last]);

  const currentPage = Math.min(page, last);
  useEffect(() => {
    const list = markers.current;
    const marker = list?.children[currentPage] as HTMLElement | undefined;
    if (!list || !marker) return;
    if (marker.offsetLeft < list.scrollLeft) list.scrollLeft = marker.offsetLeft;
    const right = marker.offsetLeft + marker.offsetWidth;
    if (right > list.scrollLeft + list.clientWidth) list.scrollLeft = right - list.clientWidth;
  }, [currentPage]);

  const step = (direction: number) => goTo((pending.current ?? settled.current) + direction);

  return (
    <main ref={desktop} className="desktop" aria-label={t('desktop.title')}>
      <DesktopClock />
      <section className="desktop-pages" aria-label={t('desktop.title')} aria-roledescription={t('desktop.carousel')}>
        {last > 0 && (
          <nav className="desktop-pagination" aria-label={t('desktop.pagination')}>
            <button type="button" aria-disabled={currentPage === 0} aria-label={t('desktop.previous')} onClick={() => step(-1)}>
              <ChevronLeft size={16} />
            </button>
            <div ref={markers} className="desktop-markers">
              {pages.map((_, index) => <PageMarker key={index} page={index} index={index * capacity}
                current={currentPage === index} goTo={goTo} label={t('desktop.page', { n: index + 1, total: pages.length })} />)}
            </div>
            <button type="button" aria-disabled={currentPage === last} aria-label={t('desktop.next')} onClick={() => step(1)}>
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
        <div ref={content} className="desktop-content"
          style={{ '--desktop-track-height': grid.trackHeight === undefined ? undefined : `${grid.trackHeight}px` } as CSSProperties}>
          <search ref={searchBar} className="desktop-searchbar" aria-label={t('desktop.search')}>
            <div className="desktop-search">
              <Search size={15} aria-hidden="true" />
              <label htmlFor="desktop-bookmark-search" className="sr-only">{t('desktop.search')}</label>
              <input ref={searchInput} id="desktop-bookmark-search" type="search" value={search}
                placeholder={t('desktop.searchPlaceholder')}
                onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => {
                  if (event.key === 'Escape' && !event.nativeEvent.isComposing) setSearch('');
                }} />
              {search && <button type="button" aria-label={t('shortcuts.clearSearch')} onClick={() => {
                setSearch('');
                searchInput.current?.focus();
              }}><X size={14} /></button>}
            </div>
            {query && <span className="sr-only" role="status">{t('common.foundResults', { n: results.length })}</span>}
          </search>
          <div ref={track} className="desktop-track" data-filtered={query ? '' : undefined} tabIndex={last > 0 ? 0 : undefined}
            role="group" aria-label={t('desktop.title')}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
              event.preventDefault();
              step(event.key === 'ArrowRight' ? 1 : -1);
            }}>
            {pages.map((items, pageIndex) => (
              <DesktopPage key={pageIndex} page={pageIndex} items={items} start={pageIndex * capacity} columns={grid.columns}
                roleDescription={t('desktop.slide')} label={t('desktop.page', { n: pageIndex + 1, total: pages.length })}>
                {items.map((shortcut, index) => <DesktopShortcut key={shortcut.id} shortcut={shortcut}
                  page={pageIndex} index={pageIndex * capacity + index} searching={!!query} onEdit={onEdit} onMovePage={moveToPage} />)}
                {!items.length && <p className="desktop-empty">{t(query ? 'common.noResults' : 'desktop.empty')}</p>}
              </DesktopPage>
            ))}
          </div>
        </div>
        <p className="sr-only" role="status">
          {announcedPage !== undefined && t('desktop.page', { n: Math.min(announcedPage, last) + 1, total: pages.length })}
        </p>
      </section>
    </main>
  );
}
