use nannou::noise::NoiseFn;
use nannou::prelude::*;

fn main() {
  nannou::app(model).simple_window(view).run();
}

struct Model {
  noise: Box<dyn NoiseFn<[f64; 2]>>,
}

fn model(_: &App) -> Model {
  let noise = Box::new(nannou::noise::OpenSimplex::new());
  Model { noise }
}

fn view(app: &App, Model { noise }: &Model, frame: Frame) {
  let draw = app.draw();
  if frame.nth() == 0 {
    draw.background().color(WHITE);
  }
  let pos = vec2(
    (noise.get([app.time as f64 / 3.0, 0.0]) * 600.0) as f32,
    (noise.get([0.0, app.time as f64 / 3.0]) * 600.0) as f32,
  );
  let w = (noise.get([app.time as f64 / 3.0, app.time as f64 / 3.0]) + 1.0) * 70.0;
  // if frame.nth() % 10 == 0 {
  //   println!("x,y: {},{}", x, y);
  // }
  draw
    .ellipse()
    .xy(pos)
    .w_h(w.max(0.01) as f32, w.max(0.01) as f32)
    .hsva(0.0, 0.0, 0.0, 0.02);
  draw.to_frame(app, &frame).unwrap();
}
