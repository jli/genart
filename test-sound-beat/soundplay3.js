'use strict';

let mic;
let fft_smooths = [0, 0.35, 0.7, 0.9, 0.98]
// https://sandiegotroubadour.com/2012/10/whats-the-frequency-kenneth/
let beat_thresholds = [20, 300, 600, 1200, 2400, 20000];
let analyzers = [];
let INIT = false;

class PeakDetector {
  constructor(low, hi) {
    this.low = low;
    this.hi = hi;
    this.detector = new p5.PeakDetect(low, hi);
    this.ellipse_w = 50;
  }
  update(fft, max_w) {
    this.detector.update(fft);
    if (this.detector.isDetected) {
      this.ellipse_w = max_w;
    } else {
      this.ellipse_w *= 0.95;
    }
  }
}

class Analyzer {
  constructor(audio_in, smooth_val) {
    this.smooth_val = smooth_val
    this.fft = new p5.FFT(smooth_val);
    this.fft.setInput(audio_in);
    this.peak_detectors = [];
    for (let i = 0; i < beat_thresholds.length-1; ++i) {
      this.peak_detectors.push(
        new PeakDetector(beat_thresholds[i], beat_thresholds[i+1]));
    }
    this.spectrum = [];
  }
  analyze() {
    this.spectrum = this.fft.analyze();
    for (const pd of this.peak_detectors) {
      pd.update(this.fft, 30);
    }
  }
  draw(low_y, hi_y) {
    fill(0, 0.1);
    beginShape();
    for (const [i, x] of this.spectrum.entries()) {
      vertex(
        map(i, 0, this.spectrum.length-1, 0, width),
        map(x, 0, 255, low_y, hi_y));
    }
    for (let i = 0; i < this.spectrum.length; ++i) {
      vertex(map(i, 0, this.spectrum.length-1, width, 0), low_y);
    }
    endShape();

    for (const [i, pd] of this.peak_detectors.entries()) {
      ellipse(map(i, 0, this.peak_detectors.length-1, width * .1, width * .9),
              low_y - abs(low_y - hi_y)/2,
              pd.ellipse_w, pd.ellipse_w); // 20, 20);//
    }
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
  //init();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function mouseClicked() { if (!INIT) { init(); } }

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
