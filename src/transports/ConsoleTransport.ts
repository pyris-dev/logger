import type { LogEntry, StringifyColorize, Transport } from "../types/index";
import { Logger } from "../logger/Logger";

/**
 * Color codes used by the ConsoleTransport.
 * Override any key to use a different color system (e.g. chalk, kleur, or custom codes).
 */
export interface ConsoleColorPalette {
  reset: string;
  bold: string;
  dim: string;
  debug: string;
  info: string;
  warn: string;
  error: string;
  /** Value-type colors for stringified output. */
  string: string;
  number: string;
  boolean: string;
  null: string;
  undefined: string;
  bigint: string;
  symbol: string;
  function: string;
  circular: string;
  depth: string;
  date: string;
  regexp: string;
  className: string;
  key: string;
  bracket: string;
}

export interface ConsoleTransportOptions {
  /**
   * Indentation for stringified objects (number of spaces or indent string).
   * Used when content exceeds `lineLength`.
   * @default 2
   */
  space?: number | string;
  /**
   * Max single-line character length before expanding to multi-line.
   * Set to `Infinity` to always stay compact, or `0` to always expand.
   * @default 80
   */
  lineLength?: number;
  /**
   * Where to write log output.
   *
   * - `"process"` — uses `process.stdout.write` / `process.stderr.write` (default).
   * - `"console"` — uses `console.log` / `console.error` / `console.warn` / `console.debug`.
   * - A custom function — called with `(line, level)` for full control.
   *
   * @default "process"
   *
   * @example
   * new ConsoleTransport({ output: "console" })
   *
   * @example
   * new ConsoleTransport({ output: (line, level) => myCustomWriter(line, level) })
   */
  output?: "process" | "console" | ((line: string, level: string) => void);
  /**
   * Custom color palette. Provide a partial object to override specific colors.
   * Set any value to `""` to disable that color.
   *
   * @example
   * // Use green for info instead of cyan
   * new ConsoleTransport({ colors: { info: "\x1b[32m" } })
   *
   * // Disable all colors
   * new ConsoleTransport({ colors: { reset: "", bold: "", dim: "", debug: "", info: "", warn: "", error: "" } })
   */
  colors?: Partial<ConsoleColorPalette>;
}

/** Default ANSI color palette. */
export const ANSI_COLORS: ConsoleColorPalette = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  // Value-type colors
  string: "\x1b[33m", // yellow
  number: "\x1b[32m", // green
  boolean: "\x1b[35m", // magenta
  null: "\x1b[2m", // dim
  undefined: "\x1b[2m", // dim
  bigint: "\x1b[32m", // green (like numbers)
  symbol: "\x1b[36m", // cyan
  function: "\x1b[35m", // magenta
  circular: "\x1b[31m", // red
  depth: "\x1b[2m", // dim
  date: "\x1b[36m", // cyan
  regexp: "\x1b[31m", // red
  className: "\x1b[1m", // bold
  key: "\x1b[37m", // white
  bracket: "\x1b[2m", // dim
};

/**
 * A transport that outputs log entries to stdout/stderr with colored,
 * human-readable formatting.
 *
 * - `error` and `warn` go to `stderr`.
 * - `info` and `debug` go to `stdout`.
 * - Objects shorter than `lineLength` stay on one line; longer ones expand.
 */
export class ConsoleTransport implements Transport {
  private space: number | string;
  private lineLength: number;
  /** The active color palette. Override at runtime or via constructor options. */
  public colors: ConsoleColorPalette;
  /** Colorizer built from the palette, passed to Logger.stringify. */
  private colorize: StringifyColorize;
  /** Output writer resolved from options. */
  private write: (line: string, level: string) => void;

  constructor(options?: ConsoleTransportOptions) {
    this.space = options?.space ?? 2;
    this.lineLength = options?.lineLength ?? 80;
    this.colors = { ...ANSI_COLORS, ...options?.colors };
    this.colorize = (type, text) => {
      const code = this.colors[type] ?? "";
      return code.length > 0 ? `${code}${text}${this.colors.reset}` : text;
    };
    this.write = ConsoleTransport.resolveOutput(options?.output);
  }

  public log(entry: LogEntry): void {
    this.write(this.format(entry), entry.level);
  }

  private static resolveOutput(
    output?: "process" | "console" | ((line: string, level: string) => void),
  ): (line: string, level: string) => void {
    if (typeof output === "function") return output;
    if (output === "console") {
      return (line, level) => {
        const fn =
          level === "error"
            ? console.error
            : level === "warn"
              ? console.warn
              : level === "debug"
                ? console.debug
                : console.log;
        fn(line);
      };
    }
    // Default: "process"
    return (line, level) => {
      if (level === "error" || level === "warn")
        process.stderr.write(line + "\n");
      else process.stdout.write(line + "\n");
    };
  }

  private format(entry: LogEntry): string {
    const c = this.colors;
    const parts: string[] = [];

    // Add timestamp
    if (entry.timestamp) parts.push(`${c.dim}[${entry.timestamp}]${c.reset}`);

    // Add level tag
    const tag = entry.level.toUpperCase().padEnd(5);
    const levelColor = c[entry.level as keyof ConsoleColorPalette] ?? "";
    parts.push(`${levelColor}${c.bold}${tag}${c.reset}`);

    // Add namespace if present
    if (entry.namespace) parts.push(`${c.dim}[${entry.namespace}]${c.reset}`);

    // Stringify each content arg individually,
    // applying line length logic for objects
    const message = entry.content
      .map((arg: any) => {
        if (typeof arg === "string") return arg;
        const compact = Logger.stringify(arg, undefined, this.colorize);
        if (compact.length <= this.lineLength) return compact;
        return Logger.stringify(arg, this.space, this.colorize);
      })
      .join(" ");

    parts.push(message);
    return parts.join(" ");
  }
}
