
import { Badge } from "../types";

export const ALL_BADGES: Badge[] = [
    { id: "first_log", title: "First Step", description: "Logged your first meal!", icon: "restaurant", condition: "first_log" },
    { id: "water_2l", title: "Hydration Hero", description: "Drank 2L of water in a day", icon: "water", condition: "water_2l" },
    {
        id: "streak_7",
        title: "On Fire! 🔥",
        description: "Hit calorie goal 7 days in a row",
        icon: "flame",
        condition: { type: "streak_days", metric: "calorie_goal", days: 7 }
    },
    {
        id: "consistency_weekly",
        title: "Steady Eater ⚖️",
        description: "Hit calorie goal 5 times in the last 7 days",
        icon: "calendar",
        condition: { type: "consistency", metric: "calorie_goal", days: 5, window: 7 }
    },
    { id: "protein_streak_3", title: "Protein Power", description: "Hit protein goal 3 days in a row", icon: "barbell", condition: "protein_streak_3" },
    { id: "activity_3_per_week", title: "Active Life", description: "Exercised 3 days in the last 7 days", icon: "bicycle", condition: "activity_3_per_week" },
];

