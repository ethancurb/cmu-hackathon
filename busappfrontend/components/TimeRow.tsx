import { ClockIcon } from "@/components/icons/stroked";

type TimeRowProps = {
  left: string;
  right: string;
  /** When present, the whole row becomes a real button (keyboard-operable,
   * focusable) rather than a plain div — opens the trip time picker. A fixed
   * accessible name (the visible text changes with the chosen time/mode). */
  onClick?: () => void;
};

/** Two halves split by a single 1px vertical rule at center. No container, no borders. */
export function TimeRow({ left, right, onClick }: TimeRowProps) {
  const content = (
    <>
      <span className="flex-1 text-left">{left}</span>
      <span className="mx-4 h-full w-px bg-border" aria-hidden />
      <span className="flex flex-1 items-center justify-end gap-2">
        <ClockIcon className="h-4 w-4" />
        {right}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Trip time: ${left}, ${right}`}
        className="flex h-[19px] w-full items-center px-gutter text-label text-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
      >
        {content}
      </button>
    );
  }

  return <div className="flex h-[19px] items-center px-gutter text-label text-blue">{content}</div>;
}
