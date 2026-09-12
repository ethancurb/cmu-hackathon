/** 1px solid --rule, spans edge to edge of the gutter. Parent should constrain width. */
export function Divider() {
  return <div className="h-px w-full bg-rule" role="separator" />;
}
