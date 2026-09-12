"use client";

import { useEffect } from "react";

function isCustomFontActive(cssVariable: string, fallbackFamily: string): boolean {
  const probe = document.createElement("span");
  probe.textContent = "mmmmmmmmmmwwwwwww";
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.whiteSpace = "nowrap";
  probe.style.fontSize = "72px";
  document.body.appendChild(probe);

  probe.style.fontFamily = fallbackFamily;
  const fallbackWidth = probe.offsetWidth;

  probe.style.fontFamily = `var(${cssVariable}), ${fallbackFamily}`;
  const actualWidth = probe.offsetWidth;

  document.body.removeChild(probe);
  return actualWidth !== fallbackWidth;
}

export function FontCheck() {
  useEffect(() => {
    const displayLoaded = isCustomFontActive("--font-display", "serif");
    const monoLoaded = isCustomFontActive("--font-mono", "monospace");

    const missing = [
      !displayLoaded && "PP Editorial New (--font-display, falling back to Times)",
      !monoLoaded && "PP Fraktion Mono (--font-mono, falling back to ui-monospace)",
    ].filter(Boolean);

    if (missing.length > 0) {
      console.warn(
        "[LoadLine] Real typeface(s) missing — using the temporary fallback stack:\n  " +
          missing.join("\n  ") +
          "\nDrop the licensed woff2 files into public/fonts to fix (see public/fonts/README.md)."
      );
    }
  }, []);

  return null;
}
