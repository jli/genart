import ddf.minim.*;
import ddf.minim.analysis.*; // FFT

Minim minim;
AudioSource source;
FFT fft;
// null for mic input
String file = null;
//String file = "torvalds-says-linux.wav";

boolean fullscreen = true;
int w = 1280;
int h = 800;
float radius_base;
float wave_max;
float radius_max;

color bg = color(#DDDDDD);
color red = color(225, 10, 50);
color blue = color(50, 10, 225);

void setup() {
  // FIXME do something awesome here
  // r + 2m < small-dim
  // (2r + 2m)*2 < large-dim
  // m := r/2
  // 2r < small-dim
  // 6r < big-dim
  w = fullscreen ? displayWidth : w;
  h = fullscreen ? displayHeight : h;
  radius_base = w/9;
  wave_max = radius_base/1.2;
  radius_max = radius_base + wave_max;
  size(w, h);
  minim = new Minim(this);
  if (file == null) {
    source = minim.getLineIn();
  } else {
    source = minim.loadFile(file);
    ((AudioPlayer)source).play();
    ((AudioPlayer)source).loop();
  }
  fft = new FFT(source.bufferSize(), source.sampleRate());
}

PVector ouro_point(float val, float angle, float mult) {
  // x = x*cos(theta) - y*sin(theta);
  // y = xprev*sin(theta) + y*cos(theta);
  float sig = radius_base + min(val*mult, wave_max);
  // as if rotating a vector at (0, -sig)
  return new PVector(sig * sin(angle), -sig * cos(angle));
}

void draw() {
  background(bg);

  PVector p1;
  PVector p2;
  float theta_frac;

  // FIXME log scale
  fft.forward(source.mix);
  int spec_size = fft.specSize() / 3; // hax
  theta_frac = TWO_PI / spec_size;
  for (int i = 0; i < spec_size; ++i) {
    stroke(blue);
    p1 = ouro_point(fft.getBand(i), theta_frac * i, 2);
    p2 = ouro_point(fft.getBand(i+1), theta_frac * (i+1), 2);
    line(w/2 - radius_max + p1.x, h/2 - p1.y,
         w/2 - radius_max + p2.x, h/2 - p2.y);
  }

  int buf_size = source.bufferSize();
  theta_frac = TWO_PI / buf_size;
  for (int i = 0; i < buf_size - 1; ++i) {
    stroke(red);
    p1 = ouro_point(source.left.get(i), theta_frac * i, wave_max);
    p2 = ouro_point(source.left.get(i+1), theta_frac * (i+1), wave_max);
    line(w/2 + radius_max + p1.x, h/2 - p1.y,
         w/2 + radius_max + p2.x, h/2 - p2.y);
  }
}

void stop() {
  source.close();
  minim.stop();
  super.stop();
}
