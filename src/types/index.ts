/** Supported log levels ordered by severity (lowest to highest). */
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

/** A union type of all supported log level strings. */
export type LogLevel = (typeof LOG_LEVELS)[number];

/** A single structured log entry passed to transports. */
export interface LogEntry {
  /** The log level of this entry. */
  level: LogLevel;
  /** The main log content. */
  content: any[];
  /** An optional ISO-8601 timestamp string. */
  timestamp?: string;
  /** An optional namespace string (e.g. "app:db"). */
  namespace?: string;
}

/** Configuration for a transport. */
export interface Transport {
  /**
   * Called for each log entry that passes the level filter.
   *
   * Can be async if needed (e.g. for network or file I/O), but the logger will not wait for completion.
   * @param entry The log entry to be processed by this transport.
   */
  log(entry: LogEntry): void | Promise<void>;
}

/** Configuration options for creating a Logger instance. */
export interface LoggerOptions {
  /**
   * Minimum log level.
   * @default "info"
   */
  level: LogLevel;
  /**
   * Whether to include ISO-8601 timestamps. Defaults to `true`.
   * @default true
   */
  timestamp: boolean;
  /**
   * Controls how timestamps are formatted.
   *
   * - `"iso"` — full ISO-8601 (default): `2026-04-16T18:10:52.005Z`
   * - `"short"` — date + time without ms: `2026-04-16 18:10:52`
   * - `"time"` — time only: `18:10:52`
   * - `(date: Date) => string` — custom formatter function
   *
   * @default "time"
   */
  timestampFormat: TimestampFormat;
  /**
   * Transports to send log entries to.
   * You can provide multiple transports (e.g. console + file + custom).
   * Defaults to a single ConsoleTransport.
   */
  transports: Transport[];
}

/**
 * A preset name or custom function that formats a `Date` into a timestamp string.
 */
export type TimestampFormat =
  | "iso"
  | "short"
  | "time"
  | ((date: Date) => string);

/**
 * A callback that wraps a stringified token with color codes.
 *
 * @param type The semantic type of the value being colored.
 * @param text The raw text to wrap.
 * @returns The colored text.
 *
 * @example
 * const colorize: StringifyColorize = (type, text) => {
 *   if (type === "string") return `\x1b[33m${text}\x1b[0m`;
 *   return text;
 * };
 */
export type StringifyColorize = (
  type:
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "undefined"
    | "bigint"
    | "symbol"
    | "function"
    | "circular"
    | "depth"
    | "date"
    | "regexp"
    | "className"
    | "key"
    | "bracket",
  text: string,
) => string;
