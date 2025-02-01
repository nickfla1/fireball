import autocannon from 'autocannon';

import { NullLogger } from '../src/logger/logger.null.ts';
import { success } from '../src/response.ts';
import { server } from '../src/server.ts';

const app = server({
  port: 3000,
  logger: new NullLogger(),
});

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

const benchs = [
  {
    path: '/one',
    schema: 'not defined',
  },
  {
    path: '/two',
    schema: 'defined',
  },
];

const benchResults = [];

for (const bench of benchs) {
  console.log('benchmarking', bench.path);

  app.listen();

  const results = await autocannon({
    url: `http://localhost:3000/${bench.path}`,
    method: 'POST',
    connections: 100,
    duration: 40,
    pipelining: 10,
  });

  benchResults.push({
    ...bench,
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
