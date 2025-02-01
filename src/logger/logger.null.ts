import type { LoggerBase } from './logger.ts';

export class NullLogger implements LoggerBase {
  setAdditionalData(data: object) {}

  child(name: string) {
    return this;
  }

  info(message: string, data?: object) {}
  warn(message: string, data?: object) {}
  error(message: string, data?: object) {}
  debug(message: string, data?: object) {}
  trace(message: string, data?: object) {}
}
