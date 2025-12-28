import { FoodResult, Goals, Logs, Profile, WeightEntry } from "./index";

export type CloudData = {
    schemaVersion: 1;
    updatedAt: number;
    profile: Profile;
    goals: Goals;
    logs: Logs;
    weightHistory: WeightEntry[];
    recentScans: FoodResult[];
};

export type LocalData = CloudData;
