import { cn } from "@/lib/cn";
import { ChevronDownIcon } from "@/components/icons/stroked";

type SelectProps = {
  value: string;
  /** Primary is sentence case; secondary is uppercase with .08em tracking. That case
   * difference is the only thing signalling rank between the two. */
  variant?: "primary" | "secondary";
};

/** Row of two elsewhere, 11px gap, 43px tall, stroked chevron-down at right. */
export function Select({ value, variant = "primary" }: SelectProps) {
  return (
    <div
      className={cn(
        "flex h-control items-center justify-between gap-[11px] rounded border border-border bg-surface px-4 text-blue",
        variant === "primary" ? "text-descriptor" : "text-select-secondary uppercase tracking-loud"
      )}
    >
      <span className="truncate">{value}</span>
      <ChevronDownIcon className="h-[11px] w-4 shrink-0" />
    </div>
  );
}
