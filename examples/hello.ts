import { NullLogger } from '../src/logger/logger.null.ts';
import { success } from '../src/response.ts';
import { server } from '../src/server.ts';

const app = server({
  port: 3000,
  logger: new NullLogger(),
  httpOptions: {
    keepAlive: true,
    keepAliveInitialDelay: 1000,
    keepAliveTimeout: 5000,
  },
});

app.func('hello', async (_req, { logger }) => {
  logger.info('hello from function');

  return success({ message: 'hello world' });
});

app.funcWithSchema(
  'hi',
  {
    response: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
  async (_req, { logger }) => {
    logger.info('hello from function');

    return success({ message: 'hello world' });
  },
);

app.listen();
