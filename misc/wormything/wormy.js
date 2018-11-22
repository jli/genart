const W = 1200, H = 800;
const NUM_SEGMENTS = 350;
const ave_mouse = [];

function setup() {
  createCanvas(W, H);
  frameRate(30);
  ave_mouse.push(createVector(W/2, H/2));
}

function draw() {
  background(25);
  const curmouse = createVector(mouseX,mouseY);
  ave_mouse.push(p5.Vector.lerp(ave_mouse[ave_mouse.length-1], curmouse, 0.1));
  if (ave_mouse.length > NUM_SEGMENTS) { ave_mouse.shift(); }

  let size = map(abs(sin(frameCount/100)), 0, 1, .75, 1) * 170;
  let x = 0;
  for (const v of ave_mouse) {
    x += 2 * PI / NUM_SEGMENTS;
    ellipse(v.x, v.y,
      size*map(abs(sin(x + frameCount/100)), 0, 1,.4, 1),
      size*map(abs(cos(x + frameCount/100)), 0, 1, .4, 1));
  }
}
