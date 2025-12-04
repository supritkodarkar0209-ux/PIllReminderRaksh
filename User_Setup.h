// User_Setup.h - TFT_eSPI configuration for 8-bit parallel ILI9341 display
// This file configures the TFT_eSPI library for your specific ESP32 wiring

#ifndef USER_SETUP_H
#define USER_SETUP_H

// === Display driver ===
#define ILI9341_DRIVER

// === Interface pins (parallel 8-bit mode) ===
#define TFT_CS   15  // Chip select
#define TFT_DC   33  // Data/Command
#define TFT_RST  32  // Reset
#define TFT_WR    4  // Write strobe
#define TFT_RD    2  // Read strobe

// === Data bus pins (8-bit) ===
#define TFT_D0   12
#define TFT_D1   13
#define TFT_D2   26
#define TFT_D3   25
#define TFT_D4   18
#define TFT_D5   19
#define TFT_D6   27
#define TFT_D7   14

// === Parallel mode ===
#define TFT_PARALLEL_8_BIT

// === Display size ===
#define TFT_WIDTH  240
#define TFT_HEIGHT 320

// === Touch screen (disable if not using) ===
#define TOUCH_CS 255  // Disable touch

// === Font support ===
#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4
#define LOAD_FONT6
#define LOAD_FONT7
#define LOAD_FONT8

// === Smooth fonts ===
#define LOAD_GFXFF

// === SPI frequency (not used in parallel mode, but keep for compatibility) ===
#define SPI_FREQUENCY  40000000

// === Performance ===
#define TFT_BL 255  // Disable backlight control

#endif // USER_SETUP_H
