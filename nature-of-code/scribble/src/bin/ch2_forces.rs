use nannou::prelude::*;

const NUM_BALLS: usize = 10;
const NUM_ATTRACTORS: usize = 3;
const WIN_SIZE: u32 = 1000;

fn main() {
  nannou::app(Model::new)
    .update(Model::update)
    .simple_window(view)
    .size(WIN_SIZE, WIN_SIZE)
    .event(event)
    .run();
}

struct Model {
  balls: Vec<Ball>,
  attractors: Vec<Ball>,
  trails: bool,
}

#[derive(Clone)]
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
    let mut attractors = Vec::new();
    for _ in 0..NUM_ATTRACTORS {
      attractors.push(Ball::attractor());
    }
    Model { balls, attractors, trails: false }
  }

  fn update(app: &App, model: &mut Model, _: Update) {
    let bounds = app.window_rect();
    let mut bcopy = model.balls.clone();
    bcopy.extend_from_slice(&model.attractors);
    for ball in model.balls.iter_mut() {
      ball.update(&bounds, &bcopy);
    }
    let acopy = model.attractors.clone();
    for a in model.attractors.iter_mut() {
      a.update(&bounds, &acopy);
    }
  }
}

impl Ball {
  fn new() -> Self {
    Self {
      pos: Vector2::from_angle(random_range(0., TAU)).with_magnitude((WIN_SIZE as f32) / 2.),
      vel: vec2(0., 0.),
      acc: vec2(0., 0.),
      mass: random_range(10.0, 20.0),
    }
  }

  fn attractor() -> Self {
    Self {
      pos: Vector2::from_angle(random_range(0., TAU)).with_magnitude(random_range(0., (WIN_SIZE as f32) / 2.)),
      vel: vec2(0., 0.),
      acc: vec2(0., 0.),
      mass: random_range(20., 50.),
    }
  }

  fn update(self: &mut Self, bounds: &Rect, attractors: &Vec<Ball>) {
    let t = 1.0 / 30.0;
    // let g = vec2(0.0, -10.0);
    // let wind = vec2(5.0, 0.0) / self.mass;
    let mut attractor = vec2(0., 0.);
    for a in attractors.iter() {
      attractor += (a.pos - self.pos).map(|x| x * a.mass * self.mass / 500.0);
    }
    self.acc = attractor;
    self.vel += self.acc.map(|v| v * t);
    self.pos += self.vel.map(|v| v * t);
    self.bounds_check(bounds);
  }

  fn bounds_check(self: &mut Self, bounds: &Rect) {
    let bounce_diminish = 0.2;
    if self.pos.x - self.mass < bounds.left() || self.pos.x + self.mass > bounds.right() {
      self.pos.x = clamp(
        self.pos.x,
        bounds.left() + self.mass,
        bounds.right() - self.mass,
      );
      self.vel.x *= -bounce_diminish;
    }
    if self.pos.y - self.mass < bounds.bottom() || self.pos.y + self.mass > bounds.top() {
      self.pos.y = clamp(
        self.pos.y,
        bounds.bottom() + self.mass,
        bounds.top() - self.mass,
      );
      self.vel.y *= -bounce_diminish;
    }
  }
}

fn view(app: &App, model: &Model, frame: Frame) {
  let draw = app.draw();
  if !model.trails {
    draw.background().color(WHITE);
  }

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
      .hsva(0.0, 0.0, 0.5, 0.7);
  }
  for attractor in model.attractors.iter() {
    draw
      .ellipse()
      .xy(attractor.pos)
      .w_h(attractor.mass * 2.0, attractor.mass * 2.0)
      .stroke_weight(3.0)
      .hsva(0.0, 0.0, 0.05, 0.8);
  }

  draw.to_frame(app, &frame).unwrap();
}

fn event(app: &App, model: &mut Model, event: Event) {
  let mut win_event = |wevent| {
      match wevent {
          KeyPressed(Key::T) => model.trails = !model.trails,
          _ => (),
      }
  };
  match event {
      Event::WindowEvent {
          simple: Some(w), ..
      } => win_event(w),
      _ => (),
  }
}
