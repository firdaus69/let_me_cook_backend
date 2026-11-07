import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { ok: true, db: 'up' };
    } catch (err) {
      app.log.error(err, 'database health check failed');
      return reply.code(503).send({ ok: false, db: 'down' });
    }
  });
}
