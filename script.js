const canvas = document.querySelector('#sequence-canvas');
const sequence = document.querySelector('#sequence');
const heroCopy = document.querySelector('.home-page .hero-copy');

if (canvas && sequence) {
const frameCount = 240;
const frames = new Map();
let target = 0;
let current = 0;
let rendered = -1;

const framePath = (index) => `EFF/ezgif-frame-${String(index + 1).padStart(3, '0')}.jpg`;

function loadFrame(index) {
  if (index < 0 || index >= frameCount || frames.has(index)) return;
  const image = new Image();
  frames.set(index, image);
  image.src = framePath(index);
  image.onload = () => {
    if (index === 0) drawFrame(0);
  };
}

function prefetchNear(index) {
  for (let offset = -18; offset <= 18; offset += 1) loadFrame(index + offset);
}

function drawFrame(index) {
  const image = frames.get(index);
  if (!image || !canvas || index === rendered) return;
  const context = canvas.getContext('2d');
  const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  rendered = index;
}

function updateTarget() {
  if (!sequence || window.innerWidth <= 700) return;
  const distance = sequence.offsetHeight - window.innerHeight;
  const progress = Math.max(0, Math.min(1, (window.scrollY - sequence.offsetTop) / distance));
  window.sequenceProgress = progress;
  target = Math.round(progress * (frameCount - 1));
  if (heroCopy) {
    heroCopy.style.setProperty('--float-x', `${progress * 72}px`);
    heroCopy.style.setProperty('--float-y', `${progress * -48}px`);
    heroCopy.style.setProperty('--copy-opacity', `${1 - progress * 0.38}`);
  }
  prefetchNear(target);
}

function tick() {
  current += (target - current) * 0.16;
  drawFrame(Math.round(current));
  requestAnimationFrame(tick);
}

loadFrame(0);
prefetchNear(0);
window.addEventListener('scroll', updateTarget, { passive:true });
window.addEventListener('resize', updateTarget);
updateTarget();
tick();
}

function startWebGLEffect() {
  const fx = document.querySelector('#webgl-fx');
  if (!fx) return;
  const gl = fx.getContext('webgl', { alpha:true, premultipliedAlpha:false });
  if (!gl) return;
  const vertex = `attribute vec2 p; void main(){gl_Position=vec4(p,0.0,1.0);}`;
  const fragment = `precision mediump float;
    uniform vec2 r; uniform float t; uniform float s;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec2 uv=gl_FragCoord.xy/r.xy; vec2 p=(uv-.5)*vec2(r.x/r.y,1.0);
      float wave=sin(p.x*19.0+t*.55+sin(p.y*8.0-t*.31)*2.2+s*6.0);
      float warp=sin(p.x*7.0-p.y*17.0+t*.42);
      float line=smoothstep(.92,.995,wave*.5+.5+warp*.11);
      vec2 cell=floor(uv*vec2(92.0,54.0)); vec2 local=fract(uv*vec2(92.0,54.0));
      vec2 dotPos=vec2(hash(cell),hash(cell+31.7));
      float dotGlow=smoothstep(.075,0.0,length(local-dotPos));
      float pulse=.42+.58*sin(t*1.7+hash(cell)*16.0+s*10.0);
      float energy=line*.68+dotGlow*pulse*.9;
      vec3 color=mix(vec3(.04,.22,.95),vec3(.33,.78,1.0),line);
      gl_FragColor=vec4(color,energy*.43);
    }`;
  function shader(type, source) { const item=gl.createShader(type); gl.shaderSource(item,source); gl.compileShader(item); return item; }
  const program=gl.createProgram(); gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex)); gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
  const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'p'); const resolution=gl.getUniformLocation(program,'r'); const time=gl.getUniformLocation(program,'t'); const scroll=gl.getUniformLocation(program,'s');
  function render(now) { const dpr=Math.min(window.devicePixelRatio||1,1.5); const w=fx.clientWidth*dpr, h=fx.clientHeight*dpr; if(fx.width!==w||fx.height!==h){fx.width=w;fx.height=h;gl.viewport(0,0,w,h);} gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER,buffer); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0); gl.uniform2f(resolution,w,h); gl.uniform1f(time,now*.001); gl.uniform1f(scroll,window.sequenceProgress||0); gl.drawArrays(gl.TRIANGLE_STRIP,0,4); requestAnimationFrame(render); }
  requestAnimationFrame(render);
}
startWebGLEffect();

const chatbot = document.querySelector('#chatbot');
const chatToggle = document.querySelector('#chat-toggle');
const chatClose = document.querySelector('#chat-close');
const chatBody = document.querySelector('#chat-body');

function openChat() { chatbot?.classList.add('is-open'); }
function closeChat() { chatbot?.classList.remove('is-open'); }

chatToggle?.addEventListener('click', openChat);
chatClose?.addEventListener('click', closeChat);

document.querySelectorAll('#chat-prompts button').forEach((button) => {
  button.addEventListener('click', () => {
    const question = document.createElement('div');
    question.className = 'chat-message user';
    question.textContent = button.textContent;
    const answer = document.createElement('div');
    answer.className = 'chat-message';
    answer.textContent = button.dataset.answer;
    chatBody?.append(question, answer);
    chatBody.scrollTop = chatBody.scrollHeight;
    button.disabled = true;
  });
});

window.setTimeout(openChat, 2200);

document.querySelector('.checkout form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.textContent = 'Agreement requested ✓';
  button.disabled = true;
});

const planSelect = document.querySelector('#selected-plan');
document.querySelectorAll('.plan-button[data-plan]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!planSelect || button.getAttribute('href') !== '#checkout') return;
    const plan = button.dataset.plan;
    [...planSelect.options].some((option, index) => {
      if (option.text.startsWith(plan)) { planSelect.selectedIndex = index; return true; }
      return false;
    });
  });
});

document.querySelectorAll('.billing-option').forEach((button) => {
  button.addEventListener('click', () => {
    const billing = button.dataset.billing;
    document.querySelectorAll('.billing-option').forEach((item) => item.classList.toggle('is-active', item === button));
    document.querySelectorAll('.plan-card strong[data-monthly]').forEach((price) => {
      const value = price.dataset[billing];
      const suffix = value === 'Custom' ? 'tailored scope' : '/ month';
      price.innerHTML = `${value} <small>${suffix}</small>`;
    });
  });
});

document.querySelector('.booking-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.textContent = 'Request received ✓';
  button.disabled = true;
});
