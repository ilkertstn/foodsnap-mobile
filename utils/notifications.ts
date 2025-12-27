import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        // token = (await Notifications.getExpoPushTokenAsync()).data;
        // console.log(token);
    } else {
        // alert('Must use physical device for Push Notifications');
    }

    return token;
}

export async function scheduleWaterReminders(config: { start: string, end: string, interval: number }) {
    // Cancel existing water reminders to avoid duplicates
    await cancelReminders('water');

    // Parse start and end times (HH:mm)
    const startHour = parseInt(config.start.split(':')[0], 10);
    const endHour = parseInt(config.end.split(':')[0], 10);

    for (let hour = startHour; hour < endHour; hour += config.interval) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "💧 Time to Drink Water!",
                body: "Stay hydrated to reach your daily goal.",
                data: { type: 'water' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: hour,
                minute: 0,
                repeats: true,
            },
        });
    }
}

export async function scheduleMealReminders(times: { breakfast: string, lunch: string, dinner: string }) {
    // Cancel existing meal reminders
    await cancelReminders('meal');

    const meals = [
        { title: "Breakfast Time! 🍳", body: "Don't forget to log your breakfast.", time: times.breakfast },
        { title: "Lunch Time! 🥗", body: "Time for a healthy lunch.", time: times.lunch },
        { title: "Dinner Time! 🍽️", body: "Enjoy your dinner and log it.", time: times.dinner },
    ];

    for (const meal of meals) {
        const [hour, minute] = meal.time.split(':').map(Number);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: meal.title,
                body: meal.body,
                data: { type: 'meal' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: hour,
                minute: minute,
                repeats: true,
            },
        });
    }
}

export async function cancelReminders(type: 'water' | 'meal' | 'all') {
    if (type === 'all') {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } else {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const item of scheduled) {
            if (item.content.data?.type === type) {
                await Notifications.cancelScheduledNotificationAsync(item.identifier);
            }
        }
    }
}
