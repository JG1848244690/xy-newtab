import { ShortcutCard } from './ShortcutCard';
import { useShortcuts } from '@/src/hooks/useShortcuts';
import { Plus } from 'lucide-react';

export function ShortcutGrid() {
  const { shortcuts, addShortcut, removeShortcut } = useShortcuts();

  return (
    <div className="w-full max-w-4xl">
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {shortcuts.map((shortcut) => (
          <ShortcutCard
            key={shortcut.id}
            shortcut={shortcut}
            onRemove={() => removeShortcut(shortcut.id)}
          />
        ))}

        {/* 添加按钮 */}
        <button
          onClick={() => addShortcut()}
          className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-gray-600/50 flex items-center justify-center group-hover:bg-gray-600 transition-colors">
            <Plus className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <span className="mt-2 text-xs text-gray-400 group-hover:text-white transition-colors">
            添加
          </span>
        </button>
      </div>
    </div>
  );
}
