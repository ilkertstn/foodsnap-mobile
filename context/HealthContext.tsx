/**
 * Health Context
 * Provides health data (steps, calories, distance) across the app
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    getTodayHealthData,
    HealthData,
    isHealthAvailable,
    requestHealthPermissions
} from '../lib/health';

interface HealthContextType {
    healthData: HealthData | null;
    isEnabled: boolean;
    isLoading: boolean;
    isAvailable: boolean;
    enableHealthIntegration: () => Promise<boolean>;
    disableHealthIntegration: () => Promise<void>;
    refreshHealthData: () => Promise<void>;
}

const STORAGE_KEY = 'foodsnap_health_enabled';

const HealthContext = createContext<HealthContextType>({
    healthData: null,
    isEnabled: false,
    isLoading: true,
    isAvailable: false,
    enableHealthIntegration: async () => false,
    disableHealthIntegration: async () => { },
    refreshHealthData: async () => { },
});

export const useHealth = () => useContext(HealthContext);

export const HealthProvider = ({ children }: { children: React.ReactNode }) => {
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(false);

    // Check availability and load saved preference
    useEffect(() => {
        const init = async () => {
            try {
                const available = await isHealthAvailable();
                setIsAvailable(available);

                if (available) {
                    const savedPref = await AsyncStorage.getItem(STORAGE_KEY);
                    if (savedPref === 'true') {
                        // Try to get permissions silently
                        const hasPermission = await requestHealthPermissions();
                        if (hasPermission) {
                            setIsEnabled(true);
                            const data = await getTodayHealthData();
                            setHealthData(data);
                        }
                    }
                }
            } catch (e) {
                console.error('Health init error', e);
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, []);

    // Refresh data periodically when enabled
    useEffect(() => {
        if (!isEnabled) return;

        const interval = setInterval(async () => {
            try {
                const data = await getTodayHealthData();
                setHealthData(data);
            } catch (e) {
                console.error('Health refresh error', e);
            }
        }, 60000); // Refresh every minute

        return () => clearInterval(interval);
    }, [isEnabled]);

    const enableHealthIntegration = useCallback(async (): Promise<boolean> => {
        try {
            const granted = await requestHealthPermissions();
            if (granted) {
                setIsEnabled(true);
                await AsyncStorage.setItem(STORAGE_KEY, 'true');
                const data = await getTodayHealthData();
                setHealthData(data);
                return true;
            }
            alert("Health permissions not granted. Please check your settings.");
            return false;
        } catch (e: any) {
            console.error('Enable health error', e);
            alert(`Health Error: ${e.message || JSON.stringify(e)}`);
            return false;
        }
    }, []);

    const disableHealthIntegration = useCallback(async () => {
        setIsEnabled(false);
        setHealthData(null);
        await AsyncStorage.setItem(STORAGE_KEY, 'false');
    }, []);

    const refreshHealthData = useCallback(async () => {
        if (!isEnabled) return;
        try {
            const data = await getTodayHealthData();
            setHealthData(data);
        } catch (e) {
            console.error('Refresh health error', e);
        }
    }, [isEnabled]);

    return (
        <HealthContext.Provider
            value={{
                healthData,
                isEnabled,
                isLoading,
                isAvailable,
                enableHealthIntegration,
                disableHealthIntegration,
                refreshHealthData,
            }}
        >
            {children}
        </HealthContext.Provider>
    );
};
