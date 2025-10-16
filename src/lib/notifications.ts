import { LocalNotifications } from '@capacitor/local-notifications';
import type { Reminder } from '@/types/reminder';

export const initializeNotifications = async () => {
  try {
    // Check if running on native platform (not web)
    const platform = (window as any).Capacitor?.getPlatform();
    if (!platform || platform === 'web') {
      console.log('Notifications are only available on native mobile devices');
      return false;
    }

    // Create notification channel for Android 8+ (API 26+)
    await LocalNotifications.createChannel({
      id: 'medicine-reminders',
      name: 'Medicine Reminders',
      description: 'Notifications for medicine intake reminders',
      importance: 5, // Maximum importance for Android 8-11
      visibility: 1,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: '#FF0000',
    });
    
    const permission = await LocalNotifications.requestPermissions();
    console.log('Notification permission:', permission);
    
    // For Android 8-11, also check for exact alarm permission
    if (permission.display === 'granted') {
      console.log('Notifications enabled and channel created');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

export const scheduleReminderNotification = async (reminder: Reminder) => {
  try {
    // Check if running on native platform
    const platform = (window as any).Capacitor?.getPlatform();
    if (!platform || platform === 'web') {
      console.log('Cannot schedule notifications on web - use a physical device');
      return;
    }

    // Parse the time (supports both 24hr format and with AM/PM)
    let hours: number, minutes: number;
    
    // Parse 24-hour format HH:mm
    [hours, minutes] = reminder.time.split(':').map(Number);
    
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime.getTime() <= now.getTime()) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: parseInt(reminder.id.replace(/\D/g, '').slice(0, 9)),
          title: "It's Time to take a pill!",
          body: `${reminder.pillName}${typeof reminder.tabletQuantity === 'number' && reminder.tabletQuantity > 0 ? ` - ${reminder.tabletQuantity} tablet${reminder.tabletQuantity > 1 ? 's' : ''}` : ''}\nCompartment ${reminder.compartmentType}\n${reminder.foodTiming === 'before' ? 'Take before food' : reminder.foodTiming === 'after' ? 'Take after food' : 'Take anytime'}`,
          schedule: { 
            at: scheduledTime, 
            repeats: true, 
            every: 'day',
            allowWhileIdle: true // Important for Android 8-11
          },
          sound: 'default',
          smallIcon: 'ic_stat_icon_config_sample',
          actionTypeId: 'MEDICINE_REMINDER',
          channelId: 'medicine-reminders',
          extra: {
            reminderId: reminder.id,
            compartmentType: reminder.compartmentType,
          },
        },
      ],
    });
    
    console.log('Notification scheduled for:', scheduledTime, 'Current time:', now);
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

export const cancelReminderNotification = async (reminderId: string) => {
  try {
    const id = parseInt(reminderId.replace(/\D/g, '').slice(0, 9));
    await LocalNotifications.cancel({ notifications: [{ id }] });
    console.log('Notification cancelled:', id);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
};
