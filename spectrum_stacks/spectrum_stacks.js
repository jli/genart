'use strict';

let mic;
let fft_smooths = [0, 0.35, 0.7, 0.9, 0.98]
let analyzers = [];
let INIT = false;

class Analyzer {
  constructor(audio_in, smooth_val) {
    this.smooth_val = smooth_val
    this.fft = new p5.FFT(smooth_val);
    this.fft.setInput(audio_in);
    this.spectrum = [];
  }
  analyze() {
    this.spectrum = this.fft.analyze();
  }
  draw(min_r, max_r) {
    fill(50, 0.3);
    beginShape();
    for (const [i, x] of this.spectrum.entries()) {
      const theta = map(i, 0, this.spectrum.length, 0, TWO_PI) + PI;
      const rad_val = map(x, 0, 255, min_r, max_r);
      vertex(
        width/2 + cos(theta) * rad_val,
        height/2 + sin(theta) * rad_val);
    }
    endShape();
  }
}

function init() {
  mic = new p5.AudioIn();
  mic.start();
  for (const [i, smooth_val] of fft_smooths.entries()) {
    analyzers.push(new Analyzer(mic, smooth_val));
  }
  INIT = true;
}

function setup() {
  colorMode(HSB);
  rectMode(CENTER);
  createCanvas(windowWidth, windowHeight);
  frameRate(60);
  init();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// function mouseClicked() { if (!INIT) { init(); } }

function draw() {
  if (!INIT) { textSize(30); text('not initialized... maybe click?', width * .1, height / 2); return; }

  background(130);
  const per_display_height = min(height, width) / (analyzers.length * 2.5);
  for (const [i, analyzer] of analyzers.entries()) {
    analyzer.analyze();
    const min_r = (i+1) * per_display_height;
    analyzer.draw(min_r, min_r + per_display_height);
  }
}
