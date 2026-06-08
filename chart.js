// Oscilloscope-style hero chart — three damped wave types, animated crosshair
(function () {
  const canvas = document.getElementById('hero-chart');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;

  // Layout
  const ML = 52, MR = 24, MT = 48, MB = 44;
  const T_MIN = 0, T_MAX = 4;
  const Y_MIN = -1.2, Y_MAX = 1.2;

  // Colors — yellow/black theme
  const BG       = '#f5cf16';
  const PLOT_BG  = '#f5cf16';
  const GRID     = 'rgba(21,20,15,0.12)';
  const AXIS_CLR = 'rgba(21,20,15,0.55)';
  const W_CLR    = 'rgba(21,20,15,0.9)';
  const W_CLR2   = 'rgba(21,20,15,0.5)';
  const DOT_CLR  = '#15140f';

  let W, H, PW, PH;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    PW = W - ML - MR;
    PH = H - MT - MB;
  }

  function tx(t) { return ML + (t - T_MIN) / (T_MAX - T_MIN) * PW; }
  function ty(y) { return MT + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PH; }
  function tFromX(x) { return T_MIN + (x - ML) / PW * (T_MAX - T_MIN); }

  // Wave functions
  function wUndamped(t)  { return Math.cos(2 * Math.PI * t); }
  function wLight(t)     { return Math.exp(-0.1 * 2 * Math.PI * t) * Math.cos(2 * Math.PI * Math.sqrt(1 - 0.01) * t); }
  function wCritical(t)  { return (1 + 2.8 * t) * Math.exp(-2.8 * t); }

  function drawWave(fn, color, dash, lw) {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw || 1.5;
    ctx.lineJoin = 'round';
    const steps = 600;
    for (let i = 0; i <= steps; i++) {
      const t = T_MIN + (i / steps) * (T_MAX - T_MIN);
      const x = tx(t), y = ty(fn(t));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    [-1, -0.5, 0, 0.5, 1].forEach(y => {
      ctx.beginPath();
      ctx.moveTo(ML, ty(y));
      ctx.lineTo(ML + PW, ty(y));
      ctx.stroke();
    });
    [0, 1, 2, 3, 4].forEach(t => {
      ctx.beginPath();
      ctx.moveTo(tx(t), MT);
      ctx.lineTo(tx(t), MT + PH);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawAxes() {
    const MONO = '"SF Mono","Roboto Mono",Consolas,monospace';
    ctx.save();
    ctx.fillStyle = AXIS_CLR;
    ctx.font = `10px ${MONO}`;
    // Y labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    [-1, -0.5, 0, 0.5, 1].forEach(y => {
      ctx.fillText(y === 0 ? '0.0' : y.toFixed(1), ML - 8, ty(y));
    });
    // X labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    [0, 1, 2, 3, 4].forEach(t => {
      ctx.fillText(t, tx(t), MT + PH + 10);
    });
    // X(T) label
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('> X(T)', 4, MT - 18);
    ctx.restore();
  }

  function drawLegend() {
    const MONO = '"SF Mono","Roboto Mono",Consolas,monospace';
    const items = [
      { label: 'UNDAMPED (Z=0)', dash: [3, 5] },
      { label: 'LIGHT (Z=0.1)',  dash: [] },
      { label: 'CRITICAL (Z=1)', dash: [9, 5] },
    ];
    ctx.save();
    ctx.font = `9px ${MONO}`;
    ctx.fillStyle = AXIS_CLR;
    ctx.textBaseline = 'middle';

    let x = W - MR;
    items.slice().reverse().forEach(item => {
      ctx.textAlign = 'right';
      const tw = ctx.measureText(item.label).width;
      ctx.fillText(item.label, x, MT - 18);
      x -= tw + 8;
      // mini line swatch
      ctx.save();
      ctx.setLineDash(item.dash);
      ctx.strokeStyle = 'rgba(21,20,15,0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 22, MT - 18);
      ctx.lineTo(x - 4,  MT - 18);
      ctx.stroke();
      ctx.restore();
      x -= 36;
    });
    ctx.restore();
  }

  function drawCrosshair(t) {
    const waves = [wLight, wCritical];
    waves.forEach(fn => {
      const y  = fn(t);
      const cx = tx(t);
      const cy = ty(y);
      // vertical dashed line
      ctx.save();
      ctx.strokeStyle = 'rgba(21,20,15,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, MT);
      ctx.lineTo(cx, MT + PH);
      ctx.stroke();
      ctx.restore();
      // outer glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(21,20,15,0.12)';
      ctx.fill();
      // filled dot
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = DOT_CLR;
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,207,22,0.9)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function drawHatch() {
    const barY = H - 16;
    const barH = 12;
    ctx.save();
    ctx.fillStyle = 'rgba(21,20,15,0.55)';
    ctx.fillRect(0, barY, W, 2);
    ctx.strokeStyle = 'rgba(21,20,15,0.35)';
    ctx.lineWidth = 1;
    const spacing = 9;
    for (let x = -barH; x < W + barH; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, barY + 2);
      ctx.lineTo(x + barH, barY + 2 + barH);
      ctx.stroke();
    }
    ctx.restore();
  }

  let cursorT = 0.5;
  let dir = 1;
  let paused = false;
  let raf;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // backgrounds
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(ML, MT, PW, PH);

    drawGrid();
    drawAxes();
    drawLegend();

    // three waves: dotted undamped, solid light, dashed critical
    drawWave(wUndamped, W_CLR2, [3, 5], 1.4);
    drawWave(wLight,    W_CLR,  [],     1.8);
    drawWave(wCritical, W_CLR2, [9, 5], 1.4);

    drawCrosshair(cursorT);
    drawHatch();
  }

  function loop() {
    if (!paused) {
      cursorT += 0.008 * dir;
      if (cursorT >= T_MAX - 0.05) dir = -1;
      if (cursorT <= T_MIN + 0.05) dir =  1;
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const t = tFromX(e.clientX - rect.left);
    if (t >= T_MIN && t <= T_MAX) { cursorT = t; paused = true; }
  });
  canvas.addEventListener('mouseleave', () => { paused = false; });

  window.addEventListener('resize', () => { resize(); });

  resize();
  loop();
})();
