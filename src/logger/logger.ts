export interface LoggerBase<Data = object> {
  info(message: string, data?: Data): void;
  warn(message: string, data?: Data): void;
  error(message: string, data?: Data): void;
  debug(message: string, data?: Data): void;
  trace(message: string, data?: Data): void;

  child(name?: string): LoggerBase;
  setAdditionalData(data: Data): void;
}
