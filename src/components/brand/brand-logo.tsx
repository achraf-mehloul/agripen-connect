import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/assets/branding/agripen-icon.png"
      alt=""
      aria-hidden
      className={cn("h-9 w-9 shrink-0 object-contain drop-shadow-[0_0_18px_var(--primary-glow)]", className)}
    />
  );
}

export function BrandLockup({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark />
      <div className="min-w-0">
        <p className="truncate font-display text-[0.95rem] font-extrabold leading-none tracking-tight">
          Agri<span className="text-primary">Pen</span>
        </p>
        <p className="truncate text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {subtitle ?? "Team app"}
        </p>
      </div>
    </div>
  );
}
