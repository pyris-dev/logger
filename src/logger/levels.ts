import { LOG_LEVELS, type LogLevel } from "../types/index";

/**
 * Returns the severity of a log level as a number (higher means more severe).
 * @param level The log level to get the severity of.
 * @returns The severity number of the log level.
 */
export function levelSeverity(level: LogLevel): number {
  return LOG_LEVELS.indexOf(level);
}

/**
 * Determines whether a log entry with the given level should be logged based on the threshold level.
 * @param level The log level of the entry.
 * @param threshold The minimum log level that should be logged.
 * @returns `true` if the entry should be logged, `false` otherwise.
 */
export function shouldLog(level: LogLevel, threshold: LogLevel): boolean {
  return levelSeverity(level) >= levelSeverity(threshold);
}

/**
 * Type guard to check if a string is a valid LogLevel.
 * @param value The string to check.
 * @returns `true` if the string is a valid LogLevel, `false` otherwise.
 */
export function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value);
}
