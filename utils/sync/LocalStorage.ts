import { LocalData } from "@/types/sync";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_BASE = "foodsnap_local_v1_";

// Legacy keys for migration
const LEGACY_KEYS = {
    PROFILE: "foodsnap_profile",
    GOALS: "foodsnap_goals",
    LOGS: "foodsnap_logs",
    WEIGHT_HISTORY: "foodsnap_weight_history",
    RECENT_SCANS: "foodsnap_recent_scans",
};

export async function getLocal(userId: string): Promise<LocalData | null> {
    try {
        const raw = await AsyncStorage.getItem(KEY_BASE + userId);
        return raw ? (JSON.parse(raw) as LocalData) : null;
    } catch (e) {
        console.error("getLocal failed", e);
        return null;
    }
}

export async function setLocal(userId: string, data: LocalData) {
    try {
        await AsyncStorage.setItem(KEY_BASE + userId, JSON.stringify(data));
    } catch (e) {
        console.error("setLocal failed", e);
    }
}

export async function migrateLegacyData(): Promise<LocalData | null> {
    try {
        const [p, g, l, w, r] = await Promise.all([
            AsyncStorage.getItem(LEGACY_KEYS.PROFILE),
            AsyncStorage.getItem(LEGACY_KEYS.GOALS),
            AsyncStorage.getItem(LEGACY_KEYS.LOGS),
            AsyncStorage.getItem(LEGACY_KEYS.WEIGHT_HISTORY),
            AsyncStorage.getItem(LEGACY_KEYS.RECENT_SCANS),
        ]);

        // If no main profile data, assume fresh install or already migrated/cleared
        if (!p) return null;

        const profile = JSON.parse(p);
        const goals = g ? JSON.parse(g) : {}; // Default goals will be handled by context if missing
        const logs = l ? JSON.parse(l) : {};
        const weightHistory = w ? JSON.parse(w) : [];
        const recentScans = r ? JSON.parse(r) : [];

        const migrated: LocalData = {
            schemaVersion: 1,
            updatedAt: Date.now(),
            profile,
            goals,
            logs,
            weightHistory,
            recentScans
        };

        // Clear legacy keys to prevent other users from inheriting this data
        await AsyncStorage.multiRemove(Object.values(LEGACY_KEYS));

        return migrated;
    } catch (e) {
        console.error("Migration failed", e);
        return null;
    }
}
