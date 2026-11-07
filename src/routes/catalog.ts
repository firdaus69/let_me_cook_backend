import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { recipeInclude, toRecipeDto } from '../lib/recipes.js';

const ListQuery = z.object({
  country: z
    .string()
    .length(2)
    .transform((s) => s.toUpperCase())
    .default('MY'),
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

const IdParams = z.object({ id: z.string().min(1) });

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/countries', async () =>
    app.prisma.country.findMany({ orderBy: { name: 'asc' } }),
  );

  app.get('/ingredients', async () =>
    app.prisma.ingredient.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
  );

  // "Suggested for you": curated picks for the country, in featuredRank order.
  app.get('/recipes/suggested', async (request) => {
    const { country, limit } = ListQuery.parse(request.query);
    const recipes = await app.prisma.recipe.findMany({
      where: { countryCode: country, featuredRank: { not: null } },
      orderBy: { featuredRank: 'asc' },
      take: limit,
      include: recipeInclude,
    });
    return recipes.map(toRecipeDto);
  });

  // "Popular": most cooked in the country, falling back to the editorial score.
  app.get('/recipes/popular', async (request) => {
    const { country, limit } = ListQuery.parse(request.query);
    const recipes = await app.prisma.recipe.findMany({
      where: { countryCode: country },
      orderBy: [{ cookEvents: { _count: 'desc' } }, { popularity: 'desc' }, { title: 'asc' }],
      take: limit,
      include: recipeInclude,
    });
    return recipes.map(toRecipeDto);
  });

  app.get('/recipes/:id', async (request, reply) => {
    const { id } = IdParams.parse(request.params);
    const recipe = await app.prisma.recipe.findUnique({ where: { id }, include: recipeInclude });
    if (!recipe) return reply.code(404).send({ error: 'Recipe not found' });
    return { ...toRecipeDto(recipe), steps: recipe.steps };
  });
}
