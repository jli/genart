// TODOs:
// - gets weird at edges. consider bounding at edges, or making distance
//   computation work across edges.
// - indication when nodes lerp velocities
// - mouse interaction to create new ducks
// - tweak behavior to work well across scales
// - smoother changes w/ accel variable to change vel over time?
// - interaction between all ducks? prob need quadtree...?

import java.util.Map;

// Set either full or dims.
boolean FULL = false;
int[] DIM = {800, 800};

int MIN_GROUPS = 3;
int MAX_GROUPS = FULL ? 10 : 5;
int MIN_GROUP_SIZE = FULL ? 10 : 5;
int MAX_GROUP_SIZE = FULL ? 100 : 50;
int MAX_DUCK_SIZE = FULL ? 30 : 20;

// Input state variables.
boolean debug_neighbors = false;
boolean debug_distance = false;
boolean tris_circles = true;  // false for circles.

// Primary state.
ArrayList<Duck[]> duck_flocks = new ArrayList<Duck[]>();

PVector rand_position() {
  return new PVector(random(0, width), random(0, height));
}

color rand_color() {
  return color(random(0, 255), random(0, 255), random(0, 255));
}

float wrap_dimension(float x, float upper) {
  if (x > upper) { x = x - upper; }
  else if (x < 0) { x = upper - x; }
  return x;
}

void wrap_vector(PVector v) {
  v.x = wrap_dimension(v.x, width);
  v.y = wrap_dimension(v.y, height);
}

// TODO: maybe make v1 the middle instead of the tip?
void draw_triangle(PVector v1, PVector dir, float size) {
  dir = dir.copy().normalize().mult(size);
  PVector base = PVector.sub(v1, dir);
  PVector v2 = PVector.add(base, dir.copy().mult(.5).rotate(HALF_PI));
  PVector v3 = PVector.add(base, dir.copy().mult(.5).rotate(-HALF_PI));
  triangle(v1.x, v1.y, v2.x, v2.y, v3.x, v3.y);
}

color brighten(color c, float mult) {
  float r = red(c); float g = green(c); float b = blue(c);
  return color(constrain(red(c) * mult, 0, 255),
               constrain(green(c) * mult, 0, 255),
               constrain(blue(c) * mult, 0, 255));
}


class Duck {
  int N_NEIGHBORS = 7;
  // Multipliers for space_need
  // - SPACE_CLOSE_MULT: push away when another duck within this distance
  // - SPACE_FAR_MULT: attract when another duck outside this distance
  // - SPACE_TOO_FAR_MULT: ignore ducks outside this distance
  float SPACE_CLOSE_MULT = 0.75;
  float SPACE_FAR_MULT = 1.7;
  float SPACE_TOO_FAR_MULT = 3;

  int id;
  PVector pos;
  PVector vel;
  String typ;
  float space_need;
  color col;
  float size;  // TODO: rename to non-reserved word?

  Duck(int i, PVector p, PVector v, float space, color c, float siz) {
    id = i;
    pos = p;
    vel = v;
    space_need = space;
    col = c;
    size = siz;
  }
  Duck copy() { return new Duck(id, pos, vel, space_need, col, size); }

  void draw_shape() {
    if (tris_circles) { draw_triangle(pos, vel, size); }
    else { ellipse(pos.x, pos.y, size, size); }
  }

  void draw() {
    stroke(30, 20);
    fill(col);
    draw_shape();
    if (debug_distance) {
      float close_diam = space_need * SPACE_CLOSE_MULT;
      float far_diam = space_need * SPACE_FAR_MULT;
      float too_far_diam = space_need * SPACE_TOO_FAR_MULT;
      stroke(100, 80);
      fill(100,25,25,10); ellipse(pos.x, pos.y, close_diam, close_diam);
      fill(25,100,25,10); ellipse(pos.x, pos.y, far_diam, far_diam);
      fill(25,25,100,10); ellipse(pos.x, pos.y, too_far_diam, too_far_diam);
    }
  }

  void update(Duck[] all) {
    // Map from distances to neighbors.
    HashMap<Float, Duck> dist_duck = new HashMap<Float, Duck>();
    for (Duck other : all) {
      if (other.id == id) { continue; }
      float d = pos.dist(other.pos);
      if (d < space_need * SPACE_TOO_FAR_MULT) {
        dist_duck.put(d, other);
      }
    }
    // Sort.
    float[] dists = {};
    for (float k : dist_duck.keySet()) { dists = append(dists, k); }
    dists = sort(dists);

    // For n neighbors, flock together.
    for (int i = 0; i < min(N_NEIGHBORS, dists.length); ++i) {
      float dist = dists[i];
      Duck other = dist_duck.get(dist);
      PVector away = PVector.sub(pos, other.pos).normalize();
      if (debug_neighbors) {
        stroke(100, 100); fill(250, 200);
        line(pos.x, pos.y, other.pos.x, other.pos.y);
        PVector arrow_tip = PVector.add(other.pos, PVector.mult(away, size/2));
        draw_triangle(arrow_tip, away.copy().rotate(PI), 4);
      }
      if (dist < space_need * SPACE_CLOSE_MULT) {
        pos.add(away.mult(0.5));
      } else if (dist > space_need * SPACE_FAR_MULT) {
        pos.lerp(other.pos, 0.005);
      }
      // Occasionally make velocity more similar to other.
      if (random(1) < 0.05) {
        vel.lerp(other.vel, 0.05);
      }
    }
    // Very occasionally add random smallish component to velocity.
    if (random(1) < 0.01) {
      vel.add(PVector.mult(PVector.random2D(), vel.mag()/8));
    }
    // Even more occasionally make random largish change to velocity.
    if (random(1) < 0.001) {
      vel.add(PVector.mult(PVector.random2D(), vel.mag()/5));
      fill(brighten(col, 1.3)); draw_shape();
    }
    pos.add(vel);
    wrap_vector(pos);
  }  // update
}  // Duck


void init_random_flock(Duck[] flock) {
  color c = rand_color();
  float size = random(3, MAX_DUCK_SIZE);
  float space_need = size * 2 * random(0.7, 1.3);
  // TODO: pull out constants?
  float speed = random(1.5, 5);
  PVector pos = rand_position();
  PVector vel = PVector.random2D().mult(speed);
  for (int i = 0; i < flock.length; ++i) {
    // TODO: more principled random fuzz amount.
    PVector posfuzzed = PVector.add(pos, PVector.random2D().mult(random(space_need * 4)));
    PVector velfuzzed = PVector.add(vel, PVector.random2D().mult(speed/5));
    flock[i] = new Duck(i, posfuzzed, velfuzzed, space_need,
                        brighten(c, random(0.6, 1.4)), size * random(0.7, 1.3));
  }
}

void init_duck_flocks() {
  duck_flocks.clear();
  for (int i = 0; i < random(MIN_GROUPS, MAX_GROUPS); ++i) {
    duck_flocks.add(new Duck[int(random(MIN_GROUP_SIZE, MAX_GROUP_SIZE))]);
    init_random_flock(duck_flocks.get(i));
  }
}

// Separate settings function in order to make.
void settings() {
  if (FULL) { fullScreen(); }
  else { size(DIM[0], DIM[1]); }
}

void setup() {
  frameRate(30);
  init_duck_flocks();
}

void draw() {
  background(15);
  // Draw ducks.
  for (Duck[] flock : duck_flocks)
    for (Duck d : flock)
      d.draw();
  // Update positions.
  for (Duck[] flock : duck_flocks) {
    Duck[] tmp_flock = new Duck[flock.length];
    for (int i = 0; i < flock.length; ++i)
      tmp_flock[i] = flock[i].copy();
    for (Duck d : flock)
      d.update(tmp_flock);
  }
}

void keyPressed() {
  switch (key) {
    case 'r': init_duck_flocks(); break;
    case 'd': debug_distance = !debug_distance; break;
    case 'n': debug_neighbors = !debug_neighbors; break;
    case 'c': tris_circles = !tris_circles; break;
  }
}
