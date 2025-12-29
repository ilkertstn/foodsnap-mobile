
const SPOONACULAR_API_KEY: string = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY || "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.spoonacular.com";

export interface Recipe {
    id: number;
    title: string;
    image: string;
    imageType: string;
    calories: number;
    protein: string;
    fat: string;
    carbs: string;
    readyInMinutes?: number;
    servings?: number;
}

export interface RecipeDetail extends Recipe {
    summary: string;
    instructions: string;
    extendedIngredients: Array<{
        original: string;
        name: string;
        amount: number;
        unit: string;
    }>;
    sourceUrl?: string;
    diets?: string[];
    dishTypes?: string[];
}

/**
 * Search recipes by nutritional targets (remaining macros)
 */
export async function searchRecipesByNutrients(params: {
    maxCalories?: number;
    maxCarbs?: number;
    maxProtein?: number;
    maxFat?: number;
    minCalories?: number;
    minProtein?: number;
    number?: number;
}): Promise<Recipe[]> {
    const queryParams = new URLSearchParams({
        apiKey: SPOONACULAR_API_KEY,
        number: String(params.number || 10),
    });

    if (params.maxCalories) queryParams.append("maxCalories", String(params.maxCalories));
    if (params.maxCarbs) queryParams.append("maxCarbs", String(params.maxCarbs));
    if (params.maxProtein) queryParams.append("maxProtein", String(params.maxProtein));
    if (params.maxFat) queryParams.append("maxFat", String(params.maxFat));
    if (params.minCalories) queryParams.append("minCalories", String(params.minCalories));
    if (params.minProtein) queryParams.append("minProtein", String(params.minProtein));

    try {
        const response = await fetch(
            `${BASE_URL}/recipes/findByNutrients?${queryParams.toString()}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Recipe search error:", error);
        return [];
    }
}

/**
 * Get random healthy recipes
 */
export async function getRandomRecipes(number: number = 10): Promise<Recipe[]> {
    try {
        const response = await fetch(
            `${BASE_URL}/recipes/random?apiKey=${SPOONACULAR_API_KEY}&number=${number}&tags=healthy`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.recipes?.map((r: any) => ({
            id: r.id,
            title: r.title,
            image: r.image,
            readyInMinutes: r.readyInMinutes,
            servings: r.servings,
            calories: r.nutrition?.nutrients?.find((n: any) => n.name === "Calories")?.amount || 0,
            protein: `${r.nutrition?.nutrients?.find((n: any) => n.name === "Protein")?.amount || 0}g`,
            carbs: `${r.nutrition?.nutrients?.find((n: any) => n.name === "Carbohydrates")?.amount || 0}g`,
            fat: `${r.nutrition?.nutrients?.find((n: any) => n.name === "Fat")?.amount || 0}g`,
        })) || [];
    } catch (error) {
        console.error("Random recipe error:", error);
        return [];
    }
}

/**
 * Get recipe details by ID
 */
export async function getRecipeDetails(recipeId: number): Promise<RecipeDetail | null> {
    try {
        const response = await fetch(
            `${BASE_URL}/recipes/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}&includeNutrition=true`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const r = await response.json();
        return {
            id: r.id,
            title: r.title,
            image: r.image,
            imageType: r.imageType,
            readyInMinutes: r.readyInMinutes,
            servings: r.servings,
            summary: r.summary?.replace(/<[^>]*>/g, "") || "", // Strip HTML
            instructions: r.instructions?.replace(/<[^>]*>/g, "") || "",
            extendedIngredients: r.extendedIngredients || [],
            sourceUrl: r.sourceUrl,
            diets: r.diets,
            dishTypes: r.dishTypes,
            calories: r.nutrition?.nutrients?.find((n: any) => n.name === "Calories")?.amount || 0,
            protein: `${r.nutrition?.nutrients?.find((n: any) => n.name === "Protein")?.amount || 0}g`,
            carbs: `${r.nutrition?.nutrients?.find((n: any) => n.name === "Carbohydrates")?.amount || 0}g`,
            fat: `${r.nutrition?.nutrients?.find((n: any) => n.name === "Fat")?.amount || 0}g`,
        };
    } catch (error) {
        console.error("Recipe details error:", error);
        return null;
    }
}


export function isApiConfigured(): boolean {
    return SPOONACULAR_API_KEY !== "YOUR_API_KEY_HERE" && SPOONACULAR_API_KEY.length > 0;
}


export const DEMO_RECIPES: Recipe[] = [
    {
        id: 1,
        title: "Grilled Chicken Salad",
        image: "https://spoonacular.com/recipeImages/715538-312x231.jpg",
        imageType: "jpg",
        calories: 350,
        protein: "35g",
        carbs: "15g",
        fat: "18g",
        readyInMinutes: 25,
        servings: 2,
    },
    {
        id: 2,
        title: "Quinoa Buddha Bowl",
        image: "https://spoonacular.com/recipeImages/716426-312x231.jpg",
        imageType: "jpg",
        calories: 420,
        protein: "18g",
        carbs: "55g",
        fat: "14g",
        readyInMinutes: 30,
        servings: 2,
    },
    {
        id: 3,
        title: "Salmon with Vegetables",
        image: "https://spoonacular.com/recipeImages/659109-312x231.jpg",
        imageType: "jpg",
        calories: 380,
        protein: "32g",
        carbs: "20g",
        fat: "22g",
        readyInMinutes: 35,
        servings: 2,
    },
    {
        id: 4,
        title: "Greek Yogurt Parfait",
        image: "https://spoonacular.com/recipeImages/665769-312x231.jpg",
        imageType: "jpg",
        calories: 280,
        protein: "20g",
        carbs: "35g",
        fat: "8g",
        readyInMinutes: 10,
        servings: 1,
    },
    {
        id: 5,
        title: "Turkey Wrap",
        image: "https://spoonacular.com/recipeImages/664547-312x231.jpg",
        imageType: "jpg",
        calories: 320,
        protein: "28g",
        carbs: "30g",
        fat: "12g",
        readyInMinutes: 15,
        servings: 1,
    },
];
