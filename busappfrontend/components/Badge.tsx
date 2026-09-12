type BadgeProps = {
  label: string;
};

/** Route badge: filled --ink-deep, 3px radius, white mono Bold. */
export function Badge({ label }: BadgeProps) {
  return (
    <span className="inline-flex items-center justify-center rounded bg-ink-deep px-2 py-[3px] text-row-title font-bold text-on-ink">
      {label}
    </span>
  );
}
