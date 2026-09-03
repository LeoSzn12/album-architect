'use client';

import React from 'react';
import { useModalA11y } from '@/hooks/useModalA11y';
import { AlertTriangle, X } from 'lucide-react';
import { playHoverSound, playDraftLockSound } from '@/lib/audioEngine';
import { useDraftStore } from '@/store/useDraftStore';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { audioEnabled } = useDraftStore();
  const { modalRef, handleBackdropClick, modalProps } = useModalA11y({
    isOpen,
    onClose: onCancel,
  });

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        {...modalProps}
        className="bg-[#0e0e12]/95 border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col gap-4"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isDestructive
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  : 'bg-white/[0.06] border-white/[0.08] text-zinc-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{message}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition cursor-pointer border border-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onCancel();
            }}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 font-bold text-xs transition cursor-pointer border border-white/[0.08] active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              playDraftLockSound(audioEnabled);
              onConfirm();
            }}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`px-5 py-2 rounded-full font-black text-xs transition cursor-pointer shadow-md active:scale-95 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
