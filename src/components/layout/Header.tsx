import { Disc3, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';
import { useWheelStore } from '@/stores/wheelStore';
import { SavedWheelsDialog } from '@/features/saved-wheels/SavedWheelsDialog';
import { WinnerHistory } from '@/features/winners/WinnerHistory';

export function Header() {
  const setIsPresenting = useUIStore((s) => s.setIsPresenting);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const wheelName = useWheelStore((s) => s.wheelName);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-c bg-surface/60 px-3 backdrop-blur sm:px-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActivePanel('participants')}
          className="flex items-center gap-2 rounded-lg p-1 md:hidden"
          aria-label="Open panel menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
            <Disc3 className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <span className="font-display text-lg font-bold tracking-tight text-text">Spinora</span>
          </div>
        </div>
        <span className="hidden max-w-40 truncate text-sm text-muted md:inline">· {wheelName}</span>
      </div>

      <nav className="flex items-center gap-1.5" aria-label="Main">
        <button
          className="hidden rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:text-text sm:block"
          onClick={() => setIsPresenting(true)}
        >
          Presentation
        </button>
        <WinnerHistory />
        <SavedWheelsDialog />
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setActivePanel('settings')}
          aria-label="Open settings"
          className="md:hidden"
        >
          Settings
        </Button>
      </nav>
    </header>
  );
}