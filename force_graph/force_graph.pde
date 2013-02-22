import java.util.HashSet;

boolean fullscreen = false;
int w = 500;
int h = 500;

Node[] nodes;
Node[] nodes_aux;
HashSet<PVector> edges;

// probability of link between any node pair
float link_prob = 0.07;
// probability of node being more highly connected
float super_node_prob = 0.05;

float node_repel = 5000;
float link_attract = 0.05;
// scale force
float update_damping = 0.4;
// weight given to old velocity. bigger means more gradual updating. range (0,1)
float update_momentum = 0.9;

int node_size;
color bg = color(20,20,20);

// todo
// click-drag nodes
// changeable params
// central gravity
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
  edges = new HashSet();
  for (int i = 0; i < nodes.length; ++i) {
    nodes[i] = new Node();
    nodes_aux[i] = new Node();
    for (int j = i+1; j < nodes.length; ++j) {
      float this_link_prob = lerp(link_prob, 1, happened(super_node_prob) ? 0.5 : 0);
      if (happened(this_link_prob))
        edges.add(new PVector(i, j));
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

void draw() {
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
    for (PVector edge : edges) {
      int other_index;
      if (int(edge.x) == i) other_index = int(edge.y);
      else if (int(edge.y) == i) other_index = int(edge.x);
      else continue;

      PVector other = nodes[other_index].pos;
      PVector this_vel = unit_direction(n.pos, other);
      this_vel.mult(link_attract * n.pos.dist(other));
      vel.add(this_vel);
    }

    vel.mult(update_damping);
    Node aux = nodes_aux[i];
    aux.vel = PVector.lerp(vel, n.vel, update_momentum);
    // this /shouldn't/ be necessary...
    //fix_nan(aux.vel);
    aux.pos = PVector.add(n.pos, aux.vel);
  }
  Node[] prev = nodes;
  nodes = nodes_aux;
  nodes_aux = prev;

  // drawing
  background(bg);

  strokeWeight(2);
  stroke(39, 74, 250, 128);

  // edges
  for (PVector edge : edges) {
    Node a = nodes[int(edge.x)];
    Node b = nodes[int(edge.y)];
    line(a.pos.x, a.pos.y, b.pos.x, b.pos.y);
  }

  // nodes
  for (int i = 0; i < nodes.length; ++i) {
    Node n = nodes[i];
    ellipse(n.pos.x, n.pos.y, node_size, node_size);
  }
}

void keyPressed() {
  switch(key) {
    case 'r':
      random_init(nodes.length);
      break;
  }
}
