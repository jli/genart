// TODOs:
// - gets weird at edges. consider bounding at edges, or making distance
//   computation work across edges.
// - better neighbor finding.
// - lerp isn't right.

// Set either full or W and H.
boolean full = false;
int W = 800;
int H = 600;

float SIZE_MANDARIN = 25;
float SIZE_MALLARD = 12;

color bluish = color(120, 50, 210);
color reddish = color(200, 40, 150);

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
  if (x > upper) {
    return x - upper;
  } else if (x < 0) {
    return upper - x;
  } else {
    return x;
  }
}

class Duck {
  PVector pos;
  PVector vel;
  String typ;
  float space_need;
  color c;
  float size;

  Duck(PVector p, PVector v, String t) {
    if (t == "mandarin") {
      c = reddish;
      space_need = 100;
      size = SIZE_MANDARIN;
    } else if (t == "mallard") {
      c = bluish;
      space_need = 25;
      size = SIZE_MALLARD;
    } else {
      throw new RuntimeException("unrecognized type:" + t);
    }
    typ = t;
    pos = p;
    vel = v;
  }

  Duck copy() { return new Duck(pos, vel, typ); }

  void draw() {
    fill(c);
    ellipse(pos.x, pos.y, size, size);
  }

  void position_update() {

  }
  void update(Duck[] all, int me) {
    ArrayList<Duck> near_neighbors = new ArrayList<Duck>();
    // Get 2 close neighbors. TODO: get the *closest* ones, duh.
    for (int i = 0; i < all.length; ++i) {
      if (i == me) {
        continue;
      }
      Duck other = all[i];
      float d = pos.dist(other.pos);
      if (d < space_need * 2) {
        near_neighbors.add(other);
        if (near_neighbors.size() == 4) {
          break;
        }
      }
    }
    for (Duck other : near_neighbors) {
      float d = pos.dist(other.pos);
      if (d < space_need * .8) {
        // Too close. Move away from other.
        pos.lerp(other.pos, -0.01);
      } else if (pos.dist(other.pos) > space_need  * 1.5) {
        // Too far. Move towards other.
        pos.lerp(other.pos, 0.005);
      }
      // Occasionally make velocity more similar to other.
      if (random(1) < 0.3) {
        vel.lerp(other.vel, 0.01);
      }
    }
    // Very occasionally add random smallish component to velocity.
    if (random(1) < 0.001) {
      println(typ + " " + str(me) + " nudging velocity");
      vel.add(PVector.mult(PVector.random2D(), 0.7));
    }
    // Even more occasionally make random largish change to velocity.
    // if (random(1) < 0.0002) {
    //   println(typ + " " + str(me) + " bumping velocity");
    //   vel.add(PVector.mult(PVector.random2D(), 1.5));
    // }
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
    mandarins[i] = new Duck(posfuzzed, velfuzzed, "mandarin");
  }
  pos = rand_position();
  vel = PVector.random2D().mult(3);
  for (int i = 0; i < mallards.length; ++i) {
    PVector posfuzzed = PVector.add(pos, PVector.random2D().mult(random(height/10)));
    PVector velfuzzed = PVector.add(vel, PVector.random2D().mult(0.2));
    mallards[i] = new Duck(posfuzzed, velfuzzed, "mallard");
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
  for (int i = 0; i < mallards.length; ++i) {
    mallards[i].draw();
    mallards[i].update(tmp_mallards, i);
  }
  for (int i = 0; i < mandarins.length; ++i) {
    mandarins[i].draw();
    mandarins[i].update(tmp_mandarins, i);
  }
}

void keyPressed() {
  if (key == 'r') {
    initialize();
  }
}
