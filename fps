double prev_time = 0;
int frames = 0;

void draw() {
  double now = System.currentTimeMillis();
  double diff = now - prev_time;
  if (diff > 1000) {
    float secs = (float) (diff/1000);
    println("fps: "+frames+"/"+secs+", "+frames/secs);
    prev_time = now;
    frames = 0;
  }
  ++frames;

}
