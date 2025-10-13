import { Preferences } from '@capacitor/preferences';
import type { Reminder, DoseLog, AppSettings } from '@/types/reminder';

const KEYS = {
  REMINDERS: 'pillbox_reminders',
  LOGS: 'pillbox_logs',
  SETTINGS: 'pillbox_settings',
};

// Reminders
export const getReminders = async (): Promise<Reminder[]> => {
  const { value } = await Preferences.get({ key: KEYS.REMINDERS });
  return value ? JSON.parse(value) : [];
};

export const saveReminders = async (reminders: Reminder[]): Promise<void> => {
  await Preferences.set({
    key: KEYS.REMINDERS,
    value: JSON.stringify(reminders),
  });
};

export const addReminder = async (reminder: Reminder): Promise<void> => {
  const reminders = await getReminders();
  reminders.push(reminder);
  await saveReminders(reminders);
};

export const updateReminder = async (id: string, updates: Partial<Reminder>): Promise<void> => {
  const reminders = await getReminders();
  const index = reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    reminders[index] = { ...reminders[index], ...updates };
    await saveReminders(reminders);
  }
};

export const deleteReminder = async (id: string): Promise<void> => {
  const reminders = await getReminders();
  const filtered = reminders.filter(r => r.id !== id);
  await saveReminders(filtered);
};

// Dose Logs
export const getDoseLogs = async (): Promise<DoseLog[]> => {
  const { value } = await Preferences.get({ key: KEYS.LOGS });
  return value ? JSON.parse(value) : [];
};

export const saveDoseLogs = async (logs: DoseLog[]): Promise<void> => {
  await Preferences.set({
    key: KEYS.LOGS,
    value: JSON.stringify(logs),
  });
};

export const addDoseLog = async (log: DoseLog): Promise<void> => {
  const logs = await getDoseLogs();
  logs.unshift(log);
  await saveDoseLogs(logs);
};

export const clearDoseLogs = async (): Promise<void> => {
  await saveDoseLogs([]);
};

// Settings
export const getSettings = async (): Promise<AppSettings> => {
  const { value } = await Preferences.get({ key: KEYS.SETTINGS });
  return value ? JSON.parse(value) : {
    esp32Ip: '192.168.1.100',
    connectionType: 'http',
    notificationSound: true,
    vibration: true,
  };
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  await Preferences.set({
    key: KEYS.SETTINGS,
    value: JSON.stringify(settings),
  });
};
