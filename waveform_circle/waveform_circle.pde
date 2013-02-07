import ddf.minim.*;
import ddf.minim.analysis.*; // FFT

Minim minim;
AudioSource source;
FFT fft;
// null for mic input
String file = null;
//String file = "torvalds-says-linux.wav";

int w = 500;
int h = 500;
int waveh = w/4;
float ouro_rad = w/4;

color bg = color(#CCCCCC);
color red = color(225, 10, 50);
color green = color(50, 225, 10);
color blue = color(50, 10, 225);

void setup() {
  size(w, h);
  minim = new Minim(this);
  if (file == null) {
    source = minim.getLineIn();
  } else {
    source = minim.loadFile(file, 1024);
    ((AudioPlayer)source).play();
    ((AudioPlayer)source).loop();
  }
  //fft = new FFT(source.bufferSize(), source.sampleRate());
}

PVector ouro_point(float angle, int index) {
  float sig = ouro_rad + source.mix.get(index)*waveh;
  return new PVector(sig * cos(angle), sig * sin(angle));
}

void draw() {
  background(bg);

  /*
  fft.forward(source.left);
  for (int i = 0; i < fft.specSize(); ++i)
    line(i, thirdh, i, thirdh + fft.getBand(i)*4);
  */

  int bufsize = source.bufferSize();
  float theta_frac = TWO_PI / bufsize;
  for (int i = 0; i < bufsize - 1; ++i) {
    PVector p1 = ouro_point(theta_frac * i, i);
    PVector p2 = ouro_point(theta_frac * (i+1), i+1);

    stroke(red);
    line(w/2 + p1.x, h/2 - p1.y,
         w/2 + p2.x, h/2 - p2.y);
  }
}

void stop() {
  source.close();
  minim.stop();
  super.stop();
}
