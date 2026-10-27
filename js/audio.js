/* 《睡班》— WebAudio 合成音效与沉浸声景(零外部素材)
   ------------------------------------------------------------
   v2.19 三层结构:
   ① 底鸣层:双振荡器,按场景频率缓变(v2.7 沿革);
   ② 纹理层:常驻噪声循环 → 滤波 → LFO,按场景切换"呼吸"手势
      (海浪呼吸/地铁驶过/23:47 时钟/库房电流/面馆蒸汽/公园风/城市房间);
   ③ 点缀层:音效 + 角色声音印记(名牌出现的一瞬)+ 23:47 钟摆动机
      + 净化倒计时心跳 + 收集连击五声音阶。
   全部合成,无下载无授权;静音钮一键全哑。 */
'use strict';
const AUDIO = (() => {
  let ctx = null, muted = false;
  let ambient = null, ambGain = null;
  let tex = null, texGain = null, texLfo = null, texLfoGain = null, curTex='off';

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
    chime(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.5,'sine',.07), i*130)); },

    /* 23:47 钟摆动机:两音,第二音微微走低——清算/入梦/反转的声音签名。
       玩家永远不知道钟停在几点;这个动机每次响起,都是同一时刻。 */
    clock47(){ tone(659,.26,'sine',.05); setTimeout(()=>tone(521,.55,'sine',.05,-7),300); },

    /* 净化倒计时心跳:最后 5 秒,身体先于警报知道。 */
    heartbeat(){ tone(58,.16,'sine',.16,-18); setTimeout(()=>tone(52,.14,'sine',.11,-14),190); },

    /* 收集连击:五声音阶上行——碎片一枚一枚,像把什么拼回来。 */
    combo(i){ const sc=[523,587,659,784,880,1046]; tone(sc[Math.min(sc.length-1,i%sc.length)],.14,'sine',.07); },

    /* 角色声音印记:名牌出现的一瞬,先"听见"这个人。 */
    sting(who){
      const c = ac(); if (!c || muted) return;
      switch(who){
        case 'mian':   // 温而低的一声"嗯"
          tone(330,.22,'sine',.05); setTimeout(()=>tone(262,.3,'sine',.045),120); break;
        case 'zao':    // 汽水开盖 + 明亮一声
          noise(.12,.06,3200,1.2); setTimeout(()=>tone(880,.14,'sine',.05),130); break;
        case 'yu':     // 黄铜戥子一磕
          tone(196,.07,'square',.03); setTimeout(()=>tone(131,.12,'sine',.05),70); break;
        case 'guardian': // 隧道风掠过
          noise(.55,.05,300,.6); break;
        case 'j17':    // 杯子轻磕 + 平直一音
          tone(1245,.05,'sine',.04); setTimeout(()=>tone(1865,.04,'sine',.03),60); setTimeout(()=>tone(220,.3,'sine',.04),140); break;
        case 'xiaoman': // 碎光上行三音
          [784,988,1319].forEach((f,i)=>setTimeout(()=>tone(f,.12,'sine',.035), i*70)); break;
        case 'r3409':  // 深水暖涌
          tone(98,.6,'sine',.05); tone(147,.7,'sine',.035); break;
        case 'he':     // 图章落纸
          noise(.08,.09,900,1); setTimeout(()=>tone(150,.12,'sine',.05),60); break;
        case 'wen':    // 水晶杯
          tone(2093,.18,'sine',.035); setTimeout(()=>tone(2637,.22,'sine',.028),70); break;
        case 'sys':    // 终端短鸣
          tone(880,.06,'square',.03); break;
        case 'sis':    // 半句听不清的哼唱
          tone(587,.2,'sine',.03); setTimeout(()=>tone(523,.28,'sine',.025),150); break;
        default: break;
      }
    }
  };

  /* ---------- 纹理层:常驻噪声循环,按场景换滤波与呼吸 ---------- */
  const TEX = {
    lap:  { type:'lowpass',  freq:300,  q:.7, vol:.05,  lfo:.32, depth:.65 },  // 浅海:浪在呼吸
    rail: { type:'bandpass', freq:220,  q:1.1,vol:.045, lfo:.11, depth:.85 },  // 地铁:每 9 秒一班
    tick: { type:'bandpass', freq:2400, q:2,  vol:.018, lfo:.5,  depth:.9  },  // 清算大厅:钟在走
    hiss: { type:'highpass', freq:4200, q:.7, vol:.02,  lfo:.07, depth:.6  },  // 库房/账簿:电流在细响
    steam:{ type:'lowpass',  freq:900,  q:.7, vol:.035, lfo:.45, depth:.7  },  // 面馆:蒸汽
    wind: { type:'bandpass', freq:520,  q:.8, vol:.03,  lfo:.19, depth:.7  },  // 公园/天台:风
    hum:  { type:'lowpass',  freq:150,  q:.7, vol:.035, lfo:.05, depth:.35 },  // 塔内/机架:电流底
    room: { type:'lowpass',  freq:110,  q:.7, vol:.03,  lfo:.06, depth:.3  },  // 舱房/街道:城市很远
    off:  null
  };
  function ensureTex(c){
    if (tex) return;
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter();
    const g = c.createGain(); g.gain.value = 0;
    const lfo = c.createOscillator(); lfo.frequency.value = .3;
    const lg = c.createGain(); lg.gain.value = 0;
    lfo.connect(lg); lg.connect(g.gain);
    src.connect(f); f.connect(g); g.connect(c.destination);
    src.start(); lfo.start();
    tex = { src, f }; texGain = g; texLfo = lfo; texLfoGain = lg;
  }
  function setTexture(name){
    const c = ac(); if (!c) return;
    ensureTex(c);
    curTex = TEX[name] ? name : 'off';
    const t = TEX[name] || null;
    const tt = c.currentTime + 2;
    try {
      if (!t || muted){ texGain.gain.linearRampToValueAtTime(0, tt); return; }
      tex.f.type = t.type; tex.f.Q.value = t.q;
      tex.f.frequency.linearRampToValueAtTime(t.freq, tt);
      texLfo.frequency.linearRampToValueAtTime(t.lfo, tt);
      texLfoGain.gain.linearRampToValueAtTime(t.vol * t.depth, tt);
      texGain.gain.linearRampToValueAtTime(t.vol, tt);
    } catch(e) {}
  }

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
    ensureTex(c);
    if (window.__pendingAmb) { setAmbient.apply(null, window.__pendingAmb); window.__pendingAmb = null; }
  }
  /* 场景环境音:[f1, f2, vol, tex?] —— 底鸣缓变 + 纹理层换手势(2s 渐变,无跳变) */
  function setAmbient(f1, f2, vol, texName){
    const args = [f1, f2, vol, texName];
    if (!f1) { window.__pendingAmb = args; return; }
    if (!ctx || muted || !ambient) { window.__pendingAmb = args; return; }
    const t = ctx.currentTime + 2;
    try {
      ambient.o1.frequency.linearRampToValueAtTime(f1, t);
      ambient.o2.frequency.linearRampToValueAtTime(f2, t);
      ambGain.gain.linearRampToValueAtTime(vol, t);
    } catch(e) {}
    if (arguments.length > 3) setTexture(texName);
  }
  function toggleMute(){
    muted = !muted;
    const c = ctx;
    if (ambGain) ambGain.gain.value = muted ? 0 : .028;
    if (c && texGain){
      try {
        const t = TEX[curTex];
        texGain.gain.value = muted ? 0 : (t ? t.vol : 0);
      } catch(e) {}
    }
    return muted;
  }
  return { SFX, ambientOn, setAmbient, setTexture, toggleMute, isMuted:()=>muted, TEX };
})();
