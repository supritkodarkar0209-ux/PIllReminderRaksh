import type { AppSettings } from '@/types/reminder';

export const sendCompartmentCommand = async (
  settings: AppSettings,
  compartment: number,
  action: 'ON' | 'TAKEN' | 'MISSED'
): Promise<boolean> => {
  try {
    const url = `http://${settings.esp32Ip}/compartment?num=${compartment}&action=${action}`;
    console.log('Sending ESP32 command:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors', // ESP32 might not have CORS enabled
    });
    
    console.log('ESP32 response:', response.status);
    return true;
  } catch (error) {
    console.error('Error communicating with ESP32:', error);
    return false;
  }
};

export const testConnection = async (ip: string): Promise<boolean> => {
  try {
    const url = `http://${ip}/status`;
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};
