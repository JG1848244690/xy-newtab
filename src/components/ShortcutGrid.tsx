import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ShortcutCard } from './ShortcutCard';
import { ShortcutDialog } from './ShortcutDialog';
import { Button } from '@/src/components/ui/button';
import type { Shortcut } from '@/src/utils/types';

interface ShortcutGridProps {
  shortcuts: Shortcut[];
  onAdd: (data: { name: string; url: string; icon?: string }) => void;
  onUpdate: (id: string, data: Partial<Omit<Shortcut, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onRemove: (id: string) => void;
}

export function ShortcutGrid({ shortcuts, onAdd, onUpdate, onRemove }: ShortcutGridProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);

  const handleAddClick = () => {
    setEditingShortcut(null);
    setDialogOpen(true);
  };

  const handleEditClick = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setDialogOpen(true);
  };

  const handleSave = (data: { name: string; url: string; icon?: string }) => {
    if (editingShortcut) {
      onUpdate(editingShortcut.id, data);
    } else {
      onAdd(data);
    }
  };

  return (
    <>
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {shortcuts.map((shortcut) => (
            <ShortcutCard
              key={shortcut.id}
              shortcut={shortcut}
              onEdit={handleEditClick}
              onRemove={onRemove}
            />
          ))}

          {/* 添加按钮 */}
          <Button
            variant="outline"
            onClick={handleAddClick}
            className="flex flex-col items-center justify-center p-4 rounded-xl h-auto border-dashed border-2 hover:border-primary/50 hover:bg-accent/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="mt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
              添加
            </span>
          </Button>
        </div>
      </div>

      {/* 添加/编辑弹窗 */}
      <ShortcutDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shortcut={editingShortcut}
        onSave={handleSave}
      />
    </>
  );
}
