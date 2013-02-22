import java.util.HashSet;

boolean fullscreen = false;
int w = 500;
int h = 500;

Node[] nodes;
HashSet<PVector> edges;

int node_size;
float random_link_prob = 0.25;

color bg = color(0,0,0);

class Node {
  public PVector pos;
  public PVector vel;
  Node() {
    this.pos = random_pos();
    this.vel = new PVector();
  }
}

PVector random_pos() {
  return new PVector(random(0, w), random(0, h));
}

int random_excluding(int lo, int hi, int exc) {
  int r = int(random((float) lo, (float) hi));
  if (r == exc) {
    println("EXCLUDING "+exc);
    return random_excluding(lo, hi, exc);
  } else {
    return r;
  }
}

void random_init(int nnodes) {
  nodes = new Node[nnodes];
  edges = new HashSet();
  for (int i = 0; i < nodes.length; ++i) {
    nodes[i] = new Node();
    for (int j = i+1; j < nodes.length; ++j)
      if (random(0, 1) < random_link_prob)
        edges.add(new PVector(i, j));
  }
}

void setup() {
  w = fullscreen ? displayWidth : w;
  h = fullscreen ? displayHeight : h;
  node_size = w*h/10000;
  int nnodes = w*h/10000;
  random_init(nnodes);
  size(w,h);
  frameRate(20);
}

void draw() {
  background(bg);

  strokeWeight(2);
  stroke(39, 74, 250);

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
