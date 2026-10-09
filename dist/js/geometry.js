import { vec2, mix } from '../Common/MV.js';

export const TRIANGLE = [vec2(-0.86, -0.74), vec2(0, 0.82), vec2(0.86, -0.74)];

export function chaosGame(vertices, count, ratio = 0.5) {
  const out = new Float32Array(count * 2);
  let p = vec2((Math.random() - .5) * .2, (Math.random() - .5) * .2);
  let lastVertex = -1;
  const chooseVertex = () => {
    let index;
    do {
      index = Math.floor(Math.random() * vertices.length);
      // For the extension polygons, avoiding adjacent vertices exposes a
      // recognisable polygon gasket instead of a nearly filled shape.
    } while (vertices.length > 3 && lastVertex >= 0 &&
      (index === lastVertex || (index - lastVertex + vertices.length) % vertices.length === 1 ||
       (lastVertex - index + vertices.length) % vertices.length === 1));
    lastVertex = index;
    return vertices[index];
  };
  // Burn-in: discard the transient points before the orbit reaches the gasket.
  // Otherwise a few random dots may remain inside the holes after every refresh.
  for (let i = 0; i < 20; i++) p = mix(p, chooseVertex(), ratio);
  for (let i = 0; i < count; i++) {
    p = mix(p, chooseVertex(), ratio);
    out[i * 2] = p[0]; out[i * 2 + 1] = p[1];
  }
  return out;
}

export function polygonVertices(sides) {
  return Array.from({ length: sides }, (_, i) => {
    const a = Math.PI / 2 + i * Math.PI * 2 / sides;
    return vec2(Math.cos(a) * .82, Math.sin(a) * .82);
  });
}

function pushTriangle(out, a, b, c) { out.push(...a, ...b, ...c); }
export function sierpinski(depth) {
  const triangles = [];
  function subdivide(a, b, c, level) {
    if (level === 0) { pushTriangle(triangles, a, b, c); return; }
    const ab = mix(a, b, .5), ac = mix(a, c, .5), bc = mix(b, c, .5);
    subdivide(a, ab, ac, level - 1);
    subdivide(ab, b, bc, level - 1);
    subdivide(ac, bc, c, level - 1);
  }
  subdivide(...TRIANGLE, depth);
  return new Float32Array(triangles);
}

export function triangleEdges(triangles) {
  const edges = new Float32Array(triangles.length * 2);
  let k = 0;
  for (let i = 0; i < triangles.length; i += 6) {
    const a = [triangles[i], triangles[i + 1]], b = [triangles[i + 2], triangles[i + 3]], c = [triangles[i + 4], triangles[i + 5]];
    for (const [p, q] of [[a,b], [b,c], [c,a]]) { edges[k++] = p[0]; edges[k++] = p[1]; edges[k++] = q[0]; edges[k++] = q[1]; }
  }
  return edges;
}
