import { v } from '@/src/schemas/validator';
import { TODO_HOST_PERMISSION, TODO_SITE } from './todoSite';

const fields = {
  content: v.string(),
  startDate: v.string(),
  endDate: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  allDay: v.boolean(),
  description: v.optional(v.string()),
};
const draftSchema = v.object(fields);
const todosSchema = v.array(v.object({ ...fields, id: v.string(), completed: v.boolean() }));

export type Todo = ReturnType<typeof todosSchema.parse>[number];
export type TodoDraft = ReturnType<typeof draftSchema.parse>;
export type TodoChange =
  | { type: 'create'; draft: TodoDraft }
  | { type: 'update'; id: string; draft: TodoDraft }
  | { type: 'toggle' | 'delete'; id: string };
type TodoFailure = { status: 'disconnected' | 'signed-out' | 'error' };
type TodoResult<T> = { status: 'ready'; value: T } | TodoFailure;
export type TodoListResult = TodoResult<Todo[]>;
export type TodoChangeResult = TodoResult<null>;

export function localTodoDate(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-');
}

function isCalendarDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(0);
  parsed.setUTCFullYear(year, month - 1, day);
  return parsed.toISOString().slice(0, 10) === date;
}

const isClockTime = (time: string) => /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time);
const withSeconds = (time: string) => time.length === 5 ? time + ':00' : time;

export function todoDraftError(draft: TodoDraft) {
  if (!draft.content.trim()) return 'contentRequired';
  if (!isCalendarDate(draft.startDate) || !isCalendarDate(draft.endDate) || draft.endDate < draft.startDate) {
    return 'dateOrder';
  }
  if (!draft.allDay && (!isClockTime(draft.startTime) || !isClockTime(draft.endTime) ||
    (draft.startDate === draft.endDate && withSeconds(draft.endTime) < withSeconds(draft.startTime)))) {
    return 'timeOrder';
  }
}

const tasksUrl = new URL('/api-hls/todos', TODO_SITE).href;

async function requestTodo<T>(
  url: string,
  read: (response: Response) => Promise<T> | T,
  init?: RequestInit,
): Promise<TodoResult<T>> {
  try {
    if (!await browser.permissions.contains({ origins: [TODO_HOST_PERMISSION] })) return { status: 'disconnected' };
    const response = await fetch(url, {
      ...init, credentials: 'include', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 401) return { status: 'signed-out' };
    if (!response.ok) return { status: 'error' };
    return { status: 'ready', value: await read(response) };
  } catch {
    return { status: 'error' };
  }
}

export function fetchTodos(date: string): Promise<TodoListResult> {
  if (typeof date !== 'string' || !isCalendarDate(date)) return Promise.resolve({ status: 'error' });
  return requestTodo(tasksUrl + '/by-date?date=' + date, async (response) => todosSchema.parse(await response.json()));
}

export async function changeTodo(change: TodoChange): Promise<TodoChangeResult> {
  if (!change) return { status: 'error' };
  if (change.type !== 'create' && (typeof change.id !== 'string' ||
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(change.id))) {
    return { status: 'error' };
  }

  const url = change.type === 'create' ? tasksUrl : tasksUrl + '/' + change.id;
  switch (change.type) {
    case 'create':
    case 'update': {
      const parsed = draftSchema.safeParse(change.draft);
      if (!parsed.ok || todoDraftError(parsed.value)) return { status: 'error' };
      const draft = parsed.value;
      return requestTodo(url, () => null, {
        method: change.type === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          content: draft.content.trim(),
          startTime: draft.allDay ? '00:00:00' : withSeconds(draft.startTime),
          endTime: draft.allDay ? '23:59:59' : withSeconds(draft.endTime),
        }),
      });
    }
    case 'toggle':
      return requestTodo(url + '/toggle', () => null, { method: 'PATCH' });
    case 'delete':
      return requestTodo(url, () => null, { method: 'DELETE' });
    default:
      return { status: 'error' };
  }
}
