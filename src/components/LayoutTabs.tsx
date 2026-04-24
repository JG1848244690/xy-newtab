import { Layers } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import type { LayoutType } from '@/src/utils/types';

interface LayoutTabsProps {
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

export function LayoutTabs({ layout, onLayoutChange }: LayoutTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      <button
        onClick={() => onLayoutChange('group')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
          layout === 'group'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Layers className="w-4 h-4" />
        <span className="hidden sm:inline">分组</span>
      </button>
    </div>
  );
}
