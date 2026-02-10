(function(){
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const bloomCanvas = document.createElement('canvas');
  bloomCanvas.width = W; bloomCanvas.height = H;
  const blCtx = bloomCanvas.getContext('2d');
  let A = new Float32Array(W*H);
  let B = new Float32Array(W*H);
  let A2 = new Float32Array(W*H);
  let B2 = new Float32Array(W*H);

  const feedInput = document.getElementById('feed');
  const killInput = document.getElementById('kill');
  const dAInput = document.getElementById('dA');
  const dBInput = document.getElementById('dB');
  const feedVal = document.getElementById('feedVal');
  const killVal = document.getElementById('killVal');
  const dAVal = document.getElementById('dAVal');
  const dBVal = document.getElementById('dBVal');
  const randomizeBtn = document.getElementById('randomize');
  const pauseBtn = document.getElementById('pause');
  const resetBtn = document.getElementById('reset');
  const itersInput = document.getElementById('iters');
  const itersVal = document.getElementById('itersVal');
  const paletteSelect = document.getElementById('palette');
  const presetsSelect = document.getElementById('presets');
  const applyPresetBtn = document.getElementById('applyPreset');
  const saveBtn = document.getElementById('save');
  const animPalette = document.getElementById('animPalette');
  const palSpeedInput = document.getElementById('palSpeed');
  const palSpeedVal = document.getElementById('palSpeedVal');
  const brushSizeInput = document.getElementById('brushSize');
  const brushSizeVal = document.getElementById('brushSizeVal');
  const brushModeSelect = document.getElementById('brushMode');
  const bloomIntensityInput = document.getElementById('bloomIntensity');
  const bloomIntensityVal = document.getElementById('bloomIntensityVal');
  const bloomRadiusInput = document.getElementById('bloomRadius');
  const bloomRadiusVal = document.getElementById('bloomRadiusVal');
  const shapeSelect = document.getElementById('shape');
  const applyShapeBtn = document.getElementById('applyShape');

  let running = true;
  let F = parseFloat(feedInput.value);
  let k = parseFloat(killInput.value);
  let dA = parseFloat(dAInput.value);
  let dB = parseFloat(dBInput.value);
  let itersPerFrame = parseInt(itersInput ? itersInput.value : 2, 10) || 2;
  let palette = (paletteSelect && paletteSelect.value) || 'iridescent';
  let palettePhase = 0.0;
  let paletteSpeed = parseFloat(palSpeedInput ? palSpeedInput.value : 0.03) || 0.03;
  let animatedPalette = true;  // Always animate iridescent palettes
  let brushSize = parseInt(brushSizeInput ? brushSizeInput.value : 8,10) || 8;
  let brushMode = (brushModeSelect && brushModeSelect.value) || 'add';
  let painting = false;
  let bloomIntensity = parseFloat(bloomIntensityInput ? bloomIntensityInput.value : 0.25) || 0.25;
  let bloomRadius = parseInt(bloomRadiusInput ? bloomRadiusInput.value : 8,10) || 8;

  function idx(x,y){ return x + y*W }

  function seed(){
    for(let i=0;i<W*H;i++){ A[i]=1; B[i]=0 }
    // center square
    const sx = Math.floor(W*0.45), sy = Math.floor(H*0.45);
    const sw = Math.floor(W*0.1), sh = Math.floor(H*0.1);
    for(let y=sy;y<sy+sh;y++) for(let x=sx;x<sx+sw;x++){
      const i=idx(x,y); B[i]=1; A[i]=0;
    }
  }
  function randomize(){
    for(let i=0;i<W*H;i++){ A[i]=1; B[i]=Math.random()*0.02 }
    for(let n=0;n<10;n++){
      const rx = Math.floor(Math.random()*W), ry = Math.floor(Math.random()*H);
      for(let y=ry-8;y<ry+8;y++) for(let x=rx-8;x<rx+8;x++){
        if(x>1 && x<W-1 && y>1 && y<H-1){ B[idx(x,y)]=1 }
      }
    }
  }

  function seedShape(shape){
    for(let i=0;i<W*H;i++){ A[i]=1; B[i]=0 }
    const cx = Math.floor(W/2), cy = Math.floor(H/2);
    if(shape === 'center'){
      const sx = Math.floor(W*0.45), sy = Math.floor(H*0.45);
      const sw = Math.floor(W*0.1), sh = Math.floor(H*0.1);
      for(let y=sy;y<sy+sh;y++) for(let x=sx;x<sx+sw;x++){ B[idx(x,y)]=1; A[idx(x,y)]=0 }
    } else if(shape === 'circle'){
      const r = Math.floor(Math.min(W,H)*0.14);
      for(let y=cy-r;y<cy+r;y++) for(let x=cx-r;x<cx+r;x++){ const dx=x-cx, dy=y-cy; if(dx*dx+dy*dy < r*r){ B[idx(x,y)]=1; A[idx(x,y)]=0 } }
    } else if(shape === 'ring'){
      const r = Math.floor(Math.min(W,H)*0.18), ri = Math.floor(r*0.6);
      for(let y=cy-r;y<cy+r;y++) for(let x=cx-r;x<cx+r;x++){ const d2=(x-cx)*(x-cx)+(y-cy)*(y-cy); if(d2 < r*r && d2 > ri*ri){ B[idx(x,y)]=1; A[idx(x,y)]=0 } }
    } else if(shape === 'stripes'){
      for(let x=0;x<W;x++){
        if((x>>4) % 2 === 0) for(let y=0;y<H;y++){ B[idx(x,y)]=1; A[idx(x,y)]=0 }
      }
    } else if(shape === 'cross'){
      const w = Math.floor(Math.min(W,H)*0.03);
      for(let y=cy-w;y<cy+w;y++) for(let x=0;x<W;x++){ B[idx(x,y)]=1; A[idx(x,y)]=0 }
      for(let x=cx-w;x<cx+w;x++) for(let y=0;y<H;y++){ B[idx(x,y)]=1; A[idx(x,y)]=0 }
    } else if(shape === 'random'){
      for(let i=0;i<2000;i++){ const x=Math.floor(Math.random()*W), y=Math.floor(Math.random()*H); B[idx(x,y)]=1; A[idx(x,y)]=0 }
    }
  }

  function laplace(arr, x, y){
    // weights: center -1, adjacent 0.2, diagonal 0.05
    let sum = 0;
    sum += arr[idx(x,y)] * -1;
    sum += arr[idx(x-1,y)] * 0.2;
    sum += arr[idx(x+1,y)] * 0.2;
    sum += arr[idx(x,y-1)] * 0.2;
    sum += arr[idx(x,y+1)] * 0.2;
    sum += arr[idx(x-1,y-1)] * 0.05;
    sum += arr[idx(x+1,y-1)] * 0.05;
    sum += arr[idx(x-1,y+1)] * 0.05;
    sum += arr[idx(x+1,y+1)] * 0.05;
    return sum;
  }

  function step(){
    const dt = 1.0;
    for(let y=1;y<H-1;y++){
      for(let x=1;x<W-1;x++){
        const i = idx(x,y);
        const a = A[i], b = B[i];
        const lapA = laplace(A,x,y);
        const lapB = laplace(B,x,y);
        const reaction = a*b*b;
        let na = a + (dA * lapA - reaction + F*(1-a)) * dt;
        let nb = b + (dB * lapB + reaction - (F + k) * b) * dt;
        if(na<0) na=0; if(na>1) na=1;
        if(nb<0) nb=0; if(nb>1) nb=1;
        A2[i]=na; B2[i]=nb;
      }
    }
    // swap
    const tmpA = A; A = A2; A2 = tmpA;
    const tmpB = B; B = B2; B2 = tmpB;
  }

  function render(){
    const img = ctx.createImageData(W,H);
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const i = idx(x,y);
        const a = A[i], b = B[i];
        const pi = (x + y*W)*4;
        const col = paletteMap(a,b,palette,palettePhase);
        img.data[pi+0] = col[0];
        img.data[pi+1] = col[1];
        img.data[pi+2] = col[2];
        img.data[pi+3] = 255;
      }
    }
    ctx.putImageData(img,0,0);

    // bloom/postprocess: draw a blurred additive pass from a temp canvas
    blCtx.clearRect(0,0,W,H);
    blCtx.drawImage(canvas,0,0);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // main bloom pass
    ctx.globalAlpha = Math.max(0, Math.min(1, bloomIntensity));
    ctx.filter = `blur(${Math.max(0, bloomRadius)}px)`;
    ctx.drawImage(bloomCanvas,0,0);
    // an extra wider, fainter pass for dramatic bloom when intensity is higher
    if(bloomIntensity > 0.15){
      ctx.globalAlpha = Math.max(0, Math.min(1, bloomIntensity * 0.6));
      ctx.filter = `blur(${Math.max(0, Math.floor(bloomRadius*1.8))}px)`;
      ctx.drawImage(bloomCanvas,0,0);
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // vignette
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    const vg = ctx.createRadialGradient(W/2,H/2, W*0.08, W/2,H/2, W*0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

  function frame(){
    if(running){
      // run a few iterations per frame for speed
      for(let i=0;i<itersPerFrame;i++) step();
      if(animatedPalette){ palettePhase += paletteSpeed; }
      render();
    }
    requestAnimationFrame(frame);
  }

  // event wiring
  feedInput.addEventListener('input',()=>{ F = parseFloat(feedInput.value); feedVal.textContent = F.toFixed(4) });
  killInput.addEventListener('input',()=>{ k = parseFloat(killInput.value); killVal.textContent = k.toFixed(4) });
  dAInput.addEventListener('input',()=>{ dA = parseFloat(dAInput.value); dAVal.textContent = dA.toFixed(2); });
  dBInput.addEventListener('input',()=>{ dB = parseFloat(dBInput.value); dBVal.textContent = dB.toFixed(3); });
  if(itersInput){ itersInput.addEventListener('input', ()=>{ itersPerFrame = parseInt(itersInput.value,10); itersVal.textContent = itersPerFrame; }); }
  if(paletteSelect){ paletteSelect.addEventListener('change', ()=>{ palette = paletteSelect.value }); }
  if(palSpeedInput){ palSpeedInput.addEventListener('input', ()=>{ paletteSpeed = parseFloat(palSpeedInput.value); palSpeedVal.textContent = paletteSpeed.toFixed(3); }); }
  if(animPalette){ animPalette.addEventListener('change', ()=>{ animatedPalette = animPalette.checked }); }
  if(brushSizeInput){ brushSizeInput.addEventListener('input', ()=>{ brushSize = parseInt(brushSizeInput.value,10); brushSizeVal.textContent = brushSize; }); }
  if(brushModeSelect){ brushModeSelect.addEventListener('change', ()=>{ brushMode = brushModeSelect.value }); }
  if(bloomIntensityInput){ bloomIntensityInput.addEventListener('input', ()=>{ bloomIntensity = parseFloat(bloomIntensityInput.value); bloomIntensityVal.textContent = bloomIntensity.toFixed(2); }); }
  if(bloomRadiusInput){ bloomRadiusInput.addEventListener('input', ()=>{ bloomRadius = parseInt(bloomRadiusInput.value,10); bloomRadiusVal.textContent = bloomRadius; }); }
  if(applyShapeBtn){ applyShapeBtn.addEventListener('click', ()=>{ seedShape(shapeSelect.value); }); }

  // pointer-based painting
  function paintAt(pageX, pageY){
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((pageX - r.left) * (W / r.width));
    const y = Math.floor((pageY - r.top) * (H / r.height));
    const rs = Math.max(1, brushSize);
    for(let yy = y - rs; yy <= y + rs; yy++){
      for(let xx = x - rs; xx <= x + rs; xx++){
        if(xx>1 && xx<W-1 && yy>1 && yy<H-1){
          const dx = xx - x, dy = yy - y;
          if(dx*dx + dy*dy <= rs*rs){
            const i = idx(xx,yy);
            if(brushMode === 'add'){ B[i] = 1; A[i] = 0; }
            else { B[i] = 0; }
          }
        }
      }
    }
  }
  canvas.classList.add('painting');
  canvas.addEventListener('pointerdown', (e)=>{ painting = true; paintAt(e.clientX, e.clientY); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e)=>{ if(painting) paintAt(e.clientX, e.clientY); });
  canvas.addEventListener('pointerup', (e)=>{ painting = false; try{ canvas.releasePointerCapture(e.pointerId); }catch(_){} });
  canvas.addEventListener('pointerleave', ()=>{ painting = false });

  const presets = {
    spots: { F:0.0367, k:0.0649, dA:1.0, dB:0.5, name:'Spotted Leopard' },
    coral: { F:0.0545, k:0.062, dA:1.0, dB:0.5, name:'Coral Growth' },
    waves: { F:0.014, k:0.054, dA:1.0, dB:0.6, name:'Wave Dynamics' },
    maze: { F:0.029, k:0.065, dA:1.0, dB:0.5, name:'Maze Pattern' },
    stripes: { F:0.0168, k:0.063, dA:1.0, dB:0.5, name:'Striped' },
    worms: { F:0.025, k:0.06, dA:1.0, dB:0.5, name:'Wandering Worms' },
    labyrinth: { F:0.03, k:0.062, dA:1.0, dB:0.5, name:'Labyrinth' }
  };
  
  // System buttons for quick preset access
  const systemContainer = document.getElementById('systemContainer');
  if(systemContainer){
    Object.keys(presets).forEach(key => {
      const btn = document.createElement('button');
      btn.textContent = presets[key].name;
      btn.addEventListener('click', () => {
        const p = presets[key];
        feedInput.value = p.F;
        killInput.value = p.k;
        dAInput.value = p.dA;
        dBInput.value = p.dB;
        feedVal.textContent = p.F.toFixed(4);
        killVal.textContent = p.k.toFixed(4);
        dAVal.textContent = p.dA.toFixed(2);
        dBVal.textContent = p.dB.toFixed(3);
        F = p.F;
        k = p.k;
        dA = p.dA;
        dB = p.dB;
        randomize();
      });
      btn.style.fontSize = '11px';
      btn.style.padding = '5px 8px';
      systemContainer.appendChild(btn);
    });
  }
  
  if(applyPresetBtn){ applyPresetBtn.addEventListener('click', ()=>{ const key = presetsSelect.value; if(presets[key]){ const p=presets[key]; feedInput.value=p.F; killInput.value=p.k; dAInput.value=p.dA; dBInput.value=p.dB; feedVal.textContent=p.F.toFixed(4); killVal.textContent=p.k.toFixed(4); dAVal.textContent=p.dA.toFixed(2); dBVal.textContent=p.dB.toFixed(3); F=p.F; k=p.k; dA=p.dA; dB=p.dB; } }); }

  if(saveBtn){ saveBtn.addEventListener('click', ()=>{ const url = canvas.toDataURL('image/png'); const a = document.createElement('a'); a.href = url; a.download = 'turing.png'; a.click(); }); }

  randomizeBtn.addEventListener('click', ()=>{ randomize(); });
  pauseBtn.addEventListener('click', ()=>{ running = !running; pauseBtn.textContent = running? 'Pause' : 'Resume' });
  resetBtn.addEventListener('click', ()=>{ seed(); });

  // initialize
  seed();
  render();
  requestAnimationFrame(frame);
})();
// Iridescent palette using HSL for smooth color transitions
function iridescent(v, phase) {
  const shift = Math.sin(phase * 0.3) * 0.1 + 0.1; // subtle shift 0..0.2
  // Map 0..1 to hue 280..40 (purple -> pink -> red -> orange -> yellow -> green -> cyan -> blue -> purple)
  const hue = (280 + v * 400 + shift * 100) % 360;
  const saturation = Math.min(100, 70 + v * 50);
  const lightness = 40 + v * 20;
  return hslToRgb(hue, saturation, lightness);
}

function oilSlick(v, phase) {
  const shift = Math.sin(phase * 0.25) * 0.15;
  const t = (v + shift) % 1.0;
  // Colors that mimic oil on water: deep blues, purples, greens, golds
  const hue = 200 + t * 280; // wide spectrum
  const sat = 80 + t * 20;
  const light = 35 + t * 25;
  return hslToRgb(hue % 360, sat, light);
}

function metallicRainbow(v, phase) {
  const shift = Math.sin(phase * 0.4) * 0.12;
  const mapped = Math.pow(v, 0.6) + shift; // power curve for better distribution
  const hue = (mapped * 360) % 360;
  const sat = 75 + Math.sin(phase * 0.1 + v * Math.PI) * 15;
  const light = 45 + v * 20;
  return hslToRgb(hue, Math.max(50, Math.min(100, sat)), light);
}

function hslToRgb(h, s, l) {
  h = h % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  
  const c = (100 - Math.abs(2 * l - 100)) * s / 100;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l / 100 - c / 2;
  
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  return [
    Math.floor((r + m) * 255),
    Math.floor((g + m) * 255),
    Math.floor((b + m) * 255)
  ];
}

// palette helper - accepts phase for animated palettes
function paletteMap(a,b,pal,phase){
  const v = Math.max(0, Math.min(1, a - b));
  
  if(pal === 'iridescent'){
    return iridescent(v, phase);
  } else if(pal === 'oilslick'){
    return oilSlick(v, phase);
  } else if(pal === 'metallic'){
    return metallicRainbow(v, phase);
  } else if(pal === 'blue'){
    const shift = Math.sin(phase) * 0.5 + 0.5;
    return [Math.floor((1-v)*20 + shift*30), Math.floor((1-v)*60 + shift*40), Math.floor(180*v + 60)];
  } else if(pal === 'contrast'){
    const shift = Math.sin(phase) * 0.5 + 0.5;
    const t = Math.floor(255 * (v*0.8 + shift*0.2));
    return [t, Math.floor(t*0.8), Math.floor(255 - t*0.5)];
  } else if(pal === 'grey'){
    const g = Math.floor(255 * v);
    return [g,g,g];
  }
  // classic with mild phase tint
  const shift = Math.sin(phase) * 0.5 + 0.5;
  return [Math.floor((a - b) * -200 + 120 + shift*20), Math.floor((a - b) * -40 + 120 + shift*10), Math.floor((b) * 255)];
}
