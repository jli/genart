#pragma once

// Battery monitoring and the low-battery LED overlay.
//
// poll() samples the divider on A2, converts to cell voltage, estimates SOC, and
// publishes to g_controls. isCritical() tells the control task when to force
// deep sleep. applyOverlay() draws the low-battery warning on top of whatever
// pattern is rendering and is called from the render task.

#include <FastLED.h>

namespace power {
// Configure the ADC. Call once from the control task.
void init();
// Sample battery and update g_controls. Call on the BATT_SAMPLE_MS cadence.
void poll();
// True when a real cell is present and below the critical threshold.
bool isCritical();
// Overlay the low-battery indicator onto the strip (slow red blink on LED 0).
// No-op when the battery is healthy or absent.
void applyOverlay(CRGB* leds, uint16_t n, uint32_t now);
}  // namespace power
