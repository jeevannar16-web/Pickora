import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronsDown } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { AmbientBackground } from '@/components/layout/AmbientBackground';
import { WheelStage } from '@/components/layout/WheelStage';
import { ParticipantPanel } from '@/features/participants/ParticipantPanel';
import { SettingsPanel } from '@/features/settings/SettingsPanel';
import { WinnerModal } from '@/features/winners/WinnerModal';
import { PresentationMode } from '@/features/winners/PresentationMode';
import { Toast } from '@/features/shared/Toast';
import { ConfirmationDialog } from '@/features/shared/ConfirmationDialog';
import { useUIStore } from '@/stores/uiStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn, formatDate } from '@/lib/utils';
import { audio } from '@/lib/audio';

function applyTheme() {
  const theme = useSettingsStore.getState().theme;
  const root = document.documentElement;
  root.style.setProperty('--sp-bg', theme.background);
  root.style.setProperty('--sp-surface', theme.surface);
  root.style.setProperty('--sp-elevated', theme.elevated);
  root.style.setProperty('--sp-primary', theme.primary);
  root.style.setProperty('--sp-secondary', theme.secondary);
  root.style.setProperty('--sp-accent', theme.accent);
  root.style.setProperty('--sp-success', theme.success);
  root.style.setProperty('--sp-danger', theme.danger);
  root.style.setProperty('--sp-text', theme.text);
  root.style.setProperty('--sp-muted', theme.muted);
  root.style.setProperty('--sp-border', theme.border);
}

export default function App() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isPresenting = useUIStore((s) => s.isPresenting);
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    applyTheme();
  }, [theme]);

  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  if (isPresenting) return <PresentationMode />;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-bg text-text">
      <AmbientBackground />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <Header />
        {isMobile ? <MobileLayout /> : <DesktopLayout />}
      </div>
      <WinnerModal />
      <Toast />
      <ConfirmationDialog />
    </div>
  );
}

function DesktopLayout() {
  const activePanel = useUIStore((s) => s.activePanel);
  return (
    <div className="grid flex-1 overflow-hidden border-t border-border-c md:grid-cols-[300px_1fr_320px]">
      <aside className="min-h-0 overflow-hidden border-r border-border-c bg-surface/40">
        <div className="h-full">
          {activePanel === 'history' ? <HistoryView /> : null}
          {activePanel !== 'history' ? <ParticipantPanel /> : null}
        </div>
      </aside>
      <main className="min-h-0 overflow-hidden">
        <WheelStage />
      </main>
      <aside className="hidden min-h-0 overflow-hidden border-l border-border-c bg-surface/40 md:block">
        <SettingsPanel />
      </aside>
    </div>
  );
}

function MobileLayout() {
  const activePanel = useUIStore((s) => s.activePanel);
  const setActivePanel = useUIStore((s) => s.setActivePanel);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        <WheelStage />
      </div>

      {activePanel !== 'wheel' && (
        <MobileSheet activePanel={activePanel} />
      )}

      <nav className="z-50 grid shrink-0 grid-cols-4 border-t border-border-c bg-surface/90 backdrop-blur">
        {([
          ['wheel', 'Wheel'],
          ['participants', 'Names'],
          ['settings', 'Settings'],
          ['history', 'History'],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActivePanel(tab)}
            className={cn(
              'py-2.5 text-xs font-medium transition-colors',
              activePanel === tab ? 'text-primary' : 'text-muted'
            )}
            aria-pressed={activePanel === tab}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function MobileSheet({ activePanel }: { activePanel: string }) {
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="absolute inset-x-0 top-1/4 bottom-12 z-40 flex flex-col overflow-hidden rounded-t-2xl border-t border-border-c bg-bg shadow-2xl"
    >
      <div className="flex items-center justify-center py-1.5">
        <button
          onClick={() => setActivePanel('wheel')}
          className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-text"
          aria-label="Close panel"
        >
          <ChevronsDown className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {activePanel === 'participants' && <ParticipantPanel />}
        {activePanel === 'settings' && <SettingsPanel />}
        {activePanel === 'history' && <HistoryView />}
      </div>
    </motion.div>
  );
}

function HistoryView() {
  const items = useHistoryStore((s) => s.items);
  return (
    <div className="spinora-scroll h-full space-y-2 overflow-y-auto p-3">
      <div className="text-sm font-semibold text-text">Winner History</div>
      {items.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border-c p-4 text-center text-xs text-muted">
          No draws yet. Spin the wheel to begin.
        </div>
      ) : (
        items.map((i) => (
          <div key={i.id} className="rounded-lg border border-border-c bg-surface p-2.5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>{formatDate(i.createdAt)}</span>
              <span>#{i.drawId} · {i.winnerMode}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {i.winners.map((w, wi) => (
                <span key={wi} className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {w}
                </span>
              ))}
            </div>
            <div className="mt-1 text-[11px] text-muted">
              {i.wheelName} · {i.participantCount} participants{i.winnersRemoved ? ' · removed' : ''}
            </div>
          </div>
        ))
      )}
    </div>
  );
}