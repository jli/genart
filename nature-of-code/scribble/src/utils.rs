use nannou::prelude::*;

// Note: replacement for nannou's old (0.14) Vector methods
pub fn vector_from_angle(radians: f32) -> Vec2 {
    Vec2::new(radians.cos(), radians.sin())
}

pub fn vector_with_magnitude(v: Vec2, magnitude: f32) -> Vec2 {
    v.normalize() * magnitude
}

pub fn vector_map<F>(v: Vec2, f: F) -> Vec2
where
    F: Fn(f32) -> f32,
{
    Vec2::new(f(v.x), f(v.y))
}
