"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none ring-offset-slate-950 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-tf-electric",
        className,
      )}
      {...props}
    />
  );
}
