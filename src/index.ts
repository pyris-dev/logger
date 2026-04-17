// ── Public API ─────────────────────────────────────────────
export { Logger } from "./logger/Logger.js";
export { shouldLog, isLogLevel, levelSeverity } from "./logger/levels.js";

// ── Transports ────────────────────────────────────────────
export {
  ConsoleTransport,
  ANSI_COLORS,
} from "./transports/ConsoleTransport.js";
export { FileTransport } from "./transports/FileTransport";

// ── Types ─────────────────────────────────────────────────
export type {
  LogLevel,
  LogEntry,
  LoggerOptions,
  StringifyColorize,
  Transport,
  TimestampFormat,
} from "./types/index.js";
export type {
  ConsoleTransportOptions,
  ConsoleColorPalette,
} from "./transports/ConsoleTransport.js";
export type { FileTransportOptions } from "./transports/FileTransport.js";

// ── Constants ─────────────────────────────────────────────
export { LOG_LEVELS } from "./types/index.js";
