/* eslint-disable no-console */
export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const currentLevel: LogLevel =
  (process.env.SKILLOS_LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[currentLevel];
}

function fmt(scope: string, level: LogLevel, msg: string): string {
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}] ${msg}`;
}

export interface Logger {
  debug(msg: string, ...args: unknown[]): void;
  info(msg: string, ...args: unknown[]): void;
  warn(msg: string, ...args: unknown[]): void;
  error(msg: string, ...args: unknown[]): void;
  child(scope: string): Logger;
}

export function createLogger(scope = "skillos"): Logger {
  return {
    debug: (msg, ...a) => shouldLog("debug") && console.debug(fmt(scope, "debug", msg), ...a),
    info: (msg, ...a) => shouldLog("info") && console.log(fmt(scope, "info", msg), ...a),
    warn: (msg, ...a) => shouldLog("warn") && console.warn(fmt(scope, "warn", msg), ...a),
    error: (msg, ...a) => shouldLog("error") && console.error(fmt(scope, "error", msg), ...a),
    child: (sub) => createLogger(`${scope}:${sub}`),
  };
}

export const logger = createLogger();
