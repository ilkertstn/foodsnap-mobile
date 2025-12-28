import { auth, db } from "@/firebaseConfig";
import { LocalData } from "@/types/sync";
import { doc, getDoc, setDoc } from "firebase/firestore";

const CLOUD_DOC_PATH = (uid: string) => doc(db, "users", uid, "app", "data");

export async function pullCloud(): Promise<LocalData | null> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
        console.warn("pullCloud ignored: No auth user");
        return null;
    }

    try {
        const snap = await getDoc(CLOUD_DOC_PATH(uid));
        if (!snap.exists()) return null;
        return snap.data() as LocalData;
    } catch (error) {
        console.error("pullCloud failed", error);
        return null; // Fail gracefully (offline)
    }
}

// Helper to remove undefined fields (Firestore doesn't support them)
function sanitize(obj: any): any {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);

    const newObj: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            newObj[key] = val === undefined ? null : sanitize(val);
        }
    }
    return newObj;
}

export async function pushCloud(local: LocalData): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
        // Silent return if no user (e.g. still initializing)
        return;
    }

    try {
        const payload = sanitize({ ...local, updatedAt: Date.now(), schemaVersion: 1 });
        await setDoc(
            CLOUD_DOC_PATH(uid),
            payload,
            { merge: true }
        );
    } catch (error) {
        console.error("pushCloud failed", error);
        // We don't throw here to avoid blocking UI. 
        // Sync is best-effort. LocalStorage maintains truth.
    }
}
