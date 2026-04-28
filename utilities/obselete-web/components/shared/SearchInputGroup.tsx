import type { ComponentProps } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputGroupProps = Omit<ComponentProps<typeof Input>, "type" | "className"> & {
  wrapperClassName?: string;
  className?: string;
};

/**
 * Search field with an inline-end icon, matching the shadcn Input Group “icon + input” pattern
 * using project `Input` styles (registry `input-group` is not installed in `components/ui/`).
 */
export function SearchInputGroup({ wrapperClassName, className, ...inputProps }: SearchInputGroupProps) {
  return (
    <div className={cn("relative min-w-0", wrapperClassName)}>
      <Input
        {...inputProps}
        type="search"
        data-slot="input-group-control"
        className={cn("pr-9", className)}
      />
      <span
        className="pointer-events-none absolute inset-y-0 end-0 flex w-9 items-center justify-center text-muted-foreground"
        aria-hidden
      >
        <Search className="size-4 shrink-0" />
      </span>
    </div>
  );
}
