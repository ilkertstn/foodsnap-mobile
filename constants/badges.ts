import { Badge } from "../types";

export const ALL_BADGES: Badge[] = [
    { id: "first_log", title: "First Step", description: "Logged your first meal!", icon: "restaurant", condition: "first_log" },
    { id: "water_2l", title: "Hydration Hero", description: "Drank 2L of water in a day", icon: "water", condition: "water_2l" },
    { id: "streak_7", title: "Consistency King", description: "Hit calorie goal 7 days in a row", icon: "ribbon", condition: "streak_7" },
    { id: "protein_streak_3", title: "Protein Power", description: "Hit protein goal 3 days in a row", icon: "barbell", condition: "protein_streak_3" },
    { id: "activity_3_per_week", title: "Active Life", description: "Exercised 3 days in the last 7 days", icon: "bicycle", condition: "activity_3_per_week" },
];
