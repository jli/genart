use nannou::noise::{NoiseFn, OpenSimplex};
use nannou::prelude::*;
use std::collections::VecDeque;

use scribble::utils::vector_from_angle;

const WIN_SIZE: u32 = 800;
const PARTICLE_LIMIT: usize = 30;
const NOISE_DEBUG: bool = false;
const TTL: u32 = 100;
const EMIT_PROB: f32 = 0.3;
const EMITTER_SIZE: f32 = 1.;
const PARTICLE_MASS: f32 = 2.;

fn main() {
    nannou::app(|_| Model::new())
        .update(|app, model, _updatee| model.update(app))
        .event(event)
        .simple_window(view)
        .size(WIN_SIZE, WIN_SIZE)
        .run();
}

fn view(app: &App, model: &Model, frame: Frame) {
    let draw = app.draw(); //.blend(BLEND_ADD);
    // draw.background().color(BLACK);
    if NOISE_DEBUG {
        let time = app.elapsed_frames() as f64 / 30.;
        for ix in (0..WIN_SIZE).step_by(25) {
            for iy in (0..WIN_SIZE).step_by(25) {
                let pos = vec2(
                    map_range(ix, 0, WIN_SIZE, -(WIN_SIZE as f32) / 2., WIN_SIZE as f32 / 2.),
                    map_range(iy, 0, WIN_SIZE, -(WIN_SIZE as f32) / 2., WIN_SIZE as f32 / 2.));
                let noise_acc = noise_acc_at_pos(&model.noise, pos, time);
                draw.arrow().points(pos, pos + noise_acc * 25.).hsva(0., 0., 0.05, 0.01);
            }
        }
    }
    model.view(&draw);
    draw.to_frame(app, &frame).unwrap();
}

fn event(app: &App, model: &mut Model, event: Event) {
    let mut win_event = |w: WindowEvent| match w {
        MousePressed(MouseButton::Left) => model.add_particle_system(app.mouse.position()),
        _ => (),
    };
    match event {
        Event::WindowEvent {
            simple: Some(w), ..
        } => win_event(w),
        _ => (),
    }
}

struct Model {
    emitters: Vec<ParticleSystem>,
    noise: OpenSimplex,
}

impl Model {
    fn new() -> Model {
        Model {
            emitters: vec![ParticleSystem::new(vec2(0., 0.), 20)],
            noise: OpenSimplex::new(),
        }
    }

    fn update(&mut self, app: &App) {
        let time = app.elapsed_frames() as f64 / 30.;
        for emitter in self.emitters.iter_mut() {
            emitter.update(&self.noise, time);
        }
    }

    fn view(&self, draw: &Draw) {
        for emitter in self.emitters.iter() {
            emitter.view(draw);
        }
    }

    fn add_particle_system(&mut self, mouse_pos: Vector2) {
        self.emitters.push(ParticleSystem::new(mouse_pos, PARTICLE_LIMIT));
    }
}

struct ParticleSystem {
    origin: Vector2,
    particle_limit: usize,
    particles: VecDeque<Particle>, // oldest at front
}

impl ParticleSystem {
    fn new(origin: Vector2, particle_limit: usize) -> ParticleSystem {
        let particles = VecDeque::with_capacity(particle_limit);
        ParticleSystem {
            origin,
            particle_limit,
            particles,
        }
    }

    fn update(&mut self, noise: &OpenSimplex, time: f64) {
        // Move it.
        // TODO: keep it on screen..?
        // moving in opposite direction is interesting
        self.origin += noise_acc_at_pos(noise, self.origin, time) * -2.;
        for p in self.particles.iter_mut() {
            p.update(noise, time);
        }
        // Clear dead particles
        let mut num_ded = 0;
        for (i, p) in self.particles.iter().enumerate() {
            if p.alive() {
                num_ded = i;
                break;
            }
        }
        for _ in 0..num_ded {
            if self.particles.pop_front().is_none() {
                println!("BUG popped more particles that existed");
            }
        }
        // Make random amount of new particles.
        if self.particles.len() < self.particle_limit && random_f32() < EMIT_PROB {
            self.particles.push_back(Particle::new(self.origin));
        }
    }

    fn view(&self, draw: &Draw) {
        let alpha = map_range(self.particles.len(), 0, self.particle_limit, 0.1, 1.);
        draw.ellipse()
            .xy(self.origin)
            .w_h(EMITTER_SIZE, EMITTER_SIZE)
            .hsva(0., 0.5, 1., alpha);
        for p in self.particles.iter() {
            p.view(draw);
        }
    }
}

#[derive(Debug)]
struct Particle {
    pos: Vector2,
    vel: Vector2,
    acc: Vector2,
    mass: f32,
    ttl: u32,
    orig_ttl: u32,
}

impl Particle {
    fn new(pos: Vector2) -> Particle {
        let ttl = TTL;
        let p = Particle {
            pos,
            vel: vector_from_angle(random_range(0., TAU)),
            acc: vec2(0., 0.),
            mass: PARTICLE_MASS,
            ttl,
            orig_ttl: ttl,
        };
        p
    }

    fn update(&mut self, noise: &OpenSimplex, time: f64) {
        if !self.alive() {
            return;
        }

        self.acc = noise_acc_at_pos(noise, self.pos, time);
        self.vel += self.acc;
        // TODO: limiting makes the trails more continuous/wispy
        self.pos += self.vel.clamp_length_max(1.5);
        // self.pos += self.vel;
        self.ttl -= 1;
    }

    fn view(&self, draw: &Draw) {
        if !self.alive() {
            return;
        }
        draw.ellipse()
            .xy(self.pos)
            .w_h(self.mass, self.mass)
            .hsva(0., 0., map_range(self.ttl, 0, self.orig_ttl, 0., 1.), 0.02);
    }

    fn alive(&self) -> bool {
        let win_bound = WIN_SIZE as f32 / 2. * 1.2;
        self.ttl > 0 && self.pos.x < win_bound && self.pos.x > -win_bound && self.pos.y < win_bound && self.pos.y > -win_bound
    }
}

fn noise_acc_at_pos(noise: &OpenSimplex, pos: Vector2, time: f64) -> Vector2 {
    // position divisor controls flow field diversity(?)
    // time divisor controls flow field speed
    vec2(
        noise.get([pos.x as f64/ 100., time / 5.]) as f32,
        noise.get([1000. + pos.y as f64/ 100., time / 5.]) as f32
    )
}
