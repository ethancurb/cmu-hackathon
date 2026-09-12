import { ClockIcon } from "@/components/icons/stroked";

type TimeRowProps = {
  left: string;
  right: string;
};

/** Two halves split by a single 1px vertical rule at center. No container, no borders. */
export function TimeRow({ left, right }: TimeRowProps) {
  return (
    <div className="flex h-[19px] items-center px-gutter text-label text-blue">
      <span className="flex-1">{left}</span>
      <span className="mx-4 h-full w-px bg-border" aria-hidden />
      <span className="flex flex-1 items-center justify-end gap-2">
        <ClockIcon className="h-4 w-4" />
        {right}
      </span>
    </div>
  );
}
