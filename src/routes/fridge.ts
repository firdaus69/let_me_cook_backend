import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { matchRecipes } from '../lib/matcher.js';
import { recipeInclude, toRecipeDto } from '../lib/recipes.js';

const MatchBody = z.object({
  ingredients: z.array(z.string().trim().min(1)).min(1).max(100),
  maxMissing: z.number().int().min(0).max(3).default(2),
  country: z
    .string()
    .length(2)
    .transform((s) => s.toUpperCase())
    .optional(),
});

export async function fridgeRoutes(app: FastifyInstance) {
  // "Cook from your fridge": which recipes can these ingredients make?
  app.post('/recipes/match', async (request) => {
    const body = MatchBody.parse(request.body);

    // Resolve the user's names against the catalogue (case-insensitive).
    const catalogue = await app.prisma.ingredient.findMany({ select: { name: true } });
    const byLower = new Map(catalogue.map((i) => [i.name.toLowerCase(), i.name]));
    const known = new Set<string>();
    const unknownIngredients: string[] = [];
    for (const name of body.ingredients) {
      const match = byLower.get(name.toLowerCase());
      if (match) known.add(match);
      else unknownIngredients.push(name);
    }

    if (known.size === 0) return { ready: [], almost: [], unknownIngredients };

    // Only recipes that use at least one of the user's ingredients can match.
    // Fine for a catalogue of thousands; move the scoring into SQL when it grows.
    const candidates = await app.prisma.recipe.findMany({
      where: {
        ...(body.country && { countryCode: body.country }),
        ingredients: { some: { ingredient: { name: { in: [...known] } } } },
      },
      include: recipeInclude,
    });

    const matches = matchRecipes(candidates.map(toRecipeDto), known, body.maxMissing);
    return {
      ready: matches.filter((m) => m.missing.length === 0),
      almost: matches.filter((m) => m.missing.length > 0),
      unknownIngredients,
    };
  });
}
