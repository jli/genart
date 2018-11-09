int W = 800;
int H = 600;
int AREA = 700;  // ave

int MIN_SIZE = 4;
int MAX_SIZE = min(W, H) / 10;

color bluish = color(50, 50, 250);
color reddish = color(250, 50, 50);

Duck[] mandarins = new Duck[10];
Duck[] tmp_mandarins = new Duck[10];
Duck[] mallards = new Duck[20];
Duck[] tmp_mallards = new Duck[20];



float randfuzz(float fuzz) { return random(-fuzz, fuzz); }

void fuzz_vector(PVector v, float fuzz, float limit) {
  v.add(randfuzz(fuzz), randfuzz(fuzz));
  v.limit(limit);
}

// TODO: get rid of it
PVector rand_unit() {
  PVector v = new PVector(random(-1, 1), random(-1, 1));
  v.normalize();
  return v;
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

  Duck(PVector p, PVector v, String t) {
    if (t == "mandarin") {
      c = reddish;
      space_need = 10;
    } else if (t == "mallard") {
      c = bluish;
      space_need = 2;
    } else {
      throw new RuntimeException("hi");
    }
    typ = t;
    pos = p;
    vel = v;
  }
  Duck copy() {
    return new Duck(pos, vel, typ);
  }

  void draw() {
    fill(c);
    ellipse(pos.x, pos.y, 10, 10);
  }

  void update(Duck[] all, int me) {
    for (int i = 0; i < all.length; ++i) {
      if (i == me) { continue; }
      Duck other = all[i];
      float d = pos.dist(other.pos);
      if (d > space_need * 2) { continue; }
      float force;
      if (d < space_need) {
        force = -space_need / pow(d, 2);
      } else {
        force = space_need * .2;
      }
      pos.lerp(other.pos, force);
    }
    pos.add(vel);
    pos.x = wrap(pos.x, W);
    pos.y = wrap(pos.y, H);
  }
}



void setup() {
  size(100,100);
  surface.setSize(W, H);
  frameRate(10);

  PVector pos = new PVector(random(0, W), random(0, H));
  PVector vel = new PVector(random(-1, 1), random(-1, 1));
  vel.normalize();
  vel = vel.mult(3);
  for (int i = 0; i < mandarins.length; ++i) {
    PVector pfuzz = new PVector(random(-AREA/10, AREA/10), random(-AREA/10, AREA/10));
    pfuzz.add(pos);
    mandarins[i] = new Duck(pfuzz, vel.add(rand_unit().mult(0.2)), "mandarin");
  }

  pos = new PVector(random(0, W), random(0, H));
  vel = new PVector(random(-1, 1), random(-1, 1));
  vel.normalize();
  vel = vel.mult(3);
  for (int i = 0; i < mallards.length; ++i) {
    PVector pfuzz = new PVector(random(-AREA/10, AREA/10), random(-AREA/10, AREA/10));
    pfuzz.add(pos);
    mallards[i] = new Duck(pfuzz, vel.add(rand_unit().mult(0.2)), "mallard");
  }
}



void draw() {
  //  background(10);
  for (int i = 0; i < mallards.length; ++i) {
    tmp_mallards[i] = mallards[i].copy();
  }
  for (int i = 0; i < mandarins.length; ++i) {
    tmp_mandarins[i] = mandarins[i].copy();
  }

  for (int i = 0; i < mallards.length; ++i) {
    mallards[i].draw();
    mallards[i].update(tmp_mallards, i);
  }
  for (int i = 0; i < mandarins.length; ++i) {
    mandarins[i].draw();
    mandarins[i].update(tmp_mandarins, i);
  }
  stroke(150, 150);
}
