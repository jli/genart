#pragma once

// Motion input abstraction.
//
// In v0 there is no MPU6050 on the bus, so this is a stub that always reports
// "not present" with zeroed motion. It exists now so the patterns and the
// auto-cycle logic can consume a stable interface; wiring up the real MPU6050
// in Milestone 1 means implementing init()/poll() here and nothing else has to
// change. Motion-reactive patterns degrade to a calm idle look while present is
// false (see patterns.cpp).

#include <stdint.h>

struct MotionState {
  bool present = false;    // MPU detected and producing data (always false in v0)
  float strideLevel = 0;   // 0..1 stride cadence intensity
  bool jumpEvent = false;  // one-shot: true for the read following a Z-axis spike
};

namespace motion {
// Initialize the sensor. v0: logs that motion is deferred and stays absent.
void init();
// Sample the sensor and update cached state. Called from the control task.
void poll();
// Latest motion snapshot, safe to read from the render task.
MotionState get();
// Convenience: is a working sensor present? Drives auto-cycle's pattern filter.
bool present();
}  // namespace motion
