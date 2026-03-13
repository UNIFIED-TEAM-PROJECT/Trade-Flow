"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variant === "default" &&
          "bg-gradient-to-r from-tf-electric to-[#1f6de0] px-4 text-white hover:brightness-110 focus-visible:ring-tf-electric",
        variant === "outline" &&
          "border border-white/20 bg-slate-900/60 text-slate-100 hover:bg-slate-900 focus-visible:ring-slate-500",
        variant === "secondary" &&
          "bg-white/10 text-slate-100 hover:bg-white/20 focus-visible:ring-slate-500",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-6 text-base",
        className,
      )}
      {...props}
    />
  );
}
