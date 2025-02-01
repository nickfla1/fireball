import type pino from 'pino';
import type { LoggerBase } from './logger.ts';

export class PinoLogger implements LoggerBase {
  #instance: pino.Logger;
  #additionalData: object = {};

  constructor(instance: pino.Logger, additionalData?: object) {
    this.#instance = instance;
    this.#additionalData = additionalData ?? {};
  }

  setAdditionalData(data: object) {
    this.#additionalData = data;
  }

  child(name: string) {
    return new PinoLogger(
      this.#instance.child({ module: name }),
      this.#additionalData,
    );
  }

  info(message: string, data?: object) {
    this.#instance.info({ message, data, ...this.baseInfo() });
  }
  warn(message: string, data?: object) {
    this.#instance.warn({ message, data, ...this.baseInfo() });
  }
  error(message: string, data?: object) {
    this.#instance.error({ message, data, ...this.baseInfo() });
  }
  debug(message: string, data?: object) {
    this.#instance.debug({ message, data, ...this.baseInfo() });
  }
  trace(message: string, data?: object) {
    this.#instance.trace({ message, data, ...this.baseInfo() });
  }

  baseInfo() {
    return this.#additionalData;
  }
}
