#include "power.h"

#include <Arduino.h>
#include "config.h"
#include "state.h"

// State-of-charge is estimated from a resting-voltage lookup table for a single
// li-ion cell. It is approximate and sags under load; good enough to drive the
// low/critical warnings, not for a fuel gauge. Voltages descending, percent
// descending. Linear interpolation between points.
namespace {

struct SocPoint {
  float volts;
  float pct;
};

const SocPoint kSocCurve[] = {
    {4.20f, 100}, {4.10f, 90}, {4.00f, 80}, {3.92f, 70}, {3.86f, 60}, {3.82f, 50},
    {3.79f, 40},  {3.77f, 30}, {3.73f, 20}, {3.69f, 10}, {3.61f, 5},  {3.30f, 0},
};
constexpr uint8_t kSocPoints = sizeof(kSocCurve) / sizeof(kSocCurve[0]);

float voltsToPct(float v) {
  if (v >= kSocCurve[0].volts) return 100.0f;
  if (v <= kSocCurve[kSocPoints - 1].volts) return 0.0f;
  for (uint8_t i = 1; i < kSocPoints; i++) {
    if (v >= kSocCurve[i].volts) {
      const SocPoint& hi = kSocCurve[i - 1];
      const SocPoint& lo = kSocCurve[i];
      float t = (v - lo.volts) / (hi.volts - lo.volts);
      return lo.pct + t * (hi.pct - lo.pct);
    }
  }
  return 0.0f;
}

float readCellVoltage() {
  uint32_t mv = 0;
  for (uint8_t i = 0; i < BATT_ADC_SAMPLES; i++) {
    mv += analogReadMilliVolts(BATT_ADC_PIN);  // uses the chip's eFuse ADC calibration
  }
  mv /= BATT_ADC_SAMPLES;
  return (mv / 1000.0f) * BATT_DIVIDER_RATIO;
}

}  // namespace

namespace power {

void init() {
  analogReadResolution(12);
  // 11dB attenuation gives the widest input range (~0..3.1V), which covers a
  // 4.2V cell through the /2 divider.
  analogSetPinAttenuation(BATT_ADC_PIN, ADC_11db);
}

void poll() {
  float v = readCellVoltage();

  if (v < BATT_PRESENT_MIN_V) {
    // No cell on the divider (bench/USB power). Don't act on a phantom reading.
    g_controls.batteryPresent.store(false);
    g_controls.batteryVolts.store(v);
    g_controls.batteryPct.store(100.0f);
    g_controls.powerStatus.store(PowerStatus::Normal);
    Serial.printf("[power] %.2fV (no battery detected)\n", v);
    return;
  }

  float pct = voltsToPct(v);
  PowerStatus st = PowerStatus::Normal;
  if (pct <= BATT_CRITICAL_PCT)
    st = PowerStatus::Critical;
  else if (pct <= BATT_LOW_PCT)
    st = PowerStatus::Low;

  g_controls.batteryPresent.store(true);
  g_controls.batteryVolts.store(v);
  g_controls.batteryPct.store(pct);
  g_controls.powerStatus.store(st);

  Serial.printf("[power] %.2fV  %.0f%%  %s\n", v, pct,
                st == PowerStatus::Critical ? "CRITICAL"
                : st == PowerStatus::Low    ? "LOW"
                                            : "ok");
}

bool isCritical() {
  return g_controls.batteryPresent.load() && g_controls.powerStatus.load() == PowerStatus::Critical;
}

void applyOverlay(CRGB* leds, uint16_t n, uint32_t now) {
  if (n == 0) return;
  if (!g_controls.batteryPresent.load()) return;
  if (g_controls.powerStatus.load() != PowerStatus::Low) return;
  // ~0.5 Hz blink: on for the first half of each 1s window.
  bool on = (now % 1000) < 500;
  leds[0] = on ? CRGB::Red : CRGB::Black;
}

}  // namespace power
