import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 flex min-h-[5.5rem] w-full rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-base outline-none transition-[color,box-shadow] focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
});

export { Textarea };
