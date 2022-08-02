use nannou::noise::{NoiseFn, OpenSimplex};
use nannou::prelude::*;
use std::collections::VecDeque;

const WIN_SIZE: f32 = 700.0;
const NUM_SPRITES: usize = 300;
const NOISE_MAG: f32 = 9.5;
const ACC_SCALE: f32 = 0.019;
const VEL_MAX: f32 = 15.0;
const TRAIL_LIMIT: usize = 5;

static mut SAVE_FRAMES: bool = false;

fn main() {
  let args: Vec<String> = std::env::args().collect();
  if args.len() == 2 {
    println!("saving to frames/");
    unsafe {
      SAVE_FRAMES = true;
    }
  }

  nannou::app(Model::new)
    .update(Model::update)
    .simple_window(view)
    .size(WIN_SIZE as u32, WIN_SIZE as u32)
    .run();
}

struct Model {
  noise: OpenSimplex,
  sprites: Vec<Sprite>,
}

#[derive(Debug)]
struct Sprite {
  noise_offset: Vector2,
  pos: VecDeque<Vector2>,
  vel: Vector2,
  acc: Vector2,
}

fn noise_map(noise_val: f64) -> f32 {
  map_range(noise_val as f64, 0.0, 1.0, 0.0, NOISE_MAG)
}

fn mag(v: &Vector2) -> f32 {
  // todo: how to use this? https://docs.rs/nannou/0.13.1/nannou/prelude/trait.InnerSpace.html
  // v.mag()
  (v.x.powi(2) + v.y.powi(2)).sqrt()
}

impl Model {
  fn new(_app: &App) -> Model {
    let mut sprites = Vec::new();
    for _ in 0..NUM_SPRITES {
      sprites.push(Sprite::new());
    }
    Model {
      noise: OpenSimplex::new(),
      sprites,
    }
  }

  fn update(app: &App, model: &mut Model, _update: Update) {
    let mpos = app.mouse.position();
    for sprite in model.sprites.iter_mut() {
      // let t = app.time;
      // normalized
      let t = app.elapsed_frames() as f32 / 30.0;
      sprite.update(&mpos, &model.noise, t);
    }
  }
}

impl Sprite {
  fn new() -> Sprite {
    let mut s = Sprite {
      noise_offset: vec2(random_f32() * 10.0, random_f32() * 10.0),
      pos: VecDeque::new(),
      // pos: vec2(random_f32() * WIN_SIZE, random_f32() * WIN_SIZE),
      vel: Vector2::ZERO,
      acc: Vector2::ZERO,
    };
    s.pos.push_back(Vector2::ZERO);
    s
  }

  fn update(self: &mut Sprite, mpos: &Vector2, noise: &OpenSimplex, time: f32) {
    let pos0 = self.pos.back().unwrap();
    let mouse_dist = *mpos - *pos0;
    self.acc = mouse_dist * ACC_SCALE;
    self.vel = (self.vel + self.acc).clamp_length_max(VEL_MAX);
    let noisepos = vec2(
      noise_map(noise.get([(self.noise_offset.x + time) as f64, 0.0])),
      noise_map(noise.get([(self.noise_offset.y + time) as f64, 0.0])),
    );
    // avoiding https://github.com/rust-lang/rust/issues/59159
    let newpos = *pos0 + self.vel + noisepos;
    self.pos.push_back(newpos);
    if self.pos.len() > TRAIL_LIMIT {
      self.pos.pop_front();
    }
  }
}

fn view(app: &App, model: &Model, frame: Frame) {
  let draw = app.draw();
  draw.background().color(BLACK);
  for sprite in model.sprites.iter() {
    // todo: hacky. boils down to mouse dist...
    let sat = map_range(mag(&sprite.acc), 0.0, WIN_SIZE * ACC_SCALE / 2.0, 0.0, 1.0);
    for (i, pos) in sprite.pos.iter().enumerate() {
      let alpha = map_range(i, 0, TRAIL_LIMIT - 1, 0.05, 0.5);
      draw
        .ellipse()
        .xy(*pos)
        .w_h(3., 3.)
        .hsva(0.0, sat, 1.0, alpha);
    }
  }
  draw
    .ellipse()
    .xy(app.mouse.position())
    .w_h(13.0, 13.0)
    .hsva(0.4, 1.0, 1.0, 0.2);
  draw.to_frame(app, &frame).unwrap();

  if frame.nth() % 30 == 0 {
    println!(
      "frame {}\ttime {}\tfps {}\tt {}\ttnorm {}",
      frame.nth(),
      app.time,
      app.fps(),
      frame.nth() as f64 / 60.0,
      app.time * app.fps() / 60.0
    );
  }
  // unsafe {
  //   if SAVE_FRAMES {
  //     app
  //       .main_window()
  //       .capture_frame(format!("frames/f{:04}.png", frame.nth()));
  //   }
  // }
}
