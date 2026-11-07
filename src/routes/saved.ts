import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { recipeInclude, toRecipeDto } from '../lib/recipes.js';

const RecipeParams = z.object({ recipeId: z.string().min(1) });
const CookedParams = z.object({ id: z.string().min(1) });

export async function savedRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate);

  app.get('/me/saved', async (request) => {
    const saved = await app.prisma.savedRecipe.findMany({
      where: { userId: request.user.sub },
      orderBy: { createdAt: 'desc' },
      include: { recipe: { include: recipeInclude } },
    });
    return saved.map((s) => toRecipeDto(s.recipe));
  });

  // PUT/DELETE are idempotent, so the app can call them without checking first.
  app.put('/me/saved/:recipeId', async (request, reply) => {
    const { recipeId } = RecipeParams.parse(request.params);
    const recipe = await app.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) return reply.code(404).send({ error: 'Recipe not found' });

    const userId = request.user.sub;
    await app.prisma.savedRecipe.upsert({
      where: { userId_recipeId: { userId, recipeId } },
      update: {},
      create: { userId, recipeId },
    });
    return reply.code(204).send();
  });

  app.delete('/me/saved/:recipeId', async (request, reply) => {
    const { recipeId } = RecipeParams.parse(request.params);
    await app.prisma.savedRecipe.deleteMany({ where: { userId: request.user.sub, recipeId } });
    return reply.code(204).send();
  });

  // "I cooked this" — feeds the Popular ranking.
  app.post('/recipes/:id/cooked', async (request, reply) => {
    const { id } = CookedParams.parse(request.params);
    const recipe = await app.prisma.recipe.findUnique({ where: { id } });
    if (!recipe) return reply.code(404).send({ error: 'Recipe not found' });

    await app.prisma.cookEvent.create({ data: { userId: request.user.sub, recipeId: id } });
    return reply.code(201).send({ ok: true });
  });
}
