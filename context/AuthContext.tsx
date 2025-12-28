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

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (email: string, pass: string) => Promise<void>;
    signInGuest: () => Promise<void>;
    signOut: () => Promise<void>;
    linkAccount: (email: string, pass: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    signIn: async () => { },
    signUp: async () => { },
    signInGuest: async () => { },
    signOut: async () => { },
    linkAccount: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("AUTH USER:", user.uid);
                setUser(user);
            } else {
                console.log("No user");
                setUser(null);
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
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signInGuest, signOut, linkAccount }}>
            {children}
        </AuthContext.Provider>
    );
};
