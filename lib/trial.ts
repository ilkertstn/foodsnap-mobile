
import { auth, db } from "@/firebaseConfig";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    Timestamp,
} from "firebase/firestore";




const TRIAL_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

function toMillis(ts: any): number | null {
    if (ts && typeof ts.toMillis === "function") return ts.toMillis();
    if (ts?.seconds) return ts.seconds * 1000;
    return null;
}

export type TrialStatus =
    | { state: "active"; endsAtMs: number }
    | { state: "expired"; endsAtMs: number }
    | { state: "unknown" };


export async function getOrCreateTrial(): Promise<TrialStatus> {
    const uid = auth.currentUser?.uid;
    if (!uid) {
        console.warn("getOrCreateTrial: No user logged in");
        return { state: "unknown" };
    }

    const trialRef = doc(db, "trials", uid);
    const snap = await getDoc(trialRef);

    if (!snap.exists()) {
        const endsAtMs = Date.now() + TRIAL_DAYS * DAY_MS;

        await setDoc(trialRef, {
            firstInstallAt: serverTimestamp(),
            trialEndsAt: Timestamp.fromMillis(endsAtMs),
            convertedToUser: false,
        });

        return { state: "active", endsAtMs };
    }

    const data = snap.data() as any;
    const endsAtMs = toMillis(data?.trialEndsAt);

    if (!endsAtMs) return { state: "unknown" };

    const result = Date.now() > endsAtMs
        ? { state: "expired", endsAtMs }
        : { state: "active", endsAtMs };

    console.log("TRIAL CHECK:", result.state);
    return result as TrialStatus;
}
