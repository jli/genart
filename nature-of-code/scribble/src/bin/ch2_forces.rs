use nannou::prelude::*;

const NUM_BALLS: usize = 10;

fn main() {
  nannou::app(Model::new)
    .update(Model::update)
    .simple_window(view)
    .size(500, 500)
    .run();
}

struct Model {
  balls: Vec<Ball>,
}

struct Ball {
  pos: Vector2,
  vel: Vector2,
  acc: Vector2,
  mass: f32,
}

impl Model {
  fn new(_: &App) -> Model {
    let mut balls = Vec::new();
    for _ in 0..NUM_BALLS {
      balls.push(Ball::new());
    }
    Model { balls }
  }

  fn update(app: &App, model: &mut Model, _: Update) {
    let bounds = app.window_rect();
    for ball in model.balls.iter_mut() {
      ball.update(&bounds);
    }
  }
}

impl Ball {
  fn new() -> Self {
    Self {
      pos: vec2(random_range(-250.0, 250.0), random_range(-250.0, 250.0)),
      vel: vec2(0.0, 0.0),
      acc: vec2(0.0, 0.0),
      mass: random_range(10.0, 30.0),
    }
  }

  fn update(self: &mut Self, bounds: &Rect) {
    let t = 1.0 / 30.0;
    let g = vec2(0.0, -10.0);
    let wind = vec2(5.0, 0.0) / self.mass;
    self.acc = g + wind;
    self.vel += self.acc.map(|v| v * t);
    self.pos += self.vel.map(|v| v * t);
    self.bounds_check(bounds);
  }

  fn bounds_check(self: &mut Self, bounds: &Rect) {
    if self.pos.x - self.mass < bounds.left() || self.pos.x + self.mass > bounds.right() {
      self.pos.x = clamp(
        self.pos.x,
        bounds.left() + self.mass,
        bounds.right() - self.mass,
      );
      self.vel.x *= -1.0;
    }
    if self.pos.y - self.mass < bounds.bottom() || self.pos.y + self.mass > bounds.top() {
      self.pos.y = clamp(
        self.pos.y,
        bounds.bottom() + self.mass,
        bounds.top() - self.mass,
      );
      self.vel.y *= -1.0;
    }
  }
}

fn view(app: &App, model: &Model, frame: Frame) {
  let draw = app.draw();
  draw.background().color(WHITE);

  if app.elapsed_frames() % 30 == 0 {
    println!(
      "fps {:?}\tframe {:?}\tt {:?}",
      app.fps(),
      app.elapsed_frames(),
      app.elapsed_frames() as f32 / 60.0
    );
  }

  for ball in model.balls.iter() {
    draw
      .ellipse()
      .xy(ball.pos)
      .w_h(ball.mass * 2.0, ball.mass * 2.0)
      .stroke_weight(2.0)
      .hsva(0.0, 0.0, 0.2, 0.8);
  }

  draw.to_frame(app, &frame).unwrap();
}
