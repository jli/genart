let TARGET_NUM_BOXES = 10000;
let BOX_SIZE;
let NUM_ROWS, NUM_COLS;
let OPACITY = 0.1;

let ACC_LIMIT = 2.5;
let VEL_LIMIT = 4.0;
let FLOW_NOISE_POS_MULT = 0.005;
let FLOW_NOISE_TIME_MULT = 0.003;
let SIZE_NOISE_MULT = 0.03;

let NUM_REFRESHED_THINGS_PER_FRAME = 5;
let RESET_EVERY_FRAMECOUNT = 1000;
let THINGS = [];

function wrap(x, mx) {
  if (x < -BOX_SIZE/2) return mx;
  if (x > mx+BOX_SIZE/2) return 0;
  return x;
}

function wrap_x(x) { return wrap(x, windowWidth); }
function wrap_y(y) { return wrap(y, windowHeight); }

class Thing {
  constructor(pos, vel, acc) {
    this.pos = pos || createVector(random(0, windowWidth),
                                   random(0, windowHeight));
    this.vel = vel || createVector();
    this.acc = acc || createVector();
    this.size_mult = 1.0;
  }

  draw(col) {
    fill(col, OPACITY);
    rect(this.pos.x, this.pos.y,
      BOX_SIZE * this.size_mult, BOX_SIZE * this.size_mult);
  }

  update() {
    this.size_mult = constrain(
      this.size_mult * map(
          noise(this.pos.x * SIZE_NOISE_MULT, this.pos.y * SIZE_NOISE_MULT),
          0, 1, 0.8, 1.2),
      0.5, 2.5);
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
      THINGS.push(new Thing(pos));
    }
  }
}

function random_int(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function refresh_random_thing() {
  THINGS.splice(random_int(THINGS.length), 1);
  THINGS.push(new Thing());
}

let dir = 1;
let count = 0;
function draw() {
  for (let i = 0; i < NUM_REFRESHED_THINGS_PER_FRAME; ++i) refresh_random_thing();

  let bg;
  if (dir > 0) {
    bg = map(count/RESET_EVERY_FRAMECOUNT, 0, 1, 0, 35);
  } else {
    bg = map(count/RESET_EVERY_FRAMECOUNT, 0, 1, 100, 65);
  }
  const fg = 100 - bg;

  background(bg);
  for (let t of THINGS) {
    t.update();
    t.draw(fg);
  }

  ++count;
  if (count >= RESET_EVERY_FRAMECOUNT) {
    count = 0;
    dir *= -1;
    init_things();
  }
  // noLoop();
}
