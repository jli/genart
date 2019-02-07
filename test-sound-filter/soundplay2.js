'use strict';

const SIZE_GAIN = 5;
const NUM_SAMPLES = 40;

let YAYVALS = [];
const NUM_AVES = 50;

//const FILTER_FREQS = [20, 50, 100, 200, 500, 2500];
//const FILTER_FREQS = [20, 50, 100, 200, 300, 400, 500, 2500];
const FILTER_FREQS = [20, 40, 80, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1250, 1500, 1750, 2000, 3000, 4000, 5000];
//const FILTER_RES = [10, 10, 10, 10, 10, 10];
const FILTER_RES = FILTER_FREQS.map(()=>25);
const SAMPLES = new Map();
//const MICS = new Map();
const FILTERS = new Map();
const AMPS = new Map();
let INIT = false;



let fft;
// let SOUND_PATH;
let SOUND_PATH;  // = '/sunset_lover.mp3';
let SOURCE;

function preload() {
  if (SOUND_PATH !== undefined) {
    SOURCE = loadSound(SOUND_PATH);
  }
}

function init() {
  //MICS.clear();
  FILTERS.clear();
  SAMPLES.clear();
  AMPS.clear();

  if (SOURCE === undefined) { SOURCE = new p5.AudioIn(); }
  // mic.connect(filter);
  // if (sound !== undefined) { mic.play(); }
  // else { mic.start(); }

  // for (const [i, filter_freq] of FILTER_FREQS.entries()) {
  //   const filter_res = FILTER_RES[i];
  //   SAMPLES.set(filter_freq, new Array(NUM_SAMPLES));
  //   const filter = new p5.BandPass();
  //   filter.freq(filter_freq);
  //   filter.res(filter_res);
  //   filter.disconnect();
  //   FILTERS.set(filter_freq, filter);
  //
  //   SOURCE.connect(filter);
  //
  //   // if (sound !== undefined) { mic = sound; }
  //   // else { mic = new p5.AudioIn(); }
  //   // const mic = new p5.AudioIn();
  //   // MICS.set(filter_freq, mic);
  //   // mic.connect(filter);
  //   // if (sound !== undefined) { mic.play(); }
  //   // else { mic.start(); }
  //
  //   const amp = new p5.Amplitude();
  //   //amp.toggleNormalize(true);
  //   amp.setInput(filter);
  //   AMPS.set(filter_freq, amp);
  // }
  if (SOUND_PATH !== undefined) { SOURCE.play(); }
  else { SOURCE.start(); }

  //fft = new p5.FFT(0.2, 256);
  fft = new p5.FFT();
  fft.setInput(SOURCE);
  INIT = true;
}

function setup() {
  colorMode(HSB);
  rectMode(CENTER);
  createCanvas(windowWidth, windowHeight);
  frameRate(15);
  //init();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

function mouseClicked() { if (!INIT) { init(); } }


function draw() {
  if (!INIT) { return; }
  background(2);

  // const spectrum = fft.analyze();
  // fill(230, 75, 50, 0.2);
  // for (const [i, val] of spectrum.entries()) {
  //   let x = map(i, 0, spectrum.length, 0, width);
  //   let h = -height + map(val, 0, 255, height, 0);
  //   rect(x, height, width/spectrum.length, h);
  // }

  YAYVALS.push(fft.linAverages(NUM_AVES));
  while (YAYVALS.length > NUM_SAMPLES) { YAYVALS.shift(); }

  for (const [i_time, sample] of YAYVALS.entries()) {
    const y = map(i_time, 0, NUM_SAMPLES-1, 0, height);
    const alpha = map(i_time, 0, NUM_SAMPLES-1, 0.05, 0.5);
    const sat = map(i_time, 0, NUM_SAMPLES-1, 5, 100);
    for (const [i_val, val] of sample.entries()) {
      const x = map(i_val, 0, sample.length-1, width*0.02, width*0.98);
      // const hue = map(i_val, 0, sample.length-1, 0, 340);
      const hue = map(val, 0, 255, 140, 360);
      const diam = map(val, 0, 255, 5, width/sample.length*2.5);
      fill(hue, sat, sat, alpha);
      ellipse(x, y, diam, diam);
    }
  }


  // for (const fv of FILTER_FREQS) {
  //   const mic = AMPS.get(fv);
  //   const samples = SAMPLES.get(fv);
  //   samples.push(mic.getLevel());
  //   while (samples.length > NUM_SAMPLES) { samples.shift(); }
  // }

  // for (const [f_i, fv] of FILTER_FREQS.entries()) {
  //   const y = map(f_i, 0, FILTER_FREQS.length-1, height*0.1, height*0.9);
  //   for (const [i, sample] of SAMPLES.get(fv).entries()) {
  //     const alpha = map(i, 0, NUM_SAMPLES-1, 0.05, 0.4);
  //     const sat = map(i, 0, NUM_SAMPLES-1, 5, 100);
  //     fill(0, sat, sat, alpha);
  //     const x = map(i, 0, NUM_SAMPLES-1, 0, width);
  //     const diam = map(sample, 0, 1, 2, width/NUM_SAMPLES * SIZE_GAIN);
  //     ellipse(x, y, diam, diam);
  //   }
  // }



}
