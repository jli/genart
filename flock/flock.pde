// TODOs:
// - gets weird at edges. consider bounding at edges, or making distance
//   computation work across edges.
// - indication of velocity. triangles instead of circles?
// - indication when nodes lerp velocities

import java.util.Map;

// Set either full or W&H.
boolean full = false;
int W = 800;
int H = 600;
boolean debug_neighbors = false;
boolean debug_distance = false;

int num_mands = 20;
int num_mals = 40;

Duck[] mandarins = new Duck[num_mands];
Duck[] tmp_mandarins = new Duck[num_mands];

Duck[] mallards = new Duck[num_mals];
Duck[] tmp_mallards = new Duck[num_mals];

PVector rand_position() {
  return new PVector(random(0, width), random(0, height));
}

float wrap(float x, float upper) {
  if (x > upper) { return x - upper; }
  if (x < 0) { return upper - x; }
  return x;
}

// 'away' should be normalized.
void draw_triangle(PVector tip, PVector away) {
  PVector base = PVector.add(tip, PVector.mult(away, 5));
  PVector base1 = PVector.add(base, away.copy().mult(3).rotate(90));
  PVector base2 = PVector.add(base, away.copy().mult(3).rotate(-90));
  triangle(tip.x, tip.y, base1.x, base1.y, base2.x, base2.y);
}

class Duck {
  int N_NEIGHBORS = 7;
  color reddish = color(200, 40, 150);
  color bluish = color(120, 50, 210);
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
  color c;
  float size;

  Duck(PVector p, PVector v, String t, int i) {
    if (t == "mandarin") {
      c = reddish;
      space_need = 50;
      size = 22;
    } else if (t == "mallard") {
      c = bluish;
      space_need = 30;
      size = 14;
    } else {
      throw new RuntimeException("unrecognized type:" + t);
    }
    typ = t;
    pos = p;
    vel = v;
    id = i;
  }

  Duck copy() { return new Duck(pos, vel, typ, id); }

  void draw() {
    stroke(30, 20);
    fill(c);
    ellipse(pos.x, pos.y, size, size);
    if (debug_distance) {
      float close_diam = 2 * space_need * SPACE_CLOSE_MULT;
      float far_diam = 2 * space_need * SPACE_FAR_MULT;
      float too_far_diam = 2 * space_need * SPACE_TOO_FAR_MULT;
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
        stroke(100, 100);
        fill(250, 200);
        line(pos.x, pos.y, other.pos.x, other.pos.y);
        PVector tri_tip = PVector.add(other.pos, PVector.mult(away, size/2));
        draw_triangle(tri_tip, away);
      }
      if (dist < space_need * SPACE_CLOSE_MULT) {
        pos.add(away.mult(0.5));
      } else if (dist > space_need * SPACE_FAR_MULT) {
        pos.lerp(other.pos, 0.005);
      }
      // Occasionally make velocity more similar to other.
      if (random(1) < 0.05) {
        vel.lerp(other.vel, 0.05);
        // fill(c, 140); ellipse(pos.x, pos.y, size * 1.2, size * 1.2);
      }
    }
    // Very occasionally add random smallish component to velocity.
    if (random(1) < 0.005) {
      println(typ + " " + str(id) + " nudging velocity");
      vel.add(PVector.mult(PVector.random2D(), 0.7));
      fill(c, 140); ellipse(pos.x, pos.y, size * 1.3, size * 1.3);
    }
    // Even more occasionally make random largish change to velocity.
    if (random(1) < 0.0005) {
      println(typ + " " + str(id) + " bumping velocity");
      vel.add(PVector.mult(PVector.random2D(), 2.5));
      fill(c, 140); ellipse(pos.x, pos.y, size * 2, size * 2);
    }
    pos.add(vel);
    pos.x = wrap(pos.x, width);
    pos.y = wrap(pos.y, height);
  }
}  // Duck


void initialize() {
  PVector pos = rand_position();
  PVector vel = PVector.random2D().mult(1.5);
  for (int i = 0; i < mandarins.length; ++i) {
    PVector posfuzzed = PVector.add(pos, PVector.random2D().mult(random(height/10)));
    PVector velfuzzed = PVector.add(vel, PVector.random2D().mult(0.2));
    mandarins[i] = new Duck(posfuzzed, velfuzzed, "mandarin", i);
  }
  pos = rand_position();
  vel = PVector.random2D().mult(3);
  for (int i = 0; i < mallards.length; ++i) {
    PVector posfuzzed = PVector.add(pos, PVector.random2D().mult(random(height/10)));
    PVector velfuzzed = PVector.add(vel, PVector.random2D().mult(0.2));
    mallards[i] = new Duck(posfuzzed, velfuzzed, "mallard", i);
  }
}

void settings() {
  if (full) { fullScreen(); }
  else { size(W, H); }
}

void setup() {
  frameRate(30);
  background(30);
  stroke(150, 150);
  initialize();
}

void draw() {
  background(4);
  // Copies.
  for (int i = 0; i < mallards.length; ++i) {
    tmp_mallards[i] = mallards[i].copy();
  }
  for (int i = 0; i < mandarins.length; ++i) {
    tmp_mandarins[i] = mandarins[i].copy();
  }
  // Draw and update.
  for (Duck mallard : mallards) {
    mallard.draw();
    mallard.update(tmp_mallards);
  }
  for (Duck mandarin : mandarins) {
    mandarin.draw();
    mandarin.update(tmp_mandarins);
  }
}

void keyPressed() {
  if (key == 'r') {
    initialize();
  } else if (key == 'd') {
    debug_distance = !debug_distance;
  } else if (key == 'n') {
    debug_neighbors = !debug_neighbors;
  }
}
