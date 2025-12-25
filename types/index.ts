export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodResult = {
    meal_name: string;
    category: MealType;
    calories_kcal: number;
    macros_g: { protein: number; carbs: number; fat: number };
    ingredients: string[];
    confidence: "low" | "medium" | "high";
    notes: string;
};

export type Profile = {
    name: string;
    age: number;
    gender: "male" | "female";
    heightCm: number;
    weightKg: number;
    activity: "sedentary" | "light" | "active";
    goal: "lose" | "maintain" | "gain";
};

export type Goals = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    strategy: "auto" | "manual";
};

export type FoodEntry = FoodResult & {
    id: string;
    createdAt: number;
    grams: number | null;
    imageUri?: string; // base64 saklama, sadece uri
};

export type DayLog = {
    date: string; // YYYY-MM-DD
    meals: Record<MealType, FoodEntry[]>;
};

export type Logs = Record<string, DayLog>; // key = date
