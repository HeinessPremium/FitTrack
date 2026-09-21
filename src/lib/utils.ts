import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(kobo: number): string {
  return `\u20A6${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}
