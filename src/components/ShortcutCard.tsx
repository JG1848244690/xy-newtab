import { Shortcut } from '@/src/utils/types';
import { ExternalLink } from 'lucide-react';

interface ShortcutCardProps {
  shortcut: Shortcut;
  onRemove: () => void;
}

export function ShortcutCard({ shortcut, onRemove }: ShortcutCardProps) {
  const handleClick = () => {
    window.open(shortcut.url, '_blank');
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col items-center p-4 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500 cursor-pointer transition-all group relative"
    >
      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
      >
        ×
      </button>

      {/* 图标 */}
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
        {shortcut.icon ? (
          <img src={shortcut.icon} alt={shortcut.name} className="w-8 h-8 rounded" />
        ) : (
          <span className="text-white font-bold text-lg">
            {shortcut.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* 名称 */}
      <span className="mt-2 text-xs text-gray-300 group-hover:text-white transition-colors truncate max-w-full">
        {shortcut.name}
      </span>
    </div>
  );
}
