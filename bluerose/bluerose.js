let NUM_PEDAL_LEVELS = 3;
let NUM_PEDALS_PER_LEVEL = 10;
let PEDALS = [];
let gui;

class Pedal {
  constructor(theta_start, theta_end, radius, lightness) {
    this.theta_start = theta_start;
    this.theta_end = theta_end;
    this.radius = radius;
    this.lightness = lightness;
  }

  draw() {
    fill(200, 80, 100 * this.lightness);
    let center_x = windowWidth / 2;
    let center_y = windowHeight / 2;
    triangle(
      center_x, center_y,
      center_x + this.radius * Math.cos(this.theta_start), center_y + this.radius * Math.sin(this.theta_start),
      center_x + this.radius * Math.cos(this.theta_end), center_y + this.radius * Math.sin(this.theta_end)
    )
  }

  update() {
    // this.size_mult = constrain(
    //   this.size_mult * map(
    //     noise(this.pos.x * SIZE_NOISE_MULT, this.pos.y * SIZE_NOISE_MULT),
    //     0, 1, 0.8, 1.2),
    //   SIZE_MULT_MINL, SIZE_MULT_MAXL);
    // flow = createVector(
    //   map(noise(this.pos.x * FLOW_NOISE_POS_MULT,
    //     this.pos.y * FLOW_NOISE_POS_MULT,
    //     frameCount * FLOW_NOISE_TIME_MULT),
    //     0, 1, -ACC_LIMIT, ACC_LIMIT),
    //   map(noise(this.pos.x * FLOW_NOISE_POS_MULT + 10000,
    //     this.pos.y * FLOW_NOISE_POS_MULT + 10000,
    //     frameCount * FLOW_NOISE_TIME_MULT),
    //     0, 1, -ACC_LIMIT, ACC_LIMIT));
    // //this.acc.add(flow).limit(ACC_LIMIT);
    // this.acc.add(flow);//.limit(ACC_LIMIT);
    // this.acc.mult(1 - DRAG);
    // //this.vel.mult(1-VEL_DRAG);
    // this.vel.add(this.acc).limit(VEL_LIMIT);
    // //this.vel = flow.limit(VEL_LIMIT);
    // this.pos.add(this.vel.mult(SPEED_MULT));
    // this.pos.x = wrap_x(this.pos.x);
    // this.pos.y = wrap_y(this.pos.y);
  }
}

function setup() {
  colorMode(HSB);
  noStroke();
  createCanvas(windowWidth, windowHeight);
  init_world();
  background(0);

  gui = createGui('settings');
  sliderRange(2, 20, 1);
  gui.addGlobals('NUM_PEDALS');
  // min/max radius, min/max theta
  gui.toggleCollapsed();

  noLoop();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function init_world() {
  PEDALS = [];
  // outer pedals first, inner pedals last
  let theta_zero = Math.random() * 2*Math.PI;
  let last_radius = 200;
  let lightness = 0.9;
  for (let level = 0; level < NUM_PEDAL_LEVELS; ++level) {
    theta_zero += Math.random() / 10 * 2*Math.PI;
    let last_theta_end = theta_zero;
    for (let i = 0; i < NUM_PEDALS_PER_LEVEL; ++i) {
      last_radius *= (1 + (Math.random() - 0.5) / 10);
      lightness *= (1 + (Math.random() - 0.5) / 2);
      let theta_start = theta_zero;
      let theta_end;
      if (i == NUM_PEDALS_PER_LEVEL - 1) {
        theta_end = 0;
      } else {
        theta_end = last_theta_end + 2*Math.PI / NUM_PEDALS_PER_LEVEL * (1 + (Math.random() - 0.5) / 2);
      }
      PEDALS.push(new Pedal(theta_start, theta_end, last_radius, lightness));
      last_theta_end = theta_end;
    }

    lightness *= 0.7;
    last_radius *= 0.7;
  }
}

function random_int(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function draw() {
  background(0);
  for (let p of PEDALS) {
    // console.log("drawing pedal:", p);
    p.update();
    p.draw();
  }
}

function keyPressed() {
  switch (key) {
    case 'p': toggle_paused(); break;
    case 'r': init_world(); draw(); break;
    case ';': gui.toggleCollapsed(); break;
  }
}

let PAUSED = false;
function toggle_paused() {
  PAUSED = !PAUSED;
  if (PAUSED) { noLoop(); } else { loop(); }
}
