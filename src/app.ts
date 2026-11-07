import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import type { PrismaClient } from '@prisma/client';
import Fastify, { type FastifyError } from 'fastify';
import { ZodError } from 'zod';

import { authRoutes } from './routes/auth.js';
import { catalogRoutes } from './routes/catalog.js';
import { fridgeRoutes } from './routes/fridge.js';
import { healthRoutes } from './routes/health.js';
import { savedRoutes } from './routes/saved.js';
import './types.js';

export type AppOptions = {
  prisma: PrismaClient;
  jwtSecret: string;
  logger?: boolean;
};

export async function buildApp({ prisma, jwtSecret, logger = false }: AppOptions) {
  const app = Fastify({ logger });

  app.decorate('prisma', prisma);

  // TODO: restrict `origin` to your web app's domain before going live.
  await app.register(cors, { origin: true });
  await app.register(jwt, { secret: jwtSecret, sign: { expiresIn: '7d' } });

  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  app.setErrorHandler((error: FastifyError | ZodError, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'Bad request',
        details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error' });
  });

  await app.register(healthRoutes);
  await app.register(catalogRoutes);
  await app.register(fridgeRoutes);
  await app.register(authRoutes);
  await app.register(savedRoutes);

  return app;
}
