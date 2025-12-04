/*
  ESP32 Pillbox - TFT_eSPI 8-bit parallel variant (corrected)
  - Requires editing TFT_eSPI's User_Setup.h to match your parallel pins
  - Important: avoid using boot-strapping pins for data or control lines
  - This sketch fixes rtc.adjust usage and avoids GPIO0/2/15 conflicts

  BEFORE USING: Review pin assignments below and change any pins that conflict
  with your board's boot straps. If your display does not support 8-bit mode,
  use the SPI variant instead.
*/

#include <WiFi.h>
#include <WebServer.h>
#include <TFT_eSPI.h>
#include <Wire.h>
#include <RTClib.h>

// WiFi - set before upload
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// NOTE: The TFT_eSPI library reads its pin mapping from User_Setup.h inside
// the TFT_eSPI library. You MUST update that file to match your wiring.
// The pins below are only used for documentation and for any direct GPIO
// that the sketch drives (LEDs/buzzers).

TFT_eSPI tft = TFT_eSPI();
RTC_DS3231 rtc;
WebServer server(80);

// Use boot-safe pins for LEDs/buzzers
const int ledPins[4]    = {16, 17, 21, 22};
const int buzzerPins[4] = {25, 26, 27, 14};

struct MedicineInfo { String name; String dosage; String time; bool active; bool triggeredToday; uint8_t lastTriggerDay; };
MedicineInfo medicines[4];

void sendJsonStatus(const char* status) {
  String json = "{\"status\":\"" + String(status) + "\",\"ip\":\"" + (WiFi.status()==WL_CONNECTED?WiFi.localIP().toString():WiFi.softAPIP().toString()) + "\"}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  for (int i=0;i<4;i++){ pinMode(ledPins[i], OUTPUT); pinMode(buzzerPins[i], OUTPUT); digitalWrite(ledPins[i], LOW); digitalWrite(buzzerPins[i], LOW); medicines[i].name="Empty"; medicines[i].dosage="-"; medicines[i].time="-"; medicines[i].active=false; }

  // TFT init - ensure you configured TFT_eSPI/User_Setup.h correctly
  tft.init(); tft.setRotation(1); tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK); tft.setTextSize(2); tft.drawString("Pillbox Booting...", 10, 10);

  Wire.begin(21,22);
  if (!rtc.begin()) { Serial.println("RTC not found"); tft.setTextColor(TFT_YELLOW); tft.drawString("RTC not found!", 10, 40); }

  WiFi.mode(WIFI_STA); WiFi.begin(ssid, password); unsigned long start=millis(); while (WiFi.status()!=WL_CONNECTED && millis()-start<20000) delay(200);
  if (WiFi.status()==WL_CONNECTED) { tft.fillScreen(TFT_BLACK); tft.setTextColor(TFT_GREEN); tft.drawString("WiFi Connected",10,10); tft.setTextColor(TFT_WHITE); tft.drawString("IP: "+WiFi.localIP().toString(),10,40); } else { WiFi.mode(WIFI_AP); WiFi.softAP("Pillbox-Setup","12345678"); tft.setTextColor(TFT_YELLOW); tft.drawString("AP Mode Active",10,10); tft.drawString("IP: "+WiFi.softAPIP().toString(),10,40); }

  // API
  server.on("/", [](){ sendJsonStatus("ok"); });
  server.on("/status", [](){ sendJsonStatus("online"); });

  server.on("/update", [](){ if (!server.hasArg("compartment")||!server.hasArg("name")){ server.send(400,"text/plain","Missing params"); return;} int idx=server.arg("compartment").toInt()-1; if (idx<0||idx>3){ server.send(400,"text/plain","Invalid compartment"); return;} medicines[idx].name=server.arg("name"); medicines[idx].dosage=server.hasArg("dosage")?server.arg("dosage"):"-"; medicines[idx].time=server.hasArg("time")?server.arg("time"):"-"; medicines[idx].active=true; displayMedicineList(); server.send(200,"text/plain","OK"); });

  server.on("/compartment", [](){ if (!server.hasArg("num")||!server.hasArg("action")){ server.send(400,"text/plain","Missing params"); return;} int idx=server.arg("num").toInt()-1; if (idx<0||idx>3){ server.send(400,"text/plain","Invalid compartment"); return;} String action=server.arg("action"); if (action=="ON"){ digitalWrite(ledPins[idx], HIGH); digitalWrite(buzzerPins[idx], HIGH); displayAlert(idx); } else { digitalWrite(ledPins[idx], LOW); digitalWrite(buzzerPins[idx], LOW); displayMedicineList(); } server.send(200,"text/plain","OK"); });

  server.on("/sync-time", [](){ if (!server.hasArg("timestamp")){ server.send(400,"text/plain","Missing timestamp"); return;} unsigned long long ts=0; for (const char* p=server.arg("timestamp").c_str(); *p>='0' && *p<='9'; ++p) ts = ts*10ULL + (*p - '0'); if (ts==0){ server.send(400,"text/plain","Invalid time"); return;} uint32_t seconds = (uint32_t)(ts/1000ULL); if (!rtc.begin()){ server.send(500,"text/plain","RTC not available"); return; } rtc.adjust(DateTime(seconds)); server.send(200, "application/json", "{\"status\":\"synced\"}"); });

  server.onNotFound([](){ server.send(404, "text/plain", "Not Found"); });
  server.begin(); Serial.println("Server ready"); displayMedicineList();
}

void loop(){ server.handleClient(); checkScheduledReminders(); delay(50); }

void checkScheduledReminders(){ if (!rtc.begin()) return; DateTime now=rtc.now(); uint8_t day=now.day(); char buf[6]; snprintf(buf,sizeof(buf),"%02d:%02d", now.hour(), now.minute()); String currentTime=String(buf); for (int i=0;i<4;i++){ if (!medicines[i].active || medicines[i].time=="-"||medicines[i].time.length()<4) continue; if (medicines[i].lastTriggerDay!=day) { medicines[i].triggeredToday=false; medicines[i].lastTriggerDay=day; } if (!medicines[i].triggeredToday && medicines[i].time==currentTime){ digitalWrite(ledPins[i], HIGH); digitalWrite(buzzerPins[i], HIGH); displayAlert(i); medicines[i].triggeredToday=true; } } }

void displayMedicineList(){ tft.fillScreen(TFT_BLACK); tft.setTextSize(2); tft.setTextColor(TFT_CYAN, TFT_BLACK); tft.drawString("MEDICINE SCHEDULE",10,6); if (rtc.begin()){ DateTime now=rtc.now(); char buf[9]; snprintf(buf,sizeof(buf),"%02d:%02d:%02d", now.hour(), now.minute(), now.second()); tft.setTextSize(1); tft.setTextColor(TFT_WHITE, TFT_BLACK); tft.drawString("Time: "+String(buf),200,10); } tft.drawFastHLine(0,35,320,TFT_WHITE); int yPos=50; for (int i=0;i<4;i++){ tft.setTextSize(1); tft.setTextColor(TFT_YELLOW, TFT_BLACK); tft.drawString("Comp "+String(i+1),10,yPos); tft.setTextColor(medicines[i].active ? TFT_GREEN : TFT_WHITE, TFT_BLACK); tft.drawString("Med: "+medicines[i].name,10,yPos+15); tft.drawString("Dose: "+medicines[i].dosage,10,yPos+30); tft.drawString("Time: "+medicines[i].time,180,yPos+30); if (i<3) tft.drawFastHLine(0,yPos+45,320,TFT_DARKGREY); yPos+=50; } tft.setTextColor(TFT_LIGHTGREY, TFT_BLACK); String ip = WiFi.status()==WL_CONNECTED?WiFi.localIP().toString():WiFi.softAPIP().toString(); tft.drawString("IP: "+ip,10,220); }

void displayAlert(int compartment){ tft.fillScreen(TFT_RED); tft.setTextSize(3); tft.setTextColor(TFT_WHITE, TFT_RED); tft.drawString("TIME TO TAKE",20,40); tft.setTextSize(4); tft.drawString("MEDICINE!",40,90); tft.setTextSize(2); tft.drawString("Compartment: "+String(compartment+1),10,140); tft.drawString(medicines[compartment].name,10,170); tft.drawString(medicines[compartment].dosage,10,200); }
