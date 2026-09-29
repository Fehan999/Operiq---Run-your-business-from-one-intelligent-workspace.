type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// Anything whose key looks like a credential is replaced before it reaches the log sink.
const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|cookie|api[-_]?key|id_?token|credential/i;
const MAX_DEPTH = 4;

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  if (Array.isArray(value)) {
    return depth >= MAX_DEPTH ? "[array]" : value.map((item) => redact(item, depth + 1));
  }
  if (typeof value === "object") {
    if (depth >= MAX_DEPTH) return "[object]";
    const output: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
      output[key] = SENSITIVE_KEY.test(key) ? "[redacted]" : redact(inner, depth + 1);
    }
    return output;
  }
  return value;
}

function currentLevel(): LogLevel {
  const level = process.env.LOG_LEVEL as LogLevel | undefined;
  return level && level in LEVEL_WEIGHT ? level : "info";
}

function write(level: LogLevel, message: string, context?: LogContext) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[currentLevel()]) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...(context ? (redact(context) as LogContext) : {}),
  };

  // One JSON object per line in production so log drains can parse it. Readable in dev.
  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(entry)
      : `[${level}] ${message}${context ? ` ${JSON.stringify(entry, null, 0)}` : ""}`;

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else process.stdout.write(`${line}\n`);
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(bindings: LogContext): Logger;
}

function createLogger(bindings: LogContext = {}): Logger {
  const merge = (context?: LogContext) => ({ ...bindings, ...context });
  return {
    debug: (message, context) => write("debug", message, merge(context)),
    info: (message, context) => write("info", message, merge(context)),
    warn: (message, context) => write("warn", message, merge(context)),
    error: (message, context) => write("error", message, merge(context)),
    child: (childBindings) => createLogger({ ...bindings, ...childBindings }),
  };
}

export const logger = createLogger();
