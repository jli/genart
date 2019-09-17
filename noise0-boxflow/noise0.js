let TARGET_NUM_BOXES = 10000;
let BOX_SIZE;
let NUM_ROWS, NUM_COLS;
let OPACITY = 0.1;

let ACC_LIMIT = 2.5;
let VEL_LIMIT = 4.0;
let FLOW_NOISE_POS_MULT = 0.005;
let FLOW_NOISE_TIME_MULT = 0.003;

let RESET_EVERY_FRAMECOUNT = 500;

let THINGS = [];

function wrap(x, mx) {
  if (x < -BOX_SIZE/2) return mx;
  if (x > mx+BOX_SIZE/2) return 0;
  return x;
}

function wrap_x(x) { return wrap(x, windowWidth); }
function wrap_y(y) { return wrap(y, windowHeight); }

class Thing {
  constructor(pos, vel, acc, col) {
    this.pos = pos;
    this.vel = vel;
    this.acc = acc;
    this.col = col;
  }

  draw() {
    fill(this.col, OPACITY);
    rect(this.pos.x, this.pos.y, BOX_SIZE, BOX_SIZE);
  }

  update() {
    let flow = createVector(
      map(noise(this.pos.x * FLOW_NOISE_POS_MULT,
                this.pos.y * FLOW_NOISE_POS_MULT,
                frameCount * FLOW_NOISE_TIME_MULT),
          0, 1, -.3, .3),
      map(noise(this.pos.x * FLOW_NOISE_POS_MULT + 100,
                this.pos.y * FLOW_NOISE_POS_MULT + 100,
                frameCount * FLOW_NOISE_TIME_MULT),
          0, 1, -.3, .3));
    this.acc.add(flow).limit(ACC_LIMIT);
    this.vel.add(this.acc).limit(VEL_LIMIT);
    this.pos.add(this.vel);
    this.pos.x = wrap_x(this.pos.x);
    this.pos.y = wrap_y(this.pos.y);
  }
}

function setup_geometry() {
  const pix_per_box = (windowHeight * windowWidth) / TARGET_NUM_BOXES;
  BOX_SIZE = Math.sqrt(pix_per_box);
  NUM_ROWS = floor(windowHeight/BOX_SIZE);
  NUM_COLS = floor(windowWidth/BOX_SIZE);
  console.log(BOX_SIZE, NUM_ROWS, NUM_COLS);
}

function setup() {
  colorMode(HSB);
  noStroke();
  createCanvas(windowWidth, windowHeight);
  setup_geometry();
  init_things();
  background(0);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function init_things() {
  THINGS = [];
  let i = 0;
  for (let r = 0; r < NUM_ROWS; ++r) {
    for (let c = 0; c < NUM_COLS; ++c) {
      const pos = createVector(c * BOX_SIZE, r * BOX_SIZE);
      const vel = createVector();
      const acc = createVector();
      THINGS.push(new Thing(pos, vel, acc, 100));
    }
  }
}

function draw() {
  background(map(frameCount/RESET_EVERY_FRAMECOUNT, 0, 1, 0, 90));
  for (let t of THINGS) {
    t.update();
    t.draw();
  }
  if (frameCount >= RESET_EVERY_FRAMECOUNT) {
    init_things();
    frameCount = 0;
  }
  // noLoop();
}
