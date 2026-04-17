import type { TimestampFormat } from "../types/index";

/**
 * Pad a number to 2 digits with leading zeros (e.g. 5 -> "05").
 * @param n The number to pad.
 * @returns The padded string.
 */
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Format a Date object according to a preset format string.
 * @param date The Date to format.
 * @param preset The preset format to use ("iso", "short", or "time").
 * @returns The formatted timestamp string.
 */
function formatPreset(date: Date, preset: "iso" | "short" | "time"): string {
  switch (preset) {
    case "iso":
      return date.toISOString();
    case "short": {
      const d = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
      const t = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
      return `${d} ${t}`;
    }
    case "time":
      return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  }
}

/**
 * Get the current timestamp formatted according to the given preset or custom function.
 * @param format A preset name or custom function that formats a `Date` into a timestamp string.
 * @returns The formatted timestamp string.
 */
export function now(format: TimestampFormat = "iso"): string {
  const date = new Date();
  if (typeof format === "function") return format(date);
  return formatPreset(date, format);
}
