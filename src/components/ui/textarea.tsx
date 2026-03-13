"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-md border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none ring-offset-slate-950 placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-tf-electric",
        className,
      )}
      {...props}
    />
  );
}
