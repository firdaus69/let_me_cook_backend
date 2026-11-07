// End-to-end checks against a real, seeded database.
// Skipped unless DATABASE_URL is set (in .env or the environment).
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { startApp } from './helpers.js';

dotenv.config({ quiet: true });

describe.skipIf(!process.env.DATABASE_URL)('API with database', () => {
  const prisma = new PrismaClient();
  const email = `test-${Date.now()}@example.com`;
  let server: Awaited<ReturnType<typeof startApp>>;

  beforeAll(async () => {
    server = await startApp({ prisma, jwtSecret: 'x'.repeat(32) });
  });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await server.app.close();
    await prisma.$disconnect();
  });

  it('reports a healthy database', async () => {
    expect((await server.call('GET', '/health')).json).toEqual({ ok: true, db: 'up' });
  });

  it('returns 5 suggested and 5 popular recipes for Malaysia', async () => {
    const suggested = (await server.call('GET', '/recipes/suggested?country=MY')).json;
    const popular = (await server.call('GET', '/recipes/popular?country=my')).json;
    expect(suggested.map((r: { id: string }) => r.id)).toEqual([
      'nasi-lemak', 'roti-canai', 'laksa-penang', 'satay-ayam', 'mee-goreng-mamak',
    ]);
    expect(popular).toHaveLength(5);
    expect(popular[0].ingredients.length).toBeGreaterThan(0);
  });

  it('matches fridge ingredients into ready and almost', async () => {
    const res = await server.call('POST', '/recipes/match', {
      body: { ingredients: ['eggs', 'Onion', 'Chili', 'Dragonfruit'] },
    });
    expect(res.status).toBe(200);
    expect(res.json.ready.map((m: { recipe: { id: string } }) => m.recipe.id)).toContain('telur-dadar-bawang');
    expect(res.json.almost.length).toBeGreaterThan(0);
    expect(res.json.unknownIngredients).toEqual(['Dragonfruit']);
  });

  it('registers, logs in and manages saved recipes', async () => {
    const creds = { email, password: 'secret123' };
    expect((await server.call('POST', '/auth/register', { body: creds })).status).toBe(201);
    expect((await server.call('POST', '/auth/register', { body: creds })).status).toBe(409);
    expect(
      (await server.call('POST', '/auth/login', { body: { email, password: 'wrong-pass' } })).status,
    ).toBe(401);

    const login = await server.call('POST', '/auth/login', { body: creds });
    expect(login.status).toBe(200);
    const token: string = login.json.token;

    expect((await server.call('GET', '/me', { token })).json.email).toBe(email);

    expect((await server.call('PUT', '/me/saved/cendol', { token })).status).toBe(204);
    expect((await server.call('PUT', '/me/saved/cendol', { token })).status).toBe(204);
    expect((await server.call('PUT', '/me/saved/nope', { token })).status).toBe(404);
    expect((await server.call('GET', '/me/saved', { token })).json.map((r: { id: string }) => r.id)).toEqual([
      'cendol',
    ]);

    expect((await server.call('DELETE', '/me/saved/cendol', { token })).status).toBe(204);
    expect((await server.call('GET', '/me/saved', { token })).json).toEqual([]);

    expect((await server.call('POST', '/recipes/cendol/cooked', { token })).status).toBe(201);
  });
});
