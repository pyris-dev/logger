import { Logger } from "@pyris/logger";

const log = new Logger({ level: "debug", timestamp: false });

// ── Primitives ────────────────────────────────────────────
log.info("=== Primitives ===");
log.info("String:", "hello world");
log.info("Number:", 42);
log.info("Boolean:", true);
log.info("Null:", null);
log.info("Undefined:", undefined);
log.info("BigInt:", 9007199254740991n);
log.info("Symbol:", Symbol("mySymbol"));

// ── Functions ─────────────────────────────────────────────
log.info("=== Functions ===");
log.info("Named function:", function fetchUsers() {});
log.info("Arrow function:", () => {});
log.info("Anonymous:", function () {});

// ── RegExp ────────────────────────────────────────────────
log.info("=== RegExp ===");
log.info("Regex:", /^hello\s+world$/gi);

// ── Date ──────────────────────────────────────────────────
log.info("=== Date ===");
log.info("Date:", new Date("2026-04-16T12:00:00Z"));

// ── Map & Set ─────────────────────────────────────────────
log.info("=== Map & Set ===");
log.info(
  "Map:",
  new Map<string, number>([
    ["users", 100],
    ["posts", 250],
  ]),
);
log.info("Set:", new Set([1, 2, 3, "four", true]));
log.info("Nested Map:", new Map([["config", new Map([["port", 3000]])]]));

// ── Weak types ────────────────────────────────────────────
log.info("=== Weak types ===");
log.info("WeakMap:", new WeakMap());
log.info("WeakSet:", new WeakSet());
log.info("WeakRef:", new WeakRef({}));

// ── Promise ───────────────────────────────────────────────
log.info("=== Promise ===");
log.info("Promise:", Promise.resolve(42));

// ── Buffers & TypedArrays ─────────────────────────────────
log.info("=== Buffers & TypedArrays ===");
log.info("Uint8Array:", new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
log.info("ArrayBuffer:", new ArrayBuffer(16));
log.info("DataView:", new DataView(new ArrayBuffer(8)));

// ── Error ─────────────────────────────────────────────────
log.info("=== Error ===");
log.error("Error:", new Error("Something went wrong"));
log.error("TypeError:", new TypeError("Expected a string"));

// ── Arrays (plain & nested) ──────────────────────────────
log.info("=== Arrays ===");
log.info("Simple array:", [1, "two", true, null]);
log.info("Nested array:", [
  [1, 2],
  [3, [4, 5]],
]);
log.info("Mixed array:", [{ id: 1 }, new Date("2026-01-01"), /test/i]);

// ── Plain objects (nested) ────────────────────────────────
log.info("=== Plain objects ===");
log.info("Flat:", { name: "Alice", age: 30 });
log.info("Nested:", {
  user: { name: "Bob", address: { city: "NYC", zip: "10001" } },
});

// ── Class instances ───────────────────────────────────────
log.info("=== Class instances ===");

class DatabaseConnection {
  host = "localhost";
  port = 5432;
  connected = true;
  connect() {}
  disconnect() {}
  query(_sql: string) {}
}

class HttpServer {
  port = 3000;
  routes = ["/api/users", "/api/posts"];
  private middleware: string[] = ["cors", "auth"];
  start() {}
  stop() {}
}

class EmptyService {}

log.info("DB:", new DatabaseConnection());
log.info("HTTP:", new HttpServer());
log.info("Empty:", new EmptyService());

// ── Inherited methods ─────────────────────────────────────
log.info("=== Inheritance ===");

class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  speak() {}
}

class Dog extends Animal {
  breed: string;
  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }
  fetch() {}
}

log.info("Dog:", new Dog("Rex", "Labrador"));

// ── Circular references ───────────────────────────────────
log.info("=== Circular references ===");
const circular: any = { name: "root" };
circular.self = circular;
log.info("Circular:", circular);

const a: any = { label: "A" };
const b: any = { label: "B" };
a.friend = b;
b.friend = a;
log.info("Mutual circular:", a);

// ── Deep nesting (depth limit) ────────────────────────────
log.info("=== Depth limit ===");
const deep = { l1: { l2: { l3: { l4: { l5: { l6: "too deep" } } } } } };
log.info("Deep object:", deep);
log.info(`(MAX_DEPTH = ${Logger.MAX_DEPTH})`);

// ── Mixed: everything in one call ─────────────────────────
log.info(
  "=== Kitchen sink ===",
  "string",
  42,
  true,
  null,
  { key: "value" },
  [1, 2],
  new Date("2026-06-01"),
  /test/,
  new Set(["a", "b"]),
);
