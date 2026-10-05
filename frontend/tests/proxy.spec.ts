import { createServer } from 'node:http';
import { test, expect } from '@playwright/test';

test('Next.js proxies API method, query, body and authorization to the backend', async ({ request }) => {
  // Listen only for this test; fail on port conflict rather than touching another service.
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ method: req.method, url: req.url, authorization: req.headers.authorization, body: JSON.parse(body) }));
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(3000, resolve);
  });
  try {
    const response = await request.post('/api/migration-check?source=next', {
      headers: { Authorization: 'Bearer migration-test-only' },
      data: { message: 'proxy check' },
    });
    expect(response.ok()).toBeTruthy();
    expect(await response.json()).toEqual({
      method: 'POST', url: '/api/migration-check?source=next',
      authorization: 'Bearer migration-test-only', body: { message: 'proxy check' },
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
