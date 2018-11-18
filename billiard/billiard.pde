int W = 500;
int H = 500;
int NUM_INITIAL_NODES = 10;
float[] SIZE_BOUNDS = {4, 20};
float[] INIT_SPEED_BOUNDS = {1, 3};
float SPEED_LIMIT = 5;

ArrayList<N> ns = new ArrayList<N>();


color rand_color() {
  return color(random(0, 255), random(0, 255), random(0, 255));
}

void bounce_off_walls(PVector pos, PVector vel, float rad) {
  if (rad > pos.x || pos.x > width - rad) {
    pos.x = constrain(pos.x, rad, width - rad);
    vel.x *= -1;
  }
  if (rad > pos.y || pos.y > height - rad) {
    pos.y = constrain(pos.y, rad, height - rad);
    vel.y *= -1;
  }
}

class N {
  int id;
  PVector pos;
  PVector vel;
  PVector accel;
  float rad;
  float mass;
  color col;
  N(int i, PVector p, PVector v, PVector a, float r) {
    id = i; pos = p; vel = v; accel = a; rad = r;
    mass = pow(rad, 2);
    col = rand_color();
  }
  // TODO: color.
  N copy() { return new N(id, pos.copy(), vel.copy(), accel.copy(), rad); }

  void draw() {
    fill(col); ellipse(pos.x, pos.y, rad*2, rad*2);
  }

  void update() {
    //accel.add(PVector.random2D().mult(0.005)); accel.limit(.5);
    vel.add(accel); vel.limit(SPEED_LIMIT);
    pos.add(vel);
    bounce_off_walls(pos, vel, rad);
  }

  void check_collisions(N[] all_nodes) {
      // TODO: could handle both colliding nodes at once?
    for (N other : all_nodes) {
      if (id == other.id) continue;
      PVector pos_delta = PVector.sub(pos, other.pos);
      float required_dist = rad + other.rad;
      float overlap = required_dist - pos_delta.mag();
      if (overlap < 0) continue;

      // Enforce non-overlap.
      pos.add(pos_delta.copy().normalize().mult(overlap / 2));

      // Angle-free representation: https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
      float mass_bit = 2 * other.mass / (mass + other.mass);
      float mag_bit = (PVector.dot(PVector.sub(vel, other.vel), pos_delta)
                       / pos_delta.magSq());
      vel.sub(PVector.mult(pos_delta, mass_bit * mag_bit));
    }
  }  // update
}  // N

N random_node(int i) {
  return new N(i, new PVector(random(0, width), random(0, height)),
               PVector.random2D().mult(random(INIT_SPEED_BOUNDS[0], INIT_SPEED_BOUNDS[1])),
               //PVector.random2D().mult(0.1),
               new PVector(),
               random(SIZE_BOUNDS[0], SIZE_BOUNDS[1]));
}

void initialize() {
  ns.clear();
  for (int i = 0; i < NUM_INITIAL_NODES; ++i) { ns.add(random_node(i)); }
}

void setup() {
  size(1, 1);
  surface.setSize(W, H);
  surface.setResizable(true);
  initialize();
}

void draw() {
  background(220);
  for (N n : ns) { n.update(); }
  N[] tmp_ns = {};
  for (N n : ns) { tmp_ns = (N[])append(tmp_ns, n.copy()); }
  for (N n : ns) { n.check_collisions(tmp_ns); }
  for (N n : ns) { n.draw(); }
}

boolean PAUSED = false;
void togglePaused() {
  if (PAUSED) { noLoop(); } else { loop(); }
  PAUSED = !PAUSED;
}
void change_nodes(int dir) {
  if (dir > 0) { ns.add(random_node(ns.size())); }
  else if (ns.size() > 1) { ns.remove(ns.size()-1); }
}
void keyPressed() {
  switch (key) {
    case ' ': togglePaused(); break;
    case '+': change_nodes(1); break;
    case '-': change_nodes(-1); break;
    case 'r': initialize(); break;
  }
}
