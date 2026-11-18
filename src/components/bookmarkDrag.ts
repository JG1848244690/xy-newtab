import { closestCenter, pointerWithin, rectIntersection, type CollisionDetection, type KeyboardCoordinateGetter } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export type BookmarkDragTarget =
  | { kind: 'group'; groupId: string }
  | { kind: 'ungrouped'; groupId: null }
  | { kind: 'shortcut'; groupId: string | null; shortcutId: string };

export const groupDragId = (groupId: string) => JSON.stringify(['group', groupId]);
export const shortcutDragId = (groupId: string | null, id: string) => JSON.stringify(['shortcut', groupId, id]);
export const ungroupedDragId = 'ungrouped';

export const bookmarkKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  if (args.context.active?.data.current?.kind !== 'group') return sortableKeyboardCoordinates(event, args);
  const droppableRects = new Map(args.context.droppableRects);
  for (const [id, container] of args.context.droppableContainers) {
    if (container.data.current?.kind !== 'group') droppableRects.delete(id);
  }
  return sortableKeyboardCoordinates(event, { ...args, context: { ...args.context, droppableRects } });
};

// 书签优先落到指针下的卡片，否则落到区域本身。区域外松手取消。
export const bookmarkCollision: CollisionDetection = (args) => {
  const source = args.active.data.current as BookmarkDragTarget | undefined;
  const targets = args.droppableContainers.filter(({ data }) =>
    source?.kind === 'group' ? data.current?.kind === 'group' : Boolean(data.current?.kind)
  );
  if (source?.kind === 'group') return closestCenter({ ...args, droppableContainers: targets });

  const hits = args.pointerCoordinates
    ? pointerWithin({ ...args, droppableContainers: targets })
    : rectIntersection({ ...args, droppableContainers: targets });

  const cards = hits.filter(({ id }) => targets.find((target) => target.id === id)?.data.current?.kind === 'shortcut');
  return cards.length ? cards : hits;
};
