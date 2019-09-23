// TODO:
// - tweak stroke drawing
// - try deviations from exact direction (gaussian, private noise?), or more momentum?
// - make new boxes smaller.
// - make old boxes shrink to 0 instead of just removing?
// - use gui library


let TARGET_NUM_BOXES = 5000;
let BOX_SIZE;
let NUM_ROWS, NUM_COLS;
let OPACITY = 0.1;
let STROKE_OPACITY = 0.3;
let DRAW_STROKE = true;
let SPEED_MULT = 1.0;

let ACC_LIMIT = 2.5;
let VEL_LIMIT = 4.0;
let FLOW_NOISE_POS_MULT = 0.005;
let FLOW_NOISE_TIME_MULT = 0.003;
let SIZE_NOISE_MULT = 0.03;

let NUM_REFRESHED_THINGS_PER_FRAME = 5;
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
  constructor(pos, vel, acc) {
    this.pos = pos || createVector(random(0, windowWidth),
                                   random(0, windowHeight));
    this.vel = vel || createVector();
    this.acc = acc || createVector();
    this.size_mult = 1.0;
  }

  draw(col) {
    fill(col, OPACITY);
    if (DRAW_STROKE) {
      let stroke_bright = col > 50 ? 0 : 40;
      stroke(stroke_bright, STROKE_OPACITY);
      // stroke(col, 0.2);
    }
    rect(this.pos.x, this.pos.y,
      BOX_SIZE * this.size_mult, BOX_SIZE * this.size_mult);
  }

  update() {
    this.size_mult = constrain(
      this.size_mult * map(
          noise(this.pos.x * SIZE_NOISE_MULT, this.pos.y * SIZE_NOISE_MULT),
          0, 1, 0.8, 1.2),
      0.4, 2.5);
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
    this.pos.add(this.vel.mult(SPEED_MULT));
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
  init_world();
  background(0);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function init_world() {
  setup_geometry();  // in case window size changed
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
    init_world();
  }
  // noLoop();
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
