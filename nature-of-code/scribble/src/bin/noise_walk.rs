use nannou::noise::NoiseFn;
use nannou::prelude::*;

fn main() {
  nannou::app(model).simple_window(view).size(600, 600).run();
}

struct Model {
  noise: Box<dyn NoiseFn<[f64; 2]>>,
  frame_dir: Option<String>,
}

// Expects that if the sketch gets 1 argument, it's the directory to write frames to. Will create
// the directory if it doesn't exist.
fn get_frame_dir() -> Option<String> {
  let mut args: Vec<String> = std::env::args().collect();
  match args.len() {
    2 => {
      let dir = args.pop().unwrap();
      std::fs::create_dir_all(&dir).unwrap();
      Some(dir)
    }
    1 => None,
    _ => panic!("weird number of args"),
  }
}

fn model(_: &App) -> Model {
  let noise = Box::new(nannou::noise::OpenSimplex::new());
  Model {
    noise,
    frame_dir: get_frame_dir(),
  }
}

fn view(app: &App, model: &Model, frame: Frame) {
  let draw = app.draw();
  if frame.nth() == 0 {
    draw.background().color(WHITE);
  }
  let t = frame.nth() as f64 / 60.0;
  if frame.nth() % 30 == 0 {
    println!(
      "frame {}\ttime {}\tfps {}\tt {}",
      frame.nth(),
      app.time,
      app.fps(),
      t
    );
  }
  let pos = vec2(
    (model.noise.get([t / 1.5, 0.0]) * 600.0) as f32,
    (model.noise.get([0.0, t / 1.5]) * 600.0) as f32,
  );
  let w = (model.noise.get([t / 3.0, t / 3.0]) + 1.0) * 70.0;
  // if frame.nth() % 10 == 0 {
  //   println!("x,y: {},{}", x, y);
  // }
  draw
    .ellipse()
    .xy(pos)
    .w_h(w.max(0.01) as f32, w.max(0.01) as f32)
    .hsva(0.0, 0.0, 0.0, 0.02);
  draw.to_frame(app, &frame).unwrap();

  if let Some(dir) = &model.frame_dir {
    app
      .main_window()
      .capture_frame(format!("{}/f{:04}.png", dir, frame.nth()));
  }
}
