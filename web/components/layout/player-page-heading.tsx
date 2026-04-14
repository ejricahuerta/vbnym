import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlayerPageHeading({
  title,
  description,
  backHref = "/",
  backLabel = "Back to games",
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="border-b border-border/60 pb-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="mb-3 h-auto gap-1.5 px-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
      >
        <Link href={backHref}>
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          {backLabel}
        </Link>
      </Button>
      <h1 className="font-heading text-3xl font-bold italic tracking-tight text-primary sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
