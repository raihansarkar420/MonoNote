import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  isDeleting?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete note content?',
  description = 'This will permanently clear your current note and remove it from the database. This action cannot be undone.',
  confirmText = 'Clear Note',
  isDeleting = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        id="confirmation-modal-dialog"
        className="relative w-full max-w-md bg-white border border-[#EEEEEE] rounded-lg p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)] text-[#1A1A1A] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#71717A] hover:text-[#18181B] rounded hover:bg-[#F4F4F5] transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] tracking-tight">
              {title}
            </h3>
            <p className="mt-2 text-sm text-[#71717A] leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#F4F4F5]">
          <button
            id="modal-cancel-btn"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-[#71717A] hover:text-[#18181B] bg-white hover:bg-[#F4F4F5] rounded border border-[#EEEEEE] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="modal-confirm-delete-btn"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Clearing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
