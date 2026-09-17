import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { PointerStyle, HubStyle } from '@/types/theme';
import { cn } from '@/lib/utils';

const SWATCHES = [
  '#8B5CF6', '#22D3EE', '#F472B6', '#34D399', '#F59E0B',
  '#EF4444', '#60A5FA', '#A3E635', '#FB923C', '#22C55E',
  '#E879F9', '#38BDF8', '#FDE047', '#FB7185', '#2DD4BF',
  '#A78BFA', '#FBBF24', '#4ADE80', '#F87171', '#93C5FD',
];

export function ThemeEditor() {
  const theme = useSettingsStore((s) => s.theme);
  const updateActiveTheme = useSettingsStore((s) => s.updateActiveTheme);
  const saveCustomTheme = useSettingsStore((s) => s.saveCustomTheme);
  const resetTheme = useSettingsStore((s) => s.resetTheme);
  const showToast = useUIStore((s) => s.showToast);

  const [name, setName] = useState(theme.name);
  const isPreset = theme.isPreset && !theme.id.startsWith('custom:');

  const toggleColor = (c: string) => {
    const next = theme.segmentColors.includes(c)
      ? theme.segmentColors.filter((x) => x !== c)
      : [...theme.segmentColors, c].slice(0, 16);
    updateActiveTheme({ segmentColors: next.length ? next : [c] });
  };

  const handleSave = () => {
    saveCustomTheme({
      ...theme,
      id: theme.id.startsWith('custom:') ? theme.id : `custom:${theme.id}`,
      name: name || 'Custom Theme',
    });
    showToast('Custom theme saved.', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Wheel segment palette</label>
        <div className="flex flex-wrap gap-1.5">
          {SWATCHES.map((c) => {
            const active = theme.segmentColors.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleColor(c)}
                aria-pressed={active}
                aria-label={`Toggle color ${c}`}
                className={cn(
                  'h-6 w-6 rounded-md border border-white/20 transition-transform hover:scale-110',
                  active && 'ring-2 ring-primary ring-offset-2 ring-offset-elevated'
                )}
                style={{ background: c }}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Pointer style</label>
        <Select
          value={theme.pointerStyle}
          onValueChange={(v) => updateActiveTheme({ pointerStyle: v as PointerStyle })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="Pointer" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="triangle">Triangle</SelectItem>
            <SelectItem value="arrow">Arrow</SelectItem>
            <SelectItem value="dot">Dot</SelectItem>
            <SelectItem value="needle">Needle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Center hub style</label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['solid', 'ring', 'glow', 'minimal'] as HubStyle[]).map((h) => (
            <Button key={h} variant={theme.hubStyle === h ? 'default' : 'outline'} size="sm"
              onClick={() => updateActiveTheme({ hubStyle: h })}
              aria-pressed={theme.hubStyle === h}>
              {h}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Pointer color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.pointerColor}
            onChange={(e) => updateActiveTheme({ pointerColor: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-border-c bg-transparent"
            aria-label="Pointer color"
          />
          <input
            type="color"
            value={theme.hubColor}
            onChange={(e) => updateActiveTheme({ hubColor: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-border-c bg-transparent"
            aria-label="Hub color"
          />
          <span className="text-xs text-muted">pointer / hub</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Wheel border color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.wheelBorder === 'rgba(255,255,255,0.30)' || theme.wheelBorder === 'rgba(255,255,255,0.10)' ? '#FFFFFF' : theme.wheelBorder}
            onChange={(e) => updateActiveTheme({ wheelBorder: e.target.value })}
            className="h-8 w-10 cursor-pointer rounded border border-border-c bg-transparent"
            aria-label="Wheel border color"
          />
          <Input
            type="number"
            min={0}
            max={8}
            value={theme.wheelBorderWidth}
            onChange={(e) => updateActiveTheme({ wheelBorderWidth: Number(e.target.value) || 0 })}
            className="w-16"
            aria-label="Wheel border width"
          />
          <span className="text-xs text-muted">border width</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted">Label color</label>
        <input
          type="color"
          value={theme.labelColor}
          onChange={(e) => updateActiveTheme({ labelColor: e.target.value })}
          className="h-8 w-10 cursor-pointer rounded border border-border-c bg-transparent"
          aria-label="Label color"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted">Custom theme name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Theme" />
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleSave} disabled={isPreset && !name.trim()}>
          <Save className="h-4 w-4" /> Save theme
        </Button>
        <Button variant="outline" onClick={() => { resetTheme(); showToast('Theme reset to preset.', 'info'); }}>
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  );
}