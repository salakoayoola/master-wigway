export type PinoLikeLogger = {
  level: string;
  child: (bindings?: Record<string, unknown>) => PinoLikeLogger;
  trace: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  fatal: (...args: unknown[]) => void;
};

export function createSilentLogger(): PinoLikeLogger {
  const noop = () => { };
  const logger: PinoLikeLogger = {
    level: 'silent',
    child: () => logger,
    trace: noop,
    debug: noop,
    info: noop,
    warn: (...args: unknown[]) => console.warn('[WA-WARN]', ...args),
    error: (...args: unknown[]) => console.error('[WA-ERROR]', ...args),
    fatal: (...args: unknown[]) => console.error('[WA-FATAL]', ...args),
  };
  return logger;
}
