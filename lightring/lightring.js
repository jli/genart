let I_GRID_SIZE = 25;
let I_RATE = 20;
let NUM_CELLS = 20;
let NUM_LIGHTS = 3;
let MAX_INIT_SPEED = 1.5
let SPEED_DECAY = 0.99;
let HUE_DECAY = 0.8;
let SPEED_TO_GC = 0.05;

let WORLD;

let RAND_HUE = 0;
function rand_hue() {
  RAND_HUE = (RAND_HUE + random(80, 160)) % 360;
  return RAND_HUE;
}

function wrap(x, a, b) {
  if (x < a) { return b - 1; }
  if (x >= b) { return a; }
  return x;
}

class Particle {
  constructor(id) {
    this.id = id;
    this.pos = Math.random() * NUM_CELLS;
    this.dir = (Math.random() < 0.5) ? 1 : -1;
    this.speed = max(0.3, Math.random() * MAX_INIT_SPEED);
    this.hue = rand_hue();
  }
  step() {
    this.pos = wrap(this.pos + this.dir * this.speed, 0, NUM_CELLS);
    this.speed *= SPEED_DECAY;
    return this.speed > SPEED_TO_GC;
  }
}

class World {
  constructor(num_particles) {
    this.pixels = new Array(NUM_CELLS);
    for (let i = 0; i < NUM_CELLS; ++i) {
      this.pixels[i] = new Array(2);
      this.pixels[i].fill(0);
    }
    this.particles = new Map();
    for (let i = 0; i < num_particles; ++i) {
      this.particles.set(i, new Particle(i));
    }
  }

  draw() {
    for (let i = 0; i < this.pixels.length; ++i) {
      this.pixels[i][1] *= HUE_DECAY;
    }
    for (const [i, p] of this.particles) {
      this.pixels[round(p.pos)] = [p.hue, 100];
    }

    for (const [i, pix] of this.pixels.entries()) {
      const [hue, bright] = pix;
      fill(color(hue, 100, bright));
      rect(i * I_GRID_SIZE, 0, I_GRID_SIZE, I_GRID_SIZE);
    }
  }

  step() {
    for (const [i, p] of this.particles) {
      const alive = p.step();
      if (!alive) {
        this.particles.set(i, new Particle(i));
      }
    }
  }
}

function init_world() {
  WORLD = new World(NUM_LIGHTS);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
  frameRate(I_RATE);
  noStroke();
  init_world();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(15);
  WORLD.draw();
  WORLD.step();
}

function keyPressed() {
  switch (key) {
    case 'p': toggle_paused(); break;
    case 'r': init_world(); break;
  }
}

let PAUSED = false;
function toggle_paused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}
