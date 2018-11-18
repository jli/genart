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

float wrap_dimension(float x, float upper) {
  if (x > upper) { x = x - upper; }
  else if (x < 0) { x = upper - x; }
  return x;
}

void wrap_position(PVector v) {
  v.x = wrap_dimension(v.x, width);
  v.y = wrap_dimension(v.y, height);
}

// Reflects v across normal vector n defining a line that v is bouncing off of.
PVector reflect(PVector v, PVector n) {
  return PVector.sub(v, PVector.mult(n, 2 * v.dot(n)));
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
    fill(0); text(str(id), pos.x, pos.y);
  }

  void update() {
    accel.add(PVector.random2D().mult(0.005)); accel.limit(.5);
    vel.add(accel); vel.limit(SPEED_LIMIT);
    pos.add(vel); wrap_position(pos);
  }

  // h/t https://processing.org/examples/circlecollision.html
  void check_collisions(N[] all_nodes) {
    for (N other : all_nodes) {
      if (id == other.id) continue;
      PVector dv = PVector.sub(other.pos, pos);
      float required_dist = rad + other.rad;
      float overlap = required_dist - dv.mag();
      if (overlap < 0) continue;

      // Enforce non-overlap.
      pos.sub(dv.copy().normalize().mult(overlap / 2));

      float theta = dv.heading();
      float sine = sin(theta); float cosine = cos(theta);

      /* bTemp will hold rotated ball positions. You
       just need to worry about bTemp[1] position*/
      PVector[] bTemp = { new PVector(), new PVector() };

      /* this ball's position is relative to the other so you can use the vector
         between them (dv(?)) as the  reference point in the rotation
         expressions. bTemp will initialize automatically to 0.0, which is what
         you want since b[1] will rotate around b[0] */
      bTemp[1].x = cosine * dv.x + sine * dv.y;
      bTemp[1].y = cosine * dv.y - sine * dv.x;

      // rotate Temporary velocities
      PVector[] vTemp = { new PVector(), new PVector() };
      vTemp[0].x  = cosine * vel.x + sine * vel.y;
      vTemp[0].y  = cosine * vel.y - sine * vel.x;
      vTemp[1].x  = cosine * other.vel.x + sine * other.vel.y;
      vTemp[1].y  = cosine * other.vel.y - sine * other.vel.x;

      /* Now that velocities are rotated, you can use 1D conservation of
      /* momentum equations to calculate the final vel along the x-axis. */
      PVector[] vFinal = { new PVector(), new PVector() };
      // final rotated vel for b[0]
      vFinal[0].x = ((mass - other.mass) * vTemp[0].x + 2 * other.mass * vTemp[1].x) / (mass + other.mass);
      vFinal[0].y = vTemp[0].y;
      // final rotated vel for b[1]
      vFinal[1].x = ((other.mass - mass) * vTemp[1].x + 2 * mass * vTemp[0].x) / (mass + other.mass);
      vFinal[1].y = vTemp[1].y;

      // hack to avoid clumping
      // bTemp[0].x += vFinal[0].x;
      // bTemp[1].x += vFinal[1].x;

      /* Rotate ball positions and velocities back Reverse signs in trig
      /* expressions to rotate in the opposite direction */
      PVector[] bFinal = { new PVector(), new PVector() };
      bFinal[0].x = cosine * bTemp[0].x - sine * bTemp[0].y;
      bFinal[0].y = cosine * bTemp[0].y + sine * bTemp[0].x;
      // bFinal[1].x = cosine * bTemp[1].x - sine * bTemp[1].y;
      // bFinal[1].y = cosine * bTemp[1].y + sine * bTemp[1].x;

      // Update position.
      //other.pos.x = pos.x + bFinal[1].x;
      //other.pos.y = pos.y + bFinal[1].y;
      pos.add(bFinal[0]);

      // Update velocity.
      vel.x = cosine * vFinal[0].x - sine * vFinal[0].y;
      vel.y = cosine * vFinal[0].y + sine * vFinal[0].x;
      //other.vel.x = cosine * vFinal[1].x - sine * vFinal[1].y;
      //other.vel.y = cosine * vFinal[1].y + sine * vFinal[1].x;
    }
  }  // update
}  // N

N random_node(int i) {
  return new N(i, new PVector(random(0, width), random(0, height)),
               PVector.random2D().mult(random(INIT_SPEED_BOUNDS[0], INIT_SPEED_BOUNDS[1])),
               PVector.random2D().mult(0.1),
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
