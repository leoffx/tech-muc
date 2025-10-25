"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "~/lib/utils";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!mounted) {
    return null;
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onOpenChange(false);
    }
  };

  const hasTitle = title !== undefined && title !== null;
  const hasDescription = description !== undefined && description !== null;

  return createPortal(
    open ? (
      <div
        className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-slate-950/30 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        onClick={handleOverlayClick}
      >
        <div
          className={cn(
            "w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl",
            className,
          )}
        >
          {(hasTitle || hasDescription) && (
            <header className="space-y-1.5 border-b border-slate-200 px-6 py-4">
              {hasTitle && typeof title === "string" ? (
                <h2 className="text-lg font-semibold text-slate-900">
                  {title}
                </h2>
              ) : hasTitle ? (
                title
              ) : null}
              {hasDescription ? (
                typeof description === "string" ? (
                  <p className="text-sm text-slate-600">{description}</p>
                ) : (
                  description
                )
              ) : null}
            </header>
          )}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    ) : null,
    document.body,
  );
}
