int W = 800;
int H = 600;

int MIN_SIZE = 4;
int MAX_SIZE = min(W, H) / 10;

int ACC_INC = 5;
float ACC_MAX = 5;

color C1 = color(50);
color C2 = color(250);

float clerp = 0.5;
float size = 10;
float sizevel = 0;
PVector pos = new PVector(random(0, W), random(0, H));
PVector vel = new PVector(random(-1, 1), random(-1, 1));
PVector acc = new PVector(random(-1, 1), random(-1, 1));

void setup() {
  size(100,100);
  surface.setSize(W, H);
  frameRate(30);
}

float randfuzz(float fuzz) { return random(-fuzz, fuzz); }
void fuzz_vector(PVector v, float fuzz, float limit) {
  v.add(randfuzz(fuzz), randfuzz(fuzz));
  v.limit(limit);
}

void draw() {
  // update ellipse size.
  sizevel = constrain(sizevel + random(-.5, .5), -2, 2);
  size = constrain(size + sizevel, MIN_SIZE, MAX_SIZE);

  // color.
  clerp += random(-.3, .3);
  if (clerp > 1) { clerp = 1 - (clerp - 1); }
  if (clerp < 0) { clerp = -clerp; }

  // acceleration.
  fuzz_vector(acc, ACC_INC, ACC_MAX);
  // velocity.
  vel.add(acc);
  vel.limit(size*.9);
  // position. bounce off walls.
  pos.add(vel);
  if (pos.x > W || pos.x < 0) {
    pos.x = constrain(pos.x, 0, W);
    vel.x *= -1;
    acc.x *= -1;
  }
  if (pos.y > H || pos.y < 0) {
    pos.y = constrain(pos.y, 0, H);
    vel.y *= -1;
    acc.y *= -1;
  }

  stroke(150, 150);
  fill(lerpColor(C1, C2, clerp));
  ellipse(pos.x, pos.y, size, size);
}
