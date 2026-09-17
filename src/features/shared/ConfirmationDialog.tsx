import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/uiStore';

export function ConfirmationDialog() {
  const open = useUIStore((s) => s.confirmationOpen);
  const action = useUIStore((s) => s.confirmationAction);
  const text = useUIStore((s) => s.confirmationText);
  const close = useUIStore((s) => s.closeConfirmation);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
      {open && (
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" /> Are you sure?
            </DialogTitle>
            <DialogDescription>{text}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                action?.();
                close();
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}