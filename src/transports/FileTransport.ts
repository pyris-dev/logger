import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "path";
import type { LogEntry, Transport } from "../types/index";
import { Logger } from "../logger/Logger";

export interface FileTransportOptions {
  /** Absolute or relative path to the log file. */
  path: string;
}

/**
 * Appends JSON-formatted log entries to a file.
 *
 * Creates the file (and parent directories) if they don't exist.
 */
export class FileTransport implements Transport {
  /** The path to the log file. */
  private filePath: string;

  constructor(options: FileTransportOptions) {
    this.filePath = options.path;
    this.ensureDir();
  }

  public log(entry: LogEntry): void {
    entry.content.map((item, index) => {
      if (typeof item === "string") return item;
      else entry.content[index] = Logger.stringify(item);
    });
    appendFileSync(this.filePath, JSON.stringify(entry) + "\n", "utf-8");
  }

  /**
   * Ensures that the directory for the log file exists, creating it if necessary.
   *
   * This is called in the constructor to avoid errors when writing log entries.
   */
  private ensureDir(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}
