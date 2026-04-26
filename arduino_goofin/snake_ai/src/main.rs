use std::collections::{HashMap, HashSet, VecDeque};
use std::env;
use std::fs::{self, File};
use std::io::{BufWriter, Write};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Dir { Up, Down, Left, Right }

impl Dir {
    fn dxdy(self) -> (i32, i32) {
        match self {
            Dir::Up => (0, -1),
            Dir::Down => (0, 1),
            Dir::Left => (-1, 0),
            Dir::Right => (1, 0),
        }
    }
    fn opposite(self) -> Dir {
        match self {
            Dir::Up => Dir::Down,
            Dir::Down => Dir::Up,
            Dir::Left => Dir::Right,
            Dir::Right => Dir::Left,
        }
    }
    fn all() -> [Dir; 4] { [Dir::Up, Dir::Right, Dir::Down, Dir::Left] }
    fn name(self) -> &'static str {
        match self { Dir::Up => "U", Dir::Down => "D", Dir::Left => "L", Dir::Right => "R" }
    }
}

#[derive(Clone)]
struct Game {
    w: i32,
    h: i32,
    snake: VecDeque<(i32, i32)>,
    dir: Dir,
    food: (i32, i32),
    rng: u64,
    tick: u32,
}

fn rng_next(s: &mut u64) -> u64 {
    let mut x = *s;
    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    *s = x;
    x
}

#[derive(PartialEq, Eq, Debug)]
enum StepResult { Moved, Ate, Died(&'static str) }

impl Game {
    fn new(w: i32, h: i32, seed: u64) -> Self {
        let mut g = Game {
            w, h,
            snake: VecDeque::new(),
            dir: Dir::Right,
            food: (0, 0),
            rng: seed | 1,
            tick: 0,
        };
        let cx = w / 2;
        let cy = h / 2;
        g.snake.push_back((cx, cy));
        g.snake.push_back((cx - 1, cy));
        g.snake.push_back((cx - 2, cy));
        g.place_food();
        g
    }

    fn in_bounds(&self, p: (i32, i32)) -> bool {
        p.0 >= 0 && p.0 < self.w && p.1 >= 0 && p.1 < self.h
    }

    fn body_set(&self) -> HashSet<(i32, i32)> {
        self.snake.iter().copied().collect()
    }

    fn place_food(&mut self) {
        let body = self.body_set();
        let total = (self.w * self.h) as usize;
        if body.len() >= total { return; }
        let free_count = total - body.len();
        let pick = (rng_next(&mut self.rng) as usize) % free_count;
        let mut idx = 0usize;
        for x in 0..self.w {
            for y in 0..self.h {
                if !body.contains(&(x, y)) {
                    if idx == pick { self.food = (x, y); return; }
                    idx += 1;
                }
            }
        }
    }

    fn head(&self) -> (i32, i32) { *self.snake.front().unwrap() }
    fn tail(&self) -> (i32, i32) { *self.snake.back().unwrap() }

    fn step(&mut self, requested: Dir) -> StepResult {
        self.tick += 1;
        let d = if self.snake.len() > 1 && requested == self.dir.opposite() {
            self.dir
        } else {
            requested
        };
        self.dir = d;
        let (dx, dy) = d.dxdy();
        let h = self.head();
        let new_head = (h.0 + dx, h.1 + dy);
        if !self.in_bounds(new_head) {
            return StepResult::Died("wall");
        }
        let eats = new_head == self.food;
        let mut blocked = self.body_set();
        if !eats { blocked.remove(&self.tail()); }
        if blocked.contains(&new_head) {
            return StepResult::Died("self");
        }
        self.snake.push_front(new_head);
        if eats {
            if (self.snake.len() as i32) == self.w * self.h {
                return StepResult::Ate;
            }
            self.place_food();
            StepResult::Ate
        } else {
            self.snake.pop_back();
            StepResult::Moved
        }
    }
}

fn bfs(start: (i32, i32), goal: (i32, i32), w: i32, h: i32, blocked: &HashSet<(i32, i32)>) -> Option<Vec<Dir>> {
    if start == goal { return Some(vec![]); }
    let mut prev: HashMap<(i32, i32), ((i32, i32), Dir)> = HashMap::new();
    let mut visited: HashSet<(i32, i32)> = HashSet::new();
    let mut q: VecDeque<(i32, i32)> = VecDeque::new();
    q.push_back(start);
    visited.insert(start);
    while let Some(p) = q.pop_front() {
        for d in Dir::all() {
            let (dx, dy) = d.dxdy();
            let n = (p.0 + dx, p.1 + dy);
            if n.0 < 0 || n.0 >= w || n.1 < 0 || n.1 >= h { continue; }
            if visited.contains(&n) { continue; }
            if blocked.contains(&n) && n != goal { continue; }
            visited.insert(n);
            prev.insert(n, (p, d));
            if n == goal {
                let mut path = vec![];
                let mut cur = n;
                while cur != start {
                    let &(pp, dd) = prev.get(&cur).unwrap();
                    path.push(dd);
                    cur = pp;
                }
                path.reverse();
                return Some(path);
            }
            q.push_back(n);
        }
    }
    None
}

#[derive(Default)]
struct AiNotes {
    strategy: &'static str,
}

/// Empty cells reachable from head (treats tail as passable: it'll vacate).
/// Uses Vec<bool> grids for O(1) lookups instead of HashSet.
fn flood_fill(game: &Game) -> usize {
    let w = game.w as usize;
    let h = game.h as usize;
    let head = game.head();
    let tail = game.tail();
    let mut occ = vec![false; w * h];
    for &p in &game.snake {
        occ[(p.1 as usize) * w + (p.0 as usize)] = true;
    }
    occ[(tail.1 as usize) * w + (tail.0 as usize)] = false;
    let mut visited = vec![false; w * h];
    let mut stack: Vec<(i32, i32)> = Vec::with_capacity(w * h);
    let hi = (head.1 as usize) * w + (head.0 as usize);
    visited[hi] = true;
    stack.push(head);
    let mut count = 1usize;
    while let Some(p) = stack.pop() {
        for d in Dir::all() {
            let (dx, dy) = d.dxdy();
            let nx = p.0 + dx;
            let ny = p.1 + dy;
            if nx < 0 || nx >= game.w || ny < 0 || ny >= game.h { continue; }
            let ni = (ny as usize) * w + (nx as usize);
            if visited[ni] || occ[ni] { continue; }
            visited[ni] = true;
            count += 1;
            stack.push((nx, ny));
        }
    }
    count
}

/// Greedy rollout: take `d`, then keep picking the safest (max-flood-fill) move
/// for `depth` steps. Returns (steps_survived, final_flood_fill, -manhattan_to_food).
/// Higher = better. None if `d` itself is fatal.
fn stall_score(game: &Game, d: Dir, depth: u32) -> Option<(u32, usize, i64)> {
    let mut sim = game.clone();
    if matches!(sim.step(d), StepResult::Died(_)) { return None; }
    let mut survived = 1u32;
    let mut last_space = flood_fill(&sim);
    for _ in 0..depth {
        let mut best: Option<(usize, Dir)> = None;
        for d2 in Dir::all() {
            if sim.snake.len() > 1 && d2 == sim.dir.opposite() { continue; }
            let mut sim2 = sim.clone();
            if matches!(sim2.step(d2), StepResult::Died(_)) { continue; }
            let f = flood_fill(&sim2);
            match best {
                None => best = Some((f, d2)),
                Some((bf, _)) if f > bf => best = Some((f, d2)),
                _ => {}
            }
        }
        match best {
            Some((_, dd)) => { sim.step(dd); survived += 1; last_space = flood_fill(&sim); }
            None => break,
        }
    }
    let head = sim.head();
    let manhattan = (head.0 - sim.food.0).abs() + (head.1 - sim.food.1).abs();
    Some((survived, last_space, -manhattan as i64))
}

/// After taking the full food path, accessible space. None if any step dies.
fn space_after_food(game: &Game, path: &[Dir]) -> Option<usize> {
    let mut sim = game.clone();
    for &d in path {
        if matches!(sim.step(d), StepResult::Died(_)) { return None; }
    }
    Some(flood_fill(&sim))
}

fn ai_decide(game: &Game, ticks_since_food: u32) -> (Dir, AiNotes) {
    let head = game.head();
    let body = game.body_set();
    let tail = game.tail();
    let snake_len = game.snake.len();

    // Yolo: been stalling far too long — go for food regardless of safety.
    // Tuned so endless tail-orbiting can't go on forever.
    let yolo = ticks_since_food > (2 * snake_len as u32) + 50;

    // 1. BFS to food. Take it if path exists and post-eating accessible space is "big enough"
    //    (>= snake_len means we can fit our whole body in the open area we reach).
    if let Some(path) = bfs(head, game.food, game.w, game.h, &body) {
        if let Some(&first) = path.first() {
            if yolo {
                return (first, AiNotes { strategy: "food-yolo" });
            }
            if let Some(space) = space_after_food(game, &path) {
                let board = (game.w * game.h) as usize;
                let empty_after = board - snake_len - 1;
                // Take food when post-eating reachable area is at least half the
                // remaining empty cells (with a small floor so we don't paralyze
                // when nearly full).
                let need = (empty_after / 2).max(snake_len / 4 + 4);
                if space >= need {
                    return (first, AiNotes { strategy: "food-safe" });
                }
            }
        }
    }

    // 2. Stall: rollout depth K with greedy-max-space; pick move whose rollout
    //    survives longest. Tiebreak by final flood-fill, then Manhattan-toward-food.
    let depth = (snake_len as u32).clamp(8, 24);
    let mut best: Option<((u32, usize, i64), Dir)> = None;
    for d in Dir::all() {
        if snake_len > 1 && d == game.dir.opposite() { continue; }
        if let Some(s) = stall_score(game, d, depth) {
            match best {
                None => best = Some((s, d)),
                Some((bs, _)) if s > bs => best = Some((s, d)),
                _ => {}
            }
        }
    }
    if let Some((_, d)) = best {
        return (d, AiNotes { strategy: "stall-rollout" });
    }

    // 3. Doomed: any non-immediate-death move.
    for d in Dir::all() {
        if snake_len > 1 && d == game.dir.opposite() { continue; }
        let (dx, dy) = d.dxdy();
        let n = (head.0 + dx, head.1 + dy);
        if !game.in_bounds(n) { continue; }
        let mut b = body.clone();
        b.remove(&tail);
        if !b.contains(&n) {
            return (d, AiNotes { strategy: "doomed-survive-1" });
        }
    }
    (game.dir, AiNotes { strategy: "doomed" })
}

fn render(game: &Game) -> String {
    let mut out = String::new();
    let body: HashSet<_> = game.snake.iter().copied().collect();
    let head = game.head();
    out.push('+');
    for _ in 0..game.w { out.push('-'); }
    out.push_str("+\n");
    for y in 0..game.h {
        out.push('|');
        for x in 0..game.w {
            let c = if (x, y) == head { '@' }
                else if body.contains(&(x, y)) { 'o' }
                else if (x, y) == game.food { '*' }
                else { ' ' };
            out.push(c);
        }
        out.push_str("|\n");
    }
    out.push('+');
    for _ in 0..game.w { out.push('-'); }
    out.push_str("+\n");
    out
}

struct GameSummary {
    seed: u64,
    ticks: u32,
    final_len: usize,
    death: String,
    won: bool,
}

fn play_one(w: i32, h: i32, seed: u64, max_ticks: u32, mut tracer: Option<&mut BufWriter<File>>) -> GameSummary {
    let mut g = Game::new(w, h, seed);
    let max_len = (w * h) as usize;
    let mut death = String::from("max_ticks");
    let mut won = false;
    let mut ticks_since_food: u32 = 0;
    loop {
        if g.snake.len() >= max_len {
            won = true;
            death = String::from("won");
            break;
        }
        if g.tick >= max_ticks { break; }
        let (d, notes) = ai_decide(&g, ticks_since_food);
        let head = g.head();
        let food = g.food;
        let len_before = g.snake.len();
        let res = g.step(d);
        match res {
            StepResult::Ate => ticks_since_food = 0,
            _ => ticks_since_food += 1,
        }
        if let Some(t) = tracer.as_mut() {
            let res_str = match res {
                StepResult::Moved => "moved",
                StepResult::Ate => "ate",
                StepResult::Died(r) => r,
            };
            let _ = writeln!(
                t,
                "{{\"tick\":{},\"len\":{},\"head\":[{},{}],\"food\":[{},{}],\"dir\":\"{}\",\"strat\":\"{}\",\"res\":\"{}\",\"stall\":{}}}",
                g.tick, len_before, head.0, head.1, food.0, food.1, d.name(), notes.strategy, res_str, ticks_since_food
            );
        }
        if let StepResult::Died(reason) = res {
            death = reason.to_string();
            break;
        }
    }
    GameSummary {
        seed,
        ticks: g.tick,
        final_len: g.snake.len(),
        death,
        won,
    }
}

struct Args {
    w: i32,
    h: i32,
    games: u32,
    seed: u64,
    max_ticks: u32,
    log_dir: String,
    trace_worst: usize,
    render_one: bool,
}

fn parse_args() -> Args {
    let mut a = Args {
        w: 20, h: 20,
        games: 100,
        seed: SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_nanos() as u64).unwrap_or(1),
        max_ticks: 5000,
        log_dir: "logs".to_string(),
        trace_worst: 5,
        render_one: false,
    };
    let argv: Vec<String> = env::args().skip(1).collect();
    let mut i = 0;
    while i < argv.len() {
        let arg = argv[i].clone();
        let mut take = || -> String {
            i += 1;
            argv[i].clone()
        };
        match arg.as_str() {
            "--w" => { a.w = take().parse().unwrap(); }
            "--h" => { a.h = take().parse().unwrap(); }
            "--games" => { a.games = take().parse().unwrap(); }
            "--seed" => { a.seed = take().parse().unwrap(); }
            "--max-ticks" => { a.max_ticks = take().parse().unwrap(); }
            "--log-dir" => { a.log_dir = take(); }
            "--trace-worst" => { a.trace_worst = take().parse().unwrap(); }
            "--render-one" => { a.render_one = true; }
            other => { eprintln!("unknown arg: {}", other); std::process::exit(2); }
        }
        i += 1;
    }
    a
}

fn main() {
    let args = parse_args();
    fs::create_dir_all(&args.log_dir).unwrap();

    let mut summaries: Vec<GameSummary> = Vec::with_capacity(args.games as usize);
    for i in 0..args.games {
        let seed = args.seed.wrapping_add(i as u64).wrapping_mul(0x9E3779B97F4A7C15);
        let s = play_one(args.w, args.h, seed, args.max_ticks, None);
        summaries.push(s);
    }

    let n = summaries.len() as f64;
    let avg_len: f64 = summaries.iter().map(|s| s.final_len as f64).sum::<f64>() / n;
    let max_len = summaries.iter().map(|s| s.final_len).max().unwrap_or(0);
    let min_len = summaries.iter().map(|s| s.final_len).min().unwrap_or(0);
    let avg_ticks: f64 = summaries.iter().map(|s| s.ticks as f64).sum::<f64>() / n;
    let wins = summaries.iter().filter(|s| s.won).count();
    let mut death_counts: HashMap<String, u32> = HashMap::new();
    for s in &summaries {
        *death_counts.entry(s.death.clone()).or_insert(0) += 1;
    }

    println!("=== Snake AI summary ===");
    println!("grid: {}x{}  games: {}  seed: {}", args.w, args.h, args.games, args.seed);
    println!("avg length: {:.2}  min: {}  max: {}  (board={})", avg_len, min_len, max_len, args.w * args.h);
    println!("avg ticks: {:.1}", avg_ticks);
    println!("wins: {}/{}", wins, args.games);
    println!("deaths:");
    let mut deaths: Vec<_> = death_counts.iter().collect();
    deaths.sort_by_key(|(_, v)| std::cmp::Reverse(**v));
    for (k, v) in &deaths {
        println!("  {}: {}", k, v);
    }

    let mut sorted = summaries.iter().enumerate().collect::<Vec<_>>();
    sorted.sort_by_key(|(_, s)| s.final_len);
    let worst = sorted.iter().take(args.trace_worst).map(|(i, _)| *i).collect::<Vec<_>>();
    let summary_path = format!("{}/summary.txt", args.log_dir);
    let mut sum_f = BufWriter::new(File::create(&summary_path).unwrap());
    writeln!(sum_f, "grid {}x{}  games={}  seed={}", args.w, args.h, args.games, args.seed).unwrap();
    writeln!(sum_f, "avg_len={:.2} min={} max={} avg_ticks={:.1} wins={}", avg_len, min_len, max_len, avg_ticks, wins).unwrap();
    for (k, v) in &deaths {
        writeln!(sum_f, "death {}: {}", k, v).unwrap();
    }
    writeln!(sum_f, "\nworst games (lowest final length):").unwrap();
    for &i in &worst {
        let s = &summaries[i];
        writeln!(sum_f, "  game[{}] seed={} len={} ticks={} death={}", i, s.seed, s.final_len, s.ticks, s.death).unwrap();
    }

    for &i in &worst {
        let s = &summaries[i];
        let path = format!("{}/trace_game_{}.jsonl", args.log_dir, i);
        let mut f = BufWriter::new(File::create(&path).unwrap());
        let _ = play_one(args.w, args.h, s.seed, args.max_ticks, Some(&mut f));
    }

    if args.render_one && !summaries.is_empty() {
        let s = &summaries[summaries.len() - 1];
        let mut g = Game::new(args.w, args.h, s.seed);
        let path = format!("{}/render_last.txt", args.log_dir);
        let mut f = BufWriter::new(File::create(&path).unwrap());
        writeln!(f, "Initial:").unwrap();
        write!(f, "{}", render(&g)).unwrap();
        let mut tsf: u32 = 0;
        loop {
            if (g.snake.len() as i32) >= args.w * args.h {
                writeln!(f, "Final (tick {} won, len {}):", g.tick, g.snake.len()).unwrap();
                write!(f, "{}", render(&g)).unwrap();
                break;
            }
            if g.tick >= args.max_ticks {
                writeln!(f, "Final (tick {} timeout, len {}):", g.tick, g.snake.len()).unwrap();
                write!(f, "{}", render(&g)).unwrap();
                break;
            }
            let (d, _) = ai_decide(&g, tsf);
            let res = g.step(d);
            match res {
                StepResult::Ate => tsf = 0,
                _ => tsf += 1,
            }
            if matches!(res, StepResult::Died(_)) {
                writeln!(f, "Final (tick {} died {:?}, len {}):", g.tick, res, g.snake.len()).unwrap();
                write!(f, "{}", render(&g)).unwrap();
                break;
            }
        }
    }

    println!("\nlogs in: {}/", args.log_dir);
}
