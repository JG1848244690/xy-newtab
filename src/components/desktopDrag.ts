import { closestCenter, pointerWithin, type CollisionDetection, type KeyboardCoordinateGetter } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Shortcut } from '@/src/utils/types';

export type DesktopDrop =
  | { kind: 'shortcut'; shortcut: Shortcut; page: number; index: number }
  | { kind: 'page'; page: number; index: number }
  | { kind: 'marker'; page: number; index: number; showPage: () => void };

export const desktopShortcutDragId = (id: string) => JSON.stringify(['desktop-shortcut', id]);

export const desktopKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const page = args.context.active?.data.current?.page;
  const droppableRects = new Map(args.context.droppableRects);
  for (const [id, container] of args.context.droppableContainers) {
    const target = container.data.current;
    if (target?.kind !== 'shortcut' || target.page !== page) droppableRects.delete(id);
  }
  return sortableKeyboardCoordinates(event, { ...args, context: { ...args.context, droppableRects } });
};

export const desktopCollision: CollisionDetection = (args) => {
  if (!args.pointerCoordinates) {
    const page = args.active.data.current?.page;
    const targets = args.droppableContainers.filter(({ data }) => data.current?.kind === 'shortcut' && data.current.page === page);
    return closestCenter({ ...args, droppableContainers: targets });
  }

  const hits = pointerWithin(args);
  const data = (id: (typeof hits)[number]['id']) => args.droppableContainers.find((container) => container.id === id)?.data.current as DesktopDrop | undefined;
  const pageHit = hits.find(({ id }) => data(id)?.kind === 'page');
  const page = pageHit ? data(pageHit.id)?.page : undefined;
  const inside = (node: Element | null | undefined) => {
    if (!node || !args.pointerCoordinates) return false;
    const { left, right, top, bottom } = node.getBoundingClientRect();
    const { x, y } = args.pointerCoordinates;
    return x >= left && x <= right && y >= top && y <= bottom;
  };
  return hits.filter(({ id }) => {
    const target = data(id);
    if (!target) return true;
    const node = args.droppableContainers.find((container) => container.id === id)?.node.current;
    return target.kind === 'marker' ? inside(node?.parentElement) : target.page === page && inside(node?.closest('.desktop-track'));
  }).sort((a, b) => Number(data(a.id)?.kind === 'page') - Number(data(b.id)?.kind === 'page'));
};
