import autocannon from 'autocannon';

import { NullLogger } from '../src/logger/logger.null.ts';
import { success } from '../src/response.ts';
import { server } from '../src/server.ts';

const app = server({
  port: 3000,
  logger: new NullLogger(),
});

app.func('hello', async (_req, { logger }) => {
  return success({ message: 'hello world' });
});

app.listen();

const results = await autocannon({
  url: 'http://localhost:3000/hello',
  method: 'POST',
  connections: 100,
  duration: 40,
  pipelining: 10,
});

app.close();

console.table(
  [results.requests],
  ['average', 'mean', 'stddev', 'min', 'max', 'total', 'sent'],
);
