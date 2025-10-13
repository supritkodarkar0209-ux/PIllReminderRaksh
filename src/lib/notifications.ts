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
    
    if (reminder.time.includes('AM') || reminder.time.includes('PM')) {
      // Parse 12-hour format with AM/PM
      const timeMatch = reminder.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3].toUpperCase();
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
      } else {
        throw new Error('Invalid time format');
      }
    } else {
      // Parse 24-hour format
      [hours, minutes] = reminder.time.split(':').map(Number);
    }
    
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
          body: `${reminder.pillName} - ${reminder.dosage}\nCompartment ${reminder.compartment}`,
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
            compartment: reminder.compartment,
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
