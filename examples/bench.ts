import autocannon from 'autocannon';

import type { ServerOptions } from 'node:http';
import { NullLogger } from '../src/logger/logger.null.ts';
import { success } from '../src/response.ts';
import { type Server, server } from '../src/server.ts';

function registerFunctions(app: Server) {
  app.func('one', async () => {
    return success({
      message: 'hello world',
      inner: {
        foo: 'bar',
      },
    });
  });

  app.funcWithSchema(
    'two',
    {
      response: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          inner: {
            type: 'object',
            properties: {
              foo: { type: 'string' },
            },
          },
        },
        required: ['message', 'inner'],
      },
    },
    async () => {
      return success({
        message: 'hello world',
        inner: {
          foo: 'bar',
        },
      });
    },
  );
}

const benchs: {
  path: string;
  info: string;
  httpOptions: ServerOptions;
}[] = [
  {
    path: '/one',
    info: 'no schema',
    httpOptions: {},
  },
  {
    path: '/two',
    info: 'with schema',
    httpOptions: {},
  },
  {
    path: '/one',
    info: 'no schema - keep alive',
    httpOptions: {
      keepAlive: true,
      keepAliveInitialDelay: 1000,
      keepAliveTimeout: 5000,
    },
  },
  {
    path: '/two',
    info: 'with schema - keep alive',
    httpOptions: {
      keepAlive: true,
      keepAliveInitialDelay: 1000,
      keepAliveTimeout: 5000,
    },
  },
];

const benchResults = [];

for (const bench of benchs) {
  console.log('benchmarking', bench.path, bench.info);

  const app = server({
    port: 3000,
    logger: new NullLogger(),
    httpOptions: bench.httpOptions,
  });

  registerFunctions(app);
  app.listen();

  const results = await autocannon({
    url: `http://localhost:3000/${bench.path}`,
    method: 'POST',
    connections: 100,
    duration: 40,
    pipelining: 10,
  });

  const { info, path } = bench;

  benchResults.push({
    path,
    info,
    ...results.requests,
  });

  await app.closeAsync();
}

console.table(benchResults, [
  'path',
  'schema',
  'average',
  'mean',
  'stddev',
  'min',
  'max',
  'total',
  'sent',
]);
