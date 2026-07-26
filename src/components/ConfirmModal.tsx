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
        className="bg-gray-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col gap-4"
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                isDestructive
                  ? 'bg-red-950/80 border-red-800 text-red-400'
                  : 'bg-purple-950/80 border-purple-800 text-purple-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white">{title}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{message}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
          <button
            onClick={() => {
              playHoverSound(audioEnabled);
              onCancel();
            }}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              playDraftLockSound(audioEnabled);
              onConfirm();
            }}
            onMouseEnter={() => playHoverSound(audioEnabled)}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs transition cursor-pointer shadow-md ${
              isDestructive
                ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-red-950/50'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-950/50'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
