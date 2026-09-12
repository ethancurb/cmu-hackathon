type HeadlineProps = {
  children: string;
  subhead?: string;
};

/** Editorial New, black, starting 37px below the nav (27px × 1.354). Sentence beneath in mono blue. */
export function Headline({ children, subhead }: HeadlineProps) {
  return (
    <div className="px-gutter pt-[37px]">
      <h1 className="font-display text-headline text-ink">{children}</h1>
      {subhead ? <p className="text-location-subhead text-blue">{subhead}</p> : null}
    </div>
  );
}
