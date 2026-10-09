// Minimal vector helpers in the style used by the course examples.
export const vec2 = (x, y) => [x, y];
export const mix = (a, b, t) => [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t];
