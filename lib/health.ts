
import { Platform } from 'react-native';

// Types
export interface HealthData {
    steps: number;
    activeCalories: number;
    distance: number; // in meters
    sleepMinutes: number;
    heartRate: number; // avg bpm
}

export interface HealthPermissionStatus {
    isAvailable: boolean;
    isAuthorized: boolean;
}

// Lazy imports to avoid errors on unsupported platforms
let AppleHealthKit: any = null;
let HealthConnect: any = null;

// Initialize platform-specific health module
import { NativeModules } from 'react-native';

const initHealthModule = () => {
    if (Platform.OS === 'ios') {
        try {
            const pkg = require('react-native-health');
            AppleHealthKit = pkg.default || pkg;

            // Fallback to NativeModules if wrapper is empty (bridging issue)
            if ((!AppleHealthKit || !AppleHealthKit.isAvailable) && NativeModules.AppleHealthKit) {
                AppleHealthKit = NativeModules.AppleHealthKit;
            }
        } catch (e) {
            console.warn('HealthKit load error:', e);
        }
    } else if (Platform.OS === 'android') {
        try {
            const pkg = require('react-native-health-connect');
            HealthConnect = pkg.default || pkg;
        } catch (e) {
            console.warn('Health Connect not available');
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
        // Check if method exists (it might be missing in Expo Go or if native linking failed)
        if (typeof AppleHealthKit.isAvailable !== 'function') {
            console.warn('HealthKit native module is missing (expected in Expo Go). Falling back to Demo Mode.');
            return false;
        }

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
        // Check if Constants are available
        const Constants = AppleHealthKit.Constants || (AppleHealthKit.default ? AppleHealthKit.default.Constants : undefined);

        if (!Constants || !Constants.Permissions) {
            console.error('HealthKit Constants not found:', AppleHealthKit);
            alert(`HealthKit Error: Constants not found. Keys: ${Object.keys(AppleHealthKit).join(',')}`);
            return false;
        }

        const permissions = {
            permissions: {
                read: [
                    Constants.Permissions.StepCount,
                    Constants.Permissions.ActiveEnergyBurned,
                    Constants.Permissions.DistanceWalkingRunning,
                    Constants.Permissions.SleepAnalysis,
                    Constants.Permissions.HeartRate,
                ],
                write: [],
            },
        };

        return new Promise((resolve) => {
            AppleHealthKit.initHealthKit(permissions, (err: any) => {
                if (err) {
                    console.error('initHealthKit error', err);
                    alert(`initHealthKit Error: ${JSON.stringify(err)}`);
                }
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
                { accessType: 'read', recordType: 'SleepSession' },
                { accessType: 'read', recordType: 'HeartRate' },
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
    const defaultData: HealthData = { steps: 0, activeCalories: 0, distance: 0, sleepMinutes: 0, heartRate: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    if (Platform.OS === 'ios' && AppleHealthKit) {
        try {
            const [steps, calories, distance, sleep, heartRate] = await Promise.all([
                getIOSStepCount(today, now),
                getIOSActiveCalories(today, now),
                getIOSDistance(today, now),
                getIOSSleep(today, now),
                getIOSHeartRate(today, now),
            ]);
            return { steps, activeCalories: calories, distance, sleepMinutes: sleep, heartRate };
        } catch (e) {
            console.error('Error fetching HealthKit data', e);
            return defaultData;
        }
    } else if (Platform.OS === 'android' && HealthConnect) {
        try {
            const [steps, calories, distance, sleep, heartRate] = await Promise.all([
                getAndroidSteps(today, now),
                getAndroidActiveCalories(today, now),
                getAndroidDistance(today, now),
                getAndroidSleep(today, now),
                getAndroidHeartRate(today, now),
            ]);
            return { steps, activeCalories: calories, distance, sleepMinutes: sleep, heartRate };
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

const getAndroidSleep = async (startDate: Date, endDate: Date): Promise<number> => {
    try {
        const result = await HealthConnect.readRecords('SleepSession', {
            timeRangeFilter: {
                operator: 'between',
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            },
        });

        // Sum duration of all sleep sessions in minutes
        const totalDurationSeconds = result.records.reduce((sum: number, r: any) => {
            const start = new Date(r.startTime).getTime();
            const end = new Date(r.endTime).getTime();
            return sum + ((end - start) / 1000);
        }, 0);

        return Math.floor(totalDurationSeconds / 60);
    } catch {
        return 0;
    }
};

const getAndroidHeartRate = async (startDate: Date, endDate: Date): Promise<number> => {
    try {
        const result = await HealthConnect.readRecords('HeartRate', {
            timeRangeFilter: {
                operator: 'between',
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
            },
        });

        if (!result.records || result.records.length === 0) return 0;

        // Calculate average BPM from all samples
        let totalBpm = 0;
        let count = 0;

        result.records.forEach((r: any) => {
            r.samples.forEach((s: any) => {
                totalBpm += s.beatsPerMinute;
                count++;
            });
        });

        return count > 0 ? Math.round(totalBpm / count) : 0;
    } catch {
        return 0;
    }
};

// -- iOS Helpers for Sleep & HR --

const getIOSSleep = (startDate: Date, endDate: Date): Promise<number> => {
    return new Promise((resolve) => {
        AppleHealthKit.getSleepSamples(
            { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            (err: any, results: any[]) => {
                if (err || !results) {
                    resolve(0);
                    return;
                }
                // Filter for ASLEEP samples
                const asleepSamples = results.filter(r => r.value === 'ASLEEP' || r.value === 'INBED');
                const totalMinutes = asleepSamples.reduce((sum, r) => {
                    const start = new Date(r.startDate).getTime();
                    const end = new Date(r.endDate).getTime();
                    return sum + ((end - start) / 1000 / 60);
                }, 0);
                resolve(Math.round(totalMinutes));
            }
        );
    });
};

const getIOSHeartRate = (startDate: Date, endDate: Date): Promise<number> => {
    return new Promise((resolve) => {
        AppleHealthKit.getHeartRateSamples(
            { startDate: startDate.toISOString(), endDate: endDate.toISOString(), limit: 100 },
            (err: any, results: any[]) => {
                if (err || !results || results.length === 0) {
                    resolve(0);
                    return;
                }
                // Average of recent samples
                const total = results.reduce((sum, r) => sum + r.value, 0);
                resolve(Math.round(total / results.length));
            }
        );
    });
};
