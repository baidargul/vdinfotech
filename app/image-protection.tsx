"use client";

import { useEffect } from "react";

function eventContainsImage(event: Event) {
  return event.composedPath().some((node) => node instanceof HTMLImageElement);
}

export function ImageProtection() {
  useEffect(() => {
    const preventImageMenu = (event: MouseEvent) => {
      if (eventContainsImage(event)) event.preventDefault();
    };
    const preventImageDrag = (event: DragEvent) => {
      if (eventContainsImage(event)) event.preventDefault();
    };

    document.addEventListener("contextmenu", preventImageMenu, true);
    document.addEventListener("dragstart", preventImageDrag, true);
    return () => {
      document.removeEventListener("contextmenu", preventImageMenu, true);
      document.removeEventListener("dragstart", preventImageDrag, true);
    };
  }, []);

  return null;
}
