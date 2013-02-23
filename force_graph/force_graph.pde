boolean fullscreen = false;
int w = 500;
int h = 500;

Node[] nodes;
Node[] nodes_aux;
// pjs compat. values currently unused
HashMap<PVector,Float> edges;

// probability of link between any node pair
float link_prob = 0.07;
// probability of node being more highly connected
float super_node_prob = 0.05;
// if any node has velocity magnitude greater than threshold,
// layouting continues
float change_threshold = 0.2;

float node_repel = 5000;
float link_attract = 0.05;
float gravity_attract = 0.03;
// scale force
float update_damping = 0.8;
// weight given to old velocity. bigger means more gradual updating. range (0,1)
float update_momentum = 0.1;

Integer selected_node; // null when nothing selected

int node_size;
color bg = color(20,20,20);

// todo
// changeable params
// variable size nodes?
// weighted edges?
// more interesting edges
// lift constants

class Node {
  public PVector pos;
  public PVector vel;
  Node() {
    this.pos = random_pos();
    this.vel = new PVector();
  }
  public String toString() {
    return "pos " + this.pos + ", vel " + this.vel;
  }
}

PVector random_pos() { return new PVector(random(0, w), random(0, h)); }

PVector unit_direction(PVector from, PVector to) {
  PVector res = PVector.sub(to, from);
  res.normalize();
  return res;
}

// maybe unnecessary...
void fix_nan(PVector v) {
  if (Float.isNaN(v.x)) v.x = 0;
  if (Float.isNaN(v.y)) v.y = 0;
  if (Float.isNaN(v.z)) v.z = 0;
}

boolean happened(float probability) { return random(0,1) < probability; }

void random_init(int nnodes) {
  nodes = new Node[nnodes];
  nodes_aux = new Node[nnodes];
  edges = new HashMap();
  for (int i = 0; i < nodes.length; ++i) {
    nodes[i] = new Node();
    nodes_aux[i] = new Node();
    for (int j = i+1; j < nodes.length; ++j) {
      float this_link_prob = lerp(link_prob, 1, happened(super_node_prob) ? 0.5 : 0);
      if (happened(this_link_prob))
        edges.put(new PVector(i, j), 1.);
    }
  }
}

void setup() {
  w = fullscreen ? displayWidth : w;
  h = fullscreen ? displayHeight : h;
  node_size = w*h/18000;
  int nnodes = w*h/7000;
  random_init(nnodes);
  size(w,h);
  frameRate(20);
}

// FIXME PVector.lerp missing from latest pjs. patched in trunk.
PVector pvector_lerp(PVector a, PVector b, float amt) {
  return new PVector(lerp(a.x, b.x, amt),
                     lerp(a.y, b.y, amt),
                     lerp(a.z, b.z, amt));
}

void draw() {
  boolean stable = true;

  // layout
  // calculate vels
  for (int i = 0; i < nodes.length; ++i) {
    Node n = nodes[i];
    PVector vel = new PVector();
    // repelled by all other nodes. electrostatic force, ~1/distance^2
    for (int j = 0; j < nodes.length; ++j) {
      if (i == j) continue;
      PVector other = nodes[j].pos;
      PVector this_vel = unit_direction(other, n.pos);
      this_vel.mult(node_repel / (float)Math.pow(n.pos.dist(other), 2));
      vel.add(this_vel);
    }

    // attracted to linked nodes. spring force, ~distance
    for (PVector edge : edges.keySet()) {
      int other_index;
      if (int(edge.x) == i) other_index = int(edge.y);
      else if (int(edge.y) == i) other_index = int(edge.x);
      else continue;

      PVector other = nodes[other_index].pos;
      PVector this_vel = unit_direction(n.pos, other);
      this_vel.mult(link_attract * n.pos.dist(other));
      vel.add(this_vel);
    }

    // central gravity to counteract things drifting off
    PVector center = new PVector(w/2,h/2);
    PVector grav = unit_direction(n.pos, center);
    grav.mult(gravity_attract * n.pos.dist(center));
    vel.add(grav);

    vel.mult(update_damping);
    Node aux = nodes_aux[i];
    aux.vel = pvector_lerp(vel, n.vel, update_momentum);
    // this /shouldn't/ be necessary...
    //fix_nan(aux.vel);
    aux.pos = PVector.add(n.pos, aux.vel);
    if (aux.vel.mag() > change_threshold)
      stable = false;
  }
  Node[] prev = nodes;
  nodes = nodes_aux;
  nodes_aux = prev;

  if (selected_node != null) {
    Node s = nodes[selected_node];
    s.pos.x = mouseX;
    s.pos.y = mouseY;
  }

  // drawing
  background(bg);

  strokeWeight(2);
  stroke(39, 74, 250, 175);

  // edges
  for (PVector edge : edges.keySet()) {
    Node a = nodes[int(edge.x)];
    Node b = nodes[int(edge.y)];
    line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
  }

  // nodes
  for (int i = 0; i < nodes.length; ++i) {
    Node n = nodes[i];
    boolean selected = selected_node != null && i == selected_node;
    if (selected) {
      pushStyle();
      strokeWeight(5);
      stroke(250, 39, 74, 128);
    }
    ellipse(n.pos.x, n.pos.y, node_size, node_size);
    if (selected) popStyle();
  }

  // switch up if stabilized
  if (stable) random_init(nodes.length);
}

void keyPressed() {
  switch(key) {
    case 'r':
      random_init(nodes.length);
      break;
  }
}

void mousePressed() {
  PVector mouse = new PVector(mouseX, mouseY);
  int closest = 0;
  float dist = mouse.dist(nodes[closest].pos);
  for (int i = 1; i < nodes.length; ++i) {
    float ndist = mouse.dist(nodes[i].pos);
    if (ndist < dist) {
      closest = i;
      dist = ndist;
    }
  }
  selected_node = closest;
  nodes[closest].pos = mouse;
  nodes[closest].vel.x = nodes[closest].vel.y = 0;
}

void mouseReleased() {
  selected_node = null;
}
