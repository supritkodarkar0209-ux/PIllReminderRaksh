import type { AppSettings, Reminder } from '@/types/reminder';

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
) => {
  const { timeoutMs = 1500, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
};

export const sendCompartmentCommand = async (
  settings: AppSettings,
  compartmentType: 'A' | 'B' | 'C' | 'D',
  action: 'ON' | 'TAKEN' | 'MISSED' | 'BUZZER'
): Promise<boolean> => {
  try {
    const compartmentNum = compartmentType.charCodeAt(0) - 65 + 1; // A=1, B=2, C=3, D=4
    const url = `http://${settings.esp32Ip}/compartment?type=${compartmentType}&num=${compartmentNum}&action=${action}`;
    console.log('Sending ESP32 command:', url);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      mode: 'no-cors',
      timeoutMs: 1500,
    });
    
    console.log('ESP32 response:', response.status);
    return true;
  } catch (error) {
    console.error('Error communicating with ESP32:', error);
    return false;
  }
};

export const sendMultipleCompartmentCommand = async (
  settings: AppSettings,
  compartmentTypes: ('A' | 'B' | 'C' | 'D')[],
  action: 'ON' | 'TAKEN' | 'MISSED' | 'BUZZER'
): Promise<boolean> => {
  try {
    const promises = compartmentTypes.map(compartmentType => 
      sendCompartmentCommand(settings, compartmentType, action)
    );
    
    const results = await Promise.all(promises);
    return results.every(result => result);
  } catch (error) {
    console.error('Error sending multiple compartment commands:', error);
    return false;
  }
};

export const updateDisplayInfo = async (
  settings: AppSettings,
  reminder: Reminder
): Promise<boolean> => {
  try {
    const tablets = typeof (reminder as any).tabletQuantity === 'number' ? (reminder as any).tabletQuantity : 0;
    const compartments = Array.isArray(reminder.compartmentType) 
      ? reminder.compartmentType.join(',') 
      : reminder.compartmentType;
    
    const url = `http://${settings.esp32Ip}/tft/reminder?compartment=${compartments}&name=${encodeURIComponent(reminder.pillName)}&tablets=${tablets}&timing=${reminder.foodTiming}&time=${encodeURIComponent(reminder.time)}`;
    console.log('Updating ESP32 TFT display:', url);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      mode: 'no-cors',
      timeoutMs: 1500,
    });
    
    console.log('ESP32 TFT display updated:', response.status);
    return true;
  } catch (error) {
    console.error('Error updating ESP32 TFT display:', error);
    return false;
  }
};

export const sendBuzzerCommand = async (
  settings: AppSettings,
  compartmentType: 'A' | 'B' | 'C' | 'D'
): Promise<boolean> => {
  try {
    const url = `http://${settings.esp32Ip}/buzzer?compartment=${compartmentType}&status=taken`;
    console.log('Sending buzzer command:', url);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      mode: 'no-cors',
      timeoutMs: 1500,
    });
    
    console.log('Buzzer command sent:', response.status);
    return true;
  } catch (error) {
    console.error('Error sending buzzer command:', error);
    return false;
  }
};

export const sendMultipleBuzzerCommand = async (
  settings: AppSettings,
  compartmentTypes: ('A' | 'B' | 'C' | 'D')[]
): Promise<boolean> => {
  try {
    const promises = compartmentTypes.map(compartmentType => 
      sendBuzzerCommand(settings, compartmentType)
    );
    
    const results = await Promise.all(promises);
    return results.every(result => result);
  } catch (error) {
    console.error('Error sending multiple buzzer commands:', error);
    return false;
  }
};

export const notifyTftPillTaken = async (
  settings: AppSettings,
  reminder: Reminder
): Promise<boolean> => {
  try {
    const tablets = typeof (reminder as any).tabletQuantity === 'number' ? (reminder as any).tabletQuantity : 0;
    const compartments = Array.isArray(reminder.compartmentType) 
      ? reminder.compartmentType.join(',') 
      : reminder.compartmentType;
    
    const url = `http://${settings.esp32Ip}/tft/taken?compartment=${compartments}&name=${encodeURIComponent(reminder.pillName)}&tablets=${tablets}&timing=${reminder.foodTiming}&time=${encodeURIComponent(reminder.time)}&message=${encodeURIComponent('Pill has been taken')}`;
    console.log('Notify TFT pill taken:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
    });
    
    console.log('TFT pill taken notification sent:', response.status);
    return true;
  } catch (error) {
    console.error('Error notifying TFT pill taken:', error);
    return false;
  }
};

export const checkBuzzerStatus = async (
  settings: AppSettings
): Promise<{compartmentType: 'A' | 'B' | 'C' | 'D' | null, status: 'taken' | 'idle'}> => {
  try {
    const url = `http://${settings.esp32Ip}/buzzer/status`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      mode: 'cors',
      timeoutMs: 1500,
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
    
    return { compartmentType: null, status: 'idle' };
  } catch (error) {
    console.error('Error checking buzzer status:', error);
    return { compartmentType: null, status: 'idle' };
  }
};

export const testConnection = async (ip: string): Promise<boolean> => {
  try {
    const url = `http://${ip}/status`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      mode: 'no-cors',
      timeoutMs: 1500,
    });
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

