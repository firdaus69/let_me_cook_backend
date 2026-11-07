import type { Prisma } from '@prisma/client';

export const recipeInclude = {
  ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
} satisfies Prisma.RecipeInclude;

export type RecipeWithIngredients = Prisma.RecipeGetPayload<{ include: typeof recipeInclude }>;

/** The recipe shape the app receives. */
export function toRecipeDto(r: RecipeWithIngredients) {
  return {
    id: r.id,
    title: r.title,
    minutes: r.minutes,
    difficulty: r.difficulty,
    tone: r.tone,
    imageUrl: r.imageUrl,
    countryCode: r.countryCode,
    ingredients: r.ingredients.map((ri) => ri.ingredient.name),
  };
}

export type RecipeDto = ReturnType<typeof toRecipeDto>;
