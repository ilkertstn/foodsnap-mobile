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
 * Helper to check if a recipe matches diet/allergy constraints
 */
function isSafeForDiet(recipe: Recipe, dietType?: string, allergies?: string[]): boolean {
    const combinedIngredients = [
        ...(recipe.extendedIngredients?.map(i => i.name) || []),
        ...(recipe.summary?.split(',') || []),
        recipe.title
    ].join(' ').toLowerCase();

    // 1. Check Diet Type
    if (dietType) {
        const dt = dietType.toLowerCase();
        if (dt === 'vegetarian') {
            if (['chicken', 'beef', 'pork', 'fish', 'tuna', 'salmon', 'meat', 'steak', 'turkey'].some(i => combinedIngredients.includes(i))) return false;
        }
        else if (dt === 'vegan') {
            if (['chicken', 'beef', 'pork', 'fish', 'tuna', 'salmon', 'meat', 'steak', 'turkey', 'egg', 'cheese', 'milk', 'dairy', 'honey', 'butter', 'yogurt', 'cream'].some(i => combinedIngredients.includes(i))) return false;
        }
        else if (dt === 'pescetarian') {
            if (['chicken', 'beef', 'pork', 'meat', 'steak', 'turkey'].some(i => combinedIngredients.includes(i))) return false;
        }
        else if (dt === 'keto') {
            // Primitive check: high carb ingredients
            if (['rice', 'pasta', 'bread', 'potato', 'sugar', 'flour', 'corn', 'banana'].some(i => combinedIngredients.includes(i))) return false;
            // Also check macros if available (Keto usually < 10% carbs)
            const c = parseG(recipe.carbs);
            const k = recipe.calories;
            if (k > 0 && (c * 4) / k > 0.15) return false; // Strict check
        }
        else if (dt === 'paleo') {
            if (['rice', 'pasta', 'bread', 'sugar', 'flour', 'corn', 'bean', 'soy', 'dairy', 'milk', 'cheese'].some(i => combinedIngredients.includes(i))) return false;
        }
    }

    // 2. Check Allergies
    if (allergies && allergies.length > 0) {
        for (const allergy of allergies) {
            const a = allergy.toLowerCase();
            if (a === 'gluten') {
                if (['wheat', 'bread', 'pasta', 'flour', 'rye', 'barley', 'cracker', 'cake'].some(i => combinedIngredients.includes(i))) return false;
            }
            if (a === 'dairy') {
                if (['milk', 'cheese', 'yogurt', 'butter', 'cream', 'whey', 'casein'].some(i => combinedIngredients.includes(i))) return false;
            }
            if (a === 'nut') {
                if (['nut', 'almond', 'cashew', 'walnut', 'pecan', 'peanut'].some(i => combinedIngredients.includes(i))) return false;
            }
            if (a === 'shellfish') {
                if (['shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'prawn'].some(i => combinedIngredients.includes(i))) return false;
            }
        }
    }

    return true;
}

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
    dietType?: string;
    allergies?: string[];
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

        // DIET & ALLERGY CHECK
        if (!isSafeForDiet(r, params.dietType, params.allergies)) return false;

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
