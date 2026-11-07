// Request validation and auth checks run before any database call,
// so these tests use an empty stand-in for Prisma.
import type { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startApp } from './helpers.js';

describe('API without a database', () => {
  let server: Awaited<ReturnType<typeof startApp>>;

  beforeAll(async () => {
    server = await startApp({ prisma: {} as PrismaClient, jwtSecret: 'x'.repeat(32) });
  });
  afterAll(() => server.app.close());

  it('rejects a fridge match with no ingredients', async () => {
    const res = await server.call('POST', '/recipes/match', { body: { ingredients: [] } });
    expect(res.status).toBe(400);
    expect(res.json.details[0].path).toBe('ingredients');
  });

  it('rejects registration with a bad email or short password', async () => {
    const res = await server.call('POST', '/auth/register', {
      body: { email: 'not-an-email', password: '123' },
    });
    expect(res.status).toBe(400);
    const paths = res.json.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('requires a login token for saved recipes', async () => {
    expect((await server.call('GET', '/me/saved')).status).toBe(401);
    expect((await server.call('GET', '/me')).status).toBe(401);
  });

  it('rejects a forged token', async () => {
    expect((await server.call('GET', '/me/saved', { token: 'not.a.token' })).status).toBe(401);
  });

  it('returns 400 for malformed JSON', async () => {
    expect((await server.call('POST', '/recipes/match', { raw: '{bad json' })).status).toBe(400);
  });
});
