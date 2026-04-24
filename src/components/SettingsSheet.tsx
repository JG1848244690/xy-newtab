import { useState, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import {
  PRESET_COLORS,
  PRESET_IMAGES,
  SIZE_OPTIONS,
  DEFAULT_BACKGROUND_COLOR,
} from '@/src/utils/constants';
import type { BackgroundSetting, BackgroundType, BackgroundSize } from '@/src/utils/types';
import { Image, Palette, Maximize2, RotateCcw, Upload } from 'lucide-react';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setting: BackgroundSetting;
  onSave: (setting: BackgroundSetting) => void;
}

export function SettingsSheet({
  open,
  onOpenChange,
  setting,
  onSave,
}: SettingsSheetProps) {
  const [type, setType] = useState<BackgroundType>(setting.type || 'none');
  const [color, setColor] = useState(setting.color || DEFAULT_BACKGROUND_COLOR);
  const [imageUrl, setImageUrl] = useState(setting.imageUrl || '');
  const [size, setSize] = useState<BackgroundSize>(setting.size || 'cover');
  const [opacity, setOpacity] = useState(setting.opacity ?? 1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当弹窗打开时，同步最新设置
  useEffect(() => {
    if (open) {
      setType(setting.type || 'none');
      setColor(setting.color || DEFAULT_BACKGROUND_COLOR);
      setImageUrl(setting.imageUrl || '');
      setSize(setting.size || 'cover');
      setOpacity(setting.opacity ?? 1);
    }
  }, [open, setting]);

  // 即时保存
  const saveSetting = (newSetting: BackgroundSetting) => {
    onSave(newSetting);
  };

  // 类型变化时即时保存
  const handleTypeChange = (newType: BackgroundType) => {
    setType(newType);
    const newSetting: BackgroundSetting = {
      type: newType,
      ...(newType === 'color' && { color }),
      ...(newType === 'image' && { imageUrl, size, opacity }),
    };
    saveSetting(newSetting);
  };

  // 颜色变化时即时保存
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (type === 'color') {
      saveSetting({ type: 'color', color: newColor });
    }
  };

  // 图片URL变化时即时保存
  const handleImageUrlChange = (newUrl: string) => {
    setImageUrl(newUrl);
    if (type === 'image' && newUrl) {
      saveSetting({ type: 'image', imageUrl: newUrl, size, opacity });
    }
  };

  // 本地图片上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小 (限制 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleImageUrlChange(dataUrl);
      }
    };
    reader.readAsDataURL(file);

    // 清空 input 以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 适配方式变化时即时保存
  const handleSizeChange = (newSize: BackgroundSize) => {
    setSize(newSize);
    if (type === 'image' && imageUrl) {
      saveSetting({ type: 'image', imageUrl, size: newSize, opacity });
    }
  };

  // 透明度变化时即时保存
  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    if (type === 'image' && imageUrl) {
      saveSetting({ type: 'image', imageUrl, size, opacity: newOpacity });
    }
  };

  // 重置
  const handleReset = () => {
    setType('none');
    setColor(DEFAULT_BACKGROUND_COLOR);
    setImageUrl('');
    setSize('cover');
    setOpacity(1);
    saveSetting({ type: 'none' });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-80 sm:max-w-80 overflow-y-auto
          bg-white/20 dark:bg-black/20
          backdrop-blur-xl
          border-l border-white/20 dark:border-black/10
          shadow-2xl shadow-black/10 dark:shadow-black/50
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right
          duration-300"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            设置
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* 背景类型选择 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">背景类型</Label>
            <div className="flex gap-2">
              <Button
                variant={type === 'none' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('none')}
                className="flex-1"
              >
                无
              </Button>
              <Button
                variant={type === 'color' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('color')}
                className="flex-1 gap-1.5"
              >
                <Palette className="w-3.5 h-3.5" />
                纯色
              </Button>
              <Button
                variant={type === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTypeChange('image')}
                className="flex-1 gap-1.5"
              >
                <Image className="w-3.5 h-3.5" />
                图片
              </Button>
            </div>
          </div>

          {/* 纯色设置 */}
          {type === 'color' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">选择预设颜色</Label>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => handleColorChange(preset.color)}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        color === preset.color
                          ? 'border-primary scale-110 shadow-md'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">自定义颜色</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer rounded-lg"
                  />
                  <Input
                    value={color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    placeholder={DEFAULT_BACKGROUND_COLOR}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 图片设置 */}
          {type === 'image' && (
            <div className="space-y-5">
              {/* 预设图片 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">预设背景</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      onClick={() => handleImageUrlChange(preset.url)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        imageUrl === preset.url
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:ring-2 hover:ring-muted'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent text-white text-xs py-1.5 text-center font-medium">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 自定义图片 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">自定义图片</Label>

                {/* 上传按钮 */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    上传本地图片
                  </Button>
                </div>

                {/* 分隔线 */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">或</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* URL 输入 */}
                <Input
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  placeholder="粘贴图片 URL..."
                  className="w-full"
                />

                {/* 当前图片预览 */}
                {imageUrl && !PRESET_IMAGES.some(p => p.url === imageUrl) && (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-white/20 dark:border-black/10">
                    <img
                      src={imageUrl}
                      alt="当前背景"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-2 left-2 text-xs text-white">
                      当前背景
                    </span>
                  </div>
                )}
              </div>

              {/* 适配方式 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5" />
                  图片适配方式
                </Label>
                <Select value={size} onValueChange={(v) => handleSizeChange(v as BackgroundSize)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 透明度 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  背景透明度: {Math.round(opacity * 100)}%
                </Label>
                <Input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* 重置按钮 */}
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleReset}
              size="sm"
              className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              重置为默认
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
