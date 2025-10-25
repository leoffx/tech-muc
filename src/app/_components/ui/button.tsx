import * as React from "react";

import { cn } from "~/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-slate-900/90 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-default disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button };
