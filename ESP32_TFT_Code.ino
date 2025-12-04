/*
  Clean SPI-based ESP32 sketch for ILI9341 TFT + DS3231 RTC
  - Returns only plain text / JSON responses (no HTML)
  - API endpoints used by the app: /update, /compartment, /sync-time, /status
  - Update WiFi credentials below before uploading
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

// TFT SPI pins (change if your wiring differs)
// Default safe pins used for many ESP32 dev boards
#define TFT_CS   5
#define TFT_DC   4
#define TFT_RST  2

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);
RTC_DS3231 rtc;
WebServer server(80);

// Hardware pins
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

// Utility: send JSON status
void sendJsonStatus(const char* status) {
  String json = "{\"status\":\"" + String(status) + "\",\"ip\":\"" + WiFi.localIP().toString() + "\"}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  delay(200);

  // initialize pins and medicines
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

  // TFT
  tft.begin();
  tft.setRotation(1);
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(10, 10);
  tft.println("Pillbox Booting...");

  // RTC
  Wire.begin();
  if (!rtc.begin()) {
    Serial.println("RTC not found");
    tft.setCursor(10, 40);
    tft.setTextSize(1);
    tft.setTextColor(ILI9341_YELLOW);
    tft.println("RTC not found");
  } else if (rtc.lostPower()) {
    Serial.println("RTC lost power - please sync time via app");
    tft.setCursor(10, 40);
    tft.setTextSize(1);
    tft.setTextColor(ILI9341_YELLOW);
    tft.println("RTC lost power - sync time");
  }

  // WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 20000) {
    delay(200);
    Serial.print('.');
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: "); Serial.println(WiFi.localIP());
    tft.fillScreen(ILI9341_BLACK);
    tft.setTextColor(ILI9341_GREEN);
    tft.setCursor(10, 10);
    tft.println("WiFi Connected");
    tft.setTextColor(ILI9341_WHITE);
    tft.setCursor(10, 40);
    tft.print("IP: "); tft.println(WiFi.localIP());
  } else {
    Serial.println("WiFi failed - starting AP: Pillbox-Setup");
    WiFi.mode(WIFI_AP);
    WiFi.softAP("Pillbox-Setup", "12345678");
    IPAddress apIp = WiFi.softAPIP();
    tft.fillScreen(ILI9341_BLACK);
    tft.setTextColor(ILI9341_YELLOW);
    tft.setCursor(10, 40);
    tft.print("AP: "); tft.println(apIp);
  }

  // Routes - plain text / JSON only
  server.on("/", [](){ sendJsonStatus("ok"); });

  server.on("/compartment", [](){
    if (!server.hasArg("num") || !server.hasArg("action")) {
      server.send(400, "text/plain", "Missing parameters");
      return;
    }
    int idx = server.arg("num").toInt() - 1;
    String action = server.arg("action");
    if (idx < 0 || idx > 3) { server.send(400, "text/plain", "Invalid compartment"); return; }

    if (action == "ON") {
      digitalWrite(ledPins[idx], HIGH);
      digitalWrite(buzzerPins[idx], HIGH);
      medicines[idx].active = true;
      displayAlert(idx);
      server.send(200, "text/plain", "OK");
    } else if (action == "TAKEN") {
      digitalWrite(ledPins[idx], LOW);
      digitalWrite(buzzerPins[idx], LOW);
      medicines[idx].active = false;
      displayMedicineList();
      server.send(200, "text/plain", "OK");
    } else if (action == "MISSED") {
      digitalWrite(ledPins[idx], LOW);
      digitalWrite(buzzerPins[idx], LOW);
      medicines[idx].active = false;
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
    int idx = server.arg("compartment").toInt() - 1;
    if (idx < 0 || idx > 3) { server.send(400, "text/plain", "Invalid compartment"); return; }
    medicines[idx].name = server.arg("name");
    medicines[idx].dosage = server.hasArg("dosage") ? server.arg("dosage") : "-";
    medicines[idx].time = server.hasArg("time") ? server.arg("time") : "-";
    medicines[idx].active = true;
    Serial.println("Updated compartment " + String(idx + 1));
    displayMedicineList();
    server.send(200, "text/plain", "Display updated");
  });

  server.on("/sync-time", [](){
    if (!server.hasArg("timestamp")) { server.send(400, "text/plain", "Missing timestamp"); return; }
    // timestamp in milliseconds (parse manually)
    const char* tsStr = server.arg("timestamp").c_str();
    unsigned long long ts = 0ULL;
    for (const char* p = tsStr; *p >= '0' && *p <= '9'; ++p) ts = ts * 10ULL + (unsigned long long)(*p - '0');
    if (ts == 0ULL) { server.send(400, "text/plain", "Invalid timestamp"); return; }
    uint32_t seconds = (uint32_t)(ts / 1000ULL);
    if (!rtc.begin()) { server.send(500, "text/plain", "RTC not available"); return; }
    rtc.adjust(DateTime(seconds));
    displayMedicineList();
    server.send(200, "application/json", "{\"status\":\"time_synced\"}");
  });

  server.on("/status", [](){ sendJsonStatus("online"); });
  server.onNotFound([](){ server.send(404, "text/plain", "Not Found"); });

  server.begin();
  Serial.println("HTTP server started");
  displayMedicineList();
}

void loop() {
  server.handleClient();
  checkScheduledReminders();
  delay(50);
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
  tft.setCursor(10, 6);
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

  tft.setTextSize(1);
  tft.setTextColor(ILI9341_DARKGREY);
  tft.setCursor(10, 220);
  tft.print("IP: ");
  tft.print(WiFi.isConnected() ? WiFi.localIP() : WiFi.softAPIP());
}

void displayAlert(int compartment) {
  tft.fillScreen(ILI9341_RED);
  tft.setTextSize(3);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(20, 40);
  tft.println("TIME TO TAKE");
  tft.setTextSize(4);
  tft.setCursor(40, 90);
  tft.println("MEDICINE!");
  tft.setTextSize(2);
  tft.setCursor(10, 140);
  tft.print("Compartment: "); tft.println(compartment + 1);
  tft.setCursor(10, 170);
  tft.println(medicines[compartment].name);
  tft.setCursor(10, 200);
  tft.println(medicines[compartment].dosage);
}
