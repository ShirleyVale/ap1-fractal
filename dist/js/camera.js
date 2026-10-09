export class PanZoom {
  constructor() { this.x = 0; this.y = 0; this.zoom = 1; }
  pan(dx, dy) { this.x += dx / this.zoom; this.y += dy / this.zoom; }
  scale(factor) { this.zoom = Math.min(8, Math.max(.35, this.zoom * factor)); }
  reset() { this.x = 0; this.y = 0; this.zoom = 1; }
}
