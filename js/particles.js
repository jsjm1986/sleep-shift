/* 《睡班》— Canvas 2D 粒子引擎
   白天 = 暖色浮尘 / 夜晚云背 = 主题流场(浅海·账簿·地铁·核心) + 拖尾 + 爆发 */
'use strict';
const FX = (() => {
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  let W=0, H=0, DPR=1;
  let mode = 'day';          // 'day' | 'night' | 'off'
  let theme = 'sea';         // sea | ledger | metro | core
  let parts = [];
  let bursts = [];
  let t = 0;
  let glitchFlash = 0;

  const THEMES = {
    sea:    { hue:168, spread:36, speed:.55, count:230, trail:.13, size:[.6,2.2], glyph:0 },
    ledger: { hue:276, spread:50, speed:.8,  count:240, trail:.12, size:[.6,2.4], glyph:1 },
    metro:  { hue:196, spread:30, speed:2.6, count:200, trail:.16, size:[.6,2],   glyph:0, lateral:true },
    core:   { hue:262, spread:60, speed:.35, count:280, trail:.10, size:[.6,2.6], glyph:1, radial:true }
  };

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, (window.innerWidth < 700 ? 1.5 : 2));
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = bodyBg(); ctx.fillRect(0,0,W,H);
    seed();
  }
  function bodyBg(){
    return mode === 'day' ? '#F7F3EC' : '#0B0E1A';
  }
  window.addEventListener('resize', resize);

  function seed(){
    parts = [];
    const th = THEMES[theme] || THEMES.sea;
    // 按屏幕面积自适应粒子规模(手机自动降载)
    const scale = Math.max(0.5, Math.min(1, (W*H) / (1280*800)));
    const n = Math.round((mode === 'day' ? 55 : th.count) * scale);
    for (let i=0;i<n;i++){
      parts.push({
        x: Math.random()*W, y: Math.random()*H,
        a: Math.random()*Math.PI*2,
        s: th.size[0] + Math.random()*(th.size[1]-th.size[0]),
        hue: th.hue + (Math.random()-.5)*th.spread,
        v: .4 + Math.random()*th.speed,
        g: Math.random() < .06   // 少量"字符"粒子
      });
    }
  }

  function setMode(m, th){
    mode = m; if (th) theme = th;
    document.body.classList.toggle('night', m !== 'day');
    ctx.fillStyle = bodyBg(); ctx.fillRect(0,0,W,H);
    seed();
  }

  function field(x, y){
    // 伪噪声流场:不同主题不同手势
    if (theme === 'metro')   return Math.sin(y*0.004 + t*0.7)*0.25;               // 近水平
    if (theme === 'core'){   const dx=x-W/2, dy=y-H*0.55;
      return Math.atan2(dy,dx) + Math.PI/2 + Math.sin(t*0.4)*0.4; }              // 环绕中心
    return Math.sin(x*0.0038 + t*0.5) + Math.cos(y*0.0032 - t*0.35);             // 海/账簿:柔性卷
  }

  /* v2.7 性能:30fps 渲染分频 + 帧时自适应降载。
     旧实现每帧全屏填充 ×2 @60fps,是移动端 GPU 头号成本;
     环境粒子在 30fps 视觉无差,GPU 预算直接减半。
     连续跟不上(帧距>40ms)时逐级减 25% 粒子(下限 24),低端机自愈。 */
  let last = 0, acc = 0, slowFrames = 0;
  function step(now){
    requestAnimationFrame(step);
    if (mode === 'off'){ return; }
    const dt = Math.min(now - last, 100);
    last = now;
    if (dt > 40 && !document.hidden) { slowFrames++; } else { slowFrames = 0; }
    if (slowFrames > 45 && parts.length > 24) { parts = parts.slice(0, Math.floor(parts.length * 0.75)); slowFrames = 0; }
    acc += dt;
    if (acc < 33) return;
    const stepDt = Math.min(acc, 100); acc = 0;
    t += 0.032 * (stepDt / 33);

    if (mode === 'day'){
      ctx.fillStyle = 'rgba(247,243,236,0.5)';
      ctx.fillRect(0,0,W,H);
      for (const p of parts){
        p.y -= p.v*0.18; p.x += Math.sin(t*0.6 + p.a)*0.12;
        if (p.y < -10){ p.y = H+10; p.x = Math.random()*W; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,170,110,${0.05 + p.s*0.05})`;
        ctx.arc(p.x, p.y, p.s*1.6, 0, 7);
        ctx.fill();
      }
    } else {
      const th = THEMES[theme] || THEMES.sea;
      ctx.fillStyle = `rgba(11,14,26,${th.trail})`;
      ctx.fillRect(0,0,W,H);
      for (const p of parts){
        const ang = field(p.x, p.y);
        p.x += Math.cos(ang) * p.v;
        p.y += Math.sin(ang) * p.v;
        if (th.lateral) p.x += p.v * 1.6;
        if (th.radial){
          const dx = p.x-W/2, dy = p.y-H*0.55, d = Math.hypot(dx,dy)||1;
          p.x -= dx/d*0.3; p.y -= dy/d*0.3;
        }
        // 越界回绕
        if (p.x<-20) p.x=W+20; if (p.x>W+20) p.x=-20;
        if (p.y<-20) p.y=H+20; if (p.y>H+20) p.y=-20;
        const a = 0.35 + Math.sin(t*2 + p.a)*0.15;
        ctx.fillStyle = `hsla(${p.hue}, 90%, 62%, ${a*0.5})`;
        if (p.g && th.glyph){
          ctx.font = `${8+p.s*4}px monospace`;
          ctx.fillText(['0','1','¥','§'][Math.floor(p.a*7)%4], p.x, p.y);
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
        }
      }
    }

    // 爆发粒子(交互反馈)
    for (let i=bursts.length-1; i>=0; i--){
      const b = bursts[i];
      b.life -= 1;
      b.x += b.vx; b.y += b.vy; b.vx *= .96; b.vy *= .96;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${b.hue},95%,68%,${Math.max(0,b.life/b.max)*0.8})`;
      ctx.arc(b.x, b.y, b.s, 0, 7);
      ctx.fill();
      if (b.life <= 0) bursts.splice(i,1);
    }

    if (glitchFlash > 0){
      glitchFlash--;
      if (glitchFlash % 3 === 0){
        ctx.fillStyle = `hsla(${Math.random()*360},90%,60%,0.05)`;
        ctx.fillRect(0, Math.random()*H, W, 2+Math.random()*30);
      }
    }
  }

  function burst(x, y, hue, n=26){
    for (let i=0;i<n;i++){
      const a = Math.random()*Math.PI*2, v = 1+Math.random()*4;
      bursts.push({ x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v,
        s:.8+Math.random()*1.8, hue:(hue||170)+(Math.random()-.5)*40,
        life:30+Math.random()*30, max:60 });
    }
  }
  function fall(){ // 下坠转场:UI 碎裂粒子
    for (let i=0;i<200;i++){
      bursts.push({
        x: W*0.15 + Math.random()*W*0.7,
        y: Math.random()*H*0.7,
        vx:(Math.random()-.5)*1.2, vy: 2+Math.random()*5,
        s:.8+Math.random()*2, hue: 20+Math.random()*30,
        life:50+Math.random()*40, max:90
      });
    }
  }
  function glitch(frames=8){ glitchFlash = frames; }

  resize(); seed(); requestAnimationFrame(step);
  return { setMode, burst, fall, glitch, get mode(){return mode;} };
})();
