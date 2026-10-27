/* 《睡班》— WebAudio 合成音效(无外部资源) */
'use strict';
const AUDIO = (() => {
  let ctx = null, muted = false, ambient = null, ambGain = null;

  function ac(){
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function env(g, t0, a, d, peak){
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }
  function tone(freq, dur, type='sine', vol=0.12, slide=0){
    const c = ac(); if (!c || muted) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), c.currentTime + dur);
    env(g, c.currentTime, 0.01, dur, vol);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur + 0.05);
  }
  function noise(dur=0.5, vol=0.1, freq=800, q=1){
    const c = ac(); if (!c || muted) return;
    const len = c.sampleRate * dur;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq; f.Q.value=q;
    const g = c.createGain(); env(g, c.currentTime, 0.02, dur, vol);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start();
  }

  const SFX = {
    click(){ tone(660, .07, 'sine', .07); },
    soft(){ tone(440, .1, 'sine', .05); },
    sign(){ tone(523,.12,'sine',.1); setTimeout(()=>tone(784,.2,'sine',.1),90); },
    coin(){ tone(880,.09,'triangle',.09); setTimeout(()=>tone(1320,.16,'triangle',.08),70); },
    whoosh(){ noise(.8,.14,600,.7); },
    purge(){ noise(.35,.08,1400,2); tone(980,.25,'sine',.06,320); },
    bad(){ tone(220,.4,'sawtooth',.07,-90); },
    echo(){ tone(392,.5,'sine',.06); setTimeout(()=>tone(494,.6,'sine',.05),160); },
    drone(){ tone(72,2.6,'sine',.12); tone(74.5,2.6,'sine',.1); },
    glitch(){ noise(.14,.16,2400,1.4); },
    black(){ tone(50,1.6,'sine',.16); noise(1.2,.05,120,.5); },
    chime(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.5,'sine',.07), i*130)); }
  };

  function ambientOn(){
    const c = ac(); if (!c || muted || ambient) return;
    const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o1.type='sine'; o1.frequency.value=110; o2.type='sine'; o2.frequency.value=164.8;
    lfo.frequency.value=.08; lg.gain.value=.02;
    g.gain.value=.028;
    lfo.connect(lg); lg.connect(g.gain);
    o1.connect(g); o2.connect(g); g.connect(c.destination);
    o1.start(); o2.start(); lfo.start();
    ambient = {o1,o2,lfo}; ambGain = g;
    if (window.__pendingAmb) { setAmbient.apply(null, window.__pendingAmb); window.__pendingAmb = null; }
  }
  /* 场景环境音:两枚振荡器缓变到场景频率/音量(2s 渐变,无跳变) */
  function setAmbient(f1, f2, vol){
    if (!f1) { window.__pendingAmb = [f1, f2, vol]; return; }
    if (!ctx || muted || !ambient) { window.__pendingAmb = [f1, f2, vol]; return; }
    const t = ctx.currentTime + 2;
    try {
      ambient.o1.frequency.linearRampToValueAtTime(f1, t);
      ambient.o2.frequency.linearRampToValueAtTime(f2, t);
      ambGain.gain.linearRampToValueAtTime(vol, t);
    } catch(e) {}
  }
  function toggleMute(){
    muted = !muted;
    if (ambGain) ambGain.gain.value = muted ? 0 : .028;
    return muted;
  }
  return { SFX, ambientOn, setAmbient, toggleMute, isMuted:()=>muted };
})();
