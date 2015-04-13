// TODO:
// - smoother movement instead of random dx/dy changes. curves!
// - mouse interaction to influence focus point movement
// - scale opacity so that older is more transparent?
// - animate colors?
// - only show subset of lines instead of full grid for more organic feel?
// - improve performance!
//
// DONE:
// - instead of random ox, oy, use a dx, dy for continuity
// - instead of random origin change, have some momentum?
// - add state. have a vector[n] of lines+opacity, and fade over time.

/* consts */
int size = 600;
int stride = size/10;
int stride_half = stride/2;
float delta_mag_sq_max = sq(stride/2);  // max for origin_delta magnitude
color bg = #111111;
int n_generations = 5;
boolean dbg = false;

/* variable state */
PVector origin_delta = new PVector(0, 0);
PVector[] origins = new PVector[n_generations];

/* helpers */
int bound(int lower, int upper, int v) {
  return max(lower, min(upper, v));
}

int torusify(int lower, int upper, int v) {
  if (v < lower) return upper;
  else if (v > upper) return lower;
  else return v;
}

/* LET'S GO! */
void draw() {
  if (dbg) println("\n-------------------DRAW!");
  background(bg);

  // "age" all generations by 1.
  // first iteration: make last element (n_gen-1) equal to 2nd to last.
  // last iteration: make 1st element (1) equal to 0th.
  for (int i = n_generations-2; i >= 0; --i)
    if (origins[i] != null)  // start when we find non-null to copy
      origins[i+1] = origins[i].get();  // copy

  // update origin_delta with smallish random vector.
  // TODO: constant-ify?
  origin_delta.add(round(random(-stride/15, stride/15)),
                   round(random(-stride/15, stride/15)),
                   0);
  // limit its magnitude.
  float delta_mag_sq = origin_delta.magSq();
  if (delta_mag_sq != 0.) {
    float scale = delta_mag_sq_max / delta_mag_sq;
    if (scale < 1.) {
      origin_delta.mult(scale);
    }
  }

  // origins[0] still holds latest value. just update that..
  origins[0].set(torusify(0, size, round(origins[0].x + origin_delta.x)),
                 torusify(0, size, round(origins[0].y + origin_delta.y)));

  for (int n = 0; n < n_generations; ++n) {
    if (dbg) print("gen #" + n + "; origin: ");
    if (origins[n] == null) {
      if (dbg) println("... is null! break!");
      break;
    }
    if (dbg) println(origins[n]);
    // linearly decay opacity
    // TODO: constant-ify?
    stroke(120, 150, 250, 30/(n+1));
    for (int x = 0; x < size; x += stride) {
      for (int y = 0; y < size; y += stride) {
        // TODO: kind of interesting, but a bit weird. think need more
        // state, so points that are off stay off, and fade in/out.
        // hmmm. if (random(0,1) < 0.1)
          line(origins[n].x, origins[n].y, x + stride_half, y + stride_half);
      }
    }
  }
}

void setup() {
  size(size, size);
  // TODO: constant-ify?
  frameRate(10);
  // TODO: constant-ify?
  strokeWeight(10);

  // setup initial origin.
  origins[0] = new PVector(round(random(stride_half, stride_half + size)),
                           round(random(stride_half, stride_half + size)));
}
