import { createWebGL2Context } from '../Common/webgl-utils.js';
import { initShaders } from '../Common/initShaders.js';
import { chaosGame, polygonVertices, sierpinski, triangleEdges } from './geometry.js';
import { PanZoom } from './camera.js';

const VS = `#version 300 es
in vec2 aPosition; uniform vec2 uPan; uniform float uZoom; uniform float uPointSize;
void main(){ gl_Position=vec4((aPosition+uPan)*uZoom,0.0,1.0); gl_PointSize=uPointSize; }`;
const FS = `#version 300 es
precision highp float; uniform vec3 uColor; out vec4 outColor;
void main(){ outColor=vec4(uColor,1.); }`;
const PALETTES = { aurora:[.26,.94,.81], sunset:[1,.46,.2], violet:[.69,.43,1] };

class FractalApp {
  constructor() {
    this.canvas = document.querySelector('#glCanvas'); this.gl = createWebGL2Context(this.canvas);
    if (!this.gl) { alert('浏览器不支持 WebGL 2.0。请使用最新版 Chrome、Edge 或 Firefox。'); return; }
    this.state = { algorithm:'chaos', sides:3, count:20000, depth:5, mode:'points', pointSize:2.5, palette:'aurora', paused:false, visible:0 };
    this.camera = new PanZoom(); this.buffer = this.gl.createBuffer(); this.data = new Float32Array(); this.drag = null;
    this.program = initShaders(this.gl, VS, FS); this.locations = this.getLocations(); this.bindUI(); this.resize(); this.regenerate(); requestAnimationFrame(this.frame.bind(this));
  }
  getLocations(){ const g=this.gl,p=this.program; return {position:g.getAttribLocation(p,'aPosition'),pan:g.getUniformLocation(p,'uPan'),zoom:g.getUniformLocation(p,'uZoom'),size:g.getUniformLocation(p,'uPointSize'),color:g.getUniformLocation(p,'uColor')}; }
  bindUI(){
    const q=(s)=>document.querySelector(s); const set=(obj,prop,v)=>{this.state[prop]=v; this.regenerate();};
    document.querySelectorAll('[data-alg]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-alg]').forEach(x=>x.classList.remove('active'));b.classList.add('active');set(this.state,'algorithm',b.dataset.alg);this.syncUI();});
    q('#shape').onchange=e=>set(this.state,'sides',+e.target.value);
    q('#count').oninput=e=>{this.state.count=+e.target.value;q('#countOut').textContent=this.state.count.toLocaleString();this.regenerate();};
    q('#depth').oninput=e=>{this.state.depth=+e.target.value;q('#depthOut').textContent=this.state.depth;this.regenerate();};
    q('#pointSize').oninput=e=>{this.state.pointSize=+e.target.value;q('#sizeOut').textContent=`${this.state.pointSize} px`;};
    q('#palette').onchange=e=>this.state.palette=e.target.value;
    document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>this.setMode(b.dataset.mode));
    q('#pause').onclick=()=>this.togglePause(); q('#reset').onclick=()=>this.camera.reset();
    this.canvas.addEventListener('mousedown',e=>{this.drag={x:e.clientX,y:e.clientY};this.canvas.style.cursor='grabbing';});
    window.addEventListener('mouseup',()=>{this.drag=null;this.canvas.style.cursor='grab';});
    window.addEventListener('mousemove',e=>{if(!this.drag)return;this.camera.pan((e.clientX-this.drag.x)/this.canvas.clientWidth*2,(this.drag.y-e.clientY)/this.canvas.clientHeight*2);this.drag={x:e.clientX,y:e.clientY};});
    this.canvas.addEventListener('wheel',e=>{e.preventDefault();this.camera.scale(e.deltaY>0?.88:1.14);},{passive:false});
    window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();this.togglePause();} if(['1','2','3'].includes(e.key))this.setMode({1:'points',2:'lines',3:'solid'}[e.key]);}); window.addEventListener('resize',()=>this.resize());
  }
  syncUI(){const recursive=this.state.algorithm==='recursive';document.querySelector('#countControl').hidden=recursive;document.querySelector('#depthControl').hidden=!recursive;document.querySelector('#algorithmNote').textContent=recursive?'每次细分一个三角形的三条边中点，保留三个角上的子三角形。':'随机选一个顶点，将当前点向它移动一半。重复后得到 Sierpinski 垫片。';}
  setMode(mode){this.state.mode=mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));}
  togglePause(){this.state.paused=!this.state.paused;document.querySelector('#pause').innerHTML=this.state.paused?'继续生长 <kbd>Space</kbd>':'暂停生长 <kbd>Space</kbd>';document.querySelector('#statusText').textContent=this.state.paused?'已暂停':'逐点生长中';document.querySelector('#statusDot').style.background=this.state.paused?'#ffbf5c':'';}
  regenerate(){this.state.visible=0;const s=this.state; if(s.algorithm==='chaos'){this.data=chaosGame(polygonVertices(s.sides),s.count,s.sides===3?.5:.5);}else{const faces=sierpinski(s.depth);this.data=s.mode==='lines'?triangleEdges(faces):faces;} this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.buffer);this.gl.bufferData(this.gl.ARRAY_BUFFER,this.data,this.gl.STATIC_DRAW);}
  resize(){const dpr=Math.min(devicePixelRatio,2),w=this.canvas.clientWidth*dpr,h=this.canvas.clientHeight*dpr;if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);}
  frame(){const s=this.state;if(!s.paused&&s.visible<this.data.length/2)s.visible=Math.min(this.data.length/2,s.visible+Math.max(90,this.data.length/240));this.draw();requestAnimationFrame(this.frame.bind(this));}
  draw(){const g=this.gl,s=this.state;g.clearColor(.027,.075,.11,1);g.clear(g.COLOR_BUFFER_BIT);g.useProgram(this.program);g.bindBuffer(g.ARRAY_BUFFER,this.buffer);g.enableVertexAttribArray(this.locations.position);g.vertexAttribPointer(this.locations.position,2,g.FLOAT,false,0,0);g.uniform2f(this.locations.pan,this.camera.x,this.camera.y);g.uniform1f(this.locations.zoom,this.camera.zoom);g.uniform1f(this.locations.size,s.pointSize*devicePixelRatio);g.uniform3fv(this.locations.color,PALETTES[s.palette]);let primitive=g.POINTS;if(s.algorithm==='recursive'){primitive=s.mode==='lines'?g.LINES:s.mode==='solid'?g.TRIANGLES:g.POINTS;}g.drawArrays(primitive,0,Math.floor(s.visible));}
}
new FractalApp();
