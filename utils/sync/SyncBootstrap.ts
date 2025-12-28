import { LocalData } from "@/types/sync";
import { getLocal, migrateLegacyData, setLocal } from "./LocalStorage";
import { pullCloud, pushCloud } from "./SyncService";

export async function bootstrapSync(userId: string, makeEmpty: () => LocalData): Promise<LocalData> {
    console.log("Bootstrap Sync started for user:", userId);

    // 1. Try to get local data (new format)
    let local = await getLocal(userId);

    // 2. If no local data, try migration
    if (!local) {
        console.log("No local data found. Checking for legacy data...");
        const migrated = await migrateLegacyData();
        if (migrated) {
            console.log("Legacy data found and migrated.");
            local = migrated;
            // Immediate save to new format locally
            await setLocal(userId, local);
        }
    }

    // 3. Fetch cloud data
    // We do this in parallel effectively if we wanted, but sequential is safer for logic clarity
    const cloud = await pullCloud();

    let finalData: LocalData;

    if (!local && !cloud) {
        console.log("No data anywhere. Creating fresh state.");
        finalData = makeEmpty();
        await setLocal(userId, finalData);
        await pushCloud(finalData); // Init cloud
    } else if (!local && cloud) {
        console.log("Only cloud data found. Downloading...");
        finalData = cloud;
        await setLocal(userId, finalData);
    } else if (local && !cloud) {
        console.log("Only local data found. Uploading...");
        finalData = local;
        await pushCloud(finalData);
    } else {
        // Both exist. Compare updatedAt.
        // We use Last-Write-Wins.
        const localTime = local!.updatedAt || 0;
        const cloudTime = cloud!.updatedAt || 0;

        console.log(`Conflict resolution: Local=${localTime}, Cloud=${cloudTime}`);

        if (cloudTime > localTime) {
            console.log("Cloud is newer. Overwriting local.");
            finalData = cloud!;
            await setLocal(userId, finalData);
        } else {
            console.log("Local is newer (or same). Pushing to cloud just in case.");
            finalData = local!;
            // Optimistic: we use local, but maybe we should push if local > cloud
            if (localTime > cloudTime) {
                await pushCloud(finalData);
            }
        }
    }

    return finalData;
}
