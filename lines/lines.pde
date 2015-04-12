// TODO:
// - add state. have a vector[n] of lines+opacity, and fade over time.
//
// DONE:
// - instead of random ox, oy, use a dx, dy for continuity
// - instead of random origin change, have some momentum?

// consts
int size = 600;
int stride = 50;
int stride_half = 25;
int d_max = stride;  // max for dx/dy values
color bg = #111111;

// variable state
// TODO: replace with PVector.
int origin_dx = 0;
int origin_dy = 0;

int n_generations = 10;
PVector[] origins = new PVector[n_generations];


int bound(int lower, int upper, int v) {
  return max(lower, min(upper, v));
}

int torusify(int lower, int upper, float v) {
  if (v < lower) return upper;
  else if (v > upper) return lower;
  else return v;
}

void draw() {
  background(bg);

  // "age" all generations by 1.
  // first iteration: make last element (n_gen-1) equal to 2nd to last.
  // last iteration: make 1st element (1) equal to 0th.
  for (int i = n_generations-2; i >= 0; --i) {
    // only start when we find a non-null origin to copy
    if (origins[i] != null)
      origins[i+1] = origins[i];
  }

  // create new origin.
  origin_dx = bound(-d_max, d_max, origin_dx + round(random(-stride/4, stride/4)));
  origin_dy = bound(-d_max, d_max, origin_dy + round(random(-stride/4, stride/4)));

  // origins[0] still holds latest value. just update that..
  origins[0].set(torusify(0, size, origins[0].x + origin_dx),
                 torusify(0, size, origins[0].y + origin_dy));

  println("origins[0]: " + origins[0]);

  for (int n = 0; n < n_generations; ++n) {
    // linearly decay opacity from 90% to (90/#generations)%.
    stroke(230, 230, 230, 90/(n+1));
    for (int x = 0; x < size; x += stride) {
      for (int y = 0; y < size; y += stride) {
        line(origins[n].x, origins[n].y, x + stride_half, y + stride_half);
      }
    }
  }
}

void setup() {
  size(size, size);
  frameRate(10);
  strokeWeight(1);

  // setup initial origin.
  origins[0].set(round(random(stride_half, stride_half + size)),
                 round(random(stride_half, stride_half + size)));
  for (int i = 1; i < n_generations; ++i) {
    origins[i] = null;
  }
}
