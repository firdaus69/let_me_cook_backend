export type Matchable = { minutes: number; ingredients: string[] };

export type RecipeMatch<T extends Matchable> = {
  recipe: T;
  have: number;
  need: number;
  missing: string[];
};

/**
 * Matches recipes against the ingredients a user has (case-insensitive).
 *
 * Keeps recipes that use at least one owned ingredient and miss at most
 * `maxMissing`. Sorted by fewest missing, then highest match ratio, then
 * shortest cooking time. Mirrors lib/features/fridge/recipe_matcher.dart in the app.
 */
export function matchRecipes<T extends Matchable>(
  recipes: T[],
  owned: Iterable<string>,
  maxMissing = 2,
): RecipeMatch<T>[] {
  const have = new Set([...owned].map((s) => s.trim().toLowerCase()));
  const matches: RecipeMatch<T>[] = [];

  for (const recipe of recipes) {
    const missing = recipe.ingredients.filter((i) => !have.has(i.toLowerCase()));
    const need = recipe.ingredients.length;
    const count = need - missing.length;
    if (count > 0 && missing.length <= maxMissing) {
      matches.push({ recipe, have: count, need, missing });
    }
  }

  return matches.sort(
    (a, b) =>
      a.missing.length - b.missing.length ||
      b.have / b.need - a.have / a.need ||
      a.recipe.minutes - b.recipe.minutes,
  );
}
