'use strict';

const QT_CAPACITY = 25;

// Checks if the bounding box contains point v.
function bb_contains(topleft, width, height, v) {
  return (topleft.x <= v.x && v.x <= topleft.x + width
          && topleft.y <= v.y && v.y <= topleft.y + height);
}

// Checks if 2 boxes overlap.
function bb_overlap(tl1, w1, h1, tl2, w2, h2) {
  if (tl1.x > tl2.x + w2 || tl2.x > tl1.x + w1) return false;
  if (tl1.y > tl2.y + h2 || tl2.y > tl1.y + h1) return false;
  return true;
}

class Quadtree {
  constructor(topleft, width, height, parent) {
    this.topleft = topleft; this.width = width; this.height = height;
    this.parent = parent;
    this.objs = [];
    this.nw = this.ne = this.se = this.sw = null;
  }

  create_children() {
    if (this.nw !== null) return;
    const w = this.width/2;
    const h = this.height/2;
    this.nw = new Quadtree(this.topleft, w, h);
    const ne = this.topleft.copy(); ne.x += w;
    this.ne = new Quadtree(ne, w, h);
    const sw = this.topleft.copy(); sw.y += h;
    this.sw = new Quadtree(sw, w, h);
    const se = sw.copy(); se.x += w;
    this.se = new Quadtree(se, w, h);
    // TODO: should i empty out this.objs?
  }

  insert(obj, v) {
    if (!bb_contains(this.topleft, this.width, this.height, v)) return false;
    if (this.objs.length < QT_CAPACITY) {
      this.objs.push([obj,  v]);
      return true;
    }
    this.create_children();
    if (this.nw.insert(obj, v)) return true;
    if (this.ne.insert(obj, v)) return true;
    if (this.se.insert(obj, v)) return true;
    if (this.sw.insert(obj, v)) return true;
    throw new Error(`failed to insert object??? ${v}`);
  }

  // Convenience function.
  queryCenter(center, width, height) {
    const topleft = createVector(center.x - width/2, center.y - height/2);
    return this.queryTopleft(topleft, width, height, []);
  }

  queryTopleft(topleft, width, height, results) {
    if (!bb_overlap(topleft, width, height, this.topleft, this.width, this.height)) {
      return results;
    }
    for (const [o, v] of this.objs) {
      if (bb_contains(topleft, width, height, v)) {
        results.push([o, v]);
      }
    }
    if (this.nw !== null) {
      this.nw.queryTopleft(topleft, width, height, results);
      this.sw.queryTopleft(topleft, width, height, results);
      this.ne.queryTopleft(topleft, width, height, results);
      this.se.queryTopleft(topleft, width, height, results);
    }
    return results;
  }
}
