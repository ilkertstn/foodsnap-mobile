import { auth } from "@/firebaseConfig"; // Adjust path as needed
import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    signOut as firebaseSignOut,
    linkWithCredential,
    onAuthStateChanged,
    signInAnonymously,
    signInWithEmailAndPassword,
    User
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { getOrCreateTrial, TrialStatus } from "../lib/trial";

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    trialStatus: TrialStatus | null;
    isTrialExpired: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string) => Promise<void>;
    signInGuest: () => Promise<void>;
    signOut: () => Promise<void>;
    linkAccount: (email: string, pass: string) => Promise<void>;
    checkTrial: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    trialStatus: null,
    isTrialExpired: false,
    signIn: async () => { },
    signUp: async () => { },
    signInGuest: async () => { },
    signOut: async () => { },
    linkAccount: async () => { },
    checkTrial: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);

    const isTrialExpired = trialStatus?.state === "expired";

    const checkTrial = async () => {
        try {
            const status = await getOrCreateTrial();
            setTrialStatus(status);
        } catch (e) {
            console.error("Trial check failed", e);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("AUTH USER:", user.uid);
                setUser(user);

                // Check trial status for anonymous users
                if (user.isAnonymous) {
                    await checkTrial();
                } else {
                    // Registered users don't have trial limits
                    setTrialStatus(null);
                }
            } else {
                console.log("No user");
                setUser(null);
                setTrialStatus(null);
            }
            setIsLoading(false);
        });

        return unsub;
    }, []);

    const signIn = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (e) {
            throw e;
        }
    };

    const signUp = async (email: string, pass: string) => {
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
        } catch (e) {
            console.error("Sign up failed", e);
            throw e;
        }
    };

    const signInGuest = async () => {
        try {
            await signInAnonymously(auth);
        } catch (e) {
            throw e;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (e) {
            console.error("Sign out failed", e);
        }
    };

    const linkAccount = async (email: string, pass: string) => {
        if (!auth.currentUser) throw new Error("No user to link");
        try {
            const credential = EmailAuthProvider.credential(email, pass);
            await linkWithCredential(auth.currentUser, credential);
        } catch (e) {
            console.error("Link account failed", e);
            throw e;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, trialStatus, isTrialExpired, signIn, signUp, signInGuest, signOut, linkAccount, checkTrial }}>
            {children}
        </AuthContext.Provider>
    );
};
