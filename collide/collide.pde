int W = 500;
int H = 500;
int NUM_INITIAL_NODES = 10;
float[] SIZE_BOUNDS = {5, 30};
float[] SPEED_BOUNDS = {20, 200};  // only used to limit initial random speeds.
boolean GRAVITY = false;

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
  N(int i, PVector p, PVector v, PVector a, float r, color c) {
    id = i; pos = p; vel = v; accel = a; rad = r; col = c;
    mass = pow(rad, 2);
  }
  N copy() { return new N(id, pos.copy(), vel.copy(), accel.copy(), rad, col); }

  void draw() { fill(col); ellipse(pos.x, pos.y, rad*2, rad*2); }

  void update() {
    vel.add(PVector.div(accel, frameRate));
    if (GRAVITY) { vel.mult(0.98); }
    pos.add(PVector.div(vel, frameRate));
    bounce_off_walls(pos, vel, rad);
  }
}  // N

void compute_collisions(ArrayList<N> nodes) {
  N[] tmp_nodes = {};  // tmp_nodes is immutable copy.
  for (N n : nodes) { tmp_nodes = (N[])append(tmp_nodes, n.copy()); }

  for (int i = 0; i < nodes.size(); ++i) {
    N n1 = tmp_nodes[i];
    N n1rw = nodes.get(i);
    for (int j = i+1; j < nodes.size(); ++j) {
      N n2 = tmp_nodes[j];
      N n2rw = nodes.get(j);
      PVector pos_delta = PVector.sub(n1.pos, n2.pos);
      float required_dist = n1.rad + n2.rad;
      float overlap = required_dist - pos_delta.mag();
      if (overlap <= 0) continue;

      // Enforce non-overlap.
      PVector pos_correction = pos_delta.copy().normalize().mult(overlap / 2);
      n1rw.pos.add(pos_correction);
      n2rw.pos.sub(pos_correction);

      // https://en.wikipedia.org/wiki/Elastic_collision
      float mass_bit1 = 2 * n2.mass / (n1.mass + n2.mass);
      float mass_bit2 = 2 * n1.mass / (n1.mass + n2.mass);
      float mag_bit = (PVector.dot(PVector.sub(n1.vel, n2.vel), pos_delta)
                       / pos_delta.magSq());
      n1rw.vel.sub(PVector.mult(pos_delta, mass_bit1 * mag_bit));
      n2rw.vel.add(PVector.mult(pos_delta, mass_bit2 * mag_bit));
    }
  }
}

N random_node(int i) {
  return random_node(i, new PVector(random(0, width), random(0, height)));
}

N random_node(int i, PVector p) {
  return new N(
    i, p, PVector.random2D().mult(random(SPEED_BOUNDS[0], SPEED_BOUNDS[1])),
    new PVector(), random(SIZE_BOUNDS[0], SIZE_BOUNDS[1]), rand_color());
}

void initialize() {
  ns.clear();
  for (int i = 0; i < NUM_INITIAL_NODES; ++i) { ns.add(random_node(i)); }
}

void setup() {
  size(1, 1);
  frameRate(30);
  surface.setSize(W, H);
  surface.setResizable(true);
  initialize();
}

void draw() {
  if (BACKGROUND) background(235);
  for (N n : ns) { n.update(); }
  compute_collisions(ns);
  for (N n : ns) { n.draw(); }
}

boolean BACKGROUND = true;
boolean PAUSED = false;
void togglePaused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}
void change_nodes(int dir) {
  if (dir > 0) { ns.add(random_node(ns.size())); }
  else if (ns.size() > 1) { ns.remove(ns.size()-1); }
}
void toggleGravity() {
  GRAVITY = !GRAVITY;
  for (N n : ns) { n.accel.y = GRAVITY ? 1000 : 0; }
}
void keyPressed() {
  switch (key) {
    case ' ': togglePaused(); break;
    case '+': change_nodes(1); break;
    case '-': change_nodes(-1); break;
    case 'r': initialize(); break;
    case 'g': toggleGravity(); break;
    case 'b': BACKGROUND = !BACKGROUND; break;
  }
}
void mousePressed() {
  ns.add(random_node(ns.size(), new PVector(mouseX, mouseY)));
}
