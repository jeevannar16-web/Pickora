import { useState } from 'react';
import { History, Trash2, Copy, Download, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHistoryStore } from '@/stores/historyStore';
import { useUIStore } from '@/stores/uiStore';
import { copyToClipboard, downloadTextFile, formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export function WinnerHistory() {
  const items = useHistoryStore((s) => s.items);
  const removeById = useHistoryStore((s) => s.removeById);
  const clearHistory = useHistoryStore((s) => s.clearHistory);
  const undoLastDraw = useHistoryStore((s) => s.undoLastDraw);
  const showToast = useUIStore((s) => s.showToast);
  const requestConfirmation = useUIStore((s) => s.requestConfirmation);
  const [open, setOpen] = useState(false);

  const copyDraw = async (winners: string[]) => {
    const ok = await copyToClipboard(winners.join('\n'));
    showToast(ok ? 'Winners copied.' : 'Copy failed.', ok ? 'success' : 'error');
  };

  const exportHistory = () => {
    const csv = [
      'date,wheel,winners,participants,mode,removed',
      ...items.map((i) =>
        [
          `"${formatDate(i.createdAt)}"`,
          `"${i.wheelName}"`,
          `"${i.winners.join('; ')}"`,
          i.participantCount,
          `"${i.winnerMode}"`,
          i.winnersRemoved,
        ].join(',')
      ),
    ].join('\n');
    const ok = downloadTextFile('spinora-history.csv', csv, 'text/csv');
    showToast(ok ? 'History exported.' : 'Export failed.', ok ? 'success' : 'error');
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <History className="h-4 w-4" /> History
        {items.length > 0 && (
          <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-white">{items.length}</span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Winner History</DialogTitle>
            <DialogDescription>{items.length} draw{items.length === 1 ? '' : 's'} recorded.</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={items.length === 0} onClick={undoLastDraw}>
              <RotateCcw className="h-4 w-4" /> Undo last
            </Button>
            <Button variant="outline" size="sm" disabled={items.length === 0} onClick={exportHistory}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-danger"
              disabled={items.length === 0}
              onClick={() => requestConfirmation(clearHistory, 'Clear the entire winner history?')}
            >
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-c p-6 text-center text-sm text-muted">
              No draws yet. Spin the wheel to start your history.
            </div>
          ) : (
            <div className="spinora-scroll max-h-80 space-y-2 overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="rounded-lg border border-border-c bg-surface p-3">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{formatDate(i.createdAt)}</span>
                    <span>·</span>
                    <span className="text-text">{i.wheelName}</span>
                    <span className="ml-auto">Draw #{i.drawId}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {i.winners.map((w, wi) => (
                      <span key={wi} className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                        {w}
                      </span>
                    ))}
                    <span className="ml-auto text-[11px] text-muted">
                      {i.winnerMode} · {i.participantCount} participants{i.winnersRemoved ? ' · removed' : ''}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={() => void copyDraw(i.winners)}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted hover:bg-white/5 hover:text-text"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button
                      onClick={() => removeById(i.id)}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-danger hover:bg-danger/10"
                    >
                      <X className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}