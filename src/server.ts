import { randomUUID } from 'node:crypto';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import type { ObjectSchema, Schema, build } from 'fast-json-stringify';
import { ConsoleLogger } from './logger/logger.console.ts';
import type { LoggerBase } from './logger/logger.ts';
import {
  type FunctionError,
  type FunctionResponse,
  createSuccessSchema,
  createSuccessStringify,
  fail,
  serializeError,
} from './response.ts';

export interface ServerOptions {
  port: number;
  host?: string;
  logger: LoggerBase;
  httpOptions?: http.ServerOptions;
}

export interface FunctionHandlerConfig {
  logger: LoggerBase;
  server: Server;
}

export type FunctionHandler<
  Data extends object = object,
  Err extends FunctionError = FunctionError,
> = (
  req: IncomingMessage,
  config: FunctionHandlerConfig,
) => Promise<FunctionResponse<Data, Err>>;

const COMMON_RESPONSES = {
  METHOD_NOT_ALLOWED: serializeError(
    fail({
      code: 'method_not_allowed',
      message: 'method not allowed',
      additionalInfo: {},
    }),
  ),
  INVALID_REQUEST: serializeError(
    fail({
      code: 'invalid_request',
      message: 'invalid request',
      additionalInfo: {},
    }),
  ),
  FUNCTION_NOT_FOUND: serializeError(
    fail({
      code: 'function_not_found',
      message: 'function not found',
      additionalInfo: {},
    }),
  ),
};

interface FunctionSchema {
  response: ObjectSchema;
}

interface FunctionSerializer {
  response: (data: unknown) => string;
}

class Server {
  #options: ServerOptions;
  #server: http.Server;

  #functions: Record<string, FunctionHandler> = {};
  #serializers: Record<string, FunctionSerializer> = {};

  constructor(options: ServerOptions) {
    this.#options = options;
    this.#server = http.createServer(
      options.httpOptions ?? {},
      this.handler.bind(this),
    );
  }

  handler(req: IncomingMessage, res: ServerResponse) {
    const logger = this.#options.logger.child('request');
    logger.setAdditionalData({
      url: req.url,
      method: req.method,
      requestId: this.requestId(),
    });

    logger.info('incoming request');

    res.setHeader('Powered-By', 'Fireball');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.write(COMMON_RESPONSES.METHOD_NOT_ALLOWED);
      res.end();
      return;
    }

    if (!req.url) {
      res.statusCode = 400;
      res.write(COMMON_RESPONSES.INVALID_REQUEST);
      res.end();
      return;
    }

    const fnName = req.url.split('/')[1] ?? '';

    const fnHandler = this.#functions[fnName];

    if (!fnHandler) {
      res.statusCode = 404;
      res.write(COMMON_RESPONSES.FUNCTION_NOT_FOUND);
      res.end();
      return;
    }

    fnHandler(req, { logger: this.#options.logger, server: this })
      .then((response) => {
        res.statusCode = 200;

        if (!response.success) {
          logger.warn('function execution was unsuccessful', {
            response: response.error,
          });

          res.write(serializeError(response));
        } else {
          logger.info('function execution was successful', {
            response: response.data,
          });

          const result =
            this.#serializers[fnName]?.response?.(response) ??
            JSON.stringify(response);

          res.write(result);
        }
      })
      .catch((error) => {
        res.statusCode = 500;
        res.write(
          serializeError(
            fail({
              code: 'internal_error',
              message: 'unexpected error',
              additionalInfo: { error },
            }),
          ),
        );

        logger.error('function execution resulted in an unhandled exception', {
          error,
        });
      })
      .finally(() => res.end());
  }

  requestId() {
    return randomUUID();
  }

  listen() {
    this.#options.logger.info('server is starting', {
      port: this.#options.port,
      host: this.#options.host,
    });

    this.#server.listen(this.#options.port, this.#options.host);
  }

  close(cb?: (error?: Error) => void) {
    this.#options.logger.info('closing server');

    this.#server.close(cb);
  }

  func(name: string, handler: FunctionHandler) {
    this.#functions[name] = handler;
  }

  funcWithSchema(
    name: string,
    schema: FunctionSchema,
    handler: FunctionHandler,
  ) {
    const successSchema = createSuccessSchema(schema.response);
    const successSchemaStringify = createSuccessStringify(successSchema);

    this.#serializers[name] = {
      response: successSchemaStringify,
    };
    this.#functions[name] = handler;
  }

  async closeAsync() {
    return new Promise<void>((resolve, reject) => {
      this.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

export interface ServerInitOptions extends Omit<ServerOptions, 'logger'> {
  logger?: LoggerBase;
}

export function server({
  host = '127.0.0.1',
  logger = new ConsoleLogger('server'),
  ...options
}: ServerInitOptions) {
  const server = new Server({ host, logger, ...options });

  // install graceful shutdowns
  process.on('SIGINT', () => {
    server.close();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.close();
    process.exit(0);
  });

  return server;
}
