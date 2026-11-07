import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const Credentials = z.object({
  email: z.email().transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8, 'must be at least 8 characters').max(128),
});

const RegisterBody = Credentials.extend({
  countryCode: z
    .string()
    .length(2)
    .transform((s) => s.toUpperCase())
    .default('MY'),
});

const publicUser = (u: { id: string; email: string; countryCode: string }) => ({
  id: u.id,
  email: u.email,
  countryCode: u.countryCode,
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = RegisterBody.parse(request.body);

    const country = await app.prisma.country.findUnique({ where: { code: body.countryCode } });
    if (!country) return reply.code(400).send({ error: 'Unsupported country' });

    const existing = await app.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return reply.code(409).send({ error: 'Email is already registered' });

    const user = await app.prisma.user.create({
      data: {
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, 12),
        countryCode: body.countryCode,
      },
    });

    const token = app.jwt.sign({ sub: user.id });
    return reply.code(201).send({ token, user: publicUser(user) });
  });

  app.post('/auth/login', async (request, reply) => {
    const body = Credentials.parse(request.body);
    const user = await app.prisma.user.findUnique({ where: { email: body.email } });

    // Same message either way so the API doesn't reveal which emails exist.
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const token = app.jwt.sign({ sub: user.id });
    return { token, user: publicUser(user) };
  });

  app.get('/me', { onRequest: [app.authenticate] }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({ where: { id: request.user.sub } });
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });
    return publicUser(user);
  });
}
