import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number | string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function toISODate(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function makeCode(prefix: string, index: number) {
  return `${prefix}-${String(index).padStart(4, "0")}`;
}
