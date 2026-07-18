"use client";

import type { ComponentProps } from "react";

export function CheckIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="3.5 8.5 6.5 11.5 12.5 5.5" />
    </svg>
  );
}
