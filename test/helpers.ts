import type { AddressInfo } from 'node:net';

import { buildApp, type AppOptions } from '../src/app.js';

type CallOptions = { body?: unknown; token?: string; raw?: string };

/**
 * Starts the app on a random local port and returns a small fetch helper.
 * (Real HTTP instead of `app.inject()`, which needs Node 22+ for one of its deps.)
 */
export async function startApp(options: AppOptions) {
  const app = await buildApp(options);
  await app.listen({ port: 0, host: '127.0.0.1' });
  const { port } = app.server.address() as AddressInfo;
  const base = `http://127.0.0.1:${port}`;

  async function call(method: string, path: string, { body, token, raw }: CallOptions = {}) {
    const hasBody = body !== undefined || raw !== undefined;
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(hasBody && { 'content-type': 'application/json' }),
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const text = await res.text();
    const json: any = text ? JSON.parse(text) : null;
    return { status: res.status, json };
  }

  return { app, call };
}
