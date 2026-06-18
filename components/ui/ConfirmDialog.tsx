"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import SubmitButton from "./SubmitButton";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  skipKey?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  skipKey,
}: ConfirmDialogProps) {
  const [noPreguntar, setNoPreguntar] = useState(false);

  // Reset cuando se abre
  useEffect(() => {
    if (isOpen) setNoPreguntar(false);
  }, [isOpen]);

  const handleConfirm = () => {
    if (noPreguntar && skipKey) {
      localStorage.setItem(skipKey, "true");
    }
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const variantStyles = {
    danger: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  const buttonStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    info: "bg-blue-600 hover:bg-blue-700",
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{message}</p>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={noPreguntar}
            onChange={(e) => setNoPreguntar(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">No volver a preguntar</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${buttonStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}