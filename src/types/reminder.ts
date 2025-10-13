export interface Reminder {
  id: string;
  pillName: string;
  dosage: string;
  compartment: number;
  time: string;
  enabled: boolean;
  createdAt: number;
}

export interface DoseLog {
  id: string;
  reminderId: string;
  pillName: string;
  compartment: number;
  scheduledTime: string;
  takenTime: number;
  status: 'taken' | 'missed';
}

export interface AppSettings {
  esp32Ip: string;
  connectionType: 'http' | 'mqtt';
  notificationSound: boolean;
  vibration: boolean;
}
