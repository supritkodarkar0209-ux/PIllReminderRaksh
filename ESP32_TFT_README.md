ESP32 Pillbox - Final sketches and instructions

Files:
- `ESP32_TFT_Code.ino` - Final recommended SPI-based sketch (Adafruit_ILI9341)
- `ESP32_TFT_Parallel_Final.ino` - Parallel 8-bit TFT sketch using TFT_eSPI (requires User_Setup.h edits)

Quick start (SPI variant - recommended):
1. Open `ESP32_TFT_Code.ino` in Arduino IDE (or PlatformIO).
2. Edit WiFi credentials at the top: `ssid` and `password`.
3. Install libraries via Arduino Library Manager:
   - Adafruit GFX Library
   - Adafruit ILI9341
   - RTClib
4. Wiring (SPI):
   - TFT_CS -> GPIO 5
   - TFT_DC -> GPIO 4
   - TFT_RST -> GPIO 2
   - MOSI -> GPIO 23
   - SCLK -> GPIO 18
   - VCC -> 3.3V
   - GND -> GND
   - RTC DS3231: SDA -> GPIO 21, SCL -> GPIO 22
   - LEDs (compartments): 12,13,14,15 (with resistors)
   - Buzzers: 16,17,25,26 (use drivers/transistors if needed)
5. Select board (e.g., ESP32 Dev Module), select port, upload.
6. Open Serial Monitor at 115200 to view IP address or check TFT for IP.
7. Use the app or PowerShell commands to hit the endpoints (see below).

Parallel variant (only if you must use 8-bit parallel display):
- `ESP32_TFT_Parallel_Final.ino` is provided, but you MUST configure `TFT_eSPI`'s `User_Setup.h` to match your pins.
- Avoid using GPIO0, GPIO2, GPIO15 for signals that are driven at reset as they affect boot.
- Verify the display controller (ILI9341 vs others). `TFT_eSPI` must use the correct driver define.

API endpoints (use from app or testing):
- `/status` -> JSON {"status":"online","ip":"<ip>"}
- `/update?compartment=X&name=...&dosage=...&time=HH:MM` -> updates display
- `/compartment?num=X&action=ON|TAKEN|MISSED` -> controls LED/buzzer and UI
- `/sync-time?timestamp=<ms_since_epoch>` -> syncs RTC (milliseconds since epoch)

Power & troubleshooting:
- Ensure TFT module is 3.3V compatible. Some breakout boards have level shifters and 5V tolerant pins, but safest is 3.3V.
- If TFT is blank: verify backlight pin; some modules require BL tied to 3.3V for backlight.
- If device fails to boot after wiring: move any signals away from GPIO0/2/15 and try again.

Testing with PowerShell (replace <IP>):
```powershell
Invoke-RestMethod "http://<IP>/status"
Invoke-RestMethod "http://<IP>/update?compartment=1&name=Test&dosage=1tab&time=12:34"
Invoke-RestMethod "http://<IP>/compartment?num=1&action=ON"
$ts = [int64]((Get-Date).ToUniversalTime() - [datetime]'1970-01-01').TotalMilliseconds
Invoke-RestMethod "http://<IP>/sync-time?timestamp=$ts"
```

If you want, I can:
- Commit and push these new files (I can do that now).
- Create a ready `User_Setup.h` snippet for your exact parallel pin mapping (tell me which screen/controller you have).
