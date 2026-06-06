#pragma once

// Input handling. In v0 the only input is the USB serial console (the physical
// button is Milestone 1). poll() is non-blocking and runs on the control task.
// When the button is added, debounced short/long/double-press handling lives
// here too and drives the same g_controls fields these commands do.

namespace input {
// Print the command banner.
void init();
// Drain any pending serial bytes and dispatch commands. Non-blocking.
void poll();
}  // namespace input
