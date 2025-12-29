/**
 * Recipe Service (Local TheMealDB based)
 * Replaces Spoonacular API with local seed data + estimated nutrition.
 */

import seed from '../data/recipes.seed.json';

// Types matching the app usage
export interface Recipe {
    id: string;
    title: string;
    image?: string;
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
    readyInMinutes?: number;
    summary?: string; // tags
    instructions?: string;
    extendedIngredients?: { original: string; name?: string; amount?: number; unit?: string }[];
    isEstimated?: boolean; // UI can show this
}

export interface RecipeDetail extends Recipe { }

// Parse '23g' -> 23
const parseG = (v: string | number | undefined) => {
    if (typeof v === 'number') return v;
    return parseInt((v ?? "0").replace("g", ""), 10) || 0;
};

// Convert seed item to App Recipe format
const LOCAL_DB: Recipe[] = (seed as any[]).map(r => ({
    id: r.id,
    title: r.name,
    image: r.image,
    calories: Number(r.kcal || 0),
    protein: `${Number(r.protein || 0)}g`,
    carbs: `${Number(r.carbs || 0)}g`,
    fat: `${Number(r.fat || 0)}g`,
    readyInMinutes: r.minutes,
    summary: (r.tags || []).join(', '), // Use tags as summary
    instructions: r.raw?.instructions,
    extendedIngredients: (r.ingredients || []).map((i: string) => ({
        original: i,
        name: i, // simple fallback
        amount: 1,
        unit: 'serving'
    })),
    isEstimated: true
}));

// Demo recipes no longer needed but kept for compatibility if needed
export const DEMO_RECIPES: Recipe[] = LOCAL_DB.slice(0, 5);

// API always "configured" since it's local
export const isApiConfigured = () => true;

/**
 * Search recipes by macro targets
 * Since we have local data, we just filter and sort by relevance
 */
export async function searchRecipesByNutrients(params: {
    maxCalories?: number;
    minCalories?: number;
    maxProtein?: number;
    minProtein?: number;
    maxCarbs?: number;
    maxFat?: number;
    number?: number;
}): Promise<Recipe[]> {
    const limit = params.number || 10;

    // Shuffle for variety if no strict filter
    let pool = [...LOCAL_DB];

    // Shuffle (Fisher-Yates simple)
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const filtered = pool.filter(r => {
        if (params.maxCalories && r.calories > params.maxCalories) return false;
        if (params.minCalories && r.calories < params.minCalories) return false;

        const p = parseG(r.protein);
        if (params.maxProtein && p > params.maxProtein) return false;
        if (params.minProtein && p < params.minProtein) return false;

        const c = parseG(r.carbs);
        if (params.maxCarbs && c > params.maxCarbs) return false;

        const f = parseG(r.fat);
        if (params.maxFat && f > params.maxFat) return false;

        return true;
    });

    return filtered.slice(0, limit);
}

/**
 * Get details (Already in memory)
 */
export async function getRecipeDetails(id: string): Promise<RecipeDetail | null> {
    return LOCAL_DB.find(r => r.id === id) || null;
}
