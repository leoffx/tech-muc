"use client";

import { cn } from "~/lib/utils";

export type AgentStatus =
  | "not-started"
  | "planning"
  | "implementing"
  | "completed"
  | "failed"
  | undefined;

type AgentStatusBadgeProps = {
  status: AgentStatus;
  className?: string;
  size?: "sm" | "md";
};

const STATUS_CONFIG: Record<
  Exclude<AgentStatus, undefined>,
  {
    label: string;
    colorClasses: string;
    icon: string;
  }
> = {
  "not-started": {
    label: "Not Started",
    colorClasses:
      "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30",
    icon: "○",
  },
  planning: {
    label: "Agent Planning",
    colorClasses:
      "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 animate-pulse",
    icon: "◐",
  },
  implementing: {
    label: "Agent Implementing",
    colorClasses:
      "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30 animate-pulse",
    icon: "◐",
  },
  completed: {
    label: "Completed",
    colorClasses:
      "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: "●",
  },
  failed: {
    label: "Failed",
    colorClasses:
      "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
    icon: "✕",
  },
};

export function AgentStatusBadge({
  status,
  className,
  size = "sm",
}: AgentStatusBadgeProps) {
  if (!status) {
    return null;
  }

  const config = STATUS_CONFIG[status];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all duration-300 ease-in-out",
        sizeClasses,
        config.colorClasses,
        className,
      )}
    >
      <span
        className={cn(
          "transition-transform duration-300",
          (status === "planning" || status === "implementing") && "animate-spin",
        )}
      >
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
}
