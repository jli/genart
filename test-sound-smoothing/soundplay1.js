'use strict';

// draws multiple ellipses tracks with different smoothing values.

const SIZE_GAIN = 100;
const NUM_SAMPLES = 50;
const SMOOTHING_VALS = [0, 0.25, 0.5, .75, 0.9]; //, 0.25, 0.5, 0.75, 1.0];
let SAMPLES = new Map();
let SMOOTH_MICS = new Map();

function init() {
  SAMPLES.clear();
  SMOOTH_MICS.clear();
  for (const smooth_val of SMOOTHING_VALS) {
    SAMPLES.set(smooth_val, new Array(NUM_SAMPLES));
    SMOOTH_MICS.set(smooth_val, new p5.AudioIn());
    SMOOTH_MICS.get(smooth_val).start();
  }
}

function setup() {
  colorMode(HSB);
  createCanvas(windowWidth, windowHeight);
  frameRate(30);
  init();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function draw() {
  background(10);
  for (let smooth of SMOOTHING_VALS) {
    const mic = SMOOTH_MICS.get(smooth);
    const samples = SAMPLES.get(smooth);
    samples.push(mic.getLevel(smooth));
    while (samples.length > NUM_SAMPLES) { samples.shift(); }
  }
  for (const [smooth_i, smooth] of SMOOTHING_VALS.entries()) {
    const y = map(smooth_i, 0, SMOOTHING_VALS.length-1, height*0.1, height*0.9);
    for (const [i, sample] of SAMPLES.get(smooth).entries()) {
      const alpha = map(i, 0, NUM_SAMPLES-1, 0, 0.3);
      const sat = map(i, 0, NUM_SAMPLES-1, 0, 100);
      fill(0, sat, sat, alpha);
      const x = map(i, 0, NUM_SAMPLES-1, 0, width);
      const diam = map(sample, 0, 1, 2, width/NUM_SAMPLES * SIZE_GAIN);
      ellipse(x, y, diam, diam);
    }
  }
}
