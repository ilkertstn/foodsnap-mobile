export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodResult = {
    meal_name: string;
    category: MealType;
    calories_kcal: number;
    macros_g: { protein: number; carbs: number; fat: number };
    ingredients: string[];
    confidence: "low" | "medium" | "high";
    notes: string;
    quantity_basis?: "100g" | "serving";
};

export type Badge = {
    id: string;
    title: string;
    description: string;
    icon: string; // Ionicons name
    condition: "water_2l" | "streak_7" | "protein_streak_3" | "activity_3_per_week" | "first_log";
};

export type Profile = {
    name: string;
    age: number;
    gender: "male" | "female";
    heightCm: number;
    weightKg: number;
    activity: "sedentary" | "light" | "active";
    goal: "lose" | "maintain" | "gain";
    reminders?: {
        water: boolean;
        waterInterval: number; // in hours, default 2
        waterStart: string; // HH:mm, default "09:00"
        waterEnd: string; // HH:mm, default "21:00"
        meals: boolean;
        breakfastTime: string; // HH:mm, default "09:00"
        lunchTime: string; // HH:mm, default "13:00"
        dinnerTime: string; // HH:mm, default "19:00"
    };
    unlockedBadges?: { badgeId: string; unlockedAt: number }[];
};

export type Goals = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number; // Daily water goal in ml
    strategy: "auto" | "manual";
};

export type FoodEntry = FoodResult & {
    id: string;
    createdAt: number;
    grams: number | null;
    imageUri?: string; // base64 saklama, sadece uri
};

export type ExerciseEntry = {
    id: string;
    type: string;
    durationMinutes: number;
    caloriesBurned: number;
    createdAt: number;
};

export type DayLog = {
    date: string; // YYYY-MM-DD
    meals: Record<MealType, FoodEntry[]>;
    water_ml: number; // Daily water intake in ml
    exercises: ExerciseEntry[];
};

export type WeightEntry = {
    date: string; // YYYY-MM-DD
    weight: number;
};

export type Logs = Record<string, DayLog>; // key = date
