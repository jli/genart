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

#define LED_PIN     3
#define ENC_A       0
#define ENC_B       1
#define ENC_BTN     2
#define POT_PIN     A4  // board pin 4
#define NUM_LEDS    64
#define GRID_W      8
#define GRID_H      8
#define NUM_PATTERNS 9
#define NUM_PALETTES 4
#define MAX_BRIGHT   50
#define DEFAULT_BRIGHT 10

// Built-in LEDs
#define DOTSTAR_DATA  INTERNAL_DS_DATA
#define DOTSTAR_CLK   INTERNAL_DS_CLK
#define RED_LED_PIN   13

#define ENC_COUNTS_PER_DETENT 2

Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);
Adafruit_DotStar onboardDot(1, DOTSTAR_DATA, DOTSTAR_CLK, DOTSTAR_BRG);

volatile int encPos = 0;
int currentPattern = 0;
int currentPalette = 0;
unsigned long lastBtnPress = 0;
unsigned long tick = 0;
unsigned long redLedOff = 0;

// --- Pixel index from (x, y) — straight wiring ---
uint8_t xy(uint8_t x, uint8_t y) {
  return y * GRID_W + x;
}

// --- Encoder ISR (gray code state table) ---
static const int8_t encTable[16] = {
   0, -1,  1,  0,
   1,  0,  0, -1,
  -1,  0,  0,  1,
   0,  1, -1,  0
};
volatile uint8_t encState = 0;

void encoderISR() {
  encState <<= 2;
  encState |= (digitalRead(ENC_A) << 1) | digitalRead(ENC_B);
  encPos += encTable[encState & 0x0F];
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
  uint8_t r = ((c >> 16) & 0xFF) / 16;
  uint8_t g = ((c >> 8) & 0xFF) / 16;
  uint8_t b = (c & 0xFF) / 16;
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

  for (uint8_t y = 0; y < GRID_H; y++) {
    for (uint8_t x = 0; x < GRID_W; x++) {
      float b = ((x + y) & 1) ? blend : (1.0 - blend);
      strip.setPixelColor(xy(x, y), paletteColor(128, 255, (uint8_t)(b * 255)));
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
      } else if (dist == ring - 1) {
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
void patternFace() {
  clearGrid();
  uint32_t skin  = paletteColor(128, 100, 60);
  uint32_t eye   = strip.Color(255, 255, 255);
  uint32_t mouth = paletteColor(0, 255, 200);

  strip.fill(skin);

  bool blinking = (tick % 80) > 75;
  if (!blinking) {
    strip.setPixelColor(xy(2, 2), eye);
    strip.setPixelColor(xy(5, 2), eye);
  }

  strip.setPixelColor(xy(2, 5), mouth);
  strip.setPixelColor(xy(3, 5), mouth);
  strip.setPixelColor(xy(4, 5), mouth);
  strip.setPixelColor(xy(5, 5), mouth);
  strip.setPixelColor(xy(2, 4), mouth);
  strip.setPixelColor(xy(5, 4), mouth);
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
  bool visited[GRID_W][GRID_H] = {};
  const int8_t dx[] = { 1, 0, -1, 0 };
  const int8_t dy[] = { 0, 1, 0, -1 };

  int x = 3, y = 3;
  int dir = 0;
  for (uint8_t i = 0; i < NUM_LEDS; i++) {
    spiralOrder[i] = xy(x, y);
    visited[x][y] = true;

    int tryDir = (dir + 1) % 4;
    int nx = x + dx[tryDir];
    int ny = y + dy[tryDir];
    if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && !visited[nx][ny]) {
      dir = tryDir;
      x = nx;
      y = ny;
    } else {
      nx = x + dx[dir];
      ny = y + dy[dir];
      if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H && !visited[nx][ny]) {
        x = nx;
        y = ny;
      } else {
        dir = (dir + 3) % 4;
        x += dx[dir];
        y += dy[dir];
      }
    }
  }
  spiralBuilt = true;
}

void patternSpiral() {
  clearGrid();
  uint8_t cycle = tick / 3 % 160;

  uint8_t fillCount;
  if (cycle < NUM_LEDS) {
    fillCount = cycle + 1;
  } else if (cycle < NUM_LEDS + 16) {
    fillCount = NUM_LEDS;
  } else if (cycle < NUM_LEDS * 2 + 16) {
    uint8_t unfilled = cycle - (NUM_LEDS + 16);
    fillCount = NUM_LEDS;
    for (uint8_t i = 0; i < unfilled + 1; i++) {
      strip.setPixelColor(spiralOrder[i], 0);
    }
  } else {
    fillCount = 0;
  }

  for (uint8_t i = 0; i < fillCount; i++) {
    uint8_t hueVal = i * 4;
    strip.setPixelColor(spiralOrder[i], paletteColor(hueVal, 255, 255));
  }

  if (cycle < NUM_LEDS) {
    strip.setPixelColor(spiralOrder[cycle], strip.Color(255, 255, 255));
  }
  if (cycle >= NUM_LEDS + 16 && cycle < NUM_LEDS * 2 + 16) {
    uint8_t unfilled = cycle - (NUM_LEDS + 16);
    if (unfilled < NUM_LEDS) {
      strip.setPixelColor(spiralOrder[unfilled], strip.Color(255, 255, 255));
    }
  }
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
      placeApple();
    }

    if (snakeLen >= SNAKE_MAX_LEN) {
      snakeDie();
      return;
    }
  }

  clearGrid();
  uint8_t appleBright = 150 + 105 * ((tick / 2) % 2);
  strip.setPixelColor(xy(appleX, appleY), paletteColor(0, 255, appleBright));

  for (uint8_t i = 0; i < snakeLen; i++) {
    uint8_t hueVal = i * (256 / snakeLen);
    uint8_t bright = (i == 0) ? 255 : 180;
    strip.setPixelColor(xy(snakeX[i], snakeY[i]), paletteColor(hueVal, 255, bright));
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
  onboardDot.setBrightness(30);
  updateOnboardDot();

  randomSeed(analogRead(A4));

  buildSpiral();
}

void loop() {
  // --- Potentiometer → brightness ---
  uint16_t potVal = analogRead(POT_PIN);
  uint8_t bright = map(potVal, 0, 1023, 0, MAX_BRIGHT);
  if (bright < 1) bright = 1;
  strip.setBrightness(bright);

  // --- Encoder → pattern selection ---
  noInterrupts();
  int pos = encPos;
  interrupts();

  int newPattern = ((pos / ENC_COUNTS_PER_DETENT) % NUM_PATTERNS + NUM_PATTERNS) % NUM_PATTERNS;
  if (newPattern != currentPattern) {
    currentPattern = newPattern;
    clearGrid();
    strip.show();
    blinkRedLed();
    snakeInited = false;
    exploding = false;
  }

  // --- Button → cycle color palette ---
  if (digitalRead(ENC_BTN) == LOW) {
    if (millis() - lastBtnPress > 300) {
      currentPalette = (currentPalette + 1) % NUM_PALETTES;
      lastBtnPress = millis();
      updateOnboardDot();
      blinkRedLed();
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
    case 8: patternSnake();        break;
  }
  strip.show();
  tick++;

  delay(50);
}