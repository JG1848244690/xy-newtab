import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, Check, Circle, ClipboardList, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { sendMessage } from '@/messaging';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/src/components/ui/dialog';
import { useI18n } from '@/src/i18n';
import { localTodoDate, type Todo, type TodoChange, type TodoListResult } from '@/src/services/todos';
import { TODO_HOST_PERMISSION, TODO_LOGIN_URL, TODO_PAGE_URL } from '@/src/services/todoSite';
import { TodoEditor } from './TodoEditor';

export function Todos() {
  const { t } = useI18n();
  const id = useId();
  const [open, setOpen] = useState(false);
  const native = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
  const trigger = (
    <Button type="button" variant="ghost" size="icon" className="bookmark-action rounded-lg"
      popoverTarget={native ? id : undefined} aria-label={t('todos.title')} title={t('todos.title')}
      aria-haspopup="dialog">
      <ClipboardList className="size-4" />
    </Button>
  );

  return native ? (
    <>
      {trigger}
      <div id={id} popover="auto" role="dialog" aria-label={t('todos.title')} className="todo-popover bookmark-surface"
        onToggle={(event) => {
          if (event.target === event.currentTarget) setOpen(event.newState === 'open');
        }}>
        {open && <TodoPanel />}
      </div>
    </>
  ) : (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined} className="todo-panel-dialog max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-[400px] gap-0 overflow-y-auto p-0">
        <DialogTitle className="sr-only">{t('todos.title')}</DialogTitle>
        {open && <TodoPanel />}
      </DialogContent>
    </Dialog>
  );
}

const days = [
  { offset: -1, label: 'todos.yesterday' },
  { offset: 0, label: 'todos.today' },
  { offset: 1, label: 'todos.tomorrow' },
] as const;

type TodoPanelState = TodoListResult | { status: 'loading' };
type TodoAction = { type: 'create' } | { type: 'update' | 'delete'; task: Todo };

function TodoPanel() {
  const { locale, t } = useI18n();
  const radioGroup = useId();
  const [windowDate, setWindowDate] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const selectedDate = new Date(windowDate.getFullYear(), windowDate.getMonth(), windowDate.getDate() + offset);
  const dateKey = localTodoDate(selectedDate);
  const [snapshot, setSnapshot] = useState<{ date: string; result: TodoPanelState }>();
  const state = snapshot?.date === dateKey ? snapshot.result : { status: 'loading' } as const;
  const [attempt, setAttempt] = useState(0);
  const [changingPermission, setChangingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [action, setAction] = useState<TodoAction | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [notice, setNotice] = useState<'writeError' | 'saved' | 'deleted' | null>(null);
  const isEditing = action !== null;

  useEffect(() => {
    if (isEditing) return;
    let rollover: ReturnType<typeof setTimeout>;
    function syncDate() {
      const now = new Date();
      setWindowDate((previous) => localTodoDate(previous) === localTodoDate(now) ? previous : now);
      clearTimeout(rollover);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      rollover = setTimeout(syncDate, midnight.getTime() - now.getTime());
    }
    syncDate();
    window.addEventListener('focus', syncDate);
    return () => {
      clearTimeout(rollover);
      window.removeEventListener('focus', syncDate);
    };
  }, [isEditing]);

  useEffect(() => {
    let disposed = false;
    let request = 0;
    const refresh = async () => {
      if (savingRef.current || isEditing) return;
      const current = ++request;
      const result = await sendMessage('todos/list', dateKey).catch(() => ({ status: 'error' } as const));
      if (!disposed && current === request && !savingRef.current) setSnapshot({ date: dateKey, result });
    };
    const permissionRemoved = ({ origins }: { origins?: string[] }) => {
      if (!origins?.includes(TODO_HOST_PERMISSION)) return;
      request++;
      setSnapshot({ date: dateKey, result: { status: 'disconnected' } });
      setAction(null);
      setNotice(null);
    };

    void refresh();
    window.addEventListener('focus', refresh);
    browser.permissions.onRemoved.addListener(permissionRemoved);
    return () => {
      disposed = true;
      window.removeEventListener('focus', refresh);
      browser.permissions.onRemoved.removeListener(permissionRemoved);
    };
  }, [attempt, dateKey, isEditing, saving]);

  async function changePermission(connect: boolean) {
    setChangingPermission(true);
    setPermissionError(false);
    const permission = { origins: [TODO_HOST_PERMISSION] };
    try {
      const changed = await (connect ? browser.permissions.request(permission) : browser.permissions.remove(permission));
      if (changed) setAttempt((current) => current + 1);
      else setPermissionError(true);
    } catch {
      setPermissionError(true);
    } finally {
      setChangingPermission(false);
    }
  }

  async function save(change: TodoChange) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setNotice(null);
    try {
      const result = await sendMessage('todos/change', change).catch(() => ({ status: 'error' } as const));
      if (result.status === 'ready') {
        setSnapshot({ date: dateKey, result: { status: 'loading' } });
        setAction(null);
        setNotice(change.type === 'delete' ? 'deleted' : 'saved');
      } else if (result.status === 'error') {
        setNotice('writeError');
      } else {
        setSnapshot({ date: dateKey, result });
        setAction(null);
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function selectAction(next: TodoAction | null) {
    setAction(next);
    setNotice(null);
  }

  const date = new Intl.DateTimeFormat(locale.replace('_', '-'), { month: 'long', day: 'numeric', weekday: 'short' }).format(selectedDate);
  const tasks = state.status === 'ready' ? state.value : [];
  const unfinished = tasks.filter((task) => !task.completed);
  const completed = tasks.filter((task) => task.completed);

  return (
    <div className="todo-panel">
      <header className="todo-panel-header">
        <div>
          <h2>{t('todos.title')}</h2>
          <p>{date}</p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="bookmark-action size-8 rounded-lg"
          title={t('todos.refresh')} aria-label={t('todos.refresh')} disabled={state.status === 'loading' || saving || isEditing}
          onClick={() => setAttempt((current) => current + 1)}>
          <RefreshCw className="size-4" />
        </Button>
      </header>

      <div className="todo-panel-body">
        {(state.status === 'loading' || state.status === 'ready') && <fieldset className="todo-days" disabled={saving || !!action}>
          <legend className="sr-only">{t('todos.selectDay')}</legend>
          {days.map((day) => (
            <label key={day.offset}>
              <input type="radio" className="sr-only" name={radioGroup} checked={offset === day.offset}
                onChange={() => { setOffset(day.offset); setNotice(null); }} />
              <span>{t(day.label)}</span>
            </label>
          ))}
        </fieldset>}
        {state.status === 'loading' && <p className="todo-panel-message flex items-center gap-2" role="status">
          <Loader2 className="size-4 motion-safe:animate-spin" />{t('todos.loading')}
        </p>}
        {state.status === 'disconnected' && <div className="todo-panel-message space-y-3">
          <p>{t('todos.connectHelp')}</p>
          <Button type="button" size="sm" onClick={() => void changePermission(true)} disabled={changingPermission}>{t('todos.connect')}</Button>
        </div>}
        {state.status === 'signed-out' && <div className="todo-panel-message space-y-3">
          <p>{t('todos.signInHelp')}</p>
          <Button asChild size="sm">
            <a href={TODO_LOGIN_URL} target="_blank" rel="noopener noreferrer">{t('todos.signIn')}<ArrowUpRight size={14} /></a>
          </Button>
        </div>}
        {state.status === 'error' && <p className="todo-panel-message" role="status">{t('todos.loadError')}</p>}
        {state.status === 'ready' && (
          <>
            <div className="todo-list-toolbar">
              <p className="todo-panel-count">{t('todos.progress', { n: completed.length, total: tasks.length })}</p>
              <Button type="button" variant="ghost" size="sm" className="bookmark-action h-8"
                onClick={() => selectAction({ type: 'create' })} disabled={saving || !!action}>
                <Plus />{t('todos.add')}
              </Button>
            </div>
            {action && (action.type === 'delete' ? (
              <div className="todo-editor">
                <p>{t('todos.confirmDelete', { name: action.task.content })}</p>
                <div className="todo-editor-actions">
                  <Button type="button" variant="ghost" size="sm" disabled={saving}
                    onClick={() => selectAction(null)}>{t('todos.cancel')}</Button>
                  <Button type="button" variant="destructive" size="sm" disabled={saving}
                    onClick={() => void save({ type: 'delete', id: action.task.id })}>{t('todos.delete')}</Button>
                </div>
              </div>
            ) : (
              <TodoEditor date={dateKey} task={action.type === 'update' ? action.task : undefined} saving={saving}
                onCancel={() => selectAction(null)}
                onSave={(draft) => void save(action.type === 'update'
                  ? { type: 'update', id: action.task.id, draft }
                  : { type: 'create', draft })} />
            ))}
            {!tasks.length && !action && <p className="todo-panel-message">{t('todos.empty')}</p>}
            {!!unfinished.length && <TaskList tasks={unfinished} disabled={saving || !!action}
              onAction={selectAction} onToggle={(id) => void save({ type: 'toggle', id })} />}
            {!!completed.length && <details className="todo-panel-completed">
              <summary>{t('todos.completed', { n: completed.length })}</summary>
              <TaskList tasks={completed} disabled={saving || !!action}
                onAction={selectAction} onToggle={(id) => void save({ type: 'toggle', id })} />
            </details>}
          </>
        )}
        {notice && <p className="todo-panel-message" role={notice === 'writeError' ? 'alert' : 'status'}>{t('todos.' + notice)}</p>}
        {permissionError && <p className="todo-panel-message text-xs" role="status">{t('todos.permissionError')}</p>}
      </div>

      <footer className="todo-panel-footer">
        <a className="todo-site-link" href={TODO_PAGE_URL} target="_blank" rel="noopener noreferrer">
          {t('todos.openSite')}<ArrowUpRight size={14} />
        </a>
        {(state.status === 'ready' || state.status === 'signed-out' || state.status === 'error') && (
          <Button variant="ghost" size="sm" className="bookmark-action rounded-lg" type="button" disabled={changingPermission || saving}
            onClick={() => void changePermission(false)}>{t('todos.disconnect')}</Button>
        )}
      </footer>
    </div>
  );
}

function TaskList({ tasks, disabled, onAction, onToggle }: {
  tasks: Todo[];
  disabled: boolean;
  onAction: (action: TodoAction) => void;
  onToggle: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <ul className="todo-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <Button type="button" variant="ghost" size="icon" className="bookmark-action size-8 shrink-0"
            aria-label={t('todos.toggleTask', { name: task.content })} aria-pressed={task.completed} disabled={disabled}
            onClick={() => onToggle(task.id)}>
            {task.completed ? <Check /> : <Circle />}
          </Button>
          <div className="min-w-0 flex-1">
            <p>{task.content}</p>
            <span>{task.allDay ? t('todos.allDay') : `${task.startTime.slice(0, 5)} – ${task.endTime.slice(0, 5)}`}</span>
            {task.startDate.slice(0, 10) !== task.endDate.slice(0, 10) && (
              <span className="block">{task.startDate.slice(0, 10)} – {task.endDate.slice(0, 10)}</span>
            )}
            {task.description && <p className="todo-description">{task.description}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" className="bookmark-action size-8 shrink-0"
            aria-label={t('todos.editTask', { name: task.content })} title={t('todos.edit')} disabled={disabled}
            onClick={() => onAction({ type: 'update', task })}><Pencil /></Button>
          <Button type="button" variant="ghost" size="icon" className="bookmark-action size-8 shrink-0"
            aria-label={t('todos.deleteTask', { name: task.content })} title={t('todos.delete')} disabled={disabled}
            onClick={() => onAction({ type: 'delete', task })}><Trash2 /></Button>
        </li>
      ))}
    </ul>
  );
}
