import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUpDown,
  Shuffle,
  CopyX,
  FileUp,
  FileDown,
  Undo2,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useParticipantStore } from '@/stores/participantStore';
import { useUIStore } from '@/stores/uiStore';
import { useDrawStore } from '@/stores/drawStore';
import { MAX_PARTICIPANTS } from '@/lib/validation';
import { parseParticipantCSV, exportCSV } from '@/lib/csv';
import { copyToClipboard, downloadTextFile } from '@/lib/utils';

export function ParticipantPanel() {
  const participants = useParticipantStore((s) => s.participants);
  const addParticipant = useParticipantStore((s) => s.addParticipant);
  const addParticipants = useParticipantStore((s) => s.addParticipants);
  const removeParticipant = useParticipantStore((s) => s.removeParticipant);
  const removeAllParticipants = useParticipantStore((s) => s.removeAllParticipants);
  const undoRemove = useParticipantStore((s) => s.undoRemove);
  const lastRemoved = useParticipantStore((s) => s.lastRemoved);
  const updateParticipant = useParticipantStore((s) => s.updateParticipant);
  const toggleParticipant = useParticipantStore((s) => s.toggleParticipant);
  const sortByName = useParticipantStore((s) => s.sortByName);
  const shuffleParticipants = useParticipantStore((s) => s.shuffleParticipants);
  const removeDuplicates = useParticipantStore((s) => s.removeDuplicates);
  const showToast = useUIStore((s) => s.showToast);
  const requestConfirmation = useUIStore((s) => s.requestConfirmation);

  const [name, setName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [search, setSearch] = useState('');
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkRef = useRef<HTMLTextAreaElement>(null);
  const setGhostName = useDrawStore((s) => s.setGhostName);

  const clearGhost = useCallback(() => setGhostName(''), [setGhostName]);

  useEffect(() => {
    return clearGhost;
  }, [clearGhost]);

  const enabledCount = participants.filter((p) => p.enabled).length;
  const filtered = participants.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = useCallback(() => {
    const result = addParticipant(name);
    if (!result.ok) {
      setValidationMsg(result.message ?? 'Unable to add participant.');
      return;
    }
    setValidationMsg(null);
    setName('');
    setGhostName('');
  }, [name, addParticipant, setGhostName]);

  const handleAddMultiple = useCallback(() => {
    const lines = bulkText
      .split(/[\n,]/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setValidationMsg('Enter names, one per line or comma-separated.');
      return;
    }
    if (lines.length > MAX_PARTICIPANTS - participants.length) {
      setValidationMsg(`Too many names. Maximum ${MAX_PARTICIPANTS} total participants.`);
      return;
    }
    const result = addParticipants(lines);
    setBulkText('');
    setValidationMsg(null);
    showToast(
      result.skipped.length > 0
        ? `Added ${result.added}. Skipped ${result.skipped.length} duplicate(s).`
        : `Added ${result.added} participant${result.added === 1 ? '' : 's'}.`,
      'success'
    );
  }, [bulkText, participants.length, addParticipants, showToast]);

  const handleImportCSV = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const result = parseParticipantCSV(text);
        if (result.error) {
          showToast(result.error, 'error');
          return;
        }
        if (result.names.length > MAX_PARTICIPANTS - participants.length) {
          showToast(`File has too many names. Maximum ${MAX_PARTICIPANTS} total participants.`, 'error');
          return;
        }
        const res = addParticipants(result.names);
        showToast(
          res.skipped.length > 0
            ? `Imported ${res.added}. Skipped ${res.skipped.length} duplicate(s).`
            : `Imported ${res.added} participant${res.added === 1 ? '' : 's'}.`,
          'success'
        );
      } catch {
        showToast('Failed to read the CSV file.', 'error');
      }
    },
    [participants.length, addParticipants, showToast]
  );

  const handleExportCSV = useCallback(() => {
    const names = participants.map((p) => p.name);
    if (names.length === 0) {
      showToast('No participants to export.', 'error');
      return;
    }
    const csv = exportCSV(names);
    const ok = downloadTextFile('spinora-participants.csv', csv, 'text/csv');
    if (ok) showToast('Participants exported to CSV.', 'success');
    else showToast('Export failed.', 'error');
  }, [participants, showToast]);

  const handleCopyNames = useCallback(async () => {
    if (participants.length === 0) {
      showToast('No participants to copy.', 'error');
      return;
    }
    const text = participants.map((p) => p.name).join('\n');
    const ok = await copyToClipboard(text);
    showToast(ok ? 'Names copied to clipboard.' : 'Copy failed.', ok ? 'success' : 'error');
  }, [participants, showToast]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto spinora-scroll p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-text">
          Participants <span className="ml-1 text-xs font-normal text-muted">({participants.length})</span>
        </div>
        <div className="text-xs text-muted">
          {enabledCount} eligible
        </div>
      </div>

      <div>
        <Textarea
          ref={bulkRef}
          value={bulkText}
          onChange={(e) => {
            setBulkText(e.target.value);
            setValidationMsg(null);
          }}
          placeholder={'Add multiple names\nOne per line, or comma-separated'}
          rows={3}
          aria-label="Bulk add participants"
          className="text-xs"
        />
        <div className="mt-1.5 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={handleAddMultiple}>
            <Plus className="h-3.5 w-3.5" /> Add all
          </Button>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" onClick={handleCopyNames}>
                  Copy names
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy all names to clipboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setGhostName(e.target.value);
            setValidationMsg(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="Add one name"
          aria-label="Add participant"
          className="flex-1"
        />
        <Button onClick={handleAdd} size="icon" aria-label="Add participant">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {validationMsg && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {validationMsg}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={sortByName} aria-label="Sort A to Z">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sort A to Z</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={shuffleParticipants} aria-label="Shuffle">
                <Shuffle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Shuffle order</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  const before = participants.length;
                  removeDuplicates();
                  showToast(
                    before > participants.length
                      ? `Removed ${before - participants.length} duplicate(s).`
                      : 'No duplicates found.',
                    before > participants.length ? 'success' : 'info'
                  );
                }}
                aria-label="Remove duplicates"
              >
                <CopyX className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove duplicates</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" disabled={!lastRemoved} onClick={undoRemove} aria-label="Undo remove">
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo last removal</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Import CSV"
              >
                <FileUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import CSV</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={handleExportCSV} aria-label="Export CSV">
                <FileDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export CSV</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-danger"
                disabled={participants.length === 0}
                onClick={() =>
                  requestConfirmation(() => removeAllParticipants(), 'Remove all participants from this wheel?')
                }
                aria-label="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleImportCSV(f);
            e.target.value = '';
          }}
        />
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search participants…"
          aria-label="Search participants"
          className="pl-8"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto spinora-scroll pr-0.5" role="list">
        {participants.length === 0 && (
          <li className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border-c text-center text-xs text-muted">
            No participants yet.
            <br />
            Add names to get started.
          </li>
        )}
        {filtered.map((p) => (
          <li
            key={p.id}
            className={`group flex items-center gap-2 rounded-lg border border-border-c bg-surface px-2.5 py-1.5 transition-colors ${
              p.enabled ? '' : 'opacity-45'
            }`}
          >
            <span className="flex w-5 cursor-pointer items-center justify-center" role="switch" aria-checked={p.enabled} tabIndex={0}
              onClick={() => toggleParticipant(p.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleParticipant(p.id);
                }
              }}
              aria-label={`Toggle ${p.name}`}
            >
              <span className={`h-3.5 w-3.5 rounded-sm border ${p.enabled ? 'border-primary bg-primary' : 'border-muted bg-transparent'}`} />
            </span>
            <span className="min-w-0 flex-1">
              <input
                value={p.name}
                onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                aria-label={`Edit ${p.name}`}
                className={`w-full bg-transparent text-sm text-text outline-none ${p.enabled ? '' : 'line-through'}`}
              />
            </span>
            <div className="flex items-center gap-1">
              <label className="hidden items-center gap-1 md:flex" aria-label={`Weight for ${p.name}`}>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={p.weight}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v >= 1) updateParticipant(p.id, { weight: Math.min(100, v) });
                  }}
                  className="w-12 rounded border border-border-c bg-elevated px-1 py-0.5 text-center text-xs text-text"
                />
              </label>
              <button
                onClick={() => removeParticipant(p.id)}
                aria-label={`Remove ${p.name}`}
                className="rounded p-1 text-muted opacity-0 transition-opacity hover:text-danger hover:bg-white/5 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
        {filtered.length !== participants.length && (
          <li className="px-1 py-1 text-xs text-muted">
            Showing {filtered.length} of {participants.length}
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between border-t border-border-c pt-2 text-xs text-muted">
        <span>Weighted selection is off by default</span>
        <Switch
          checked={false}
          onCheckedChange={() =>
            showToast('Enable weights per participant (right side of each row).', 'info')
          }
          aria-label="Weights notice"
        />
      </div>
    </div>
  );
}