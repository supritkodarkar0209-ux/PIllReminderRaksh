# Automated Pillbox App - Installation Guide

## 📱 Android App Installation

### Method 1: Build APK from this project

1. **Transfer to GitHub**
   - Click "Export to Github" button in Lovable
   - Clone the repository to your local machine

2. **Install Dependencies**
   ```bash
   git clone <your-repo-url>
   cd <your-project>
   npm install
   ```

3. **Add Capacitor Android Platform**
   ```bash
   npx cap add android
   ```

4. **Build the Web App**
   ```bash
   npm run build
   ```

5. **Sync with Android**
   ```bash
   npx cap sync android
   ```

6. **Build APK**
   - Option A: Using Android Studio
     ```bash
     npx cap open android
     ```
     - In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   
   - Option B: Using Gradle (command line)
     ```bash
     cd android
     ./gradlew assembleDebug
     ```
     - APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

7. **Install on Android Device**
   - Transfer the APK to your phone
   - Enable "Install from Unknown Sources" in Settings
   - Tap the APK file to install

### Method 2: Direct Install (Development)

```bash
# After completing steps 1-5 above
npx cap run android
```

This will install and run the app directly on a connected device or emulator.

---

## 🔧 ESP32 Setup

### Hardware Requirements
- ESP32 development board
- 4 LEDs (any color)
- 4 Buzzers (5V)
- Resistors: 220Ω for LEDs, 100Ω for buzzers
- Breadboard and jumper wires

### Wiring Diagram
```
ESP32 Pin 2  → LED 1 → 220Ω → GND
ESP32 Pin 4  → LED 2 → 220Ω → GND
ESP32 Pin 5  → LED 3 → 220Ω → GND
ESP32 Pin 18 → LED 4 → 220Ω → GND

ESP32 Pin 15 → Buzzer 1 (+) → GND (-)
ESP32 Pin 16 → Buzzer 2 (+) → GND (-)
ESP32 Pin 17 → Buzzer 3 (+) → GND (-)
ESP32 Pin 19 → Buzzer 4 (+) → GND (-)
```

### Software Setup

1. **Install Arduino IDE**
   - Download from: https://www.arduino.cc/en/software

2. **Install ESP32 Board Support**
   - Open Arduino IDE
   - Go to File > Preferences
   - Add this URL to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to Tools > Board > Boards Manager
   - Search "ESP32" and install "esp32 by Espressif Systems"

3. **Upload ESP32 Code**
   - Open `ESP32_Arduino_Code.ino`
   - Update WiFi credentials:
     ```cpp
     const char* ssid = "YOUR_WIFI_SSID";
     const char* password = "YOUR_WIFI_PASSWORD";
     ```
   - Select board: Tools > Board > ESP32 Arduino > ESP32 Dev Module
   - Select port: Tools > Port > (your ESP32 port)
   - Click Upload button
   - Open Serial Monitor (115200 baud) to see the IP address

4. **Note the IP Address**
   - The ESP32 will print its IP address in the Serial Monitor
   - Example: `192.168.1.100`
   - You'll need this for the Android app

---

## 🚀 First Time Setup

### 1. Configure ESP32 Connection
1. Open the Automated Pillbox app
2. Go to Settings tab
3. Enter your ESP32 IP address
4. Tap "Test Connection" to verify
5. Tap "Save Settings"

### 2. Test Compartments
1. In Settings, scroll to "Test Compartments"
2. Tap each compartment button to test LED and buzzer
3. Verify all hardware is working

### 3. Add Your First Reminder
1. Go to Home tab
2. Tap "Add New" or use the + icon
3. Fill in:
   - Medicine name (e.g., "Aspirin")
   - Dosage (e.g., "500mg")
   - Compartment number (1-4)
   - Time (e.g., "08:00")
4. Tap "Add Reminder"

### 4. Enable Notifications
- When prompted, allow notifications
- This is required for medicine reminders to work

---

## 📋 How It Works

1. **At reminder time:**
   - App sends HTTP command to ESP32: `http://YOUR_ESP32_IP/compartment?num=1&action=ON`
   - ESP32 lights up the LED and buzzer for that compartment
   - App shows notification on your phone

2. **When you confirm:**
   - If you tap "Yes, I Took It":
     - App sends: `http://YOUR_ESP32_IP/compartment?num=1&action=TAKEN`
     - ESP32 turns off LED and buzzer
     - App logs it as "taken"
   
   - If you tap "No, I Missed It":
     - App sends: `http://YOUR_ESP32_IP/compartment?num=1&action=MISSED`
     - ESP32 turns off LED and buzzer
     - App logs it as "missed"

3. **View History:**
   - Go to History tab to see all taken/missed doses
   - Track your medication adherence percentage

---

## 🐛 Troubleshooting

### App Issues

**"Connection failed" when testing ESP32**
- Verify ESP32 is powered on and connected to WiFi
- Check IP address is correct
- Ensure phone and ESP32 are on same WiFi network
- Try pinging the IP from another device

**Notifications not appearing**
- Check app has notification permission (Settings > Apps > Automated Pillbox > Permissions)
- Disable battery optimization for the app
- Ensure "Do Not Disturb" is not blocking notifications

**Reminders not triggering**
- Verify reminder is enabled (toggle should be ON)
- Check system time is correct
- Keep app running in background

### ESP32 Issues

**ESP32 not connecting to WiFi**
- Double-check SSID and password in code
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Try moving ESP32 closer to router

**LEDs/Buzzers not working**
- Verify wiring matches the pin diagram
- Test with a simple blink sketch first
- Check component polarity

**Serial Monitor shows "brownout detector"**
- Use a better power supply (2A recommended)
- Add a 100µF capacitor across power pins

---

## 🔐 Network Security Notes

- This system uses HTTP (not HTTPS) for local network communication
- Only use on your private home WiFi network
- The ESP32 IP address is local and not accessible from internet
- For production use, consider implementing:
  - HTTPS encryption
  - Authentication tokens
  - MQTT with credentials

---

## 📝 Project Files

- `src/` - React/TypeScript app source code
- `ESP32_Arduino_Code.ino` - ESP32 web server code
- `capacitor.config.ts` - Capacitor configuration
- `android/` - Native Android project (after `npx cap add android`)

---

## 🎓 Demo & Testing

### Quick Demo Mode (Without ESP32)
1. Use the app without ESP32 hardware
2. Set reminders and test notifications
3. The app will still log history even if ESP32 isn't connected
4. Use "Test" buttons on home screen to see confirmation dialogs

### Live Demo with ESP32
1. Set a reminder for 1 minute from now
2. Wait for notification
3. Watch ESP32 LED/buzzer activate
4. Confirm medicine taken in app
5. Verify ESP32 turns off LED/buzzer
6. Check history shows "taken" status

---

## 💡 Enhancement Ideas

### Hardware
- Add servo motors to open compartments automatically
- LCD display to show medicine name and time
- Real-time clock module for accurate timekeeping
- SD card for offline logging

### Software
- Multiple daily reminders per medicine
- Recurring schedules (every other day, weekly, etc.)
- Medicine inventory tracking
- Caregiver notifications
- Cloud sync for multiple devices
- Voice reminders
- Integration with health apps

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review ESP32 Serial Monitor output
3. Enable browser console in app (for debugging)

---

**Made with ❤️ for IoT Healthcare Projects**
