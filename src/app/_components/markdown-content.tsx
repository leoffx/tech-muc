"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "~/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

const markdownComponents: Components = {
  h1: ({ node: _node, ...props }) => (
    <h2 className="text-xl font-semibold text-foreground" {...props} />
  ),
  h2: ({ node: _node, ...props }) => (
    <h3 className="text-lg font-semibold text-foreground" {...props} />
  ),
  h3: ({ node: _node, ...props }) => (
    <h4 className="text-base font-medium text-foreground" {...props} />
  ),
  p: ({ node: _node, ...props }) => (
    <p className="mb-4 leading-relaxed text-foreground/80 last:mb-0" {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul
      className="mb-4 list-disc space-y-2 pl-5 text-foreground/80 last:mb-0"
      {...props}
    />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol
      className="mb-4 list-decimal space-y-2 pl-5 text-foreground/80 last:mb-0"
      {...props}
    />
  ),
  li: ({ node: _node, ...props }) => (
    <li className="leading-relaxed" {...props} />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote
      className="mb-4 border-l-4 border-border pl-4 text-muted-foreground italic last:mb-0"
      {...props}
    />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre
      className="mb-4 overflow-x-auto rounded-md bg-secondary p-4 text-xs text-secondary-foreground last:mb-0"
      {...props}
    />
  ),
  code: ({ node: _node, className, children, ...props }) => {
    const isInline = !className?.includes("language-");
    if (isInline) {
      return (
        <code
          className={cn(
            "rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground",
            className,
          )}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code className={cn("font-mono text-xs", className)} {...props}>
        {children}
      </code>
    );
  },
  a: ({ node: _node, ...props }) => (
    <a
      className="font-medium text-primary underline underline-offset-4"
      {...props}
    />
  ),
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "space-y-4 text-sm leading-relaxed text-foreground/80",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
