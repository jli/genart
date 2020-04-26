# nannou notes & patterns

## fps-invariance

- **frame time**: doing things on every update/view call is treating frame draws
  as the time tick. if fps can't keep up, the sketch doesn't "miss" updates by
  slowing down.
- **app.time**: can mean the sketch "keeps up" when fps slows down.

when making a video, frame time is preferable due to fps slowdown. and can
change it afterwards by encoding the video at whatever framerate. not sure how
this'll work if the sketch needs to react to real-world things, like video or
audio...


## making videos


### save frames

```
// setup
static mut SAVE_FRAMES: bool = false;

fn main() {
  let args: Vec<String> = std::env::args().collect();
  if args.len() == 2 {
    println!("saving to frames/");
    unsafe { SAVE_FRAMES = true; }
  }
  // stuff
}
```

```
// saving to frames/ directory
fn view(...) {
  // stuff
  unsafe {
  if SAVE_FRAMES {
    app
      .main_window()
      .capture_frame(format!("frames/f{:04}.png", frame.nth()));
  }
}
```

alternatives to unsafe: thread_local! maybe?, or save flag in Model struct.

### make video

see [ffmpeg_notes.md](ffmpeg_notes.md).
