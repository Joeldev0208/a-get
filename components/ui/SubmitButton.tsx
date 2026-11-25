"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  loading: boolean;
  text: string;
  loadingText?: string;
  disabled?: boolean;
  variant?: "primary" | "danger" | "secondary";
}

export default function SubmitButton({
  loading,
  text,
  loadingText,
  disabled = false,
  variant = "primary",
}: SubmitButtonProps) {
  const { t } = useTranslation();
  const resolvedLoadingText = loadingText ?? t("common.saving");
  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-200",
  };

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant]
      )}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? resolvedLoadingText : text}
    </button>
  );
}