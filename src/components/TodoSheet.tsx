import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Checkbox } from '@/src/components/ui/checkbox';
import { cn } from '@/src/lib/utils';
import type { Todo } from '@/src/utils/types';
import { Plus, Trash2, ListTodo } from 'lucide-react';

interface TodoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todos: Todo[];
  stats: { total: number; completed: number; pending: number };
  onAdd: (content: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClearCompleted: () => void;
}

export function TodoSheet({
  open,
  onOpenChange,
  todos,
  stats,
  onAdd,
  onToggle,
  onRemove,
  onClearCompleted,
}: TodoSheetProps) {
  const [newTodo, setNewTodo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onAdd(newTodo.trim());
      setNewTodo('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-80 overflow-y-auto bg-transparent dark:bg-background shadow-xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ListTodo className="w-5 h-5" />
            今日待办
            <span className="text-sm font-normal text-muted-foreground ml-auto">
              {stats.completed}/{stats.total}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-120px)]">
          {/* 添加输入框 */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="添加新待办..."
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={!newTodo.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {/* 待办列表 */}
          <div className="flex-1 overflow-y-auto">
            {todos.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                暂无待办事项
              </div>
            ) : (
              <ul className="space-y-1">
                {todos.map((todo) => (
                  <li
                    key={todo.id}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-lg transition-colors",
                      "hover:bg-accent/50",
                      todo.completed && "opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => onToggle(todo.id)}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        todo.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {todo.content}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      onClick={() => onRemove(todo.id)}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 底部操作栏 */}
          {stats.completed > 0 && (
            <div className="pt-4 border-t mt-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={onClearCompleted}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清除已完成 ({stats.completed})
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
