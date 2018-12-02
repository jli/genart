'use strict';

/* Helpers for creating DOM elements for tweaking/tuning parametrs. */

// Slider with label including value display.
class Slider {
  constructor(label, min, max, startval, step, parent) {
    this.default = startval;
    this.value = startval;
    this.label_text = label;
    const container = createDiv().parent(parent);
    this.label_elt = createSpan().parent(container);
    this.slider = createSlider(min, max, startval, step).parent(container);
    this.slider.size(100);
    this.slider.input((e) => this.set(e.target.valueAsNumber));
    this.update_label();
  }
  update_label() { this.label_elt.html(`${this.label_text} [${this.value}]`); }
  set(value) {
    this.value = value;
    this.slider.value(value);
    this.update_label()
  }
  reset() { this.set(this.default); }
}

class Checkbox {
  constructor(label, startval, parent) {
    this.default = startval;
    this.value = startval;
    this.checkbox = createCheckbox(label, startval).parent(parent);
    // Note: input() works on desktop (mouse, keyboard), but not mobile. changed() works on everything.
    this.checkbox.changed((e) => this.value = e.target.checked);
  }
  set(value) {
    this.value = value;
    this.checkbox.checked(value);
  }
  toggle() { this.set(!this.value); }
  reset() { this.set(this.default); }
}

// Creates number input with label.
class NumInput {
  constructor(label, min, max, startval, step, size, parent) {
    this.default = startval;
    this.value = startval;
    const container = createDiv().parent(parent);
    createSpan(label + ' ').parent(container);
    this.input = createInput(str(startval), 'number').parent(container);
    if (min !== null) this.input.attribute('min', min);
    if (max !== null) this.input.attribute('max', max);
    if (step !== null) this.input.attribute('step', step);
    if (size !== null) this.input.size(size);
    this.input.input((e) => this.value = e.target.valueAsNumber);
  }
  set(value) {
    this.value = value;
    this.input.value(value);
  }
  reset() { this.set(this.default); }
}

// Creates button. 'f' is both mousePressed and keydown (space, enter) handle.
function make_button(label, parent, f) {
  const b = createButton(label).parent(parent);
  b.mousePressed(f);
  b.elt.onkeydown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      // e.preventDefault();  // is this needed/useful?
      f();
    }
  }
  return b;
}
