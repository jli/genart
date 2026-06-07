#pragma once

// Shared control state, written by the control-core tasks (input, power,
// auto-cycle) and read by the render task on the other core. Each field is a
// std::atomic so cross-core reads/writes are well defined without a mutex; this
// works here only because every field is an independent scalar with a single
// logical writer. Anything needing multi-field consistency would need a lock.

#include <atomic>
#include "config.h"

enum class PowerStatus : uint8_t { Normal, Low, Critical };

struct Controls {
  std::atomic<uint8_t> patternIndex{4};     // boot on Smooth Cycle
  std::atomic<uint8_t> brightnessLevel{1};  // index into BRIGHTNESS_LEVELS (medium)
  std::atomic<bool> autoCycle{true};
  std::atomic<bool> sleeping{false};  // render task blanks the strip when set

  // Battery telemetry, published by power::poll().
  std::atomic<float> batteryVolts{0.0f};
  std::atomic<float> batteryPct{100.0f};
  std::atomic<bool> batteryPresent{false};
  std::atomic<PowerStatus> powerStatus{PowerStatus::Normal};
};

extern Controls g_controls;
