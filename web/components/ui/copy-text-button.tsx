"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

type Props = {
  text: string;
  /** Shown to screen readers and as the native tooltip (`title`). */
  label: string;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * When set, this content is part of the same control as the copy icon — clicking
   * the text copies `text` (e.g. full address line).
   */
  children?: ReactNode;
};

export function CopyTextButton({
  text,
  label,
  className,
  variant = "outline",
  size = "icon-sm",
  children,
}: Props) {
  const [copied, setCopied] = useState(false);

  const onClick = useCallback(async () => {
    const t = text.trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [text]);

  if (!text.trim()) return null;

  const hasLabel = children != null && children !== false;

  const iconClass = hasLabel
    ? copied
      ? "size-3.5 shrink-0 text-green-600"
      : "size-3.5 shrink-0"
    : copied
      ? "size-4 text-green-600"
      : "size-4";

  if (hasLabel) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex max-w-full min-w-0 cursor-pointer items-baseline gap-x-1.5 border-0 bg-transparent p-0 text-left font-inherit text-inherit shadow-none outline-none ring-0 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0",
          className
        )}
      >
        <span className="min-w-0 text-pretty">{children}</span>
        {copied ? <Check className={iconClass} aria-hidden /> : <Copy className={iconClass} aria-hidden />}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("shrink-0 cursor-pointer", className)}
    >
      {copied ? <Check className={iconClass} aria-hidden /> : <Copy className={iconClass} aria-hidden />}
    </Button>
  );
}
