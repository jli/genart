// 8x8 WS2812 Baby Pattern Display — Trinket M0
//
// Wiring:
//   Pin 0 — Encoder A (CLK)
//   Pin 1 — Encoder B (DT)
//   Pin 2 — Encoder button (SW) — wire to GND
//   Pin 3 — WS2812 data in
//   Pin 4 — Potentiometer wiper (pot ends to 3.3V and GND)
//   Encoder common pins to GND
//   WS2812 power to external 5V (not USB)

#include <Adafruit_NeoPixel.h>
#include <Adafruit_DotStar.h>

// Wiring
#define ENC_A       0
#define ENC_B       1
#define ENC_BTN     2
#define LED_PIN     3
#define POT_PIN     A4  // board pin 4
// Built-in LEDs
#define DOTSTAR_DATA  INTERNAL_DS_DATA
#define DOTSTAR_CLK   INTERNAL_DS_CLK
#define RED_LED_PIN   13

// Grid
#define GRID_W      8
#define GRID_H      8
#define NUM_LEDS    GRID_W * GRID_H

// Config
#define NUM_PATTERNS 11
#define NUM_PALETTES 4
#define MAX_BRIGHT     50
#define DEFAULT_BRIGHT 10
#define DEFAULT_PATTERN 0  // 0=checker 1=breathe 2=sweep 3=rings 4=sparkle 5=face 6=rainbow 7=spiral 8=snake 9=balls 10=lissajous
#define TICK_MS        40
#define DEBUG_BAUD     115200
#define DEBUG_INTERVAL (10000 / TICK_MS)

static const char *PATTERN_NAMES[NUM_PATTERNS] = {
  "checker", "breathe", "sweep", "rings", "sparkle", "face",
  "rainbow", "spiral", "snake", "balls", "lissajous"
};
static const char *PALETTE_NAMES[NUM_PALETTES] = {
  "warm", "cool", "red", "rainbow"
};

#define ENC_COUNTS_PER_DETENT 4

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_DotStar onboardDot(1, DOTSTAR_DATA, DOTSTAR_CLK, DOTSTAR_BGR);

volatile int     encPos     = DEFAULT_PATTERN * ENC_COUNTS_PER_DETENT;
// Debug counters incremented inside the ISR — can't Serial.print from there,
// so we read these in the main loop under noInterrupts().
volatile uint16_t encCW      = 0;  // valid CW transitions (table returned +1)
volatile uint16_t encCCW     = 0;  // valid CCW transitions (table returned -1)
volatile uint16_t encInvalid = 0;  // table returned 0: impossible state, usually bounce
int currentPattern = DEFAULT_PATTERN;
int currentPalette = 0;
unsigned long lastBtnPress = 0;
unsigned long tick = 0;
unsigned long redLedOff = 0;

// --- Pixel index from (x, y) — straight wiring ---
uint8_t xy(uint8_t x, uint8_t y) {
  return (GRID_H - 1 - y) * GRID_W + (GRID_W - 1 - x);
}

// --- Encoder ISR (gray code / quadrature state machine) ---
//
// HOW QUADRATURE ENCODERS WORK
// ─────────────────────────────
// The encoder has two output pins (A and B). As the shaft turns, each
// pin produces a square wave. The two waves are 90° out of phase — hence
// "quadrature". With pull-up resistors, both pins idle HIGH between clicks.
//
// One full detent (click) produces exactly 4 signal edges:
//
//   CW  rotation:   A ‾|_|‾    B _|‾|_    (A leads B)
//   CCW rotation:   A _|‾|_    B ‾|_|‾    (B leads A)
//
// Each edge fires our ISR (CHANGE interrupts on both pins). We pack the
// previous and current states of both pins into a 4-bit index:
//
//   bits 3:2 = (prevB, prevA)  — the reading from last ISR call
//   bits 1:0 = (currB, currA)  — just read
//
// encTable[index] maps that 4-bit pattern to +1 (CW), -1 (CCW), or 0
// (invalid / noise). Over one full detent we accumulate ±4 counts; dividing
// by ENC_COUNTS_PER_DETENT converts that to ±1 pattern step.
//
// Table layout (rows = prevBA, cols = currBA):
//            curr 00  01  10  11
//   prev 00:   0  -1  +1   0
//   prev 01:  +1   0   0  -1
//   prev 10:  -1   0   0  +1
//   prev 11:   0  +1  -1   0
//
// The zeros on the diagonal (no change) and on the anti-diagonal (two bits
// changed simultaneously — physically impossible in one step) both map to 0.
//
// WHY IT GETS WONKY
// ─────────────────
// 1. Contact bounce: mechanical encoders don't make clean transitions.
//    A single detent can trigger 10–20 ISR calls. The state table discards
//    impossible transitions (the 0-entries), but if bounce creates an even
//    number of spurious valid-looking transitions they can cancel a real
//    step or inject a phantom one.
//
// 2. ISR latency: digitalRead() is relatively slow. If A and B change
//    within a few microseconds of each other (common at the start of a
//    detent), the second ISR call may see a state that has already moved
//    past the intermediate value — recording a jump of two bits, which
//    maps to 0 (discarded). That's a lost step.
//
// 3. ENC_COUNTS_PER_DETENT mismatch: some encoders produce only 2 edges
//    per detent, not 4. If every other click is silently ignored, try
//    changing ENC_COUNTS_PER_DETENT to 2.
//
// DEBUGGING STRATEGY
// ──────────────────
// encCW / encCCW count valid transitions; encInvalid counts 0-table hits.
//
//   High encInvalid relative to (encCW+encCCW) → contact bounce.
//   Fix: 100 Ω series + 10 nF to GND on each encoder pin (RC low-pass),
//   or add software debounce (but that can eat real fast edges).
//
//   "enc [partial]" in the log means encPos moved but landed between
//   detents. A series of partials with no clean landing = lost transition.
//   Try slowing down turns; if it only misbehaves at high speed, the ISR
//   is losing edges (latency problem).
//
//   "enc BOUNCE" in the log = invalid count exceeded valid count in a
//   single 50 ms loop iteration — heavy bounce, hardware filter advised.
//
//   Pattern jumps by 2 or skips backward: accumulated phantom ±4 from
//   bounce. Hardware filter is the reliable fix.

static const int8_t encTable[16] = {
   0, -1,  1,  0,
   1,  0,  0, -1,
  -1,  0,  0,  1,
   0,  1, -1,  0
};
volatile uint8_t encState = 0;

void encoderISR() {
  encState <<= 2;
  encState |= (digitalRead(ENC_B) << 1) | digitalRead(ENC_A);
  int8_t delta = encTable[encState & 0x0F];
  encPos += delta;
  // Increment debug counters — no Serial here, ISR must be fast.
  if      (delta > 0) encCW++;
  else if (delta < 0) encCCW++;
  else                encInvalid++;  // noise, bounce, or simultaneous edge
}

// --- Color palettes ---
struct Palette {
  uint8_t hueLo;
  uint8_t hueHi;
  bool fullRainbow;
  uint32_t indicatorColor;
};

Palette palettes[NUM_PALETTES] = {
  {  0,  40, false, 0xFF4400 },  // warm
  { 96, 160, false, 0x0044FF },  // cool
  {  0,   0, false, 0xFF0000 },  // mono red
  {  0, 255, true,  0xFF00FF },  // full rainbow
};

uint16_t paletteHue(uint8_t val) {
  Palette &p = palettes[currentPalette];
  if (p.fullRainbow) return (uint16_t)val << 8;
  uint8_t hue = p.hueLo + ((uint16_t)(p.hueHi - p.hueLo) * val / 255);
  return (uint16_t)hue << 8;
}

uint32_t paletteColor(uint8_t val, uint8_t sat, uint8_t bright) {
  return strip.ColorHSV(paletteHue(val), sat, bright);
}

void clearGrid() {
  strip.clear();
}

// --- Status LED helpers ---
void updateOnboardDot() {
  uint32_t c = palettes[currentPalette].indicatorColor;
  uint8_t r = (c >> 16) & 0xFF;
  uint8_t g = (c >> 8) & 0xFF;
  uint8_t b = c & 0xFF;
  onboardDot.setPixelColor(0, r, g, b);
  onboardDot.show();
}

void blinkRedLed() {
  digitalWrite(RED_LED_PIN, HIGH);
  redLedOff = millis() + 150;
}

// =============================================================
// Pattern 0: Fading checkerboard
// =============================================================
void patternCheckerboard() {
  float phase = (float)(tick % 80) / 80.0 * 2.0 * PI;
  float blend = (sin(phase) + 1.0) / 2.0;
  uint8_t hueVal = (tick / 4) % 256;

  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      if ((x + y) & 1) {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, (uint8_t)(blend * 255)));
      } else {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, (uint8_t)((1.0 - blend) * 255)));
      }
    }
  }
}

// =============================================================
// Pattern 1: Color breathing pulse
// =============================================================
void patternBreathe() {
  float phase = (float)(tick % 60) / 60.0 * 2.0 * PI;
  uint8_t brightness = (uint8_t)(127.5 + 127.5 * sin(phase));
  uint8_t hueVal = (tick / 4) % 256;
  strip.fill(paletteColor(hueVal, 255, brightness));
}

// =============================================================
// Pattern 2: Sweeping column
// =============================================================
void patternSweep() {
  clearGrid();
  uint8_t col = (tick / 6) % (GRID_W * 2);
  if (col >= GRID_W) col = GRID_W * 2 - 1 - col;

  uint8_t hueVal = (tick / 3) % 256;
  for (uint8_t y = 0; y < GRID_H; y++) {
    strip.setPixelColor(xy(col, y), paletteColor(hueVal, 255, 255));
    if (col > 0)
      strip.setPixelColor(xy(col - 1, y), paletteColor(hueVal, 255, 80));
    if (col < GRID_W - 1)
      strip.setPixelColor(xy(col + 1, y), paletteColor(hueVal, 255, 80));
  }
}

// =============================================================
// Pattern 3: Expanding rings from center
// =============================================================
void patternRings() {
  clearGrid();
  float cx = 3.5, cy = 3.5;
  uint8_t maxDist = 5;
  uint8_t ring = (tick / 5) % (maxDist + 2);
  uint8_t hueVal = (tick / 10) % 256;

  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      float dx = abs((float)x - cx);
      float dy = abs((float)y - cy);
      uint8_t dist = (uint8_t)(max(dx, dy) + 0.5);
      if (dist == ring) {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, 255));
      } else if (ring > 0 && dist == ring - 1) {
        strip.setPixelColor(xy(x, y), paletteColor(hueVal, 255, 60));
      }
    }
  }
}

// =============================================================
// Pattern 4: Slow sparkle
// =============================================================
uint8_t sparklePixels[8];
uint8_t sparkleHues[8];
uint8_t sparkleBright[8];

void patternSparkle() {
  for (uint8_t i = 0; i < 8; i++) {
    if (sparkleBright[i] > 4) sparkleBright[i] -= 4;
    else sparkleBright[i] = 0;
  }

  if ((tick % 8) == 0) {
    uint8_t slot = random(8);
    sparklePixels[slot] = random(NUM_LEDS);
    sparkleHues[slot] = random(256);
    sparkleBright[slot] = 255;
  }

  clearGrid();
  for (uint8_t i = 0; i < 8; i++) {
    if (sparkleBright[i] > 0) {
      strip.setPixelColor(sparklePixels[i],
        paletteColor(sparkleHues[i], 255, sparkleBright[i]));
    }
  }
}

// =============================================================
// Pattern 5: Simple face with blinking eyes
// =============================================================
// :)  ;)  :D  :P  :O
static const char *EXPR_NAMES[] = { ":)", ";)", ":D", ":P", ":O" };
#define NUM_EXPRS 5

void patternFace() {
  clearGrid();

  static uint8_t lastExpr = 255;
  static bool lastBlink = false;

  uint32_t eyeC   = strip.Color(255, 255, 255);
  uint32_t mouthC = paletteColor(0, 255, 220);

  uint8_t blinkPhase = tick % 50;
  bool eyesFull = blinkPhase < 47;
  bool eyesHalf = blinkPhase == 47;

  uint8_t expr = (tick / 100) % NUM_EXPRS;

  if (expr != lastExpr) {
    Serial.print("face -> "); Serial.println(EXPR_NAMES[expr]);
    lastExpr = expr;
  }
  bool blinking = !eyesFull && !eyesHalf;
  if (blinking && !lastBlink) Serial.println("face blink");
  lastBlink = blinking;

  // --- Eyes ---
  switch (expr) {
    case 1: // ;) wink — left closed dash, right open 2×2
      strip.setPixelColor(xy(1, 2), eyeC); strip.setPixelColor(xy(2, 2), eyeC);
      strip.setPixelColor(xy(5, 1), eyeC); strip.setPixelColor(xy(6, 1), eyeC);
      strip.setPixelColor(xy(5, 2), eyeC); strip.setPixelColor(xy(6, 2), eyeC);
      break;

    case 4: // :O surprised — wide open, no blink
      strip.setPixelColor(xy(1, 1), eyeC); strip.setPixelColor(xy(2, 1), eyeC);
      strip.setPixelColor(xy(5, 1), eyeC); strip.setPixelColor(xy(6, 1), eyeC);
      strip.setPixelColor(xy(1, 2), eyeC); strip.setPixelColor(xy(2, 2), eyeC);
      strip.setPixelColor(xy(5, 2), eyeC); strip.setPixelColor(xy(6, 2), eyeC);
      break;

    default: // :) :D :P — normal 2×2 with blink
      if (eyesFull) {
        strip.setPixelColor(xy(1, 1), eyeC); strip.setPixelColor(xy(2, 1), eyeC);
        strip.setPixelColor(xy(5, 1), eyeC); strip.setPixelColor(xy(6, 1), eyeC);
        strip.setPixelColor(xy(1, 2), eyeC); strip.setPixelColor(xy(2, 2), eyeC);
        strip.setPixelColor(xy(5, 2), eyeC); strip.setPixelColor(xy(6, 2), eyeC);
      } else if (eyesHalf) {
        strip.setPixelColor(xy(1, 2), eyeC); strip.setPixelColor(xy(2, 2), eyeC);
        strip.setPixelColor(xy(5, 2), eyeC); strip.setPixelColor(xy(6, 2), eyeC);
      }
      break;
  }

  // --- Mouth ---
  switch (expr) {
    case 0: // :) smile
    case 1: // ;) wink
      // . M . . . . M .
      strip.setPixelColor(xy(1, 5), mouthC); strip.setPixelColor(xy(6, 5), mouthC);
      // . . M M M M . .
      strip.setPixelColor(xy(2, 6), mouthC); strip.setPixelColor(xy(3, 6), mouthC);
      strip.setPixelColor(xy(4, 6), mouthC); strip.setPixelColor(xy(5, 6), mouthC);
      break;

    case 2: // :D open grin — D shape
      // . M M M M M M .
      strip.setPixelColor(xy(1, 5), mouthC); strip.setPixelColor(xy(2, 5), mouthC);
      strip.setPixelColor(xy(3, 5), mouthC); strip.setPixelColor(xy(4, 5), mouthC);
      strip.setPixelColor(xy(5, 5), mouthC); strip.setPixelColor(xy(6, 5), mouthC);
      // . M . . . . M .
      strip.setPixelColor(xy(1, 6), mouthC); strip.setPixelColor(xy(6, 6), mouthC);
      // . . M M M M . .
      strip.setPixelColor(xy(2, 7), mouthC); strip.setPixelColor(xy(3, 7), mouthC);
      strip.setPixelColor(xy(4, 7), mouthC); strip.setPixelColor(xy(5, 7), mouthC);
      break;

    case 3: // :P flat mouth + tongue hanging from right side
      // . M M M M M M .
      strip.setPixelColor(xy(1, 5), mouthC); strip.setPixelColor(xy(2, 5), mouthC);
      strip.setPixelColor(xy(3, 5), mouthC); strip.setPixelColor(xy(4, 5), mouthC);
      strip.setPixelColor(xy(5, 5), mouthC); strip.setPixelColor(xy(6, 5), mouthC);
      // . . . . M   M .
      strip.setPixelColor(xy(4, 6), mouthC);
      strip.setPixelColor(xy(6, 6), mouthC);
      // . . . . M M M .
      strip.setPixelColor(xy(4, 7), mouthC);
      strip.setPixelColor(xy(5, 7), mouthC);
      strip.setPixelColor(xy(6, 7), mouthC);
      break;

    case 4: // :O rounded O
      // . . . M M . . .
      strip.setPixelColor(xy(3, 4), mouthC); strip.setPixelColor(xy(4, 4), mouthC);
      // . . M . . M . .
      strip.setPixelColor(xy(2, 5), mouthC); strip.setPixelColor(xy(5, 5), mouthC);
      // . . M . . M . .
      strip.setPixelColor(xy(2, 6), mouthC); strip.setPixelColor(xy(5, 6), mouthC);
      // . . . M M . . .
      strip.setPixelColor(xy(3, 7), mouthC); strip.setPixelColor(xy(4, 7), mouthC);
      break;
  }
}

// =============================================================
// Pattern 6: Slow diagonal rainbow wipe
// =============================================================
void patternRainbow() {
  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      uint8_t val = (x + y) * 16 + tick * 2;
      strip.setPixelColor(xy(x, y), paletteColor(val, 255, 200));
    }
  }
}

// =============================================================
// Pattern 7: Spiral fill from center, then unwind
// =============================================================
uint8_t spiralOrder[NUM_LEDS];
bool spiralBuilt = false;

void buildSpiral() {
  if (spiralBuilt) return;
  int top = 0, bottom = GRID_H - 1, left = 0, right = GRID_W - 1;
  uint8_t idx = 0;

  while (top <= bottom && left <= right) {
    for (int x = left;  x <= right;  x++) spiralOrder[idx++] = xy(x, top);
    top++;
    for (int y = top;   y <= bottom; y++) spiralOrder[idx++] = xy(right, y);
    right--;
    if (top <= bottom) {
      for (int x = right; x >= left; x--) spiralOrder[idx++] = xy(x, bottom);
      bottom--;
    }
    if (left <= right) {
      for (int y = bottom; y >= top; y--) spiralOrder[idx++] = xy(left, y);
      left++;
    }
  }
  spiralBuilt = true;
}

// Returns the i-th pixel in fill order: inward = outside→center, outward = center→outside
uint8_t spiralAt(uint8_t i, bool inward) {
  return inward ? spiralOrder[i] : spiralOrder[NUM_LEDS - 1 - i];
}

void patternSpiral() {
  clearGrid();
  unsigned long t3 = tick / 3;
  uint8_t cycle = t3 % 144;
  bool inward = (t3 / 144) % 2 == 0;

  if (cycle < NUM_LEDS) {
    // Phase 1: fill — pixels 0..cycle-1 lit, cycle is white tracer
    for (uint8_t i = 0; i < cycle; i++)
      strip.setPixelColor(spiralAt(i, inward), paletteColor(i * 4, 255, 255));
    strip.setPixelColor(spiralAt(cycle, inward), strip.Color(255, 255, 255));

  } else if (cycle < NUM_LEDS + 8) {
    // Phase 2: hold full
    for (uint8_t i = 0; i < NUM_LEDS; i++)
      strip.setPixelColor(spiralAt(i, inward), paletteColor(i * 4, 255, 255));

  } else if (cycle < NUM_LEDS * 2 + 8) {
    // Phase 3: erase in same order — eraseIdx is white tracer, pixels after remain lit
    uint8_t eraseIdx = cycle - (NUM_LEDS + 8);
    for (uint8_t i = eraseIdx + 1; i < NUM_LEDS; i++)
      strip.setPixelColor(spiralAt(i, inward), paletteColor(i * 4, 255, 255));
    strip.setPixelColor(spiralAt(eraseIdx, inward), strip.Color(255, 255, 255));
  }
  // Phase 4: hold empty — clearGrid() already handled it
}

// =============================================================
// Pattern 8: Autonomous snake (no wrapping, death explosion)
// =============================================================
#define SNAKE_MAX_LEN 20
#define SNAKE_INIT_LEN 3
#define SNAKE_SPEED 4

int8_t snakeX[SNAKE_MAX_LEN];
int8_t snakeY[SNAKE_MAX_LEN];
uint8_t snakeLen;
int8_t snakeDirX, snakeDirY;
int8_t appleX, appleY;
bool snakeInited = false;

bool exploding = false;
uint8_t explosionTick = 0;
int8_t explosionX, explosionY;
uint32_t deathFrame[NUM_LEDS];

void placeApple() {
  for (uint8_t attempts = 0; attempts < 100; attempts++) {
    appleX = random(GRID_W);
    appleY = random(GRID_H);
    bool onSnake = false;
    for (uint8_t i = 0; i < snakeLen; i++) {
      if (snakeX[i] == appleX && snakeY[i] == appleY) {
        onSnake = true;
        break;
      }
    }
    if (!onSnake) return;
  }
}

void snakeInit() {
  snakeLen = SNAKE_INIT_LEN;
  for (uint8_t i = 0; i < snakeLen; i++) {
    snakeX[i] = 3 - i;
    snakeY[i] = 3;
  }
  snakeDirX = 1;
  snakeDirY = 0;
  placeApple();
  snakeInited = true;
}

bool snakeInBounds(int8_t x, int8_t y) {
  return x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
}

bool snakeHitsSelf(int8_t x, int8_t y) {
  for (uint8_t i = 0; i < snakeLen - 1; i++) {
    if (snakeX[i] == x && snakeY[i] == y) return true;
  }
  return false;
}

void snakeDie() {
  Serial.print("snake died len="); Serial.print(snakeLen);
  Serial.print(" at ("); Serial.print(snakeX[0]); Serial.print(","); Serial.print(snakeY[0]); Serial.println(")");
  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    deathFrame[i] = strip.getPixelColor(i);
  }
  explosionX = snakeX[0];
  explosionY = snakeY[0];
  if (explosionX < 0) explosionX = 0;
  if (explosionX >= GRID_W) explosionX = GRID_W - 1;
  if (explosionY < 0) explosionY = 0;
  if (explosionY >= GRID_H) explosionY = GRID_H - 1;
  exploding = true;
  explosionTick = 0;
}

void snakeChooseDir() {
  int8_t dirs[][2] = {
    { snakeDirX, snakeDirY },
    { (int8_t)-snakeDirY, snakeDirX },
    { snakeDirY, (int8_t)-snakeDirX },
  };

  int bestDist = 999;
  int8_t bestDX = snakeDirX, bestDY = snakeDirY;
  bool anyValid = false;

  for (uint8_t d = 0; d < 3; d++) {
    int8_t nx = snakeX[0] + dirs[d][0];
    int8_t ny = snakeY[0] + dirs[d][1];

    if (!snakeInBounds(nx, ny)) continue;
    if (snakeHitsSelf(nx, ny)) continue;

    anyValid = true;
    int dist = abs(nx - appleX) + abs(ny - appleY);
    if (dist < bestDist) {
      bestDist = dist;
      bestDX = dirs[d][0];
      bestDY = dirs[d][1];
    }
  }

  if (!anyValid) {
    snakeDie();
    return;
  }

  snakeDirX = bestDX;
  snakeDirY = bestDY;
}

void patternSnake() {
  if (exploding) {
    clearGrid();
    uint8_t radius = explosionTick / 2;
    uint8_t maxRadius = GRID_W + GRID_H;

    for (uint8_t y = 0; y < GRID_H; y++) {
      for (uint8_t x = 0; x < GRID_W; x++) {
        uint8_t dist = abs(x - explosionX) + abs(y - explosionY);
        if (dist > radius) {
          strip.setPixelColor(xy(x, y), deathFrame[xy(x, y)]);
        } else if (dist == radius) {
          strip.setPixelColor(xy(x, y), strip.Color(255, 255, 255));
        }
      }
    }

    explosionTick++;
    if (radius > maxRadius) {
      exploding = false;
      snakeInited = false;
    }
    return;
  }

  if (!snakeInited) snakeInit();

  if ((tick % SNAKE_SPEED) == 0) {
    snakeChooseDir();
    if (exploding) return;

    for (int i = snakeLen - 1; i > 0; i--) {
      snakeX[i] = snakeX[i - 1];
      snakeY[i] = snakeY[i - 1];
    }
    snakeX[0] += snakeDirX;
    snakeY[0] += snakeDirY;

    if (!snakeInBounds(snakeX[0], snakeY[0])) {
      snakeDie();
      return;
    }

    if (snakeX[0] == appleX && snakeY[0] == appleY) {
      if (snakeLen < SNAKE_MAX_LEN) {
        snakeLen++;
        snakeX[snakeLen - 1] = snakeX[snakeLen - 2];
        snakeY[snakeLen - 1] = snakeY[snakeLen - 2];
      }
      Serial.print("snake apple len="); Serial.println(snakeLen);
      placeApple();
    }

    if (snakeLen >= SNAKE_MAX_LEN) {
      snakeDie();
      return;
    }
  }

  clearGrid();
  uint8_t appleBright = 150 + 105 * ((tick / 2) % 2);
  strip.setPixelColor(xy(appleX, appleY), strip.Color(appleBright, appleBright, appleBright));

  for (uint8_t i = 0; i < snakeLen; i++) {
    uint8_t hueVal = i * (256 / snakeLen);
    uint8_t bright = (i == 0) ? 255 : 180;
    strip.setPixelColor(xy(snakeX[i], snakeY[i]), paletteColor(hueVal, 255, bright));
  }
}

// =============================================================
// Pattern 9: Bouncing balls with trails
// =============================================================
#define NUM_BALLS 2

float ballX[NUM_BALLS], ballY[NUM_BALLS];
float ballVX[NUM_BALLS], ballVY[NUM_BALLS];
uint8_t ballHue[NUM_BALLS];
uint8_t ballTrailBright[NUM_LEDS];
uint8_t ballTrailHue[NUM_LEDS];
bool ballsInited = false;

void ballsInit() {
  for (uint8_t i = 0; i < NUM_BALLS; i++) {
    ballX[i]  = 1.0f + random(6);
    ballY[i]  = 1.0f + random(6);
    float spd = 0.25f + random(3) * 0.1f;
    ballVX[i] = spd * (random(2) ? 1.0f : -1.0f);
    ballVY[i] = spd * (random(2) ? 1.0f : -1.0f);
    ballHue[i] = i * 128;  // opposite sides of color wheel
  }
  memset(ballTrailBright, 0, NUM_LEDS);
  ballsInited = true;
}

void patternBalls() {
  if (!ballsInited) ballsInit();

  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    if (ballTrailBright[i] > 18) ballTrailBright[i] -= 18;
    else ballTrailBright[i] = 0;
  }

  for (uint8_t i = 0; i < NUM_BALLS; i++) {
    ballX[i] += ballVX[i];
    ballY[i] += ballVY[i];

    if (ballX[i] < 0.0f)          { ballX[i] = 0.0f;          ballVX[i] = -ballVX[i]; }
    if (ballX[i] > GRID_W - 1.0f) { ballX[i] = GRID_W - 1.0f; ballVX[i] = -ballVX[i]; }
    if (ballY[i] < 0.0f)          { ballY[i] = 0.0f;          ballVY[i] = -ballVY[i]; }
    if (ballY[i] > GRID_H - 1.0f) { ballY[i] = GRID_H - 1.0f; ballVY[i] = -ballVY[i]; }

    uint8_t px = (uint8_t)(ballX[i] + 0.5f);
    uint8_t py = (uint8_t)(ballY[i] + 0.5f);
    if (px >= GRID_W) px = GRID_W - 1;
    if (py >= GRID_H) py = GRID_H - 1;
    ballTrailBright[xy(px, py)] = 255;
    ballTrailHue[xy(px, py)]    = ballHue[i];
  }

  clearGrid();
  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      if (ballTrailBright[xy(x, y)] > 0)
        strip.setPixelColor(xy(x, y),
          paletteColor(ballTrailHue[xy(x, y)], 255, ballTrailBright[xy(x, y)]));
    }
  }
  for (uint8_t i = 0; i < NUM_BALLS; i++) {
    uint8_t px = (uint8_t)(ballX[i] + 0.5f);
    uint8_t py = (uint8_t)(ballY[i] + 0.5f);
    if (px >= GRID_W) px = GRID_W - 1;
    if (py >= GRID_H) py = GRID_H - 1;
    strip.setPixelColor(xy(px, py), paletteColor(ballHue[i], 200, 255));
  }
}

// =============================================================
// Pattern 10: Lissajous tracer
// =============================================================
uint8_t lissTrail[NUM_LEDS];

void patternLissajous() {
  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    if (lissTrail[i] > 10) lissTrail[i] -= 10;
    else lissTrail[i] = 0;
  }

  float a  = 2.0f + 0.7f * sinf(tick * 0.004f);  // ratio drifts ~2:3 over time
  float t0 = (tick - 1) * 0.1f;
  float t1 = tick * 0.1f;
  for (uint8_t s = 0; s <= 8; s++) {
    float t  = t0 + (t1 - t0) * s / 8.0f;
    float xf = sinf(a * t);
    float yf = sinf(3.0f * t + 1.2f);
    uint8_t px = (uint8_t)((xf + 1.0f) * 0.5f * (GRID_W - 1) + 0.5f);
    uint8_t py = (uint8_t)((yf + 1.0f) * 0.5f * (GRID_H - 1) + 0.5f);
    if (px >= GRID_W) px = GRID_W - 1;
    if (py >= GRID_H) py = GRID_H - 1;
    lissTrail[xy(px, py)] = 255;
  }

  clearGrid();
  uint8_t hueShift = tick / 2;
  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      if (lissTrail[xy(x, y)] > 0)
        strip.setPixelColor(xy(x, y),
          paletteColor(hueShift + x * 16 + y * 8, 255, lissTrail[xy(x, y)]));
    }
  }
}

// =============================================================
// Main
// =============================================================

void setup() {
  pinMode(ENC_A, INPUT_PULLUP);
  pinMode(ENC_B, INPUT_PULLUP);
  pinMode(ENC_BTN, INPUT_PULLUP);
  pinMode(RED_LED_PIN, OUTPUT);

  attachInterrupt(digitalPinToInterrupt(ENC_A), encoderISR, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENC_B), encoderISR, CHANGE);

  strip.begin();
  strip.setBrightness(DEFAULT_BRIGHT);
  strip.show();

  onboardDot.begin();
  onboardDot.setBrightness(80);
  updateOnboardDot();

  randomSeed(analogRead(A4));

  buildSpiral();

  Serial.begin(DEBUG_BAUD);
  Serial.print("sulagrid ready  patterns="); Serial.print(NUM_PATTERNS);
  Serial.print(" palettes="); Serial.print(NUM_PALETTES);
  Serial.print(" maxbright="); Serial.println(MAX_BRIGHT);
}

void loop() {
  // --- Potentiometer → brightness ---
  static uint8_t lastReportedBright = 0;
  uint16_t potVal = analogRead(POT_PIN);
  uint8_t bright = map(potVal, 0, 1023, 0, MAX_BRIGHT);
  if (bright < 1) bright = 1;
  strip.setBrightness(bright);
  if (abs((int)bright - (int)lastReportedBright) > 2) {
    Serial.print("bright="); Serial.println(bright);
    lastReportedBright = bright;
  }

  // --- Encoder → pattern selection ---
  // Read pos and all debug counters in one critical section so they're
  // consistent with each other (an ISR between two separate reads could
  // increment counters against a pos we've already consumed).
  static int     lastLogPos = DEFAULT_PATTERN * ENC_COUNTS_PER_DETENT;
  static uint16_t lastCW = 0, lastCCW = 0, lastInv = 0;

  noInterrupts();
  int      pos = encPos;
  uint16_t cw  = encCW;
  uint16_t ccw = encCCW;
  uint16_t inv = encInvalid;
  interrupts();

  // Log every raw position change. "[partial]" means we're mid-detent —
  // normal while turning, but if you only ever see partial and never a
  // clean multiple of ENC_COUNTS_PER_DETENT, a transition is being lost.
  if (pos != lastLogPos) {
    Serial.print("enc pos="); Serial.print(pos);
    Serial.print(" delta="); Serial.print(pos - lastLogPos);
    if (pos % ENC_COUNTS_PER_DETENT != 0) Serial.print(" [partial]");
    Serial.println();
    lastLogPos = pos;
  }

  // Bounce warning: fires when invalid transitions outnumber valid ones
  // within this loop tick. Hardware RC filter (100Ω + 10nF) is the fix.
  uint16_t newValid = (cw - lastCW) + (ccw - lastCCW);
  uint16_t newInv   = inv - lastInv;
  if (newInv > newValid && newInv > 0) {
    Serial.print("enc BOUNCE cw="); Serial.print(cw);
    Serial.print(" ccw="); Serial.print(ccw);
    Serial.print(" inv="); Serial.println(inv);
  }
  lastCW = cw; lastCCW = ccw; lastInv = inv;

  int newPattern = ((pos / ENC_COUNTS_PER_DETENT) % NUM_PATTERNS + NUM_PATTERNS) % NUM_PATTERNS;
  if (newPattern != currentPattern) {
    currentPattern = newPattern;
    clearGrid();
    strip.show();
    blinkRedLed();
    snakeInited = false;
    exploding = false;
    ballsInited = false;
    Serial.print("pattern -> "); Serial.print(currentPattern);
    Serial.print(" ("); Serial.print(PATTERN_NAMES[currentPattern]);
    Serial.print(") encPos="); Serial.print(pos);
    Serial.print(" cw="); Serial.print(cw);
    Serial.print(" ccw="); Serial.print(ccw);
    Serial.print(" inv="); Serial.println(inv);
  }

  // --- Button → cycle color palette ---
  if (digitalRead(ENC_BTN) == LOW) {
    if (millis() - lastBtnPress > 300) {
      currentPalette = (currentPalette + 1) % NUM_PALETTES;
      lastBtnPress = millis();
      updateOnboardDot();
      blinkRedLed();
      Serial.print("palette -> "); Serial.print(currentPalette);
      Serial.print(" ("); Serial.print(PALETTE_NAMES[currentPalette]); Serial.println(")");
    }
  }

  // --- Turn off red LED after blink duration ---
  if (redLedOff > 0 && millis() >= redLedOff) {
    digitalWrite(RED_LED_PIN, LOW);
    redLedOff = 0;
  }

  // --- Run current pattern ---
  switch (currentPattern) {
    case 0: patternCheckerboard(); break;
    case 1: patternBreathe();      break;
    case 2: patternSweep();        break;
    case 3: patternRings();        break;
    case 4: patternSparkle();      break;
    case 5: patternFace();         break;
    case 6: patternRainbow();      break;
    case 7: patternSpiral();       break;
    case 8:  patternSnake();      break;
    case 9:  patternBalls();      break;
    case 10: patternLissajous();  break;
  }
  strip.show();

  if (tick % DEBUG_INTERVAL == 0) {
    Serial.print("tick="); Serial.print(tick);
    Serial.print(" pat="); Serial.print(PATTERN_NAMES[currentPattern]);
    Serial.print(" pal="); Serial.print(PALETTE_NAMES[currentPalette]);
    Serial.print(" bright="); Serial.println(bright);
  }

  tick++;
  delay(TICK_MS);
}
