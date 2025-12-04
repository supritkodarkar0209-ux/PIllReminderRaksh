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
    const tablets =
      typeof (reminder as any).tabletQuantity === 'number'
        ? (reminder as any).tabletQuantity
        : 0;

    const compartments = Array.isArray(reminder.compartmentType)
      ? reminder.compartmentType
      : [reminder.compartmentType];

    // ESP32 TFT firmware expects /update?compartment=X&name=...&dosage=...&time=...
    const requests = compartments.map((compartment) => {
      const compartmentNum = compartment.charCodeAt(0) - 65 + 1; // A=1, B=2...
      const dosageText =
        tablets > 0
          ? `${tablets} tablet${tablets > 1 ? 's' : ''}`
          : '-';

      const url = `http://${settings.esp32Ip}/update?compartment=${compartmentNum}&name=${encodeURIComponent(
        reminder.pillName
      )}&dosage=${encodeURIComponent(dosageText)}&time=${encodeURIComponent(
        reminder.time
      )}`;

      console.log('Updating ESP32 TFT display:', url);

      return fetchWithTimeout(url, {
        method: 'GET',
        mode: 'no-cors',
        timeoutMs: 1500,
      });
    });

    await Promise.allSettled(requests);
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
    // The TFT sketch already updates the display when /compartment?action=TAKEN is called.
    // We keep this function for API compatibility but do not need an extra HTTP call.
    console.log('notifyTftPillTaken: handled via /compartment TAKEN action');
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

export const testDisplayMessage = async (
  settings: AppSettings
): Promise<boolean> => {
  try {
    const url = `http://${settings.esp32Ip}/update?compartment=1&name=${encodeURIComponent(
      "Hi from app"
    )}&dosage=${encodeURIComponent("Test message")}&time=${encodeURIComponent(
      "--:--"
    )}`;
    console.log("Testing TFT display via:", url);

    await fetchWithTimeout(url, {
      method: "GET",
      mode: "no-cors",
      timeoutMs: 1500,
    });

    return true;
  } catch (error) {
    console.error("Error testing TFT display:", error);
    return false;
  }
};

export const syncTimeWithEsp32 = async (
  settings: AppSettings
): Promise<boolean> => {
  try {
    const currentTimestampMs = Date.now();
    const url = `http://${settings.esp32Ip}/sync-time?timestamp=${currentTimestampMs}`;
    
    console.log('Syncing time with ESP32:', url);
    
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      mode: 'no-cors',
      timeoutMs: 1500,
    });
    
    console.log('Time sync response:', response.status);
    return true;
  } catch (error) {
    console.error('Error syncing time with ESP32:', error);
    return false;
  }
};

