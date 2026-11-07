import type { PrismaClient } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    /** onRequest hook that rejects requests without a valid login token. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}
