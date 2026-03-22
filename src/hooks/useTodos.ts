import { useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '@wxt-dev/storage';
import type { Todo } from '@/src/utils/types';
import { STORAGE_KEY } from '@/src/utils/constants';

const TODOS_KEY = `local:${STORAGE_KEY.TODOS}` as const;

// 获取今日日期字符串 (YYYY-MM-DD)
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);

  // 加载待办事项
  useEffect(() => {
    storage.getItem<Todo[]>(TODOS_KEY).then((saved) => {
      if (saved) {
        setTodos(saved);
      }
    });
  }, []);

  // 保存待办事项
  const saveTodos = useCallback(async (newTodos: Todo[]) => {
    setTodos(newTodos);
    await storage.setItem(TODOS_KEY, newTodos);
  }, []);

  // 添加待办
  const addTodo = useCallback(async (content: string, dueDate?: string) => {
    const now = Date.now();
    const newTodo: Todo = {
      id: now.toString(),
      content,
      completed: false,
      dueDate,
      createdAt: now,
      updatedAt: now,
    };

    const current = await storage.getItem<Todo[]>(TODOS_KEY) || [];
    const updated = [...current, newTodo];
    await saveTodos(updated);
    return newTodo;
  }, [saveTodos]);

  // 更新待办
  const updateTodo = useCallback(async (
    id: string,
    data: Partial<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    const current = await storage.getItem<Todo[]>(TODOS_KEY) || [];
    await saveTodos(
      current.map((t) =>
        t.id === id
          ? { ...t, ...data, updatedAt: Date.now() }
          : t
      )
    );
  }, [saveTodos]);

  // 切换完成状态
  const toggleTodo = useCallback(async (id: string) => {
    const current = await storage.getItem<Todo[]>(TODOS_KEY) || [];
    await saveTodos(
      current.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, updatedAt: Date.now() }
          : t
      )
    );
  }, [saveTodos]);

  // 删除待办
  const removeTodo = useCallback(async (id: string) => {
    const current = await storage.getItem<Todo[]>(TODOS_KEY) || [];
    await saveTodos(current.filter((t) => t.id !== id));
  }, [saveTodos]);

  // 清除已完成的待办
  const clearCompleted = useCallback(async () => {
    const current = await storage.getItem<Todo[]>(TODOS_KEY) || [];
    await saveTodos(current.filter((t) => !t.completed));
  }, [saveTodos]);

  // 今日待办 (计算属性)
  const todayTodos = useMemo(() => {
    const today = getTodayString();
    return todos.filter((t) => !t.dueDate || t.dueDate === today);
  }, [todos]);

  // 统计
  const stats = useMemo(() => ({
    total: todayTodos.length,
    completed: todayTodos.filter((t) => t.completed).length,
    pending: todayTodos.filter((t) => !t.completed).length,
  }), [todayTodos]);

  return {
    todos,
    todayTodos,
    stats,
    addTodo,
    updateTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
  };
}
