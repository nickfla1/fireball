import type { LoggerBase } from './logger.ts';

export class ConsoleLogger implements LoggerBase {
  #additionalData?: object;
  #name: string;

  constructor(name: string, additionalData?: object) {
    this.#name = name;
    this.#additionalData = additionalData;
  }

  setAdditionalData(data: object) {
    this.#additionalData = data;
  }

  child(name: string) {
    return new ConsoleLogger(name ?? this.#name, this.#additionalData);
  }

  info(message: string, data?: object) {
    console.info({ message, level: 'info', data, ...this.baseInfo() });
  }
  warn(message: string, data?: object) {
    console.warn({ message, level: 'warn', data, ...this.baseInfo() });
  }
  error(message: string, data?: object) {
    console.error({ message, level: 'error', data, ...this.baseInfo() });
  }
  debug(message: string, data?: object) {
    console.debug({ message, level: 'debug', data, ...this.baseInfo() });
  }
  trace(message: string, data?: object) {
    console.trace({ message, level: 'trace', data, ...this.baseInfo() });
  }

  baseInfo() {
    return {
      name: this.#name,
      pid: this.pid(),
      timestamp: this.time(),
      ...this.#additionalData,
    };
  }

  time() {
    return new Date().getTime();
  }

  pid() {
    return process.pid;
  }
}
