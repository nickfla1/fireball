import type { LoggerBase } from './logger.ts';

export class NullLogger implements LoggerBase {
  setAdditionalData(_data: object) {}

  child(_name: string) {
    return this;
  }

  info(_message: string, _data?: object) {}
  warn(_message: string, _data?: object) {}
  error(_message: string, _data?: object) {}
  debug(_message: string, _data?: object) {}
  trace(_message: string, _data?: object) {}
}
