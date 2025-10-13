/*
 * ESP32 Automated Pillbox Web Server
 * 
 * This code runs on your ESP32 and receives HTTP commands from the Android app
 * to control LED indicators and buzzer for each compartment.
 * 
 * Hardware Setup:
 * - Connect 4 LEDs to pins 2, 4, 5, 18 (one for each compartment)
 * - Connect 4 buzzers to pins 15, 16, 17, 19 (one for each compartment)
 * - Each LED/Buzzer should have appropriate resistors
 * 
 * Usage:
 * 1. Update WiFi credentials below
 * 2. Upload to ESP32
 * 3. Open Serial Monitor to see IP address
 * 4. Enter this IP in the Android app settings
 */

#include <WiFi.h>
#include <WebServer.h>

// WiFi credentials - UPDATE THESE
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Create web server on port 80
WebServer server(80);

// Pin definitions for 4 compartments
const int LED_PINS[] = {2, 4, 5, 18};     // LED pins for compartments 1-4
const int BUZZER_PINS[] = {15, 16, 17, 19}; // Buzzer pins for compartments 1-4

void setup() {
  Serial.begin(115200);
  
  // Initialize all LED and Buzzer pins
  for (int i = 0; i < 4; i++) {
    pinMode(LED_PINS[i], OUTPUT);
    pinMode(BUZZER_PINS[i], OUTPUT);
    digitalWrite(LED_PINS[i], LOW);
    digitalWrite(BUZZER_PINS[i], LOW);
  }
  
  // Connect to WiFi
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.println("Enter this IP in the Android app settings");
  
  // Define server endpoints
  server.on("/", handleRoot);
  server.on("/compartment", handleCompartment);
  server.on("/status", handleStatus);
  server.onNotFound(handleNotFound);
  
  // Start server
  server.begin();
  Serial.println("Web server started");
}

void loop() {
  server.handleClient();
}

// Root endpoint - show welcome message
void handleRoot() {
  String html = "<html><body>";
  html += "<h1>ESP32 Automated Pillbox</h1>";
  html += "<p>System is running</p>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
  html += "<h3>Test Endpoints:</h3>";
  html += "<p>Turn ON: /compartment?num=1&action=ON</p>";
  html += "<p>Mark TAKEN: /compartment?num=1&action=TAKEN</p>";
  html += "<p>Mark MISSED: /compartment?num=1&action=MISSED</p>";
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

// Handle compartment control commands
void handleCompartment() {
  if (!server.hasArg("num") || !server.hasArg("action")) {
    server.send(400, "text/plain", "Missing parameters");
    return;
  }
  
  int compartmentNum = server.arg("num").toInt();
  String action = server.arg("action");
  
  // Validate compartment number
  if (compartmentNum < 1 || compartmentNum > 4) {
    server.send(400, "text/plain", "Invalid compartment number (1-4)");
    return;
  }
  
  int index = compartmentNum - 1; // Convert to 0-based index
  
  Serial.print("Command received: Compartment ");
  Serial.print(compartmentNum);
  Serial.print(", Action: ");
  Serial.println(action);
  
  if (action == "ON") {
    // Turn on LED and buzzer for this compartment
    digitalWrite(LED_PINS[index], HIGH);
    digitalWrite(BUZZER_PINS[index], HIGH);
    
    server.send(200, "text/plain", "Compartment " + String(compartmentNum) + " activated");
    
  } else if (action == "TAKEN") {
    // Turn off LED and buzzer - medicine was taken
    digitalWrite(LED_PINS[index], LOW);
    digitalWrite(BUZZER_PINS[index], LOW);
    
    server.send(200, "text/plain", "Compartment " + String(compartmentNum) + " marked as TAKEN");
    
  } else if (action == "MISSED") {
    // Turn off LED and buzzer - medicine was missed
    digitalWrite(LED_PINS[index], LOW);
    digitalWrite(BUZZER_PINS[index], LOW);
    
    // Could add different behavior for missed doses (e.g., blink LED)
    server.send(200, "text/plain", "Compartment " + String(compartmentNum) + " marked as MISSED");
    
  } else {
    server.send(400, "text/plain", "Invalid action (use ON, TAKEN, or MISSED)");
  }
}

// Status endpoint for connection testing
void handleStatus() {
  String json = "{";
  json += "\"status\":\"online\",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"compartments\":4";
  json += "}";
  
  server.send(200, "application/json", json);
}

// Handle 404 errors
void handleNotFound() {
  server.send(404, "text/plain", "Endpoint not found");
}

/*
 * ADDITIONAL FEATURES YOU CAN ADD:
 * 
 * 1. Automatic timeout - turn off buzzer after 5 minutes if not confirmed
 * 2. Visual patterns - blink LED differently for different actions
 * 3. MQTT support - for more reliable communication
 * 4. Multiple reminders - queue multiple alarms
 * 5. LCD display - show medicine name and time
 * 6. Motor control - open compartment automatically
 * 
 * Example auto-timeout code (add to loop function):
 * 
 * unsigned long lastTriggerTime[4] = {0, 0, 0, 0};
 * const unsigned long TIMEOUT = 300000; // 5 minutes
 * 
 * void loop() {
 *   server.handleClient();
 *   
 *   // Check for timeouts
 *   for (int i = 0; i < 4; i++) {
 *     if (digitalRead(BUZZER_PINS[i]) == HIGH) {
 *       if (millis() - lastTriggerTime[i] > TIMEOUT) {
 *         digitalWrite(LED_PINS[i], LOW);
 *         digitalWrite(BUZZER_PINS[i], LOW);
 *       }
 *     }
 *   }
 * }
 */
