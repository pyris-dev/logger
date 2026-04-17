import { Logger } from "@pyris/logger";

// ── Basic usage (ISO timestamp, wrapped in brackets) ──────
const log = new Logger({ level: "debug", timestamp: true });

log.debug("Booting up…");
log.info("Server started", { port: 3000, env: "development" });
log.warn("Deprecation notice", { feature: "legacyAuth" });
log.error("Connection refused", { host: "db.local", retries: 3 });

// ── Short timestamp format ────────────────────────────────
const shortLog = new Logger({
  level: "debug",
  timestamp: true,
  timestampFormat: "short",
});
shortLog.info("Short format timestamp");

// ── Time-only timestamp format ────────────────────────────
const timeLog = new Logger({
  level: "debug",
  timestamp: true,
  timestampFormat: "time",
});
timeLog.info("Time-only timestamp");

// ── Custom timestamp formatter ────────────────────────────
const customLog = new Logger({
  level: "debug",
  timestamp: true,
  timestampFormat: (date) =>
    `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
});
customLog.info("Custom formatted timestamp");

// ── Child loggers ─────────────────────────────────────────
const http = log.child("http");
http.info("GET /api/users", { status: 200, ms: 12 });

const db = log.child("db");
db.error("Query timeout", { query: "SELECT * FROM users", ms: 5000 });

// ── Nested child ──────────────────────────────────────────
const dbPool = db.child("pool");
dbPool.debug("Connection acquired", { id: 7 });

// ── Runtime level change ──────────────────────────────────
log.setLevel("error");
log.info("This will NOT appear (level is now error)");
log.error("This WILL appear");
