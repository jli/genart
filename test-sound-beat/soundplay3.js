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
    this.peak_detector = new p5.PeakDetect();
    this.ellipse_w = 10;

    this.spectrum = [];
    this.beat = false;
  }
  analyze() {
    this.spectrum = this.fft.analyze();
    this.peak_detector.update(this.fft);
    this.beat = this.peak_detector.isDetected;
  }
  draw(low_y, hi_y) {
    noFill();
    beginShape();
    for (const [i, x] of this.spectrum.entries()) {
      vertex(
        map(i, 0, this.spectrum.length, 0, width),
        map(x, 0, 255, low_y, hi_y));
    }
    endShape();

    if (this.beat) {
      this.ellipse_w = abs(hi_y - low_y);
    } else {
      this.ellipse_w *= map(this.smooth_val, 0, 1, 0.5, 1);
    }
    fill(0, .5);
    ellipse(width * .8, low_y + (hi_y-low_y)/2,
            this.ellipse_w, this.ellipse_w);
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
  frameRate(30);
  init();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// function mouseClicked() { if (!INIT) { init(); } }

function draw() {
  if (!INIT) { textSize(30); text('not initialized... maybe click?', width * .1, height / 2); return; }

  background(170);
  const per_display_height = height / analyzers.length;
  for (const [i, analyzer] of analyzers.entries()) {
    analyzer.analyze();
    const bottom_y = height - (i * per_display_height);
    analyzer.draw(bottom_y, bottom_y - per_display_height);
  }
}
