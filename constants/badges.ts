import { Badge } from "../types";

export const ALL_BADGES: Badge[] = [
    {
        id: "first_log",
        titleKey: "badges.first_log.title",
        descKey: "badges.first_log.desc",
        icon: "restaurant",
        condition: "first_log"
    },
    {
        id: "water_2l",
        titleKey: "badges.water_2l.title",
        descKey: "badges.water_2l.desc",
        icon: "water",
        condition: "water_2l"
    },
    {
        id: "streak_7",
        titleKey: "badges.streak_7.title",
        descKey: "badges.streak_7.desc",
        icon: "flame",
        condition: { type: "streak_days", metric: "calorie_goal", days: 7 }
    },
    {
        id: "consistency_weekly",
        titleKey: "badges.consistency_weekly.title",
        descKey: "badges.consistency_weekly.desc",
        icon: "calendar",
        condition: { type: "consistency", metric: "calorie_goal", days: 5, window: 7 }
    },
    {
        id: "protein_streak_3",
        titleKey: "badges.protein_streak_3.title",
        descKey: "badges.protein_streak_3.desc",
        icon: "barbell",
        condition: "protein_streak_3"
    },
    {
        id: "activity_3_per_week",
        titleKey: "badges.activity_3_per_week.title",
        descKey: "badges.activity_3_per_week.desc",
        icon: "bicycle",
        condition: "activity_3_per_week"
    },
];
