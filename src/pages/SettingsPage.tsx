import { useEffect, useState } from 'react';
import { Wifi, Settings as SettingsIcon, TestTube, Bell } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { getSettings, saveSettings } from '@/lib/storage';
import { testConnection, sendCompartmentCommand, testDisplayMessage } from '@/lib/esp32';
import { scheduleTestNotification } from '@/lib/notifications';
import type { AppSettings } from '@/types/reminder';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>({
    esp32Ip: '192.168.1.100',
    connectionType: 'http',
    notificationSound: true,
    vibration: true,
  });
  const [testing, setTesting] = useState(false);
  const [testingDisplay, setTestingDisplay] = useState(false);
  const [testingTftAlert, setTestingTftAlert] = useState(false);
  
  // Test TFT Display with medicine info
  const handleTestDisplayMessage = async () => {
    setTestingDisplay(true);
    try {
      const success = await testDisplayMessage(settings);
      if (success) {
        toast({
          title: "Display test sent",
          description: 'Sent test message "Hi from app" to compartment 1 on the TFT screen.',
        });
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error("Error testing TFT display:", error);
      toast({
        title: "Display test failed",
        description: "Could not send message to ESP32 display. Check IP and connection.",
        variant: "destructive",
      });
    } finally {
      setTestingDisplay(false);
    }
  };
  
  // Test TFT Alert with medication reminder
  const handleTestTftAlert = async () => {
    setTestingTftAlert(true);
    try {
      // Send test alert via compartment trigger
      const success = await sendCompartmentCommand(settings, 'A', 'ON');
      if (success) {
        toast({
          title: "Alert test sent",
          description: "Check the TFT display for the alert message and test LED/buzzer in compartment A.",
        });
        // Auto turn off after 3 seconds
        setTimeout(async () => {
          await sendCompartmentCommand(settings, 'A', 'TAKEN');
        }, 3000);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error("Error testing TFT alert:", error);
      toast({
        title: "Alert test failed",
        description: "Could not send alert to ESP32. Check IP and connection.",
        variant: "destructive",
      });
    } finally {
      setTestingTftAlert(false);
    }
  };
  
  

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
  };

  const handleSave = async () => {
    // Basic IP address validation to avoid invalid / unsafe values
    const ip = settings.esp32Ip.trim();
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      toast({
        title: "Invalid IP address",
        description: "Please enter a valid IPv4 address like 192.168.1.100",
        variant: "destructive",
      });
      return;
    }

    setSettings({ ...settings, esp32Ip: ip });
    await saveSettings(settings);
    toast({
      title: "Settings saved",
      description: "Your settings have been updated",
    });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const success = await testConnection(settings.esp32Ip);
    
    toast({
      title: success ? "Connection successful" : "Connection failed",
      description: success 
        ? "ESP32 is reachable" 
        : "Could not reach ESP32. Check IP address and network.",
      variant: success ? "default" : "destructive",
    });
    
    setTesting(false);
  };

  const handleTestCompartment = async (compartmentType: 'A' | 'B' | 'C' | 'D') => {
    const success = await sendCompartmentCommand(settings, compartmentType, 'ON');
    
    toast({
      title: success ? "Command sent" : "Command failed",
      description: success 
        ? `Triggered compartment ${compartmentType}` 
        : "Could not send command to ESP32",
      variant: success ? "default" : "destructive",
    });

    // Auto turn off after 3 seconds
    if (success) {
      setTimeout(async () => {
        await sendCompartmentCommand(settings, compartmentType, 'TAKEN');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary text-primary-foreground p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-sm opacity-90">Configure your pillbox system</p>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                ESP32 Connection
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="esp32Ip">ESP32 IP Address</Label>
                  <Input
                    id="esp32Ip"
                    value={settings.esp32Ip}
                    onChange={(e) => setSettings({ ...settings, esp32Ip: e.target.value })}
                    placeholder="192.168.1.100"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the IP address of your ESP32 device on your local network
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleTestConnection} 
                    disabled={testing}
                    variant="outline"
                    className="flex-1"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button onClick={handleSave} className="flex-1">
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Test TFT Display
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Send test messages to the ESP32 TFT display to confirm connection.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleTestDisplayMessage} 
              disabled={testingDisplay}
              className="w-full"
              variant="outline"
            >
              {testingDisplay ? "Testing..." : "Test Display Message"}
            </Button>
            
            <Button 
              onClick={handleTestTftAlert} 
              disabled={testingTftAlert}
              className="w-full"
            >
              {testingTftAlert ? "Testing..." : "Test Alert (with LED/Buzzer)"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound">Notification Sound</Label>
                <p className="text-xs text-muted-foreground">Play sound for reminders</p>
              </div>
              <Switch
                id="sound"
                checked={settings.notificationSound}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, notificationSound: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="vibration">Vibration</Label>
                <p className="text-xs text-muted-foreground">Vibrate on reminders</p>
              </div>
              <Switch
                id="vibration"
                checked={settings.vibration}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, vibration: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <Label htmlFor="test-notif">Test Notification</Label>
                <p className="text-xs text-muted-foreground">
                  Send a test reminder to phone + TFT display in 10 seconds
                </p>
              </div>
              <Button
                id="test-notif"
                size="sm"
                variant="outline"
                onClick={async () => {
                  await scheduleTestNotification();
                  // Also send test alert to TFT display
                  await handleTestTftAlert();
                  toast({
                    title: "Test scheduled",
                    description: "Check your phone and TFT display for the test notification.",
                  });
                }}
              >
                <Bell className="h-4 w-4 mr-1" />
                Send Test
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Compartments
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            Test LED and buzzer for each compartment
          </p>

          <div className="grid grid-cols-2 gap-3">
            {["A", "B", "C", "D"].map((type) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => handleTestCompartment(type as 'A' | 'B' | 'C' | 'D')}
                className="h-16"
              >
                Compartment {type}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-accent/50">
          <h3 className="text-sm font-semibold mb-2">About</h3>
          <p className="text-xs text-muted-foreground">
            Automated Pillbox App v1.0
            <br />
            ESP32 IoT Medication Reminder System
          </p>
        </Card>
      </div>

      <Navigation />
    </div>
  );
};

export default SettingsPage;
