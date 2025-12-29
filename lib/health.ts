
import { Platform } from 'react-native';

// Types
export interface HealthData {
    steps: number;
    activeCalories: number;
    distance: number; // in meters
}

export interface HealthPermissionStatus {
    isAvailable: boolean;
    isAuthorized: boolean;
}

// Lazy imports to avoid errors on unsupported platforms
let AppleHealthKit: any = null;
let HealthConnect: any = null;

// Initialize platform-specific health module
const initHealthModule = async () => {
    if (Platform.OS === 'ios') {
        try {
            AppleHealthKit = require('react-native-health').default;
        } catch (e) {
            console.log('HealthKit not available');
        }
    } else if (Platform.OS === 'android') {
        try {
            HealthConnect = require('react-native-health-connect');
        } catch (e) {
            console.log('Health Connect not available');
        }
    }
};

// Initialize on import
initHealthModule();

/**
 * Check if Health services are available on this device
 */
export const isHealthAvailable = async (): Promise<boolean> => {
    if (Platform.OS === 'ios' && AppleHealthKit) {
        return new Promise((resolve) => {
            AppleHealthKit.isAvailable((err: any, available: boolean) => {
                resolve(!err && available);
            });
        });
    } else if (Platform.OS === 'android' && HealthConnect) {
        try {
            const status = await HealthConnect.getSdkStatus();
            return status === HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE;
        } catch {
            return false;
        }
    }
    return false;
};

/**
 * Request permissions for health data access
 */
export const requestHealthPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'ios' && AppleHealthKit) {
        const permissions = {
            permissions: {
                read: [
                    AppleHealthKit.Constants.Permissions.StepCount,
                    AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
                    AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
                ],
                write: [],
            },
        };

        return new Promise((resolve) => {
            AppleHealthKit.initHealthKit(permissions, (err: any) => {
                resolve(!err);
            });
        });
    } else if (Platform.OS === 'android' && HealthConnect) {
        try {
            await HealthConnect.initialize();
            const granted = await HealthConnect.requestPermission([
                { accessType: 'read', recordType: 'Steps' },
                { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
                { accessType: 'read', recordType: 'Distance' },
            ]);
            return granted.length > 0;
        } catch (e) {
            console.error('Health Connect permission error', e);
            return false;
        }
    }
    return false;
};

/**
 * Get today's health data
 */
export const getTodayHealthData = async (): Promise<HealthData> => {
    const defaultData: HealthData = { steps: 0, activeCalories: 0, distance: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    if (Platform.OS === 'ios' && AppleHealthKit) {
        try {
            const [steps, calories, distance] = await Promise.all([
                getIOSStepCount(today, now),
                getIOSActiveCalories(today, now),
                getIOSDistance(today, now),
            ]);
            return { steps, activeCalories: calories, distance };
        } catch (e) {
            console.error('Error fetching HealthKit data', e);
            return defaultData;
        }
    } else if (Platform.OS === 'android' && HealthConnect) {
        try {
            const [steps, calories, distance] = await Promise.all([
                getAndroidSteps(today, now),
                getAndroidActiveCalories(today, now),
                getAndroidDistance(today, now),
            ]);
            return { steps, activeCalories: calories, distance };
        } catch (e) {
            console.error('Error fetching Health Connect data', e);
            return defaultData;
        }
    }

    return defaultData;
};

// iOS HealthKit helpers
const getIOSStepCount = (startDate: Date, endDate: Date): Promise<number> => {
    return new Promise((resolve) => {
        AppleHealthKit.getStepCount(
            { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            (err: any, results: any) => {
                resolve(err ? 0 : results?.value || 0);
            }
        );
    });
};

const getIOSActiveCalories = (startDate: Date, endDate: Date): Promise<number> => {
    return new Promise((resolve) => {
        AppleHealthKit.getActiveEnergyBurned(
            { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            (err: any, results: any[]) => {
                const total = results?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;
                resolve(err ? 0 : total);
            }
        );
    });
};

const getIOSDistance = (startDate: Date, endDate: Date): Promise<number> => {
    return new Promise((resolve) => {
        AppleHealthKit.getDistanceWalkingRunning(
            { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            (err: any, results: any) => {
                resolve(err ? 0 : (results?.value || 0) * 1000); // Convert km to meters
            }
        );
    });
};

// Android Health Connect helpers
const getAndroidSteps = async (startDate: Date, endDate: Date): Promise<number> => {
    try {
        const result = await HealthConnect.readRecords('Steps', {
            timeRangeFilter: {
                operator: 'between',
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            },
        });
        return result.records.reduce((sum: number, r: any) => sum + (r.count || 0), 0);
    } catch {
        return 0;
    }
};

const getAndroidActiveCalories = async (startDate: Date, endDate: Date): Promise<number> => {
    try {
        const result = await HealthConnect.readRecords('ActiveCaloriesBurned', {
            timeRangeFilter: {
                operator: 'between',
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            },
        });
        return result.records.reduce((sum: number, r: any) => sum + (r.energy?.inKilocalories || 0), 0);
    } catch {
        return 0;
    }
};

const getAndroidDistance = async (startDate: Date, endDate: Date): Promise<number> => {
    try {
        const result = await HealthConnect.readRecords('Distance', {
            timeRangeFilter: {
                operator: 'between',
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            },
        });
        return result.records.reduce((sum: number, r: any) => sum + (r.distance?.inMeters || 0), 0);
    } catch {
        return 0;
    }
};
