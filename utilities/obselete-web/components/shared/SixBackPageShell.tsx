import { cn } from "@/lib/utils";

export function SixBackPageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12",
        className
      )}
    >
      {children}
    </main>
  );
}

export function SixBackSection({
  title,
  eyebrow,
  description,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card mt-6 p-6 sm:p-8", className)}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="display mt-2 text-3xl sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm text-[var(--ink-2)] sm:text-base">{description}</p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
