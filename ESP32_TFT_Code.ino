/*
 * Automated Pillbox with TFT Display - ESP32
 * This code controls LEDs, buzzers, and displays medicine information on a 2.4" TFT screen
 * Compatible with ILI9341 TFT displays
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <TFT_eSPI.h>
#include <RTClib.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// TFT Display pins (8-bit parallel mode)
#define TFT_CS   15  // Chip select control pin (library pulls permanently low)
#define TFT_DC   33  // Data Command control pin - must use a pin in the range 0-31
#define TFT_RST  32  // Reset pin, toggles on startup

#define TFT_WR    4  // Write strobe control pin - must use a pin in the range 0-31
#define TFT_RD    2  // Read strobe control pin

#define TFT_D0   12  // Must use pins in the range 0-31 for the data bus
#define TFT_D1   13  // so a single register write sets/clears all bits.
#define TFT_D2   26  // Pins can be randomly assigned, this does not affect
#define TFT_D3   25  // TFT screen update performance.
#define TFT_D4   18
#define TFT_D5   19
#define TFT_D6   27
#define TFT_D7   14

// Initialize TFT display (8-bit parallel mode via TFT_eSPI)
TFT_eSPI tft = TFT_eSPI();

// RTC (DS3231)
RTC_DS3231 rtc;

// LED and Buzzer pins for 4 compartments
const int ledPins[4] = {12, 13, 14, 15};
const int buzzerPins[4] = {16, 17, 25, 26};

// Medicine information structure
struct MedicineInfo {
  String name;
  String dosage;
  String time;
  bool active;          // has a valid schedule
  bool triggeredToday;  // whether today's alert has fired
  uint8_t lastTriggerDay;
};

MedicineInfo medicines[4];

WebServer server(80);

// Device hostname for mDNS (access as http://pillbox-esp32.local)
const char* deviceHostname = "pillbox-esp32";

// Optional static IP configuration (set useStaticIP to true if needed)
const bool useStaticIP = false; // default to DHCP for easiest mobile connection
IPAddress local_IP(10, 80, 69, 27);
IPAddress gateway(10, 80, 69, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

// Connect to WiFi with timeout and optional static IP
bool connectWifi(unsigned long timeoutMs = 20000) {
  if (useStaticIP) {
    if (!WiFi.config(local_IP, gateway, subnet, dns)) {
      Serial.println("WiFi.config failed (static IP)");
    }
  }
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < timeoutMs) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi Connected. IP: ");
    Serial.println(WiFi.localIP());

    // Start mDNS so phones can connect via name
    if (MDNS.begin(deviceHostname)) {
      MDNS.addService("http", "tcp", 80);
      Serial.print("mDNS started: http://");
      Serial.print(deviceHostname);
      Serial.println(".local/");
    } else {
      Serial.println("mDNS start failed");
    }
    return true;
  }

  Serial.printf("WiFi connect failed, status=%d\n", WiFi.status());
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Initialize RTC
  if (!rtc.begin()) {
    Serial.println("RTC not found. Time-based alerts will be disabled.");
  } else {
    if (rtc.lostPower()) {
      Serial.println("RTC lost power, please set the time manually.");
      // rtc.adjust(DateTime(F(__DATE__), F(__TIME__))); // Uncomment once to set from compile time
    }
  }
  
  // Initialize TFT display
  tft.init();
  tft.setRotation(1); // Landscape mode (0=portrait, 1=landscape, 2=inverted portrait, 3=inverted landscape)
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 10);
  tft.println("Pillbox Initializing...");
  
  // Initialize pins
  for (int i = 0; i < 4; i++) {
    pinMode(ledPins[i], OUTPUT);
    pinMode(buzzerPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
    digitalWrite(buzzerPins[i], LOW);
    
    // Initialize medicine info
    medicines[i].name = "Empty";
    medicines[i].dosage = "-";
    medicines[i].time = "-";
    medicines[i].active = false;
    medicines[i].triggeredToday = false;
    medicines[i].lastTriggerDay = 0;
  }
  
  // Connect to WiFi (with static IP if enabled). Fallback to AP if it fails.
  tft.setCursor(20, 40);
  tft.print("Connecting to WiFi");
  bool connected = connectWifi();
  
  tft.fillScreen(TFT_BLACK);
  tft.setCursor(20, 10);
  if (connected) {
    Serial.println("WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    tft.setTextColor(TFT_GREEN);
    tft.println("WiFi Connected!");
    tft.setTextColor(TFT_WHITE);
    tft.setCursor(20, 40);
    tft.print("IP: ");
    tft.println(WiFi.localIP());
    tft.setCursor(20, 60);
    tft.print("URL: http://");
    tft.print(deviceHostname);
    tft.println(".local/");
  } else {
    // Start configuration AP for recovery
    WiFi.mode(WIFI_AP);
    WiFi.softAP("Pillbox-Setup", "12345678");
    IPAddress apIp = WiFi.softAPIP();
    Serial.print("AP mode started. SSID: Pillbox-Setup, IP: ");
    Serial.println(apIp);
    tft.setTextColor(TFT_YELLOW);
    tft.println("STA Failed. AP Ready");
    tft.setTextColor(TFT_WHITE);
    tft.setCursor(20, 40);
    tft.print("AP IP: ");
    tft.println(apIp);
  }
  
  delay(2000);
  
  // Setup web server routes
  server.on("/", handleRoot);
  server.on("/compartment", handleCompartment);
  server.on("/update", handleUpdate);
  server.on("/status", handleStatus);
  server.onNotFound(handleNotFound);
  
  server.begin();
  Serial.println("HTTP server started");
  
  // Display initial screen
  displayMedicineList();
}

void checkScheduledReminders() {
  if (!rtc.begin()) {
    return; // RTC not available
  }

  DateTime now = rtc.now();
  uint8_t currentDay = now.day();

  char buf[6];
  snprintf(buf, sizeof(buf), "%02d:%02d", now.hour(), now.minute());
  String currentTime = String(buf);

  for (int i = 0; i < 4; i++) {
    if (!medicines[i].active) continue;
    if (medicines[i].time == "-" || medicines[i].time.length() < 4) continue;

    // Reset daily trigger flag when the day changes
    if (medicines[i].lastTriggerDay != currentDay) {
      medicines[i].triggeredToday = false;
    }

    if (!medicines[i].triggeredToday && medicines[i].time == currentTime) {
      Serial.print("RTC trigger for compartment ");
      Serial.println(i + 1);

      digitalWrite(ledPins[i], HIGH);
      digitalWrite(buzzerPins[i], HIGH);
      displayAlert(i);

      medicines[i].triggeredToday = true;
      medicines[i].lastTriggerDay = currentDay;
    }
  }
}

void loop() {
  server.handleClient();
  checkScheduledReminders();
}

void displayMedicineList() {
  tft.fillScreen(TFT_BLACK);
  
  // Title
  tft.setTextSize(2);
  tft.setTextColor(TFT_CYAN);
  tft.setCursor(60, 10);
  tft.println("MEDICINE SCHEDULE");

   // Show current RTC time (if available)
   if (rtc.begin()) {
     DateTime now = rtc.now();
     char buf[9];
     snprintf(buf, sizeof(buf), "%02d:%02d:%02d", now.hour(), now.minute(), now.second());
     tft.setTextSize(1);
     tft.setTextColor(TFT_WHITE);
     tft.setCursor(200, 10);
     tft.print("Time ");
     tft.println(buf);
   }
  
  // Draw separator line
  tft.drawLine(0, 35, 320, 35, TFT_WHITE);
  
  // Display each compartment
  int yPos = 50;
  for (int i = 0; i < 4; i++) {
    tft.setTextSize(1);
    
    // Compartment number
    tft.setTextColor(TFT_YELLOW);
    tft.setCursor(10, yPos);
    tft.print("Compartment ");
    tft.print(i + 1);
    
    // Medicine name
    tft.setTextColor(medicines[i].active ? TFT_GREEN : TFT_WHITE);
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
      tft.drawLine(0, yPos + 45, 320, yPos + 45, TFT_DARKGREY);
    }
    
    yPos += 50;
  }
  
  // Display IP at bottom
  tft.setTextSize(1);
  tft.setTextColor(TFT_DARKGREY);
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
  tft.fillScreen(TFT_RED);
  
  tft.setTextSize(3);
  tft.setTextColor(TFT_WHITE);
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
 * 2. Wire your 2.4" TFT display (8-bit parallel mode):
 *    Control pins:
 *      TFT_CS   -> GPIO 15  (Chip Select)
 *      TFT_DC   -> GPIO 33  (Data Command)
 *      TFT_RST  -> GPIO 32  (Reset)
 *      TFT_WR   -> GPIO 4   (Write Strobe)
 *      TFT_RD   -> GPIO 2   (Read Strobe)
 *    Data bus (8-bit):
 *      TFT_D0   -> GPIO 12
 *      TFT_D1   -> GPIO 13
 *      TFT_D2   -> GPIO 26
 *      TFT_D3   -> GPIO 25
 *      TFT_D4   -> GPIO 18
 *      TFT_D5   -> GPIO 19
 *      TFT_D6   -> GPIO 27
 *      TFT_D7   -> GPIO 14
 *    (Adjust pins in code if your wiring is different)
 * 
 * 3. Update WiFi credentials at the top of the code
 * 
 * 4. Upload to ESP32 and note the IP address shown on display
 * 
 * 5. Enter this IP in the app's Settings page
 */
               