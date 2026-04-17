# @pyris/logger

A lightweight, zero-dependency logging library for Node.js and Bun, built with TypeScript.

Simple out of the box. Powerful enough to scale — with structured logging, pluggable transports, child loggers, and a built-in universal stringifier.

## Install

```bash
npm install @pyris/logger
```

## Quick Start

```ts
import { Logger } from "@pyris/logger";

const log = new Logger({ level: "debug" });

log.info("Server started", { port: 3000 });
log.warn("Deprecation notice", { feature: "legacyAuth" });
log.error("Connection refused", { host: "db.local", retries: 3 });
log.debug("Verbose trace");
```

Output:

```
[18:10:52] INFO  Server started { "port": 3000 }
[18:10:52] WARN  Deprecation notice { "feature": "legacyAuth" }
[18:10:52] ERROR Connection refused { "host": "db.local", "retries": 3 }
[18:10:52] DEBUG Verbose trace
```

## Features

- **Log levels** — `debug`, `info`, `warn`, `error` with runtime filtering
- **Child loggers** — namespaced loggers that inherit parent config
- **Pluggable transports** — console, file, or build your own
- **Universal stringifier** — safely stringify any JS value (classes, Map, Set, circular refs, etc.)
- **Per-type colorization** — strings, numbers, booleans, etc. each get distinct colors in console output
- **Smart line-length collapsing** — compact output when short, expanded when wide
- **Configurable output** — write to `process.stdout`, `console.*`, or a custom function
- **Configurable timestamps** — presets (`iso`, `short`, `time`) or custom formatter
- **Zero dependencies** — only TypeScript and Node.js built-ins
- **Dual format** — ships ESM and CJS with full type declarations

## Options

```ts
const log = new Logger({
  level: "info", // minimum log level (default: "info")
  timestamp: true, // include timestamps (default: true)
  timestampFormat: "time", // "iso" | "short" | "time" | (date) => string
  transports: [
    // array of transports (default: [ConsoleTransport])
    new ConsoleTransport({ space: 2 }),
  ],
});
```

| Option            | Type                                                   | Default              | Description                   |
| ----------------- | ------------------------------------------------------ | -------------------- | ----------------------------- |
| `level`           | `"debug" \| "info" \| "warn" \| "error"`               | `"info"`             | Minimum severity to output    |
| `timestamp`       | `boolean`                                              | `true`               | Include timestamps in entries |
| `timestampFormat` | `"iso" \| "short" \| "time" \| (date: Date) => string` | `"time"`             | How timestamps are formatted  |
| `transports`      | `Transport[]`                                          | `[ConsoleTransport]` | Where log entries are sent    |

## Child Loggers

Child loggers inherit their parent's configuration and chain namespaces with `:`.

```ts
const log = new Logger({ level: "debug" });

const http = log.child("http");
http.info("GET /api/users", { status: 200 });
// [18:10:52] INFO  [http] GET /api/users { "status": 200 }

const dbPool = log.child("db").child("pool");
dbPool.debug("Connection acquired", { id: 7 });
// [18:10:52] DEBUG [db:pool] Connection acquired { "id": 7 }
```

## Runtime Level Changes

```ts
const log = new Logger({ level: "info" });

log.debug("hidden"); // filtered out

log.setLevel("debug");
log.debug("now visible"); // printed
```

## Timestamp Formats

```ts
// Full ISO-8601
new Logger({ timestampFormat: "iso" });
// [2026-04-16T18:10:52.005Z] INFO  ...

// Date + time (no milliseconds)
new Logger({ timestampFormat: "short" });
// [2026-04-16 18:10:52] INFO  ...

// Time only (default)
new Logger({ timestampFormat: "time" });
// [18:10:52] INFO  ...

// Custom formatter
new Logger({ timestampFormat: (date) => date.toLocaleDateString() });
// [4/16/2026] INFO  ...
```

## Transports

### ConsoleTransport

Pretty, coloured output with smart line-length collapsing and per-type value colorization.

```ts
import { ConsoleTransport } from "@pyris/logger";

new Logger({
  transports: [new ConsoleTransport({ space: 2, lineLength: 100 })],
});
```

| Option       | Type                                                              | Default       | Description                                                                                |
| ------------ | ----------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| `space`      | `number \| string`                                                | `2`           | Indentation for expanded objects                                                           |
| `lineLength` | `number`                                                          | `80`          | Max single-line length before expanding (`Infinity` = always compact, `0` = always expand) |
| `output`     | `"process" \| "console" \| (line: string, level: string) => void` | `"process"`   | Where to write output (see [Output Targets](#output-targets))                              |
| `colors`     | `Partial<ConsoleColorPalette>`                                    | ANSI defaults | Custom color palette (see [Color Palette](#color-palette))                                 |

#### Output Targets

By default, ConsoleTransport writes to `process.stdout` / `process.stderr`. You can switch to `console.*` methods or provide a custom writer:

```ts
// Use console.log / console.error / console.warn / console.debug
new ConsoleTransport({ output: "console" });

// Custom writer
new ConsoleTransport({
  output: (line, level) => myStream.write(`[${level}] ${line}\n`),
});
```

#### Color Palette

The palette covers both log-level chrome and per-value-type colors inside stringified output. Override any key with a partial object, or set values to `""` to disable:

```ts
import { ConsoleTransport, ANSI_COLORS } from "@pyris/logger";

// Override specific colors
new ConsoleTransport({
  colors: {
    info: "\x1b[32m", // green info labels
    string: "\x1b[93m", // bright yellow strings
    number: "\x1b[96m", // bright cyan numbers
  },
});

// Disable all colors
new ConsoleTransport({
  colors: Object.fromEntries(Object.keys(ANSI_COLORS).map((k) => [k, ""])),
});
```

**Default value-type colors:**

| Palette Key | Default Color | Used For                      |
| ----------- | ------------- | ----------------------------- |
| `string`    | yellow        | String values                 |
| `number`    | green         | Numbers                       |
| `boolean`   | magenta       | `true` / `false`              |
| `null`      | dim           | `null`                        |
| `undefined` | dim           | `undefined`                   |
| `bigint`    | green         | BigInt values                 |
| `symbol`    | cyan          | Symbols                       |
| `function`  | magenta       | Function references           |
| `date`      | cyan          | Date objects                  |
| `regexp`    | red           | Regular expressions           |
| `className` | bold          | Class names                   |
| `key`       | white         | Object property keys          |
| `bracket`   | dim           | `{}`, `[]` delimiters         |
| `circular`  | red           | `[Circular]` markers          |
| `depth`     | dim           | `[Object]`, `[WeakMap]`, etc. |

### FileTransport

Appends JSON log entries to a file. Creates directories if needed.

```ts
import { Logger, FileTransport } from "@pyris/logger";

const log = new Logger({
  transports: [new FileTransport({ path: "./logs/app.log" })],
});
```

### Custom Transport

Implement the `Transport` interface:

```ts
import type { Transport, LogEntry } from "@pyris/logger";

class MyTransport implements Transport {
  log(entry: LogEntry): void {
    // entry.level, entry.content, entry.timestamp?, entry.namespace?
    // entry.content is the raw args array — stringify as needed
  }
}

const log = new Logger({
  transports: [new MyTransport()],
});
```

## Stringifier

`Logger.stringify()` safely converts any JavaScript value into a readable string. Used internally by transports, but also available as a standalone utility.

```ts
import { Logger } from "@pyris/logger";

Logger.stringify({ name: "Alice", age: 30 });
// { "name": "Alice", "age": 30 }

Logger.stringify(new Map([["key", "value"]]));
// Map(1) { "key" => "value" }

Logger.stringify(new Set([1, 2, 3]));
// Set(3) { 1, 2, 3 }
```

Pass a `space` parameter for indented output:

```ts
Logger.stringify({ nested: { deep: true } }, 2);
// {
//   "nested": {
//     "deep": true
//   }
// }
```

### Colorized Output

Pass a `colorize` callback as the third argument to add color to stringified tokens. Each token is tagged with a semantic type (`"string"`, `"number"`, `"key"`, etc.) so you can apply any color system:

```ts
import { Logger, type StringifyColorize } from "@pyris/logger";

const colorize: StringifyColorize = (type, text) => {
  if (type === "string") return `\x1b[33m${text}\x1b[0m`;
  if (type === "number") return `\x1b[32m${text}\x1b[0m`;
  return text;
};

Logger.stringify({ name: "Alice", age: 30 }, 2, colorize);
```

The ConsoleTransport does this automatically using its color palette — no extra setup needed.

### Supported types

| Type                    | Example output                                         |
| ----------------------- | ------------------------------------------------------ |
| Primitives              | `42`, `true`, `null`, `undefined`, `9007199254740991n` |
| Strings                 | `"hello"`                                              |
| Functions               | `[Function: fetchUsers]`                               |
| Symbols                 | `Symbol(mySymbol)`                                     |
| RegExp                  | `/^hello$/gi`                                          |
| Date                    | `Date(2026-04-16T12:00:00.000Z)`                       |
| Error                   | full stack trace                                       |
| Map                     | `Map(2) { "a" => 1, "b" => 2 }`                        |
| Set                     | `Set(3) { 1, 2, 3 }`                                   |
| WeakMap/WeakSet/WeakRef | `[WeakMap]`, `[WeakSet]`, `[WeakRef]`                  |
| Promise                 | `[Promise]`                                            |
| TypedArrays / Buffer    | `Uint8Array(4) <de ad be ef>`                          |
| ArrayBuffer             | `ArrayBuffer(16)`                                      |
| Class instances         | `HttpServer { port: 3000, [Function start] }`          |
| Circular references     | `[Circular]`                                           |
| Deep nesting            | truncated to `[Object]` at `MAX_DEPTH` (default 4)     |

## API Reference

### `new Logger(options?)`

Create a logger instance.

### `logger.debug(...args)` / `.info(...)` / `.warn(...)` / `.error(...)`

Log at the given level. Accepts any number of arguments — strings are concatenated, objects are stringified.

### `logger.child(namespace)`

Create a child logger with a chained namespace.

### `logger.setLevel(level)`

Change the minimum log level at runtime.

### `Logger.stringify(value, space?, colorize?)`

Safely stringify any value. Optional `space` parameter for indentation, optional `colorize` callback for per-type coloring.

### `Logger.MAX_DEPTH`

Maximum nesting depth for the stringifier (default: `4`).

## License

MIT
