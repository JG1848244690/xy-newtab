import { useState, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import type { SearchEngineType, SearchEngineOption } from '@/src/utils/types';
import { cn } from '@/src/lib/utils';

interface SearchBarProps {
  engine: SearchEngineType;
  engineOption: SearchEngineOption;
  engineOptions: SearchEngineOption[];
  onEngineChange: (engine: SearchEngineType) => void;
  onSearch: (query: string) => void;
}

export function SearchBar({
  engine,
  engineOption,
  engineOptions,
  onEngineChange,
  onSearch,
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full ">
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-card border border-border shadow-lg hover:shadow-xl transition-shadow">
        {/* 搜索引擎选择 */}
        <Select value={engine} onValueChange={(value) => onEngineChange(value as SearchEngineType)}>
          <SelectTrigger className="w-[130px] border-0 bg-transparent focus:ring-0 shrink-0">
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <span className="text-base">{engineOption.icon}</span>
                <span className="text-sm truncate">{engineOption.name}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {engineOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                <span className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 分隔线 */}
        <div className="w-px h-8 bg-border shrink-0" />

        {/* 搜索输入框 */}
        <Input
          type="text"
          placeholder="搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 min-w-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
            "text-base placeholder:text-muted-foreground"
          )}
        />

        {/* 搜索按钮 */}
        <Button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="rounded-xl px-6 shrink-0"
        >
          <Search className="w-4 h-4 mr-2" />
          搜索
        </Button>
      </div>
    </div>
  );
}
