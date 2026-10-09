export function createWebGL2Context(canvas) {
  return canvas.getContext('webgl2', { antialias: true, alpha: false });
}
