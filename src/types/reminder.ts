export interface Reminder {
  id: string;
  pillName: string;
  tabletQuantity?: number;
  compartmentType: 'A' | 'B' | 'C' | 'D';
  time: string;
  foodTiming: 'before' | 'after' | 'anytime';
  enabled: boolean;
  createdAt: number;
}

export interface DoseLog {
  id: string;
  reminderId: string;
  pillName: string;
  tabletQuantity?: number;
  compartmentType: 'A' | 'B' | 'C' | 'D';
  foodTiming: 'before' | 'after' | 'anytime';
  scheduledTime: string;
  takenTime: number;
  status: 'taken' | 'missed';
  takenBy: 'user' | 'buzzer';
}

export interface AppSettings {
  esp32Ip: string;
  connectionType: 'http' | 'mqtt';
  notificationSound: boolean;
  vibration: boolean;
}
