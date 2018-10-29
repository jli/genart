import ddf.minim.*;
import ddf.minim.analysis.*; // FFT

Minim minim;
AudioSource source;
FFT fft;
int fft_spec_size; // hax
// null for mic input
String file = null;
//String file = "torvalds-says-linux.wav";

boolean fullscreen = false;
int spectro_size = 10;
int w = 1400; // rounded down to multiple of spectro_size
int h = 1000;
float radius_base;
float wave_max;
float radius_max;
float circle_weight = 2;

int wn; // spectro size/bounds
int hn;
int bands_per_val;
float[][] spectro;
int spectro_x = 0;
float spectro_fade = 0.95;

color bg = color(#DDDDDD);
color red = color(225, 10, 50);
color blue = color(50, 10, 225);
void spectro_stroke(float alpha) { stroke(155, 10, 165, alpha); }

int round_down(int x, int mult) { return x - (x % mult); }

void setup() {
  // FIXME do something awesome here
  // r + 2m < small-dim
  // (2r + 2m)*2 < large-dim
  // m := r/2
  // 2r < small-dim
  // 6r < big-dim
  size(100, 100);
  surface.setResizable(true);
  w = round_down(fullscreen ? displayWidth : w, spectro_size);
  h = round_down(fullscreen ? displayHeight : h, spectro_size);
  surface.setSize(w, h);
  wn = w/spectro_size;
  hn = h/spectro_size;
  spectro = new float[wn][hn];
  radius_base = w/9;
  wave_max = radius_base/1.2;
  radius_max = radius_base + wave_max;

  frameRate(100);

  minim = new Minim(this);
  if (file == null) {
    source = minim.getLineIn(2, 2048);
  } else {
    source = minim.loadFile(file, 2048);
    ((AudioPlayer)source).play();
    ((AudioPlayer)source).loop();
  }
  fft = new FFT(source.bufferSize(), source.sampleRate());

  fft_spec_size = fft.specSize() / 7; // hax

  // int division - might lose a sample. oh well.
  bands_per_val = max(fft_spec_size / hn, 1);

  println("w, h, wn, hn. "+w+", "+h+", "+wn+", "+hn);
  println("radius-base, wave-max, radius-max. "
          +radius_base+", "+wave_max+", "+radius_max);
}

PVector ouro_point(float val, float angle, float mult) {
  // x = x*cos(theta) - y*sin(theta);
  // y = xprev*sin(theta) + y*cos(theta);
  float sig = radius_base + val*mult; //min(val*mult, wave_max);
  // as if rotating a vector at (0, -sig)
  // - in x value to mirror across y axis
  return new PVector(-sig * sin(angle), -sig * cos(angle));
}

void draw() {
  background(bg);

  PVector p1;
  PVector p2;
  float theta_frac;

  // save spectrogram data for current sample
  for (int iy = 0; iy < hn; ++iy) {
    float band_sum = 0;
    int spect_i = iy * bands_per_val;
    int excl_bound = min(spect_i + bands_per_val, fft_spec_size);
    // bandn is bands_per_val, or less when near end of spectrum
    int bandn = excl_bound - spect_i;
    for (int i = spect_i; i < excl_bound; ++i)
      band_sum += fft.getBand(i);
    spectro[spectro_x][iy] = band_sum / bandn;
  }
  spectro_x = (spectro_x + 1) % wn;

  // draw spectrogram
  strokeWeight(spectro_size);
  int center_adj = spectro_size/2;
  for (int ix = 0; ix < wn; ++ix) {
    for (int iy = 0; iy < hn; ++iy) {
      float spectro_val = spectro[ix][iy];
      // TODO: scaling
      float alpha = map(min(spectro_val, 50), 0, 10, 0, 255);
      spectro_stroke(alpha);
      point(ix * spectro_size + center_adj, h - iy * spectro_size - center_adj);
      spectro[ix][iy] *= spectro_fade; // fade out
    }
  }

  // draw spectrum and waveform circles
  strokeWeight(circle_weight);
  // FIXME log scale
  fft.forward(source.mix);
  theta_frac = TWO_PI / fft_spec_size;
  for (int i = 0; i < fft_spec_size; ++i) {
    stroke(blue);
    // TODO: scaling
    p1 = ouro_point(fft.getBand(i), theta_frac * i, 10);
    p2 = ouro_point(fft.getBand(i+1), theta_frac * (i+1), 10);
    line(w/2 - radius_max + p1.x, h/2 - p1.y,
         w/2 - radius_max + p2.x, h/2 - p2.y);
  }

  int buf_size = source.bufferSize();
  theta_frac = TWO_PI / buf_size;
  for (int i = 0; i < buf_size - 1; ++i) {
    stroke(red);
    // TODO: scaling
    p1 = ouro_point(source.left.get(i), theta_frac * i, wave_max * 5);
    p2 = ouro_point(source.left.get(i+1), theta_frac * (i+1), wave_max * 5);
    line(w/2 + radius_max + p1.x, h/2 - p1.y,
         w/2 + radius_max + p2.x, h/2 - p2.y);
  }

}

void stop() {
  source.close();
  minim.stop();
  super.stop();
}
