import type {
  LogLevel,
  LogEntry,
  LoggerOptions,
  Transport,
  TimestampFormat,
  StringifyColorize,
} from "../types/index";
import { shouldLog } from "./levels";
import { now } from "../utils/time";
import { ConsoleTransport } from "../transports/ConsoleTransport";

const DEFAULT_LOGGER_OPTIONS: LoggerOptions = {
  level: "info",
  timestamp: true,
  timestampFormat: "time",
  transports: [new ConsoleTransport()],
};

/**
 * A flexible logger with support for multiple transports, namespaces, and structured metadata.
 *
 * Example usage:
 * ```ts
 * const logger = new Logger({ level: "debug" });
 * logger.info("Server started", { port: 3000 });
 * const dbLogger = logger.child("db");
 * dbLogger.error("Connection failed", { host: "db.local" });
 * ```
 */
export class Logger {
  /** The current minimum log level. */
  private level: LogLevel;
  /** Whether to include timestamps in log entries. */
  private timestamp: boolean;
  /** The format to use for timestamps (if enabled). */
  private timestampFormat: TimestampFormat;
  /** The transports to send log entries to. */
  private transports: Transport[];
  /** An optional namespace for this logger (e.g. "app", "app:db"). */
  private namespace?: string;

  public constructor(options?: Partial<LoggerOptions>, namespace?: string) {
    const fullOptions = { ...DEFAULT_LOGGER_OPTIONS, ...options };
    this.level = fullOptions.level;
    this.timestamp = fullOptions.timestamp;
    this.timestampFormat = fullOptions.timestampFormat;
    this.transports = fullOptions.transports;
    this.namespace = namespace;
  }

  // ── public API ──────────────────────────────────────────────

  /**
   * Log at the `debug` level. You can pass any number of string or object arguments. Objects will be safely stringified.
   * @example
   * logger.debug("User data", { id: 123, name: "Alice" });
   */
  public debug(...args: any[]): void {
    this.write("debug", ...args);
  }

  /**
   * Log at the `info` level. You can pass any number of string or object arguments. Objects will be safely stringified.
   * @example
   * logger.info("User logged in", { userId: 123, username: "alice" });
   */
  public info(...args: any[]): void {
    this.write("info", ...args);
  }

  /**
   * Log at the `warn` level. You can pass any number of string or object arguments. Objects will be safely stringified.
   * @example
   * logger.warn("Deprecated API used", { endpoint: "/v1/users", alternative: "/v2/users" });
   */
  public warn(...args: any[]): void {
    this.write("warn", ...args);
  }

  /**
   * Log at the `error` level. You can pass any number of string or object arguments. Objects will be safely stringified.
   * @example
   * logger.error("Failed to connect to database", { host: "db.local", retries: 3 });
   */
  public error(...args: any[]): void {
    this.write("error", ...args);
  }

  /**
   * Create a child logger with an extended namespace. Child loggers inherit all configuration from the parent.
   * @param childNamespace The namespace to append to the parent logger's namespace (e.g. "http", "db").
   * @returns A new Logger instance with the combined namespace.
   */
  public child(childNamespace: string): Logger {
    if (this.namespace) childNamespace = `${this.namespace}:${childNamespace}`;

    const child = new Logger(
      {
        level: this.level,
        timestamp: this.timestamp,
        timestampFormat: this.timestampFormat,
        transports: this.transports,
      },
      childNamespace,
    );

    return child;
  }

  /** Change the minimum log level at runtime. */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  // ── internal ────────────────────────────────────────────────

  /**
   * Internal method to write a log entry if it passes the level filter.
   * @param level The log level of this entry.
   * @param content The content to log (strings or objects). Objects will be stringified.
   * @returns void
   */
  private write(level: LogLevel, ...content: any): void {
    if (!shouldLog(level, this.level)) return;

    const entry: LogEntry = {
      level,
      content,
      ...(this.timestamp ? { timestamp: now(this.timestampFormat) } : {}),
      ...(this.namespace ? { namespace: this.namespace } : {}),
    };

    for (const transport of this.transports) transport.log(entry);
  }

  /**
   * Maximum depth for nested objects when stringifying.
   * @default 4
   */
  public static MAX_DEPTH = 4;

  /**
   * Safely stringify any value into a readable string, similar to `JSON.stringify`.
   *
   * Strings are quoted, objects produce JSON-like output, and non-JSON types
   * (Map, Set, class instances, circular refs, etc.) get readable fallbacks.
   *
   * @param content The value to stringify.
   * @param space Indentation width (number of spaces) or indent string.
   * @param colorize Optional callback to wrap tokens with color codes.
   * @returns A string representation of the value.
   */
  public static stringify(
    content: any,
    space?: number | string,
    colorize?: StringifyColorize,
  ): string {
    return Logger._stringify(content, space, colorize, new WeakSet(), 0);
  }

  // ── internal stringify implementation ───────────────────

  private static _stringify(
    content: any,
    space: number | string | undefined,
    colorize: StringifyColorize | undefined,
    seen: WeakSet<object>,
    depth: number,
  ): string {
    const c = colorize ?? Logger.noColor;
    const indent = Logger.resolveIndent(space);
    const currentPad = indent ? indent.repeat(depth) : "";
    const nextPad = indent ? indent.repeat(depth + 1) : "";

    // ── Primitives ────────────────────────────────────────
    if (content === null) return c("null", "null");
    if (content === undefined) return c("undefined", "undefined");
    if (typeof content === "string")
      return c("string", JSON.stringify(content));
    if (typeof content === "number") return c("number", String(content));
    if (typeof content === "boolean") return c("boolean", String(content));
    if (typeof content === "bigint") return c("bigint", `${content}n`);
    if (typeof content === "symbol") return c("symbol", content.toString());
    if (typeof content === "function")
      return c("function", `[Function: ${content.name || "anonymous"}]`);

    // ── Circular reference detection ──────────────────────
    if (typeof content === "object") {
      if (seen.has(content)) return c("circular", "[Circular]");
      seen.add(content);
    }

    // ── Depth guard ───────────────────────────────────────
    if (depth >= Logger.MAX_DEPTH) return c("depth", "[Object]");

    // ── Error ─────────────────────────────────────────────
    if (content instanceof Error)
      return content.stack || content.message || String(content);

    // ── RegExp ────────────────────────────────────────────
    if (content instanceof RegExp) return c("regexp", content.toString());

    // ── Date ──────────────────────────────────────────────
    if (content instanceof Date)
      return c("date", `Date(${content.toISOString()})`);

    // ── Map ───────────────────────────────────────────────
    if (content instanceof Map) {
      if (content.size === 0) return `Map(0) ${c("bracket", "{}")}`;
      const entries = [...content.entries()].map(
        ([k, v]) =>
          `${Logger._stringify(k, space, colorize, seen, depth + 1)} => ${Logger._stringify(v, space, colorize, seen, depth + 1)}`,
      );
      if (indent) {
        const inner = entries.map((e) => `${nextPad}${e}`).join(",\n");
        return `Map(${content.size}) ${c("bracket", "{")}\n${inner}\n${currentPad}${c("bracket", "}")}`;
      }
      return `Map(${content.size}) ${c("bracket", "{")} ${entries.join(", ")} ${c("bracket", "}")}`;
    }

    // ── Set ───────────────────────────────────────────────
    if (content instanceof Set) {
      if (content.size === 0) return `Set(0) ${c("bracket", "{}")}`;
      const items = [...content.values()].map((v) =>
        Logger._stringify(v, space, colorize, seen, depth + 1),
      );
      if (indent) {
        const inner = items.map((i) => `${nextPad}${i}`).join(",\n");
        return `Set(${content.size}) ${c("bracket", "{")}\n${inner}\n${currentPad}${c("bracket", "}")}`;
      }
      return `Set(${content.size}) ${c("bracket", "{")} ${items.join(", ")} ${c("bracket", "}")}`;
    }

    // ── WeakMap / WeakSet / WeakRef ───────────────────────
    if (content instanceof WeakMap) return c("depth", "[WeakMap]");
    if (content instanceof WeakSet) return c("depth", "[WeakSet]");
    if (typeof WeakRef !== "undefined" && content instanceof WeakRef)
      return c("depth", "[WeakRef]");

    // ── Promise ───────────────────────────────────────────
    if (content instanceof Promise) return c("depth", "[Promise]");

    // ── TypedArrays (Buffer, Uint8Array, etc.) ────────────
    if (ArrayBuffer.isView(content) && !(content instanceof DataView)) {
      const ta = content as ArrayBufferView;
      const name = ta.constructor?.name ?? "TypedArray";
      const hex = [...new Uint8Array(ta.buffer, ta.byteOffset, ta.byteLength)]
        .slice(0, 64)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
      const truncated = ta.byteLength > 64 ? " …" : "";
      return `${name}(${ta.byteLength}) <${hex}${truncated}>`;
    }

    // ── ArrayBuffer / SharedArrayBuffer ───────────────────
    if (content instanceof ArrayBuffer)
      return `ArrayBuffer(${content.byteLength})`;
    if (
      typeof SharedArrayBuffer !== "undefined" &&
      content instanceof SharedArrayBuffer
    )
      return `SharedArrayBuffer(${content.byteLength})`;

    // ── DataView ──────────────────────────────────────────
    if (content instanceof DataView) return `DataView(${content.byteLength})`;

    // ── Objects ───────────────────────────────────────────
    if (typeof content === "object" && content !== null) {
      const ctor = content.constructor;
      const isClassInstance =
        ctor && ctor.name && ctor.name !== "Object" && !Array.isArray(content);

      if (isClassInstance)
        return Logger.stringifyInstance(
          content,
          ctor.name,
          space,
          colorize,
          seen,
          depth,
        );

      // ── Plain arrays ──────────────────────────────────
      if (Array.isArray(content)) {
        if (content.length === 0) return c("bracket", "[]");
        const items = content.map((v) =>
          Logger._stringify(v, space, colorize, seen, depth + 1),
        );
        if (indent) {
          const inner = items.map((i) => `${nextPad}${i}`).join(",\n");
          return `${c("bracket", "[")}\n${inner}\n${currentPad}${c("bracket", "]")}`;
        }
        return `${c("bracket", "[")}${items.join(", ")}${c("bracket", "]")}`;
      }

      // ── Plain objects ─────────────────────────────────
      try {
        const keys = Object.keys(content);
        if (keys.length === 0) return c("bracket", "{}");
        const pairs = keys.map(
          (k) =>
            `${c("key", JSON.stringify(k))}: ${Logger._stringify(content[k], space, colorize, seen, depth + 1)}`,
        );
        if (indent) {
          const inner = pairs.map((p) => `${nextPad}${p}`).join(",\n");
          return `${c("bracket", "{")}\n${inner}\n${currentPad}${c("bracket", "}")}`;
        }
        return `${c("bracket", "{")} ${pairs.join(", ")} ${c("bracket", "}")}`;
      } catch {
        return String(content);
      }
    }

    return String(content);
  }

  /**
   * Stringify a class instance showing its name, properties, and methods.
   */
  private static stringifyInstance(
    instance: any,
    className: string,
    space: number | string | undefined,
    colorize: StringifyColorize | undefined,
    seen: WeakSet<object>,
    depth: number,
  ): string {
    const c = colorize ?? Logger.noColor;
    const indent = Logger.resolveIndent(space);
    const currentPad = indent ? indent.repeat(depth) : "";
    const nextPad = indent ? indent.repeat(depth + 1) : "";
    const parts: string[] = [];

    for (const key of Object.keys(instance)) {
      const value = instance[key];
      if (typeof value === "function")
        parts.push(
          `${c("key", key)}: ${c("function", `[Function ${value.name || key}]`)}`,
        );
      else
        parts.push(
          `${c("key", key)}: ${Logger._stringify(value, space, colorize, seen, depth + 1)}`,
        );
    }

    const seenMethods = new Set<string>();
    let proto = Object.getPrototypeOf(instance);
    while (proto && proto !== Object.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (key === "constructor" || seenMethods.has(key)) continue;
        const descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (descriptor && typeof descriptor.value === "function") {
          seenMethods.add(key);
          parts.push(c("function", `[Function ${key}]`));
        }
      }
      proto = Object.getPrototypeOf(proto);
    }

    if (parts.length === 0)
      return `${c("className", className)} ${c("bracket", "{}")}`;
    if (indent) {
      const inner = parts.map((p) => `${nextPad}${p}`).join(",\n");
      return `${c("className", className)} ${c("bracket", "{")}\n${inner}\n${currentPad}${c("bracket", "}")}`;
    }
    return `${c("className", className)} ${c("bracket", "{")} ${parts.join(", ")} ${c("bracket", "}")}`;
  }

  /** No-op colorizer (identity function). */
  private static noColor: StringifyColorize = (_type, text) => text;

  private static resolveIndent(space?: number | string): string {
    if (typeof space === "number" && space > 0)
      return " ".repeat(Math.min(space, 10));
    if (typeof space === "string") return space.slice(0, 10);
    return "";
  }
}
