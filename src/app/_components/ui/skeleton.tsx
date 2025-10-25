import type { HTMLAttributes } from "react";

import { cn } from "~/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/60",
        className,
      )}
      {...props}
    />
  );
}
