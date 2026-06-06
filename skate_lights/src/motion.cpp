#include "motion.h"

#include <Arduino.h>

// v0 stub: no MPU6050 is wired, so we never have motion data. The cached state
// is a constant default. When the MPU lands in Milestone 1, this file gains the
// I2C init, periodic reads in poll(), stride/jump detection, and a small mutex
// (or per-field atomics) around the cached state since poll() and get() run on
// different cores. For now get() returns a constant, so no synchronization is
// needed.

namespace {
const MotionState kAbsent{};  // present=false, strideLevel=0, jumpEvent=false
}

namespace motion {

void init() {
  Serial.println(F("[motion] MPU6050 deferred to Milestone 1; motion absent"));
}

void poll() {
  // Nothing to sample in v0.
}

MotionState get() {
  return kAbsent;
}

bool present() {
  return false;
}

}  // namespace motion
