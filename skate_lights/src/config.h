#pragma once

// Central tunables and pin map for the skate_lights firmware.
//
// Everything here is meant to be adjusted empirically once the hardware is in
// hand. Pins use the XIAO ESP32-S3 silkscreen names (D0, A2, ...) which the
// Arduino variant header maps to the right GPIOs.

#include <Arduino.h>

// ---- Pin map (XIAO ESP32-S3) ----------------------------------------------
// FastLED's addLeds<> needs the data pin as a compile-time literal, so this one
// is a macro rather than a constexpr.
#define LED_DATA_PIN D0  // FCOB strip data in

// Battery sense: 2-resistor divider (100k/100k) from cell+ to A2.
// A2 = GPIO3 on the XIAO S3, which is ADC1 (ADC2 is unusable with WiFi).
constexpr uint8_t BATT_ADC_PIN = A2;

// Deferred to Milestone 1 (kept here so the pin map lives in one place):
//   #define BUTTON_PIN  D1   // momentary to GND, INPUT_PULLUP
//   #define I2C_SDA_PIN D4   // MPU6050 + future OLED
//   #define I2C_SCL_PIN D5

// ---- LED strip -------------------------------------------------------------
constexpr uint16_t NUM_LEDS = 34;  // USB bench bring-up; full strip is ~48
#define LED_TYPE WS2812B           // XGB1338 is WS2812B-compatible
#define COLOR_ORDER GRB

// Hard firmware brightness ceiling. Patterns must never exceed this; the render
// loop clamps every frame. ~50% of full scale keeps current/heat in check.
constexpr uint8_t BRIGHTNESS_CAP = 128;

// User-cyclable brightness levels (low / medium / high). All must be <= cap.
constexpr uint8_t BRIGHTNESS_LEVELS[] = {25, 70, 128};
constexpr uint8_t NUM_BRIGHTNESS_LEVELS = sizeof(BRIGHTNESS_LEVELS);

// Default solid-color pattern (sanity-check pattern). Azure reads clearly and
// draws less than full white.
constexpr uint8_t SOLID_R = 0;
constexpr uint8_t SOLID_G = 150;
constexpr uint8_t SOLID_B = 255;

// ---- Timing ----------------------------------------------------------------
constexpr uint8_t TARGET_FPS = 60;
constexpr uint32_t CONTROL_TICK_MS = 10;   // control task cadence
constexpr uint32_t AUTO_CYCLE_MS = 20000;  // auto-advance interval (no button in v0)
constexpr uint32_t BATT_SAMPLE_MS = 5000;  // battery sample interval

// ---- Battery monitoring ----------------------------------------------------
// Cell+ -> 100k -> A2 -> 100k -> GND  =>  Vcell = Vpin * 2.
constexpr float BATT_DIVIDER_RATIO = 2.0f;
// Per-sample averaging to smooth ADC noise.
constexpr uint8_t BATT_ADC_SAMPLES = 16;
// Below this measured cell voltage we assume nothing is connected to the
// divider (e.g. running from USB on the bench) and skip all SOC actions so we
// never false-trigger the low-battery warning or a forced sleep.
constexpr float BATT_PRESENT_MIN_V = 2.5f;
// State-of-charge thresholds (percent).
constexpr float BATT_LOW_PCT = 15.0f;      // slow red blink on LED 0
constexpr float BATT_CRITICAL_PCT = 5.0f;  // force deep sleep to protect cell

// ---- Motion detection (Milestone 1 - MPU6050 not present in v0) ------------
// Tunables live here now so the seams are obvious; they are unused until the
// MPU is wired and motion.cpp is implemented. Units are g (1g ~= 9.81 m/s^2).
//   constexpr float STRIDE_ACCEL_THRESHOLD = 0.25f;  // X/Y oscillation, 1-2 Hz
//   constexpr float JUMP_ACCEL_THRESHOLD   = 2.0f;   // Z-axis spike
