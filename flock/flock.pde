int W = 1680;
int H = 1048;
int AREA = 700;  // ave

float SIZE_MAN = 25;
float SIZE_MAL = 12;

color bluish = color(120, 50, 210);
color reddish = color(200, 40, 150);

int num_mands = 25;
int num_mals = 40;
Duck[] mandarins = new Duck[num_mands];
Duck[] tmp_mandarins = new Duck[num_mands];
Duck[] mallards = new Duck[num_mals];
Duck[] tmp_mallards = new Duck[num_mals];



float randfuzz(float fuzz) {
  return random(-fuzz, fuzz);
}

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
// float wrap(float x, float upper) {
//   if (x > upper) {
//     return upper -  (x -  upper);
//   } else if (x < 0) {
//     return -x;
//   } else {
//     return x;
//   }
// }
// boolean oob(float x, float upper) {
//   return (x > upper || x < 0);
// }

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
      size = SIZE_MAN;
    } else if (t == "mallard") {
      c = bluish;
      space_need = 25;
      size = SIZE_MAL;
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
    ellipse(pos.x, pos.y, size, size);
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
    for (int i = 0; i < near_neighbors.size(); ++i) {
      Duck other = near_neighbors.get(i);
      float  d = pos.dist(other.pos);
      PVector away = PVector.sub(other.pos, pos);
      away.normalize();
      if (d < space_need * .8) {
        //vel.lerp(other.vel, -0.01);
         pos.lerp(other.pos, -0.01);
        // float force = map(d, 0, space_need * .6, 20, 5);
        // away.setMag(away.mag() * force);
        // pos.add(away);

        if (random(1) < 0.1) {
          vel.lerp(other.vel, 0.01);
        }
      } else if (pos.dist(other.pos) > space_need  * 1.5) {
        //vel.lerp(other.vel, 0.02);
        pos.lerp(other.pos, 0.005);
      }
    }
    if (random(1.0) < 0.01) {
      vel.add(PVector.mult(PVector.random2D(), 0.7));
    }
    if (random(1.0) < 0.0002) {
      vel.add(PVector.mult(PVector.random2D(), 1.5));
    }
    //pos.add(PVector.mult(vel, random(0.9, 1.1)));
    pos.add(vel);
    // if (oob(pos.x, W)) {
    //   pos.x = wrap(pos.x, W);
    //   vel.x *= -1;
    // }
    // if (oob(pos.y, H)) {
    //   pos.y = wrap(pos.y, H);
    //   vel.y *= -1;
    // }
    pos.x = wrap(pos.x, W);
    pos.y = wrap(pos.y, H);
  }
}


void initialize() {
  PVector pos = new PVector(random(0, W), random(0, H));
  PVector vel = new PVector(random(-1, 1), random(-1, 1));
  vel.normalize();
  vel = vel.mult(1.5);
  for (int i = 0; i < mandarins.length; ++i) {
    PVector pfuzz = new PVector(random(-AREA/10, AREA/10), random(-AREA/10, AREA/10));
    pfuzz.add(pos);
    mandarins[i] = new Duck(pfuzz, PVector.add(vel, rand_unit().mult(0.2)), "mandarin");
  }

  pos = new PVector(random(0, W), random(0, H));
  vel = new PVector(random(-1, 1), random(-1, 1));
  vel.normalize();
  vel = vel.mult(4);
  for (int i = 0; i < mallards.length; ++i) {
    PVector pfuzz = new PVector(random(-AREA/10, AREA/10), random(-AREA/10, AREA/10));
    pfuzz.add(pos);
    mallards[i] = new Duck(pfuzz, PVector.add(vel, rand_unit().mult(0.2)), "mallard");
  }
}

void setup() {
  fullScreen();
  //size(100, 100);
  surface.setSize(W, H);
  frameRate(30);
  background(30);
  initialize();
}



void draw() {
  background(4);
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

void keyPressed() {
  if (key == 'r') {
    initialize();
  }

}
