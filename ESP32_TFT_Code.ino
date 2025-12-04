/*
 * Automated Pillbox with TFT Display - ESP32
 * This code controls LEDs, buzzers, and displays medicine information on a 2.4" TFT screen
 * Compatible with ILI9341 TFT displays
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <RTClib.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// TFT Display pins (adjust based on your wiring)
#define TFT_CS   5
#define TFT_DC   4
#define TFT_RST  2
#define TFT_MOSI 23
#define TFT_CLK  18

// Initialize TFT display
Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

// RTC (DS3231)
RTC_DS3231 rtc;

// LED and Buzzer pins for 4 compartments
const int ledPins[4] = {12, 13, 14, 15};
const int buzzerPins[4] = {16, 17, 25, 26};

/*
  ESP32 Pillbox - SPI TFT version
  - Uses Adafruit_ILI9341 in SPI mode (fewer wires)
  - RTC (DS3231) for scheduled reminders
  - Web server endpoints for Android app integration:
      /update?compartment=X&name=...&dosage=...&time=HH:MM
      /compartment?num=X&action=ON|TAKEN|MISSED
      /sync-time?timestamp=UNIX_MS
      /status

  Wiring (recommended SPI wiring):
    TFT_CS   -> GPIO 5
    TFT_DC   -> GPIO 4
    TFT_RST  -> GPIO 2
    TFT_MOSI -> GPIO 23
    TFT_SCLK -> GPIO 18
    (MISO not required for display)

    RTC (DS3231): SDA -> GPIO 21, SCL -> GPIO 22

    LEDs (compartments A-D): GPIO 12, 13, 14, 15
    Buzzers (compartments A-D): GPIO 16, 17, 25, 26

  Update WiFi credentials below before uploading.
*/

#include <WiFi.h>
#include <WebServer.h>
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <Wire.h>
#include <RTClib.h>

// WiFi credentials - set these before uploading
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// TFT SPI pins
#define TFT_CS   5
#define TFT_DC   4
#define TFT_RST  2

// Initialize Adafruit ILI9341 (SPI)
Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

// RTC (DS3231)
RTC_DS3231 rtc;

// Web server
WebServer server(80);

// Safe pin assignments (avoid SPI and I2C pins)
const int ledPins[4] = {12, 13, 14, 15};
const int buzzerPins[4] = {16, 17, 25, 26};

struct MedicineInfo {
  String name;
  String dosage;
  String time; // "HH:MM"
  bool active;
  bool triggeredToday;
  uint8_t lastTriggerDay;
};

MedicineInfo medicines[4];

void displayMedicineList();
void displayAlert(int compartment);
void checkScheduledReminders();

void setup() {
  Serial.begin(115200);
  delay(500);

  // Initialize pins
  for (int i = 0; i < 4; i++) {
    pinMode(ledPins[i], OUTPUT);
    pinMode(buzzerPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
    digitalWrite(buzzerPins[i], LOW);

    medicines[i].name = "Empty";
    medicines[i].dosage = "-";
    medicines[i].time = "-";
    medicines[i].active = false;
    medicines[i].triggeredToday = false;
    medicines[i].lastTriggerDay = 0;
  }

  // Initialize display
  tft.begin();
  tft.setRotation(1);
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 10);
  tft.println("Pillbox Initializing...");

  // Initialize RTC
  Wire.begin();
  if (!rtc.begin()) {
    Serial.println("RTC not found");
    tft.setCursor(20, 40);
    tft.setTextSize(1);
    tft.setTextColor(ILI9341_YELLOW);
    tft.println("RTC not found");
  } else {
    if (rtc.lostPower()) {
      Serial.println("RTC lost power, set time via app sync-time");
      tft.setCursor(20, 40);
      tft.setTextSize(1);
      tft.setTextColor(ILI9341_YELLOW);
      tft.println("RTC lost power - sync time");
    }
  }

  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  tft.setCursor(20, 60);
  tft.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 20000) {
    delay(500);
    Serial.print('.');
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
    tft.fillScreen(ILI9341_BLACK);
    tft.setCursor(20, 10);
    tft.setTextSize(2);
    tft.setTextColor(ILI9341_GREEN);
    tft.println("WiFi Connected!");
    tft.setTextColor(ILI9341_WHITE);
    tft.setCursor(20, 40);
    tft.print("IP: ");
    tft.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connect failed - starting AP");
    WiFi.mode(WIFI_AP);
    WiFi.softAP("Pillbox-Setup", "12345678");
    IPAddress apIp = WiFi.softAPIP();
    tft.fillScreen(ILI9341_BLACK);
    tft.setTextColor(ILI9341_YELLOW);
    tft.setCursor(20, 40);
    tft.println("AP Ready - connect to Pillbox-Setup");
    tft.setCursor(20, 60);
    tft.print("AP IP: ");
    tft.println(apIp);
  }

  // Web server routes
  server.on("/", [](){ server.send(200, "text/plain", "ESP32 Pillbox"); });
  server.on("/compartment", [](){
    if (!server.hasArg("num") || !server.hasArg("action")) {
      server.send(400, "text/plain", "Missing parameters");
      return;
    }
    int compartment = server.arg("num").toInt() - 1;
    String action = server.arg("action");
    if (compartment < 0 || compartment > 3) {
      server.send(400, "text/plain", "Invalid compartment");
      return;
    }
    if (action == "ON") {
      digitalWrite(ledPins[compartment], HIGH);
      digitalWrite(buzzerPins[compartment], HIGH);
      medicines[compartment].active = true;
      displayAlert(compartment);
      server.send(200, "text/plain", "OK");
    } else if (action == "TAKEN") {
      digitalWrite(ledPins[compartment], LOW);
      digitalWrite(buzzerPins[compartment], LOW);
      medicines[compartment].active = false;
      displayMedicineList();
      server.send(200, "text/plain", "OK");
    } else if (action == "MISSED") {
      digitalWrite(ledPins[compartment], LOW);
      digitalWrite(buzzerPins[compartment], LOW);
      medicines[compartment].active = false;
      displayMedicineList();
      server.send(200, "text/plain", "OK");
    } else {
      server.send(400, "text/plain", "Invalid action");
    }
  });

  server.on("/update", [](){
    if (!server.hasArg("compartment") || !server.hasArg("name")) {
      server.send(400, "text/plain", "Missing parameters");
      return;
    }
    int compartment = server.arg("compartment").toInt() - 1;
    if (compartment < 0 || compartment > 3) {
      server.send(400, "text/plain", "Invalid compartment");
      return;
    }
    medicines[compartment].name = server.arg("name");
    medicines[compartment].dosage = server.hasArg("dosage") ? server.arg("dosage") : "-";
    medicines[compartment].time = server.hasArg("time") ? server.arg("time") : "-";
    medicines[compartment].active = true;
    Serial.print("Updated compartment "); Serial.println(compartment + 1);
    displayMedicineList();
    server.send(200, "text/plain", "Display updated");
  });

  server.on("/sync-time", [](){
    if (!server.hasArg("timestamp")) {
      server.send(400, "text/plain", "Missing timestamp");
      return;
    }
    uint64_t ts = server.arg("timestamp").toInt();
    if (ts == 0) {
      server.send(400, "text/plain", "Invalid timestamp");
      return;
    }
    uint32_t seconds = ts / 1000;
    if (rtc.begin()) {
      rtc.adjust(DateTime(seconds));
      displayMedicineList();
      server.send(200, "application/json", "{\"status\":\"time_synced\"}");
    } else {
      server.send(500, "text/plain", "RTC not available");
    }
  });

  server.on("/status", [](){
    String json = "{\"status\":\"online\",\"ip\":\"" + WiFi.localIP().toString() + "\"}";
    server.send(200, "application/json", json);
  });

  server.onNotFound([](){ server.send(404, "text/plain", "Not Found"); });

  server.begin();
  Serial.println("HTTP server started");

  // Initial display
  displayMedicineList();
}

void loop() {
  server.handleClient();
  checkScheduledReminders();
}

void checkScheduledReminders() {
  if (!rtc.begin()) return;
  DateTime now = rtc.now();
  uint8_t day = now.day();
  char buf[6];
  snprintf(buf, sizeof(buf), "%02d:%02d", now.hour(), now.minute());
  String currentTime = String(buf);
  for (int i = 0; i < 4; i++) {
    if (!medicines[i].active) continue;
    if (medicines[i].time == "-" || medicines[i].time.length() < 4) continue;
    if (medicines[i].lastTriggerDay != day) medicines[i].triggeredToday = false;
    if (!medicines[i].triggeredToday && medicines[i].time == currentTime) {
      Serial.print("RTC trigger compartment "); Serial.println(i + 1);
      digitalWrite(ledPins[i], HIGH);
      digitalWrite(buzzerPins[i], HIGH);
      displayAlert(i);
      medicines[i].triggeredToday = true;
      medicines[i].lastTriggerDay = day;
    }
  }
}

void displayMedicineList() {
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_CYAN);
  tft.setCursor(60, 10);
  tft.println("MEDICINE SCHEDULE");
  if (rtc.begin()) {
    DateTime now = rtc.now();
    char buf[9];
    snprintf(buf, sizeof(buf), "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
    tft.setTextSize(1);
    tft.setTextColor(ILI9341_WHITE);
    tft.setCursor(200, 10);
    tft.print("Time ");
    tft.println(buf);
  }
  tft.drawLine(0, 35, 320, 35, ILI9341_WHITE);
  int yPos = 50;
  for (int i = 0; i < 4; i++) {
    tft.setTextSize(1);
    tft.setTextColor(ILI9341_YELLOW);
    tft.setCursor(10, yPos);
    tft.print("Compartment "); tft.print(i + 1);
    tft.setTextColor(medicines[i].active ? ILI9341_GREEN : ILI9341_WHITE);
    tft.setCursor(10, yPos + 15);
    tft.print("Med: "); tft.println(medicines[i].name);
    tft.setCursor(10, yPos + 30);
    tft.print("Dose: "); tft.println(medicines[i].dosage);
    tft.setCursor(180, yPos + 30);
    tft.print("Time: "); tft.println(medicines[i].time);
    if (i < 3) tft.drawLine(0, yPos + 45, 320, yPos + 45, ILI9341_DARKGREY);
    yPos += 50;
  }
}

void displayAlert(int compartment) {
  tft.fillScreen(ILI9341_RED);
  tft.setTextSize(3);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(40, 40);
  tft.println("TIME TO TAKE");
  tft.setTextSize(4);
  tft.setCursor(60, 90);
  tft.println("MEDICINE!");
  tft.setTextSize(2);
  tft.setCursor(20, 140);
  tft.print("Compartment: "); tft.println(compartment + 1);
  tft.setCursor(20, 170);
  tft.println(medicines[compartment].name);
  tft.setCursor(20, 200);
  tft.println(medicines[compartment].dosage);
}

}

void loop() {
  server.handleClient();
  checkScheduledReminders();
}

void displayMedicineList() {
  tft.fillScreen(ILI9341_BLACK);
  
  // Title
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_CYAN);
  tft.setCursor(60, 10);
  tft.println("MEDICINE SCHEDULE");

   // Show current RTC time (if available)
   if (rtc.begin()) {
     DateTime now = rtc.now();
     char buf[9];
     snprintf(buf, sizeof(buf), "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
     tft.setTextSize(1);
     tft.setTextColor(ILI9341_WHITE);
     tft.setCursor(200, 10);
     tft.print("Time ");
     tft.println(buf);
   }
  
  // Draw separator line
  tft.drawLine(0, 35, 320, 35, ILI9341_WHITE);
  
  // Display each compartment
  int yPos = 50;
  for (int i = 0; i < 4; i++) {
    tft.setTextSize(1);
    
    // Compartment number
    tft.setTextColor(ILI9341_YELLOW);
    tft.setCursor(10, yPos);
    tft.print("Compartment ");
    tft.print(i + 1);
    
    // Medicine name
    tft.setTextColor(medicines[i].active ? ILI9341_GREEN : ILI9341_WHITE);
    tft.setCursor(10, yPos + 15);
    tft.print("Med: ");
    tft.println(medicines[i].name);
    
    // Dosage
    tft.setCursor(10, yPos + 30);
    tft.print("Dose: ");
    tft.println(medicines[i].dosage);
    
    // Time
    tft.setCursor(180, yPos + 30);
    tft.print("Time: ");
    tft.println(medicines[i].time);
    
    // Draw separator
    if (i < 3) {
      tft.drawLine(0, yPos + 45, 320, yPos + 45, ILI9341_DARKGREY);
    }
    
    yPos += 50;
  }
  
  // Display IP at bottom
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_DARKGREY);
  tft.setCursor(10, 220);
  tft.print("IP: ");
  tft.print(WiFi.isConnected() ? WiFi.localIP() : WiFi.softAPIP());
  
  // Show mDNS hint when connected
  if (WiFi.isConnected()) {
    tft.setCursor(160, 220);
    tft.print(" ");
    tft.print(deviceHostname);
    tft.print(".local");
  }
}

void displayAlert(int compartment) {
  tft.fillScreen(ILI9341_RED);
  
  tft.setTextSize(3);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(40, 40);
  tft.println("TIME TO TAKE");
  
  tft.setTextSize(4);
  tft.setCursor(60, 90);
  tft.println("MEDICINE!");
  
  tft.setTextSize(2);
  tft.setCursor(20, 140);
  tft.print("Compartment: ");
  tft.println(compartment + 1);
  
  tft.setCursor(20, 170);
  tft.println(medicines[compartment].name);
  
  tft.setCursor(20, 200);
  tft.println(medicines[compartment].dosage);
}

void handleRoot() {
  String html = "<html><head><title>Pillbox ESP32</title></head><body>";
  html += "<h1>Automated Pillbox with TFT Display</h1>";
  html += "<h2>Current Status:</h2>";
  html += "<p>WiFi: Connected</p>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
  html += "<h3>Medicines:</h3><ul>";
  
  for (int i = 0; i < 4; i++) {
    html += "<li>Compartment " + String(i + 1) + ": " + medicines[i].name;
    html += " (" + medicines[i].dosage + ") at " + medicines[i].time + "</li>";
  }
  
  html += "</ul><h3>API Endpoints:</h3>";
  html += "<p>/compartment?num=X&action=ON/TAKEN/MISSED</p>";
  html += "<p>/update?compartment=X&name=MED_NAME&dosage=DOSAGE&time=TIME</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handleCompartment() {
  if (!server.hasArg("num") || !server.hasArg("action")) {
    server.send(400, "text/plain", "Missing parameters");
    return;
  }
  
  int compartment = server.arg("num").toInt() - 1;
  String action = server.arg("action");
  
  if (compartment < 0 || compartment > 3) {
    server.send(400, "text/plain", "Invalid compartment");
    return;
  }
  
  if (action == "ON") {
    digitalWrite(ledPins[compartment], HIGH);
    digitalWrite(buzzerPins[compartment], HIGH);
    medicines[compartment].active = true;
    displayAlert(compartment);
    
    Serial.println("Compartment " + String(compartment + 1) + " activated");
  }
  else if (action == "TAKEN") {
    digitalWrite(ledPins[compartment], LOW);
    digitalWrite(buzzerPins[compartment], LOW);
    medicines[compartment].active = false;
    displayMedicineList();
    
    Serial.println("Compartment " + String(compartment + 1) + " marked as taken");
  }
  else if (action == "MISSED") {
    digitalWrite(ledPins[compartment], LOW);
    digitalWrite(buzzerPins[compartment], LOW);
    medicines[compartment].active = false;
    displayMedicineList();
    
    Serial.println("Compartment " + String(compartment + 1) + " marked as missed");
  }
  
  server.send(200, "text/plain", "OK");
}

void handleUpdate() {
  if (!server.hasArg("compartment") || !server.hasArg("name")) {
    server.send(400, "text/plain", "Missing parameters");
    return;
  }
  
  int compartment = server.arg("compartment").toInt() - 1;
  
  if (compartment < 0 || compartment > 3) {
    server.send(400, "text/plain", "Invalid compartment");
    return;
  }
  
  medicines[compartment].name = server.arg("name");
  medicines[compartment].dosage = server.hasArg("dosage") ? server.arg("dosage") : "-";
  medicines[compartment].time = server.hasArg("time") ? server.arg("time") : "-";
  medicines[compartment].active = true; // enable schedule when updated
  
  Serial.println("Updated compartment " + String(compartment + 1));
  Serial.println("Name: " + medicines[compartment].name);
  Serial.println("Dosage: " + medicines[compartment].dosage);
  Serial.println("Time: " + medicines[compartment].time);
  
  displayMedicineList();
  
  server.send(200, "text/plain", "Display updated");
}

void handleStatus() {
  String json = "{\"status\":\"online\",\"ip\":\"" + WiFi.localIP().toString() + "\"}";
  server.send(200, "application/json", json);
}

void handleNotFound() {
  server.send(404, "text/plain", "Not Found");
}

/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Install required libraries in Arduino IDE:
 *    - Adafruit GFX Library
 *    - Adafruit ILI9341
 * 
 * 2. Wire your 2.4" TFT display:
 *    TFT_CS   -> GPIO 5
 *    TFT_DC   -> GPIO 4
 *    TFT_RST  -> GPIO 2
 *    TFT_MOSI -> GPIO 23
 *    TFT_CLK  -> GPIO 18
 *    (Adjust pins in code if your wiring is different)
 * 
 * 3. Update WiFi credentials at the top of the code
 * 
 * 4. Upload to ESP32 and note the IP address shown on display
 * 
 * 5. Enter this IP in the app's Settings page
 */
               