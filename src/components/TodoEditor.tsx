import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { useI18n } from '@/src/i18n';
import { todoDraftError, type Todo, type TodoDraft } from '@/src/services/todos';

export function TodoEditor({ date, task, saving, onCancel, onSave }: {
  date: string;
  task?: Todo;
  saving: boolean;
  onCancel: () => void;
  onSave: (draft: TodoDraft) => void;
}) {
  const { t } = useI18n();
  const id = useId();
  const contentRef = useRef<HTMLInputElement>(null);
  const [allDay, setAllDay] = useState(task?.allDay ?? true);
  const [error, setError] = useState<ReturnType<typeof todoDraftError>>();

  useEffect(() => { contentRef.current?.focus(); }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const draft = {
      content: String(data.get('content') ?? '').trim(),
      description: String(data.get('description') ?? ''),
      startDate: String(data.get('startDate') ?? ''),
      endDate: String(data.get('endDate') ?? ''),
      startTime: String(data.get('startTime') ?? ''),
      endTime: String(data.get('endTime') ?? ''),
      allDay,
    };
    const invalid = todoDraftError(draft);
    setError(invalid);
    if (invalid) {
      const field = { contentRequired: 'content', dateOrder: 'endDate', timeOrder: 'endTime' }[invalid];
      (form.elements.namedItem(field) as HTMLInputElement | null)?.focus();
      return;
    }
    onSave(draft);
  }

  return (
    <form className="todo-editor" aria-labelledby={id + '-title'} onSubmit={submit} onInput={() => setError(undefined)}>
      <h3 id={id + '-title'}>{t(task ? 'todos.edit' : 'todos.add')}</h3>
      <fieldset className="todo-editor-fields" disabled={saving}>
        <legend className="sr-only">{t('todos.details')}</legend>
        <label htmlFor={id + '-content'}>{t('todos.content')}</label>
        <Input ref={contentRef} id={id + '-content'} name="content" required defaultValue={task?.content}
          aria-invalid={error === 'contentRequired' || undefined}
          aria-describedby={error === 'contentRequired' ? id + '-error' : undefined} />
        <div className="todo-editor-range">
          <div>
            <label htmlFor={id + '-startDate'}>{t('todos.startDate')}</label>
            <Input id={id + '-startDate'} name="startDate" type="date" required defaultValue={task?.startDate.slice(0, 10) ?? date} />
          </div>
          <div>
            <label htmlFor={id + '-endDate'}>{t('todos.endDate')}</label>
            <Input id={id + '-endDate'} name="endDate" type="date" required defaultValue={task?.endDate.slice(0, 10) ?? date}
              aria-invalid={error === 'dateOrder' || undefined}
              aria-describedby={error === 'dateOrder' ? id + '-error' : undefined} />
          </div>
        </div>
        <div className="todo-editor-all-day">
          <input id={id + '-allDay'} name="allDay" type="checkbox" checked={allDay}
            onChange={(event) => setAllDay(event.currentTarget.checked)} />
          <label htmlFor={id + '-allDay'}>{t('todos.allDay')}</label>
        </div>
        <div className="todo-editor-range" hidden={allDay}>
          <div>
            <label htmlFor={id + '-startTime'}>{t('todos.startTime')}</label>
            <Input id={id + '-startTime'} name="startTime" type="time" step={1} required={!allDay}
              disabled={allDay} defaultValue={task && !task.allDay ? task.startTime : '09:00'} />
          </div>
          <div>
            <label htmlFor={id + '-endTime'}>{t('todos.endTime')}</label>
            <Input id={id + '-endTime'} name="endTime" type="time" step={1} required={!allDay}
              disabled={allDay} defaultValue={task && !task.allDay ? task.endTime : '10:00'}
              aria-invalid={error === 'timeOrder' || undefined}
              aria-describedby={error === 'timeOrder' ? id + '-error' : undefined} />
          </div>
        </div>
        <label htmlFor={id + '-description'}>{t('todos.description')}</label>
        <textarea id={id + '-description'} name="description" rows={2} defaultValue={task?.description}
          className="min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline focus-visible:outline-ring" />
      </fieldset>
      {error && <p id={id + '-error'} className="text-destructive" role="alert">{t('todos.' + error)}</p>}
      <div className="todo-editor-actions">
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={onCancel}>{t('todos.cancel')}</Button>
        <Button type="submit" size="sm" disabled={saving}>{t(saving ? 'todos.saving' : 'todos.save')}</Button>
      </div>
    </form>
  );
}
