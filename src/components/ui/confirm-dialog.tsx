'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Bestätigen',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <div className="text-center">
          {variant === 'destructive' && (
            <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-[#1a1a1a]">{title}</h3>
          <p className="text-sm text-[#6b7280] mt-2">{description}</p>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-semibold text-[#6b7280] hover:bg-[#fafafa] rounded-lg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-9 px-4 text-sm font-semibold text-white rounded-lg transition-colors ${
              variant === 'destructive'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-[#11485e] hover:bg-[#41697d]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
