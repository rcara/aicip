"use client";

import { useEffect, useRef } from "react";

export function TextSizeControl({ larger, smaller }: { larger: string; smaller: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const enabled = window.localStorage.getItem("aicip-text") === "large";
    document.documentElement.dataset.text = enabled ? "large" : "normal";
    if (buttonRef.current) buttonRef.current.textContent = enabled ? smaller : larger;
  }, [larger, smaller]);

  return (
    <button
      ref={buttonRef}
      className="rounded-full border border-line px-3 py-1"
      type="button"
      onClick={() => {
        const next = document.documentElement.dataset.text !== "large";
        document.documentElement.dataset.text = next ? "large" : "normal";
        window.localStorage.setItem("aicip-text", next ? "large" : "normal");
        if (buttonRef.current) buttonRef.current.textContent = next ? smaller : larger;
      }}
    >
      {larger}
    </button>
  );
}
