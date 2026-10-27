/* 《睡班》Sleep Shift — 主引擎
   状态机:标题 → 晨间 → 白天 → 夜晚(结算/梦境) → 清算/反转 → 结局 */
'use strict';

/* ================= 工具 ================= */
const $ = s => document.querySelector(s);
const app = document.getElementById('app');
function h(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function mkBtn(label, cls, onclick){ const b=h('button','btn'+(cls?' '+cls:''),label); b.addEventListener('click',e=>{ e.stopPropagation(); AUDIO.SFX.click(); onclick(e); }); return b; }
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
/* 生活行动 id → 卡面名字(去掉换行),清晨线索条用 */
/* 绘制图标优先,emoji 兜底 */
function cIcon(cid){ const I=window.ICONS; return (I&&I.contract[cid])||CONTRACTS[cid].icon; }
function lIcon(lid){ const I=window.ICONS; return (I&&I.life[lid])||LIFE[lid].icon; }
/* 触觉反馈:安卓生效,iOS 静默忽略 */
function vib(p){ try{ navigator.vibrate && navigator.vibrate(p); }catch(e){} }
function LIFE_NAME(id){
  const a=(window.LIFE&&LIFE[id]);
  return a ? a.name.replace('\n',' · ') : '白天';
}

/* 星级 → 内部评级字母。
   《供体评级手册》(data_world.js DOCS)只写了 A/B/C/D 四档,而星级有 0~5 六级,
   两边一直对不上;玩家在清算单上看到三颗星,手册里却找不到对应的档位。
   这里把 0~5 星补齐为 D/C/B/B+/A/A+,并把手册同步扩成六档(见 data_world.js)。
   对外叫"星级",供体舱里叫字母——这本身就是世界观的一部分。 */
const STAR_LETTER=['D','C','B','B+','A','A+'];
const starLetter=s=>STAR_LETTER[clamp(s|0,0,5)];

/* 可键盘激活的非 button 控件。保留原有 div 结构(合同签后卡里还嵌套着按钮),
   只补 role/tabindex/键位,不把嵌套 button 改成非法 HTML。 */
function bindActivate(el, fn){
  el.addEventListener('click', fn);
  el.tabIndex=0;
  el.setAttribute('role','button');
  el.addEventListener('keydown', e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    e.preventDefault();
    if(!e.repeat) fn(e);
  });
}

/* 只替换 HUD 自身,不重绘 #app —— 典当/选择等弹窗仍挂在 app 下,整棵重绘会把它们拆掉。 */
function refreshHud(){
  const old=document.querySelector('.hud');
  if(old && G) old.outerHTML=hudHTML();
}

/* 选择后果的可见回执:不在选项前剧透叙事,但执行后必须让玩家看见数值发生了变化。 */
function stateDelta(before, after){
  if(!before || !after) return '';
  const out=[];
  const money=after.coins-before.coins;
  const mem=after.mem-before.mem;
  const mood=after.mood-before.mood;
  const stars=after.stars-before.stars;
  if(money) out.push(`₡${money>0?'+':''}${money}`);
  if(mem) out.push(`记忆 ${mem>0?'+':''}${mem}%`);
  if(mood) out.push(`情绪 ${mood>0?'+':''}${mood}`);
  if(stars) out.push(`评级 ${stars>0?'+':''}${stars}`);
  return out.join(' · ');
}

/* 合同三处显示共用同一份预览:派单板、签约弹窗、签后卡。
   这里只算"合同与加签"的可预期部分;夜间数据质量、金融的随机浮动另行标明,
   不再让卡面写出与实际结算不同的单一数字。 */
function contractPreview(cid, affixId, rush){
  const c=CONTRACTS[cid]; if(!c) return null;
  const af=affixId ? AFFIXES[affixId] : null;
  let earn=c.coins, risk=c.risk, moodDelta=c.mood||0, memCost=0;
  if(af){
    if(af.coinsMul) earn=Math.round(earn*af.coinsMul);
    if(af.riskHalf) risk=Math.ceil(risk/2);
    if(af.riskAdd) risk+=af.riskAdd;
    if(af.moodAdd) moodDelta+=af.moodAdd;
    if(af.moodHalf) moodDelta=Math.round(moodDelta/2);
    if(af.memCost) memCost+=af.memCost;
  }
  /* 急单:锁价覆盖(报酬/风险由 RUSH 手写,不随词缀/随机浮动) */
  if(rush){ earn=rush.coins; risk=rush.risk; moodDelta-=6; }
  return {
    c, af, earn, risk, memCost,
    minEarn:(c.id==='finance' && !rush) ? Math.round(earn*0.6) : earn,
    maxEarn:(c.id==='finance' && !rush) ? Math.round(earn*1.4) : earn,
    moodDelta:moodDelta-3                 // 每晚固定基础情绪 -3,卡面不能再藏
  };
}
function contractMoney(p){ return p.minEarn===p.maxEarn ? `+₡${p.earn}` : `₡${p.minEarn}–${p.maxEarn}`; }

/* ================= 存档 ================= */
const SAVE_PREFIX='sleepshift_v1_';
let G=null;

/* ---- 存储可用性兜底(必守) ----
   Safari 隐私模式 / 磁盘配额耗尽 / 企业策略禁用 / 部分 file:// 环境里,
   localStorage 的 getItem 与 setItem **都会抛**。此前只有 saveMeta 包了 try,
   hasAuto() 与 setMeta() 是裸调用 —— 一抛就中断 showTitle(),#app 保持空白,
   玩家看到的是纯白屏,连"新的睡班"都点不到(实测已复现)。
   读写全部改走这两个兜底函数:写入失败只降级为"本次不存",绝不阻断游玩。 */
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); return true; }catch(e){ return false; } }
let saveWarned=false;
function warnNoSave(){ if(saveWarned) return; saveWarned=true; toast('这个环境不允许存档,进度只保留到关掉页面。'); }

function saveMeta(){ try{ return JSON.parse(lsGet(SAVE_PREFIX+'meta')||'{}'); }catch(e){ return {}; } }
function setMeta(m){ lsSet(SAVE_PREFIX+'meta', JSON.stringify(m)); }
function hasAuto(){ return !!loadSlot('auto'); }
function autoSave(){ if(!lsSet(SAVE_PREFIX+'auto', JSON.stringify(G))) warnNoSave(); }
function saveSlot(n){ const ok=lsSet(SAVE_PREFIX+'slot'+n, JSON.stringify(G)); if(!ok) warnNoSave(); return ok; }
/* 只读原始字符串,用于区分"空槽"与"槽里有东西但读不出来" */
function slotRaw(n){ return lsGet(n==='auto' ? SAVE_PREFIX+'auto' : SAVE_PREFIX+'slot'+n); }
/* 读档统一在这里"读 + 归一化":损坏(JSON 截断 / 手工改过 / 写入被中断)
   一律返回 null。此前 hasAuto() 只判断"字符串存在"、loadSlot() 解析失败返回 null,
   两者口径不一致 —— 按钮照常显示「继续睡班(第 ? 天)」,点下去 G=null,
   showMorning() 读 G.route 直接抛错,玩家被**永久卡在标题页**(实测 4 例复现)。
   现在按钮只在真的读得出有效存档时才出现;损坏的槽位自动等同空槽,可被正常覆盖。 */
function loadSlot(n){
  try{
    const raw=lsGet(n==='auto' ? SAVE_PREFIX+'auto' : SAVE_PREFIX+'slot'+n);
    if(!raw) return null;
    const s=normalizeSave(JSON.parse(raw));
    if(s && s.morningDay==null){
      s.morningDay=s.day;
      s.dayReady=(n!=='auto' || s.lifeDone || s.contract) ? s.day : 0;
    }
    return s;
  }catch(e){ return null; }
}
/* 补齐旧存档缺失的字段,避免读档后因 undefined 抛错。
   返回 null 表示"这份存档救不回来",调用方按空档处理。 */
function normalizeSave(s){
  if(!s || typeof s!=='object' || Array.isArray(s)) return null;
  const num=(v,d)=>(typeof v==='number' && isFinite(v)) ? v : d;
  s.day=num(s.day,1); if(s.day<1) s.day=1; if(s.day>30) s.day=30;   // DAYS 只到 30,越界会得到空的一天
  s.coins=num(s.coins,380);
  s.mem=num(s.mem,92);
  s.mood=num(s.mood,70);
  s.stars=num(s.stars,2);
  /* 只补类型不补区间不够:手改存档或被别的版本写过的存档可能带 mem:9999 / mood:-40,
     会让 nightQuality() 直接判"优"、applyMood() 算出负透明度,HUD 显示 9999%。
     这里统一夹回设计区间。 */
  s.coins=Math.max(0, s.coins);
  s.mem=clamp(s.mem,0,100);
  s.mood=clamp(s.mood,0,100);
  s.stars=clamp(s.stars,0,5);
  s.weekEarn=Math.max(0, num(s.weekEarn,0));
  if(s.morningDay!=null) s.morningDay=clamp(Math.floor(num(s.morningDay,0)),0,30);
  s.dayReady=clamp(Math.floor(num(s.dayReady,0)),0,30);
  /* 终生累计:老存档没有这四个字段,缺了会让终局结算单显示 NaN% 抽成。
     补 0 而不是补估算值——算不出来的账,宁可显示 0,也不能编。 */
  ['totalHash','totalGross','totalEarn','totalCut'].forEach(k=>{ s[k]=Math.max(0, num(s[k],0)); });
  s.nightsWorked=Math.max(0, num(s.nightsWorked,0));
  if(s.glitch==null) s.glitch=0;
  if(s.affix===undefined) s.affix=null;
  if(typeof s.lifeDone!=='boolean') s.lifeDone=false;
  if(!s.flags || typeof s.flags!=='object' || Array.isArray(s.flags)) s.flags={};
  if(!s.route || typeof s.route!=='object' || Array.isArray(s.route)) s.route={ren:0,zhen:0,zhi:0};
  /* 只补存在性不够:旧存档可能带 route:{} —— 进游戏后 G.route.zhi++ 会算出 NaN,
     路线判定从此永久失真。必须逐键补成数字。 */
  ['ren','zhen','zhi'].forEach(k=>{ s.route[k]=num(s.route[k],0); });
  if(!Array.isArray(s.seen)) s.seen=[];
  if(!Array.isArray(s.history)) s.history=[];
  if(!s.mems || typeof s.mems!=='object' || Array.isArray(s.mems)) s.mems={};
  /* 工单按"该合同第几次出工"推进;旧存档没有这两张表,补空对象即可。
     逐个键夹取,避免手改存档把 workCounts 变成字符串后导致 W 次错位。 */
  if(!s.workCounts || typeof s.workCounts!=='object' || Array.isArray(s.workCounts)) s.workCounts={};
  Object.keys(s.workCounts).forEach(k=>{ s.workCounts[k]=Math.max(0,Math.floor(num(s.workCounts[k],0))); });
  if(!s.workSeen || typeof s.workSeen!=='object' || Array.isArray(s.workSeen)) s.workSeen={};
  /* 合同/词缀 id 必须是真实存在的键:非法值会让夜间结算 CONTRACTS[G.contract]
     取到 undefined,applyContractEconomy() 读 c.coins 直接抛错,整晚白干。 */
  const has=(o,k)=>!!o && Object.prototype.hasOwnProperty.call(o,k);
  if(s.contract!=null && !has(CONTRACTS,s.contract)) s.contract=null;
  if(s.affix!=null && !has(AFFIXES,s.affix)) s.affix=null;
  MEMORIES.forEach(m=>{ if(!s.mems[m.id]) s.mems[m.id]=(m.id==='sis_face')?'pawned':'full'; });
  return s;
}

function newGame(){
  const mems={};
  MEMORIES.forEach(m=>{ mems[m.id] = (m.id==='sis_face') ? 'pawned' : 'full'; });
  const ng = !!saveMeta().ng;
  G = {
    day:1, morningDay:0, dayReady:0, coins:380 + (ng?500:0), mem:92, mood:70, mems,
    /* 试用期从 C 级起步:评级要有爬升过程,不能开局就 B 级、一周后满星。 */
    stars:1, affix:null,
    flags:{}, seen:[],
    route:{ren:0,zhen:0,zhi:0},
    contract:null, lifeDone:false,
    weekEarn:0, loot:null, lastLog:null, glitch:0,
    /* 终生累计(终局结算单 / 档案「你的账」用):
       totalHash 突触秒、totalGross 应得、totalEarn 实得、totalCut 被扣 */
    totalHash:0, totalGross:0, totalEarn:0, totalCut:0,
    nightsWorked:0,
    /* 每合同独立的工单进度与已读记录:首次出工永远从 W1 开始,
       不再按全局日历把第一次接 mole/finance 的玩家直接丢进 W2/W3。 */
    workCounts:{}, workSeen:{}
  };
  if (ng){ G.flags.ng = 1; }
}

/* ================= glitch / 情绪(数值即画面) ================= */
let glitchTimer=null;
function setGlitch(level){
  if(G) G.glitch=level;
  document.body.classList.toggle('gl3', level>=3);
  clearInterval(glitchTimer); glitchTimer=null;
  app.classList.remove('gl-on');
  if(level<=0) return;
  glitchTimer=setInterval(()=>{
    if(Math.random() < 0.18 + level*0.09){
      app.classList.add('gl-on');
      if(Math.random()<0.25) AUDIO.SFX.glitch();
      setTimeout(()=>app.classList.remove('gl-on'), 100+Math.random()*180);
      if(level>=4 && Math.random()<0.4) FX.glitch(6);
    }
  }, 1500);
}
function applyMood(){
  if(!G) return;
  $('#moodVeil').style.opacity = (clamp((85-G.mood)/85,0,1)*0.75).toFixed(2);
  document.documentElement.style.setProperty('--breath', (3+(100-G.mood)*0.045).toFixed(2)+'s');
}

/* ================= 记忆 ================= */
function memName(id){ const m=MEMORIES.find(x=>x.id===id); return m?m.name:'某段记忆'; }
function contaminateRandom(){
  const full=MEMORIES.filter(m=>G.mems[m.id]==='full');
  if(!full.length) return null;
  const m=rnd(full); G.mems[m.id]='tainted'; return m.id;
}
function taintFromNight(){
  G.mem=clamp(G.mem-3,0,100);
  const id=contaminateRandom();
  if(!id) G.mem=clamp(G.mem-3,0,100);
  return id;
}
function taintedList(){
  return MEMORIES.filter(m=>G.mems[m.id]==='tainted').map(m=>m.id);
}

/* ================= HUD / 弹窗 ================= */
function hudHTML(){
  if(!G) return '';
  const dots=[0,1,2,3,4].map(i=>`<i class="${G.mood>i*20+10?'on':''}"></i>`).join('');
  const week=['一','二','三','四','五','六','日'][(G.day-1)%7];
  const stars='★★★★★'.slice(0,G.stars)+'☆☆☆☆☆'.slice(0,5-G.stars);
  /* v1.4:监测读数条。emoji 徽章退役——机架上的读数不长表情。 */
  return `<div class="hud">
    <span class="cell"><span class="lbl">第</span><b>${String(G.day).padStart(2,'0')}</b><span class="lbl">天·周${week}</span></span>
    <span class="cell"><span class="lbl">余额</span><b>₡${G.coins}</b></span>
    <span class="cell" title="记忆完整性——你还记得多少。池子管它的消耗叫「折旧」,第 14 条已自动签收"><span class="lbl">记忆</span><b class="${G.mem<50?'warn':''}">${G.mem}%</b></span>
    <span class="cell" title="情绪——池子管它叫「散热」,低了要扣钱。点 i 看具体规则"><span class="lbl">情绪</span><b class="moodNum">${G.mood}</b><span class="moodDots">${dots}</span><button class="hudInfo" data-hudinfo="mood" aria-label="查看情绪与散热规则">i</button></span>
    <span class="cell" title="公司评级 · 对外称星级,内部评级 ${starLetter(G.stars)} 级(见《供体评级手册》)"><span class="starsTxt">${stars}</span><b class="slet">${starLetter(G.stars)}</b></span>
  </div>`;
}
function toast(msg){
  const t=h('div','toastBox',
    `<div class="toastHead"><span class="tDot"></span>梦巢云算 · 系统通知</div><p class="toastMsg">${msg}</p>`);
  t.style.cssText='position:fixed;left:50%;top:12%;transform:translateX(-50%);z-index:75;max-width:320px';
  document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(-8px)'; }, 1400);
  setTimeout(()=>t.remove(), 1800);
}

/* ================= 通用:多页文本场景 ================= */
/* ================= 场景系统(程序化矢量美术) ================= */
/* 场景→环境音映射(f1/f2/音量):合成音,无外部资源 */
const AMB_MAP={ park:[96,144,.03], noodle:[130,196,.034], audit:[118,177,.02], tower:[118,177,.02],
  bedroom:[84,126,.032], metro:[100,150,.028], pawn:[86,132,.03], store:[104,156,.03],
  gym:[110,165,.03], bookstore:[90,138,.026], observatory:[78,118,.026], zao:[98,147,.03],
  home:[110,165,.028], clinic:[120,180,.024] };
const SCENE_NAMES={ park:'白噪音公园', noodle:'陈记面馆', zao:'天台', bookstore:'旧书店',
  clinic:'社区诊所', tower:'云梯塔 41 层', metro:'旧地铁站', store:'便利店',
  observatory:'天文馆', gym:'健身房', pawn:'鱼骨典当行', audit:'清算大厅',
  bedroom:'体面舱', home:'常暖市 · 地面', annot:'供体算力池', render:'环境算力池',
  finance:'隔夜风险池', lab:'生物算力池', service:'服务间', penthouse:'88 层' };
function setScene(key){
  const s=document.getElementById('scene');
  const art=(window.SceneArt&&window.SceneArt.build)?SceneArt.build(key):null;
  if(key && window.AUDIO && AUDIO.setAmbient){
    const am=AMB_MAP[key]||[110,164.8,.028];
    AUDIO.setAmbient(am[0], am[1], am[2]);
  }
  if(!art){ s.classList.remove('on'); s.innerHTML=''; return; }
  s.className='on';
  s.innerHTML=art+`<div class="sceneVignette"></div><div class="sceneGrain"></div>`;
  /* 场景标签戳:进入地点时闪现红章(1.6s 自动消失) */
  const name = SCENE_NAMES[key];
  /* home/bedroom 是默认态,不算"到达" */
  if(name && key!=='home' && key!=='bedroom' && !document.querySelector('.locStamp')){
    const st = h('div','locStamp',name);
    document.body.appendChild(st);
    setTimeout(() => st.remove(), 1700);
  }
}

/* ================= 视觉小说对话系统 ================= */
function runPages(pages, done, opts={}){
  pages = pages.slice();
  let i=0;
  const vn=document.getElementById('vn');
  const mount = opts.host || vn;
  let typing=null, full='', pendingChoices=null, finished=false, downX=0;

  /* 同一宿主上只允许一个活动的页序列:开启新序列时,旧序列立即作废。
     否则连点/重复触发会让旧序列的 click 监听器残留在宿主上,
     它的 done 回调会在"已经翻页之后"才触发,把 G.day 与在途流程错开。 */
  const token={dead:false};
  if(mount.__vnToken) mount.__vnToken.dead=true;
  mount.__vnToken=token;

  mount.innerHTML='';
  const frame=h('div','vnFrame');
  const head=h('div','vnHead');
  const portrait=h('div','vnPortrait','🙂');
  const namePlate=h('div','vnName','');
  head.append(portrait,namePlate);
  const textBox=h('div','vnText');
  const deltaBox=h('div','vnDelta');
  deltaBox.setAttribute('role','status');
  const nextCue=h('div','vnNext','▼');
  const choiceRow=h('div','vnChoices');
  frame.append(head,textBox,deltaBox,nextCue,choiceRow);
  let nextDelta='';
  mount.appendChild(frame);
  if(!opts.host){ vn.classList.add('on'); app.classList.add('dimmed'); }
  const cleanup=()=>{ token.dead=true; clearTimeout(typing); typing=null; mount.removeEventListener('click',tap); if(!opts.host){ vn.classList.remove('on'); app.classList.remove('dimmed'); } mount.innerHTML=''; };

  function resolve(){
    while(i<pages.length){
      let p = pages[i];
      try{ while(typeof p==='function') p = p(G); }catch(e){ p=null; }
      if(p==null){ i++; continue; }
      pages[i]=p;
      return p;
    }
    return undefined;
  }
  function setSpeaker(p){
    if(p && p.who){
      const c=(window.CHARACTERS&&CHARACTERS[p.who])||{};
      const tone=c.tone||'#38F2D8';
      const sv=(window.PORTRAITS&&window.PORTRAITS[p.who])||null;
      if(sv){ portrait.innerHTML=sv; portrait.classList.add('hasSvg'); }
      else { portrait.innerHTML=''; portrait.textContent=c.icon||'❔'; portrait.classList.remove('hasSvg'); }
      namePlate.textContent=c.name||p.who;
      portrait.style.borderColor=tone;
      portrait.style.boxShadow=`0 0 16px ${tone}44`;
      namePlate.style.color=tone;
      namePlate.style.setProperty('--np',tone);
      head.style.display='flex';
    } else {
      head.style.display='none';
    }
  }
  function type(str){
    clearTimeout(typing); full=str; textBox.textContent='';
    nextCue.classList.remove('on');
    let k=0;
    /* 标点停顿:逗号 80ms/句读 160ms——文字游戏的呼吸感 */
    function typeStep(){
      if(token.dead){ typing=null; return; }
      k+=1; textBox.textContent=full.slice(0,k);
      if(k>=full.length){ typing=null; onTyped(); return; }
      const ch=full[k-1];
      const d = (ch==='，'||ch==='、'||ch===',') ? 80 : (ch==='。'||ch==='！'||ch==='？'||ch==='…') ? 160 : (ch==='\n') ? 60 : 22;
      typing=setTimeout(typeStep, d);
    }
    typeStep();
  }
  function completeTyping(){
    clearTimeout(typing); typing=null;
    textBox.textContent=full; onTyped();
  }
  function onTyped(){
    if(pendingChoices){ renderChoices(); }
    else { nextCue.classList.add('on'); }
  }
  function renderChoices(){
    choiceRow.innerHTML='';
    pendingChoices.forEach(c=>{
      /* 叙事选项不是"开始游戏"级别的主 CTA;统一 primary 会让整屏按钮同时呼吸,
         也无法区分普通选择与危险动作。继续/天亮才保留 primary。 */
      const b=mkBtn(c.label,'',()=>{
        if(finished) return;
        const before={coins:G.coins,mem:G.mem,mood:G.mood,stars:G.stars};
        if(c.fx) c.fx(G);
        nextDelta=stateDelta(before,G);
        applyMood(); AUDIO.SFX.soft(); refreshHud();
        const lines=(c.lines||[]).map(l=>typeof l==='function'?(()=>{try{return l(G);}catch(e){return null;}})():l).filter(l=>l!=null);
        pages.splice(i+1, 0, ...lines);
        i++; step();
      });
      choiceRow.appendChild(b);
    });
  }
  function render(){
    if(token.dead) return;
    deltaBox.innerHTML=nextDelta ? `<span class="deltaLabel">选择回执</span> ${nextDelta}` : '';
    nextDelta='';
    choiceRow.innerHTML=''; pendingChoices=null;
    const p=pages[i];
    // 容错:若某一页把"下一页"对象误写进 text 数组,就地提升为后续页。
    // 否则 join 后会渲染出 "[object Object]",且内嵌的选项永远不会出现。
    if(p && typeof p==='object' && Array.isArray(p.text)){
      const nested=p.text.filter(t=>t && typeof t==='object' && !Array.isArray(t));
      if(nested.length){
        p.text=p.text.filter(t=>!(t && typeof t==='object' && !Array.isArray(t)));
        pages.splice(i+1,0,...nested);
      }
    }
    if(typeof p==='object' && p.scene) setScene(p.scene);
    setSpeaker(p);
    const text = typeof p==='string' ? p : (p.text||[]).join('\n\n');
    pendingChoices = (typeof p!=='string' && p.choices) ? p.choices : null;
    type(text);
  }
  function tap(ev){
    if(finished || token.dead) return;
    if(ev && ev.target.closest && ev.target.closest('.btn')) return;
    if(typing){ completeTyping(); return; }
    if(!pendingChoices){ i++; step(); }
  }
  mount.addEventListener('click',tap);
  function step(){
    if(token.dead) return;
    if(i>=pages.length){ finished=true; cleanup(); done && done(); return; }
    if(resolve()===undefined){ finished=true; cleanup(); done && done(); return; }
    render();
  }
  step();
}

/* ================= 标题 ================= */
function showTitle(){
  G=null;
  app.classList.remove('hasDock');
  nightLock=false; dayClosed=-1;
  FX.setMode('day');
  setScene(null);
  document.body.classList.remove('cracked');
  $('#moodVeil').style.opacity=0;
  setGlitch(0);
  const meta=saveMeta();
  /* v1.4:标题页 = 梦巢云算的"受理终端"。不是启动页,是一张立着的受理单。 */
  const wrap=h('div','title-wrap');
  const form=h('div','tForm');
  form.innerHTML=`
    <div class="tDocHead"><span>梦巢云算 · 供体受理处</span><span>FORM 3409-02</span></div>
    <div class="tSeal">共惠<br>受理</div>
    <div class="logo">睡班</div>
    <div class="logo-sub">SLEEP SHIFT</div>
    <div class="tRule"></div>
    <div class="slogan">"你睡觉,世界运转。"<br><em>—— 神经共惠计划 · 宣</em></div>`;
  const btns=h('div','title-btns');
  /* 读不出内容但键还在 = 存档损坏。此前这种情况会让玩家点下去直接崩;
     现在如果只把按钮藏起来,玩家只会觉得"我的存档凭空没了",同样困惑 ——
     所以显式标成「存档损坏」并给出说明,让玩家知道发生了什么。 */
  const auto=loadSlot('auto'), autoBroken=!auto && !!slotRaw('auto');
  if(auto){
    btns.appendChild(mkBtn(`继续睡班(第 ${auto.day} 天)`,'primary',()=>{
      G=auto;
      showMorning();
    }));
  }else if(autoBroken){
    btns.appendChild(mkBtn('继续睡班(存档损坏)','meek',()=>{
      toast('自动存档读不出来了,只能重开一局。');
    }));
  }
  btns.appendChild(mkBtn(meta.ng?'新的睡班 · 二周目':'新的睡班', auto?'':'primary',()=>{
    AUDIO.SFX.chime(); newGame();
    if(meta.ng){ showMorning(); } else { showPrologue(()=>showMorning()); }
  }));
  const row=h('div','slot-row');
  [1,2,3].forEach(n=>{
    const s=loadSlot(n), broken=!s && !!slotRaw(n);
    row.appendChild(mkBtn(s?`档${n}·D${s.day}`:broken?`档${n}·损坏`:`空档${n}`,'',()=>{
      if(s){ G=s; showMorning(); }
      else if(broken) toast(`槽位 ${n} 的存档读不出来了。再存一次会覆盖它。`);
      else toast('这个槽位是空的。');
    }));
  });
  btns.appendChild(row);
  form.appendChild(btns);
  if(saveWarned) form.appendChild(h('div','saveWarn','⚠ 此环境无法存档(隐私模式 / 存储配额)——进度只保留到关闭页面'));
  const onLine=h('div','onLine','在线矿机 <b id="onCnt">41,203</b> 台 · 本日产出已并入矿池账');
  form.appendChild(onLine);
  if(window.__onT) clearInterval(window.__onT);
  window.__onT=setInterval(()=>{
    const el=document.getElementById('onCnt');
    if(!el){ clearInterval(window.__onT); return; }
    el.textContent=(41203+Math.floor(Math.random()*80)-40).toLocaleString();
  },3000);
  form.appendChild(h('div','tFoot','神经共惠计划 · 受理终端 v4.02<br>异议通道:维护中(自 2081 年起)'));
  wrap.appendChild(form);
  app.innerHTML=''; app.appendChild(wrap);
}

/* ================= 晨间 ================= */
const CHAPTERS={1:['第一章','试用期'],8:['第二章','去向'],15:['第三章','妹妹'],22:['第四章','真相与选择']};
function showChapterCard(done){
  const [num,title]=CHAPTERS[G.day]||['',''];
  const el=h('div','chapterCard',`<div class="cnum">${num}</div><div class="ctitle">${title}</div><div class="cline"></div>`);
  document.body.appendChild(el);
  AUDIO.SFX.drone();
  let closed=false;
  const close=()=>{ if(closed) return; closed=true; el.classList.add('out'); setTimeout(()=>{ el.remove(); done&&done(); }, 800); };
  el.addEventListener('click',close);
  setTimeout(close, 2100);
}

function showMorning(){
  app.classList.remove('hasDock');
  app.scrollTop=0;
  FX.setMode('day');
  nightLock=false;                       // 新的一天:夜晚流程锁一定处于打开状态
  document.body.classList.remove('night');
  if(!G.route) G.route={ren:0,zhen:0,zhi:0};
  document.body.classList.toggle('cracked',!!G.flags.cracked);
  setGlitch(glitchBase());
  if(G.dayReady===G.day){ startDay(); return; }
  setScene('bedroom');
  const D=DAYS[G.day]||{};
  if(G.morningDay!==G.day){
    G.flags.gym=0;
    G.lifeDone=false;
    if(D.moodDelta){ G.mood=clamp(G.mood+D.moodDelta,0,100); }
    if(D.fx && !G.flags['fx'+G.day]){ D.fx(G); G.flags['fx'+G.day]=1; }
    G.morningDay=G.day;
  }
  applyMood();
  const lines = typeof D.morning==='function' ? D.morning() : (D.morning||['新的一天。']);
  /* 昨天白天做了什么,今早必须有人提。
     原先这里只有一条"记忆 <80 时 30% 概率"的随机错认——那是通用的、和你的选择无关
     的噪音。现在把玩家昨天真的走过的那一步放在最前面,随机错认退到它后面。
     读出后立即清掉:回响只打一次,否则静养日/漏做的日子会把前天的下文重播。 */
  if(G.flags.vitals){
  }
  const leadId=(window.DAY_LEAD&&G.flags.dayLead)?G.flags.dayLead:null;
  const lead=leadId?window.DAY_LEAD.text[leadId]:null;
  const leadName=leadId?LIFE_NAME(leadId):null;
  if(leadId) G.flags.dayLead=0;
  autoSave();
  app.innerHTML=hudHTML();
  const panel=h('div','panel fadeIn stagger');
  if(lead){
    panel.appendChild(h('div','dayLead',`<span class="leadTag">昨天 · ${leadName}</span>${lead}`));
  }
  lines.forEach(l=>panel.appendChild(h('p','t',l)));
  if(G.flags.vitals){
    panel.appendChild(h('div','vitalsLine',`<span class="vtag">昨夜体征</span>${G.flags.vitals}`));
    G.flags.vitals=0;
  }
  // 记忆完整性下降后的"错认"系统:每天 30% 概率
  if(G.mem<80 && G.mem>=25 && Math.random()<0.3){
    const pool=[
      '你把送牛奶的认成了妹妹。你为一句脱口而出的"妹",道歉了一整个电梯的时间。',
      '收银员找零时,你叫出了一个名字。那是谁的?你对着小本子翻了一夜。',
      '你对着镜子的自己,愣了三秒。\n\n"这张脸——是我的吗?"',
      '主管跟你打招呼,你却听成了母亲的呼唤。\n\n两种声音都很假。假得分不出谁更假。'
    ];
    panel.appendChild(h('p','t dim',rnd(pool)));
  }
  // 常暖市公共屏幕:乌托邦的脸。体面、准确、无一处提到代价。
  const scr=(window.SCREEN&&SCREEN[G.day])||null;
  if(scr){
    const ticker=(window.WORLD&&WORLD.screenTicker)||'算力池 · 全城矿机在线';
    panel.appendChild(h('div','publicScreen',
      `<div class="psHead"><i class="psDot"></i>常暖市 · 算力池公告</div><div class="psBody">${scr}</div><div class="psFoot">${ticker}</div>`));
  }
  panel.appendChild(mkBtn('起床','primary',()=>{
    app.innerHTML='';
    const go=()=>afterMorning();
    if(CHAPTERS[G.day]) showChapterCard(go); else go();
  }));
  app.appendChild(panel);
}

function glitchBase(){
  if(G.flags.T9) return 5;
  if(G.flags.T6) return 4;
  if(G.flags.T5) return 3;
  if(G.flags.T3||G.flags.T4) return 2;
  if(G.flags.T1||G.flags.T2) return 1;
  return 0;
}

function afterMorning(){
  const D=DAYS[G.day]||{};
  const seq=[];
  /* 首日一句引导:D1 面前直接是"四份合同 + 三个行动 + 裸睡",此前没有任何
     一句告诉玩家这一天该怎么用。放在剧情之前,只在 D1 出现一次。 */
  const tutor=(window.DAY_TUTOR&&DAY_TUTOR.get)?DAY_TUTOR.get(G):null;
  if(tutor) seq.push(...tutor);
  // 二周目:D1 开场差异
  if(G.flags.ng && G.day===1 && !G.flags.ngSeen){
    G.flags.ngSeen=1;
    seq.push('……熟悉的签约室,熟悉的消毒水味。\n\n接待员对你微笑。这一次,你注意到她的笑容里有一瞬间的卡顿——\n\n像加载失败了半帧。');
  }
  const th=memThresholdPages();
  if(th.length) seq.push(...th);
  if(D.story){
    if(D.story.twist){ seq.push({__twist:D.story.twist}); }
    else if(typeof D.story==='function'){ seq.push(...D.story(G)); }
    else seq.push(...D.story);
  }
  if(D.storyAfter) seq.push(...D.storyAfter);
  if(D.audit) seq.push({__audit:true});
  runSeq(seq);
}
function runSeq(seq){
  if(!seq.length){ startDay(); return; }
  const item=seq.shift();
  if(item.__twist){
    showTwist(item.__twist, ()=>{ FX.setMode('day'); runSeq(seq); });
    return;
  }
  if(item.__transfer){
    showTransferLetter(()=>runSeq(seq));
    return;
  }
  if(item.__audit){
    // 防御:序列在途时若天数已被推进,当天可能没有清算单——跳过而不是崩溃
    const a=(DAYS[G.day]||{}).audit;
    if(!a){ runSeq(seq); return; }
    showAudit(a, ()=>{
      const rest=(a.pages||[]).slice();
      if(a.twist) showTwist(a.twist, ()=>runSeq(rest));
      else runSeq(rest);
    });
    return;
  }
  runPages([item].flat(), ()=>{ app.innerHTML=''; runSeq(seq); });
}

function memThresholdPages(){
  const out=[];
  if(G.mem<25 && !G.flags.th25){
    G.flags.th25=1; G.mood=clamp(G.mood-10,0,100);
    out.push('今天,医生给你开了一周的"静养"。\n\n公司批得飞快。\n\n快得像等这一天,已经很久了。');
  } else if(G.mem<50 && !G.flags.th50){
    G.flags.th50=1; G.mood=clamp(G.mood-10,0,100);
    out.push('楼道里,阿枣朝你挥手。\n\n你看着她的脸,看了很久。\n\n"你是……哪位?"\n\n她手里的汽水,慢慢放下了。');
  } else if(G.mem<80 && !G.flags.th80){
    G.flags.th80=1; G.mood=clamp(G.mood-6,0,100);
    out.push('清晨,你在楼道里遇见阿枣。\n\n你叫出了另一个名字。\n\n她愣住了。你也愣住了。\n\n那个名字是从哪来的?你的嘴,比脑子诚实。');
  }
  return out;
}

/* ================= 存档槽选择 ================= */
/* 旧实现 `find(空槽)||1` 会在三槽满后静默覆盖槽 1,没有选择也没有确认;
   损坏槽还会被当成空槽直接覆盖。这里显式列出三槽,覆盖必须二次确认。 */
function openSaveSlots(){
  if(!G) return;
  const modal=h('div','modal');
  const paper=h('div','paper savePaper');
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
  paper.innerHTML=`<header>存档 <small>三槽 · 覆盖需确认</small></header><div class="body"></div>`;
  const body=paper.querySelector('.body');
  const close=mkBtn('取消','meek',()=>modal.remove());
  let busy=false;
  const doSave=n=>{
    if(busy) return;
    busy=true;
    const ok=saveSlot(n);
    busy=false;
    if(ok){ toast(`已存入槽位 ${n}。`); modal.remove(); }
    else toast('存档失败:这个环境不允许写入。');
  };
  const confirmSave=n=>{
    const s=loadSlot(n), broken=!s && !!slotRaw(n);
    body.innerHTML='';
    body.appendChild(h('p','t',`槽位 ${n} ${s?`已有存档(第 ${s.day} 天)`:(broken?'的内容已经损坏':'是空的')}。\n\n${s||broken?'覆盖后无法恢复。':'确认写入这一局?'}`));
    if(s||broken) body.appendChild(mkBtn('确认覆盖','danger',()=>doSave(n)));
    else body.appendChild(mkBtn('存入此槽','primary',()=>doSave(n)));
    body.appendChild(mkBtn('返回','meek',render));
  };
  const render=()=>{
    body.innerHTML='';
    body.appendChild(h('p','t','选择一个槽位。空槽会直接写入;已有存档需要再确认一次。'));
    [1,2,3].forEach(n=>{
      const s=loadSlot(n), broken=!s && !!slotRaw(n);
      const label=s?`档 ${n} · 第 ${s.day} 天`:`档 ${n} · ${broken?'损坏':'空档'}`;
      const b=mkBtn(label,s?'':'',()=>confirmSave(n));
      body.appendChild(b);
    });
    body.appendChild(close);
  };
  modal.appendChild(paper);
  app.appendChild(modal);
  render();
}

/* ================= 白天(主界面) ================= */
function startDay(){
  G.dayReady=G.day;
  app.scrollTop=0;
  FX.setMode('day');
  setScene('home');
  applyMood();
  const D=DAYS[G.day]||{};
  // 注意:生活行动次数(lifeDone)在 showMorning() 里每日重置,不能放在这里——
  // startDay 也会在"做完一次生活行动后"被调用,那样会让每日 1 次的限制失效。
  const resting = G.flags.th25 && !G.flags.th25done && G.day<=30;
  if(resting) G.flags.th25done=1;
  if(!D.offers) D.offers=['biaozhu','render'];

  app.innerHTML=hudHTML();
  const head=h('div','',`<div class="dayHead"><span class="dayTag">试用期 · NEURAL MUTUAL PROGRAM</span><span class="dayNo">№ 3409-02 · D${String(G.day).padStart(2,'0')}</span></div><div class="dayTitle">白天</div>`);
  app.appendChild(head);
  /* 长期目标常驻:序章立了"赎回妹妹的脸 ₡4,500",但白天页面一次都没提醒,
     玩家很容易只剩"今天签哪单"的短视循环。 */
  const goalHTML=(()=>{
    const target=4500;
    const pct=Math.max(0,Math.min(100, G.coins/target*100));
    const done=G.mems.sis_face!=='pawned';
    return `<div class="goalLabel">${done?'赎回完成 · 妹妹的脸':'赎回目标 · 妹妹的脸'}</div>
      <div class="goalBar"><i style="width:${done?100:pct}%"></i></div>
      <div class="goalVal">现有 ₡${G.coins} / ₡${target} · 周固定 ₡900</div>
      ${G.day===1?'<div class="goalFlow">今日流程:选一份睡班 → 用掉 1 次生活行动 → 开始今晚的睡班</div>':''}`;
  })();
  app.appendChild(h('div','goalStrip',goalHTML));
  /* 倒计时:第四章起,墙开始合拢。数字比台词更压迫。 */
  if(G.day>=22){
    const left=31-G.day;
    app.appendChild(h('div','countdownStrip'+(left<=3?' hot':''),
      `距试用期评估 <b>${left}</b> 天 · 逾期未提交书面异议者,自动转入永久供体`));
  }

  /* 白天的方向感:今天有没有"会推进主线"的行动。
     生活行动此前是一排等价交易,玩家没有理由走向其中任何一个 ——
     而主线恰恰藏在两三个具体的地点里(D4 面馆 / 便利店 / 典当行柜台)。 */
  const storyHits=(resting?[]:(D.life||['park','zao','clinic']).concat(G.flags.pawnshop_open?['pawnshop']:[])
    .filter((v,i,arr)=>arr.indexOf(v)===i))
    .filter(lid=>!!lifeStoryTag(lid));

  // ---- 今晚的睡班 ----
  app.appendChild(h('div','h','今晚的睡班'));
  const cwrap=h('div','cards');
  if(G.contract){
    const c=CONTRACTS[G.contract];
    const p=contractPreview(G.contract,G.affix,(G.flags.rush&&window.RUSH)?RUSH[G.day]:null);
    const card=h('div','cCard');
    card.style.setProperty('--c1',c.c1); card.style.setProperty('--c2',c.c2);
    card.innerHTML=`<div class="cname"><span class="cicon">${cIcon(G.contract)}</span> ${c.name}</div>
      <div class="cdesc">已签署。今夜生效。</div>
      <div class="chash">额定产出 ≈ ${HASH_BY_CONTRACT[G.contract]||'—'}×10⁹ 突触秒 / 夜</div>
      <div class="cmeta"><span class="money">${contractMoney(p)}</span><span>污染风险 ${p.risk}%</span><span>情绪 ${p.moodDelta>0?'+':''}${p.moodDelta}</span></div>
      <div class="cNote">${p.af?`已含加签 · ${p.af.name} · `:''}入睡本身损耗情绪 −3 · 实到手 = 卡面分成 × 当夜数据质量(情绪差、忘得多都会打折,最低 8 折)</div>`;
    const re=mkBtn('改签','meek',()=>{ G.contract=null; startDay(); });
    card.appendChild(re);
    cwrap.appendChild(card);
  } else if(resting){
    cwrap.appendChild(h('div','panel fadeIn','<p class="t dim">静养中。今晚不接单,梦巢已暂停你的排班。</p>'));
  } else {
    /* 派单门槛:高负载单按《供体评级手册》限级(C 级限制高负载单)。
       tier 字段此前只写不读,是纯死数据;接进来之后,"评级"第一次真的挡住了钱。
       两条例外:
       ① 黑单不看评级——它根本不在册上。掉星的人最后一条路,恰恰是它。
       ② 任何一天至少留一单可接,否则玩家会被卡死在"没钱付租金"的死路上。 */
    const openable = c => !!c && (c.union ? !!G.flags.union_helped : true)
                        && (c.id==='black' || (c.tier||0)<=G.stars);
    const gateOn = D.offers.some(cid=>openable(CONTRACTS[cid]));
    D.offers.forEach(cid=>{
      const c=CONTRACTS[cid];
      if(!c) return;
      if(c.union && !G.flags.union_helped) return;
      const need=c.tier||0;
      if(gateOn && c.id!=='black' && need>G.stars){
        const lc=h('div','cCard locked');
        lc.style.setProperty('--c1','#6B6B6B'); lc.style.setProperty('--c2','#8A8A8A');
        lc.innerHTML=`<div class="lockStamp">暂 缓</div><div class="cname"><span class="cicon">${cIcon(cid)}</span> ${c.name}</div>
          <div class="cdesc">评级不足。该单要求 <b>${starLetter(need)}</b> 级,当前 <b>${starLetter(G.stars)}</b> 级。</div>
          <div class="chash">额定产出 ≈ ${HASH_BY_CONTRACT[cid]||'—'}×10⁹ 突触秒 / 夜</div>
          <div class="cmeta"><span>已锁定 · 评级在每周大清算与云梯塔超频会上变动</span></div>`;
        lc.setAttribute('aria-disabled','true');
        bindActivate(lc,()=>{ AUDIO.SFX.soft();
          toast(`评级不足:需 ${starLetter(need)} 级,当前 ${starLetter(G.stars)} 级。`); });
        cwrap.appendChild(lc);
        return;
      }
      const card=h('div','cCard');
      const p=contractPreview(cid,null);
      card.style.setProperty('--c1',c.c1); card.style.setProperty('--c2',c.c2);
      card.innerHTML=`<div class="cname"><span class="cicon">${cIcon(cid)}</span> ${c.name}</div>
        <div class="cdesc">${c.desc}</div>
        <div class="chash">额定产出 ≈ ${HASH_BY_CONTRACT[cid]||'—'}×10⁹ 突触秒 / 夜</div>
        <div class="cmeta"><span class="money">${contractMoney(p)}</span><span>污染风险 ${p.risk}%</span><span>情绪 ${p.moodDelta>0?'+':''}${p.moodDelta}</span></div>
        <div class="cNote">${c.id==='finance'?'金融分成 0.6–1.4× 随机 · ':''}入睡本身损耗情绪 −3 · 实到手 = 卡面报酬 × 当夜数据质量(最低 8 折;评分规则见晨间读数旁的 i)</div>
        <div class="riskBar"><i style="width:${Math.min(100,c.risk*3)}%"></i></div>`;
      card.setAttribute('aria-label',`${c.name},${c.desc.replace(/\n+/g,' ')}`);
      bindActivate(card,()=>{ AUDIO.SFX.soft(); openContract(cid); });
      cwrap.appendChild(card);
    });
    /* 急单:每周一天,池子的加急委托。锁价、不查评级、不可加签——
       钱是平时的 1.6 倍,风险也写在脸上。这是派单板唯一一张"诱惑卡"。 */
    const rush=(window.RUSH&&RUSH[G.day])||null;
    if(rush){
      const base=CONTRACTS[rush.cid];
      const p=contractPreview(rush.cid,null,rush);
      const card=h('div','cCard rush');
      card.style.setProperty('--c1','#B03A2E'); card.style.setProperty('--c2','#F2683C');
      card.innerHTML=`<div class="rushStamp">急</div><div class="cname"><span class="cicon">${cIcon(rush.cid)}</span> ${base.name} · 加急件</div>
        <div class="cdesc">${rush.desc}</div>
        <div class="chash">额定产出 ≈ ${HASH_BY_CONTRACT[rush.cid]||'—'}×10⁹ 突触秒 / 夜(加急保量)</div>
        <div class="cmeta"><span class="money">+₡${p.earn}</span><span>污染风险 ${p.risk}%</span><span>情绪 ${p.moodDelta>0?'+':''}${p.moodDelta}</span></div>
        <div class="cNote">加急件:锁价 · 不查评级 · 不可加签 · 情绪额外 −6 · 今夜有效</div>
        <div class="riskBar"><i style="width:${Math.min(100,p.risk*3)}%"></i></div>`;
      bindActivate(card,()=>{ AUDIO.SFX.soft(); openContract(rush.cid, rush); });
      cwrap.appendChild(card);
    }
    const no=mkBtn('不签,今晚裸睡','meek',()=>{ G.contract=null; toast('今晚不接单。好好睡。'); });
    cwrap.appendChild(no);
  }
  app.appendChild(cwrap);

  // ---- 生活行动 ----
  app.appendChild(h('h',`h`, G.lifeDone?'生活行动(今日已用)':'生活行动(1/1)'));
  if(!resting && !G.lifeDone && storyHits.length){
    const names=storyHits.map(lid=>LIFE_NAME(lid).split(' · ')[0]).join(' / ');
    app.appendChild(h('div','storyHint',`<b>今天有人等你</b>${names}。这一步会推着故事往前走。`));
  }
  const grid=h('div','lifeGrid');
  let lifeIds = resting ? [] : (D.life||['park','zao','clinic']).slice();
  /* 典当行一旦知道门在哪,就一直是"今天可以做的事"之一。
     原实现里它只出现在 D11 / D12 两天的 life 列表 —— 过了 D12 就再也进不去。
     于是序章刚立起来的那笔账(赎回妹妹的脸 ₡4,500)在这局游戏里根本没法还:
     目标存在、按钮存在、入口不存在。这是"只写不读"之外最糟糕的一种空洞。
     代价仍在:去了典当行,今天就做不了别的事。 */
  if(!resting && G.flags.pawnshop_open && lifeIds.indexOf('pawnshop')<0) lifeIds.push('pawnshop');
  lifeIds.forEach(lid=>{
    const a=LIFE[lid]; if(!a) return;
    if(lid==='pawnshop' && !G.flags.pawnshop_open) return;
    const cost=a.coins<0 ? -a.coins : 0;
    const short=Math.max(0, cost-G.coins);
    const card=h('div','lifeCard'+(G.lifeDone?' used':'')+(short?' unaffordable':''));
    const effect=lifeEffectText(lid,a);
    /* 「有戏」标:今天这一步会把主线往前推。不给内容提示(不剧透),只给方向。
       没有它的日子里,三个选项在玩家眼里是纯等价交易。 */
    const tag=lifeStoryTag(lid);
    card.dataset.ltype = ({ park:'recover', zao:'recover', clinic:'recover', gym:'recover', noodle:'recover', bookstore:'story', observatory:'story', radio:'story', metro:'story', tower:'work', partjob:'work', pawnshop:'story' })[lid] || 'recover';
    card.innerHTML=`<div class="ic"><span class="licon">${lIcon(lid)}</span></div><div class="nm">${a.name.replace('\n','<br>')}</div>`
      +`${tag?`<div class="lifeTag">${tag}</div>`:''}`
      +`<div class="lifeMeta">${effect}</div>${short?`<div class="lifeLock">还差 ₡${short}</div>`:''}`;
    card.title=short ? `余额不足,还差 ₡${short}` : (tag?`${effect}\n(今天这里有剧情)` : effect);
    card.setAttribute('aria-disabled', G.lifeDone||short ? 'true':'false');
    bindActivate(card,()=>{
      if(G.lifeDone) return;
      if(short){ toast(`余额不足,还差 ₡${short}。`); return; }
      doLife(lid);
    });
    grid.appendChild(card);
  });
  if(resting) grid.appendChild(h('div','panel fadeIn','<p class="t dim">空白周:今天什么都不做,也是一种治疗。</p>'));
  app.appendChild(grid);

  // ---- 睡觉 ----
  const sleepLabel=G.contract?'开始今晚的睡班':'裸睡(不接单,静养)';
  const sleepAction=()=>{ AUDIO.SFX.whoosh(); goSleep(); };
  /* 签完合同后,玩家必须再滚到页面底部才能开始睡班;手机上这层摩擦很容易让人
     以为"签完就结束了"。签后把核心动作固定在底部,未签时仍留在页尾。 */
  if(G.contract){
    const dock=h('div','sleepDock');
    dock.appendChild(mkBtn(sleepLabel,'primary',sleepAction));
    app.appendChild(dock);
    app.classList.add('hasDock');
  } else {
    app.classList.remove('hasDock');
    app.appendChild(mkBtn(sleepLabel,'primary',sleepAction));
  }

  const foot=h('div','center');
  const save=mkBtn('存档','meek',()=>openSaveSlots());
  const codexBtn=mkBtn('档案','meek',()=>showCodex());
  const home=mkBtn('回到标题','meek',()=>{ autoSave(); showTitle(); });
  foot.appendChild(save); foot.appendChild(codexBtn); foot.appendChild(home);
  app.appendChild(foot);
  app.classList.remove('falling');
  autoSave();
}

/* ================= 生活行动 ================= */
/* 生活行动此前是"盲选":卡面只有名字,诊所扣钱、公园回情绪、健身房提速都不写。
   先让每个白天行动的成本和收益可比较,再让玩家决定这一天怎么花。 */
function lifeEffectText(lid,a){
  const out=[];
  if(a.coins) out.push(a.coins>0?`+₡${a.coins}`:`−₡${-a.coins}`);
  if(a.mood) out.push(`情绪 ${a.mood>0?'+':''}${a.mood}`);
  if(a.mem) out.push(`记忆 +${a.mem}%`);
  if(lid==='tower'){
    const wk=Math.ceil(G.day/7);
    out.push(G.stars>=5?'评级已满':(G.flags.towerWeek!==wk?'评级 +1':'本周已复核 · 不再升评级'));
  }
  if(lid==='gym') out.push('今夜净化 -15% 时间');
  if(a.type==='pawn') out.push('典当 / 赎回记忆');
  if(a.type==='union') out.push('联络醒觉会');
  return out.length?out.join(' · '):'平静的一天';
}
/* 今天这个行动有没有"戏"。
   实测问题:生活行动卡只写数值,玩家看到的是一排等价交易。可其中几个
   其实挂着主线 —— D4 的面娘、D20 的便利店、典当行的柜台。这些必须写在卡面上,
   否则玩家永远不知道该往哪儿走,只能按收益挑。
   peek 用一份 flags 副本试算,不写主存档(否则看卡面就当成做过)。 */
function lifeStoryTag(lid){
  const DS=window.DAY_SCENE;
  if(!DS || !DS.get || !G) return '';
  let peek;
  try{ peek=DS.get(lid, JSON.parse(JSON.stringify(G))); }catch(e){ return ''; }
  return peek ? '有戏' : '';
}
function doLife(lid){
  const a=LIFE[lid];
  /* 余额 guard:旧实现 `G.coins += a.coins` 可在钱不够时把金币扣成负数,
     玩家从诊所/面馆出来才发现自己"透支"了一座城市的信用点。 */
  const cost=a.coins<0 ? -a.coins : 0;
  if(cost>G.coins){ toast(`余额不足,还差 ₡${cost-G.coins}。`); return; }
  const sceneMap={park:'park',zao:'zao',clinic:'clinic',bookstore:'bookstore',pawnshop:'pawn',tower:'tower',metro:'metro',partjob:'store',observatory:'observatory',gym:'gym',noodle:'noodle',radio:'home'};
  setScene(sceneMap[lid]||'home');
  /* 去一趟甜水巷最深处,要花掉今天那一次"生活"。
     原实现在这里直接 return,典当行不消耗行动次数 —— 等于白送一次额外行动。 */
  G.lifeDone=true;
  /* 记录"今天白天去了哪":夜里结算/清晨剧情要用(DATA.DAY_LEAD)。
     必须放在典当/工会分支之前——这两个分支提前 return,放在后面就会漏记,
     典当行/地铁站的日子将永远没有清晨回响和夜里的下文。 */
  G.flags.dayLead=lid;
  if(a.type==='pawn'){
    /* 典当行先播"当天的戏"(鱼骨柜台),再开柜台弹窗。
       原实现直接 openPawn,DAY_SCENE 里写给典当行的戏永远播不到(UI 层不可达)。 */
    let pre=null;
    const DS=window.DAY_SCENE;
    if(DS && DS.get){ try{ pre=DS.get('pawnshop',G); }catch(e){ pre=null; } }
    const open=()=>openPawn(()=>startDay());
    if(pre && pre.length) runPages(pre, open); else open();
    return;
  }
  if(a.type==='union'){ unionScene(); return; }
  if(lid==='zao'){ G.flags.zao=(G.flags.zao||0)+1; }
  if(lid==='tower'){
    /* 超频会可以反复参加,但评级每周只复核一次。
       旧版 D2/D4/D6 连续三次直接把星级从 2 顶到 5,评级门槛形同虚设。 */
    const wk=Math.ceil(G.day/7);
    if(G.stars<5 && G.flags.towerWeek!==wk){ G.stars=Math.min(5,G.stars+1); G.flags.towerWeek=wk; }
    G.flags.tower_visit=1;   // 词条「深眠糖」的解锁依据:道具是超频会发的,不是健身房的
    if(G.route) G.route.zhi++;
  }
  if(lid==='gym'){ G.flags.gym=1; }
  if(a.mood) G.mood=clamp(G.mood+a.mood,0,100);
  if(a.coins) G.coins+=a.coins;
  if(a.mem) G.mem=clamp(G.mem+a.mem,0,100);
  applyMood(); refreshHud();
  const pages = typeof a.pages==='function' ? a.pages(G) : (a.pages||['(什么也没发生。)']);
  /* 当天的戏(DATA.DAY_SCENE)插在通用描写之后、LIFE_EXTRA 的"经济底注"之前。
     通用描写讲的是这个地点,DAY_SCENE 讲的是今天这个地点为什么不同。
     取不到(或今天没有戏)就原样播放,不改变既有任何一条。 */
  let seq=pages;
  const DS=window.DAY_SCENE;
  if(DS && DS.get){
    let scene=null;
    try{ scene=DS.get(lid,G); }catch(e){ scene=null; }
    if(scene && scene.length){
      /* LIFE_EXTRA 是 data_world.js 追加在末尾的一拍,字数固定为本行动 +1 页。
         这里插在倒数第 1 页之前,保证"经济底注"仍然是最后收尾的那一拍。 */
      const extra=(window.LIFE_EXTRA&&window.LIFE_EXTRA[lid])?window.LIFE_EXTRA[lid].length:0;
      const at=Math.max(0, pages.length-extra);
      seq=pages.slice(0,at).concat(scene, pages.slice(at));
    }
  }
  runPages(seq, ()=>startDay());
}

function unionScene(){
  G.lifeDone=true;
  setScene('metro');
  let pages;
  if(G.flags.union_helped){
    pages = G.day>=26
      ? ['据点比往常安静。守望者把一枚旧按钮放在你手心。\n\n"如果到了最后那天,"她说,"它还在等一个主人。"']
      : ['据点里,守望者正在给新来的失眠者讲课。\n\n"他们管记忆损耗叫磨损,管神经报废叫折旧。"她看见你,停了停,"你们管超频叫福报。\n\n管做梦,叫出算力。"'];
    G.mood=clamp(G.mood+3,0,100);
  } else if(G.flags.T4){
    pages=['地铁站台空无一人。\n\n墙上有人用粉笔写:"你睡着的 8 小时,去了哪里?"\n\n你站了一会儿,没有找到守望者。\n\n也许,她也在躲 017 号。'];
  } else {
    pages=['地铁站台空无一人。\n\n风从隧道深处吹出来,带着旧报纸的味道。\n\n墙上有人用粉笔写了一行字:\n\n"你睡着的 8 小时,去了哪里?"'];
    G.mood=clamp(G.mood+1,0,100);
  }
  applyMood();
  const uext=(window.LIFE_EXTRA&&LIFE_EXTRA.metro)||null;
  if(uext) pages=pages.concat(uext);
  runPages(pages, ()=>startDay());
}

/* ================= 典当行 ================= */
function openPawn(done){
  const modal=h('div','modal');
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
  const paper=h('div','paper');
  paper.innerHTML=`<header>鱼骨典当行 <small>只收不问 · 余额 <b class="pawnCoins">₡${G.coins}</b></small></header><div class="body"></div>`;
  const body=paper.querySelector('.body');
  /* 幂等守卫:典当/赎回成功后本弹窗会在 700ms 后自动重开(刷新状态),
     期间按钮仍在 DOM 里且可点。若不加锁,连点/双击同一枚按钮会重复结算
     (同一段记忆被典当两次、金币重复到账),并把 openPawn 排队两次 → 弹窗堆叠。
     closed 则用于"玩家已点离开"后禁止延时重开。 */
  let busy=false, closed=false;
  body.appendChild(h('p','t','"记忆,按私密度计价。"鱼骨敲了敲柜台,"越痛的,越值钱。"'));
  MEMORIES.forEach(m=>{
    const st=G.mems[m.id];
    const row=h('div','panel');
    row.style.marginTop='10px';
    let html=`<p class="t" style="margin:0"><b>${m.name}</b> <span class="dim" style="color:#9A8C74;font-size:12px">${m.line}</span></p>`;
    if(st==='full'){
      html+=`<div style="text-align:right;margin-top:6px"><button class="btn primary" style="display:inline-block;width:auto;padding:8px 16px;font-size:14px" data-pawn="${m.id}">典当 +₡${m.price}</button></div>`;
    } else if(st==='pawned'){
      const cost=m.price*3;
      const short=Math.max(0,cost-G.coins);
      html+=`<p class="t dim" style="font-size:12px;margin:4px 0 0">已典当。</p>
      <div style="text-align:right;margin-top:2px"><button class="btn meek${short?' cant':''}" data-redeem="${m.id}" style="margin-top:4px"${short?' disabled aria-disabled="true"':''}>赎回(₡${cost}${short?` · 差 ₡${short}`:''})</button></div>`;
    } else {
      html+=`<p class="t dim" style="font-size:12px;margin:4px 0 0;color:#B03A2E">污染中——去云背把它净化,才能带回来。</p>`;
    }
    row.innerHTML=html;
    body.appendChild(row);
  });
  body.appendChild(h('p','t dim','(典当会永久改变你与这个世界的对话方式。)'));
  const pext=(window.LIFE_EXTRA&&LIFE_EXTRA.pawnshop)||null;
  if(pext) body.appendChild(h('p','t dim',pext[0]));
  const close=mkBtn('离开典当行','meek',()=>{ if(closed) return; closed=true; modal.remove(); done&&done(); });
  const foot=h('div','center'); foot.appendChild(close); body.appendChild(foot);

  body.addEventListener('click',e=>{
    if(busy) return;
    const p=e.target.closest('[data-pawn]'); const r=e.target.closest('[data-redeem]');
    if(p){
      const m=MEMORIES.find(x=>x.id===p.dataset.pawn);
      if(!m || G.mems[m.id]!=='full') return;   // 状态守卫:已典当/污染中的记忆不可再典当
      busy=true;
      G.mems[m.id]='pawned';
      G.coins+=m.price; G.mem=clamp(G.mem-4,0,100); G.mood=clamp(G.mood+8,0,100);
      G.flags.pawn_count=(G.flags.pawn_count||0)+1;
      AUDIO.SFX.coin(); applyMood(); refreshHud();
      const pc=modal.querySelector('.pawnCoins'); if(pc) pc.textContent='₡'+G.coins;
      rowFlash(p.closest('.panel'));
      toast(`「${m.name}」被抽走了。世界亮了一点,也空了一点。`);
      setTimeout(()=>{ if(closed) return; modal.remove(); openPawn(done); }, 700);
    }
    if(r){
      const m=MEMORIES.find(x=>x.id===r.dataset.redeem);
      if(!m || G.mems[m.id]!=='pawned') return;   // 状态守卫:未典当的记忆不可赎回
      const cost=m.price*3;
      if(G.coins<cost){ toast('钱不够。鱼骨耸耸肩:"赎回,从来比典当贵。"'); return; }
      busy=true;
      G.coins-=cost; G.mems[m.id]='full'; G.mem=clamp(G.mem+4,0,100); G.mood=clamp(G.mood-2,0,100);
      G.flags.redeem_count=(G.flags.redeem_count||0)+1;
      AUDIO.SFX.chime(); applyMood(); refreshHud();
      const pc=modal.querySelector('.pawnCoins'); if(pc) pc.textContent='₡'+G.coins;
      toast(`「${m.name}」回来了。`);
      setTimeout(()=>{ if(closed) return; modal.remove(); openPawn(done); }, 700);
    }
  });

  app.appendChild(modal);
  modal.appendChild(paper);
  function rowFlash(row){
    if(!row) return;
    row.style.transition='filter .6s, transform 1.2s, opacity 1.2s';
    requestAnimationFrame(()=>{ row.style.filter='brightness(2) blur(2px)'; row.style.transform='translateY(-14px)'; row.style.opacity='0'; });
  }
}

/* ================= 合同签署(仪式) ================= */
function openContract(cid, rush){
  const c=CONTRACTS[cid];
  const modal=h('div','modal');
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
  const paper=h('div','paper');
  const weekNow=Math.min(3,Math.max(1,Math.ceil(G.day/7)));
  const tk=(window.getMontage&&getMontage(cid,weekNow))?getMontage(cid,weekNow).ticket:'工单 #?-3409';
  paper.innerHTML=`
    <header>共惠计划 · 睡班合同 <small>${tk}</small></header>
    <div class="body">
      <p class="t" style="margin:0 0 8px"><b>${cIcon(cid)} ${c.name}</b> — ${c.desc}</p>
      <p class="contractPreview" style="margin:0"></p>
      <h5>条款(节选)</h5>
      <p>一、供体自愿出租睡眠时段大脑算力,用途包括但不限于:蛋白质折叠、气候模拟、及其他。</p>
      <p>二、睡班时段:22:40 至自然醒。供体应保持情绪稳定,以保证数据质量。</p>
      <p>三、乙方(供体)梦境产出内容之相关权利,归甲方所有。</p>
      <p>四、本合同未尽事宜,以甲方解释为准。</p>
      <div class="clause14"><b>十四、</b>睡眠时段产生的记忆损耗属于正常神经磨损,相关补偿由系统<b>自动签收</b>,无需供体再次确认。<br>
        <label><input type="checkbox" checked disabled> 我已阅读并同意(已为您自动勾选)</label></div>
    </div>
    <footer>
      <div class="affixRow"></div>
      <div class="signArea">请 在 此 签 名</div>
      <div class="signRow"><div class="signChip">林晚</div></div>
      <div class="tip">点击或拖动名牌完成签名 · 附加条款可不选 · 建议下滑阅读全部条款</div>
    </footer>`;
  if(rush){
    const hs = paper.querySelector('header small');
    if(hs) hs.textContent = '加急件 · 锁价 · 不查评级';
    const tp = paper.querySelector('.tip');
    if(tp) tp.textContent = '加急件无附加条款 · 点击或拖动名牌完成签名';
  }
  modal.appendChild(paper); app.appendChild(modal);

  // 附加条款:随机两个,可选一个
  const affixRow=paper.querySelector('.affixRow');
  const affixIds=Object.keys(AFFIXES).sort(()=>Math.random()-.5).slice(0,2);
  let picked=null;
  /* 加急件不设附加条款:没有公司会给急件买保险。 */
  if(rush) affixRow.style.display='none';
  /* 签约页预览必须随加签实时更新:旧版固定写基础合同数值,
     玩家勾了"深潜强超频"后仍以为只拿 ₡120、只 -2 情绪。 */
  const previewEl=paper.querySelector('.contractPreview');
  const renderPreview=()=>{
    const p=contractPreview(cid,picked,rush);
    previewEl.innerHTML=`报酬:<b>${contractMoney(p)}</b>/夜 · 污染风险 <b>${p.risk}%</b> · 情绪影响 <b>${p.moodDelta>0?'+':''}${p.moodDelta}</b>${p.memCost?` · 记忆 -${p.memCost}%`:''}<br><span class="previewNote">入睡本身损耗情绪 −3 · 实到手 = 上面的报酬 × 当夜数据质量(池子管情绪叫「散热」,管记忆损耗叫「折旧」,最低打 8 折)</span>`;
  };
  renderPreview();
  affixIds.forEach(aid=>{
    const a=AFFIXES[aid];
    const btn=h('button','affix',`<b>加签 · ${a.name}</b>${a.desc}`);
    btn.addEventListener('click',()=>{
      AUDIO.SFX.soft();
      if(picked===aid){ picked=null; btn.classList.remove('picked'); renderPreview(); return; }
      picked=aid;
      affixRow.querySelectorAll('.affix').forEach(x=>x.classList.remove('picked'));
      btn.classList.add('picked');
      renderPreview();
    });
    affixRow.appendChild(btn);
  });
  G.affix=null;

  const close=mkBtn('先不签了','meek',()=>{ G.affix=null; G.contract=null; modal.remove(); startDay(); });
  const foot2=h('div','center'); foot2.appendChild(close); paper.querySelector('footer').appendChild(foot2);

  const area=paper.querySelector('.signArea');
  const chip=paper.querySelector('.signChip');
  let dragging=false, movedFar=false, off={x:0,y:0}, signedDone=false, downX=0, downY=0;

  // 名牌位置 = 视口坐标 (vx,vy),换算到名牌实际定位容器(offsetParent = .signRow)
  const placeChip=(vx,vy)=>{
    const ob = chip.offsetParent ? chip.offsetParent.getBoundingClientRect() : modal.getBoundingClientRect();
    chip.style.position='absolute';
    chip.style.left=(vx-ob.left)+'px';
    chip.style.top=(vy-ob.top)+'px';
    chip.style.transform='none';
    chip.style.zIndex=60;
  };
  const homePos=()=>{ chip.style.position='absolute'; chip.style.left='50%'; chip.style.top='7px'; chip.style.transform='translateX(-50%)'; chip.style.zIndex=5; };
  requestAnimationFrame(homePos);

  const insideArea=()=>{
    const ar=area.getBoundingClientRect(), cr=chip.getBoundingClientRect();
    return cr.left<ar.right-8 && cr.right>ar.left+8 && cr.top<ar.bottom-8 && cr.bottom>ar.top+8;
  };
  const doSign=()=>{
    if(signedDone) return; signedDone=true;
    area.classList.add('signed');
    area.textContent='林 晚';
    chip.style.display='none';
    AUDIO.SFX.sign();
    vib(40);
    paper.style.animation='paperThud .3s ease';
    G.contract=cid; G.affix=picked;
    if(rush) G.flags.rush=1;
    autoSave();   // 签约即存:跳转 startDay 前的 550ms 也算安全区
    setTimeout(()=>{ modal.remove(); startDay(); }, 550);
  };
  // 点击名牌/签名区 → 名牌飞入签名区(拖拽失败也能签)
  const signByFlight=()=>{
    if(signedDone||dragging) return;
    const cr=chip.getBoundingClientRect();
    const ar=area.getBoundingClientRect();
    placeChip(cr.left, cr.top);
    chip.style.transition='left .5s cubic-bezier(.35,.7,.25,1), top .5s cubic-bezier(.5,-.35,.65,.5), transform .5s';
    requestAnimationFrame(()=>{
      placeChip(ar.left+ar.width/2-cr.width/2, ar.top+ar.height/2-cr.height/2);
      chip.style.transform='scale(1.18)';
    });
    setTimeout(()=>{ chip.style.transition=''; doSign(); }, 520);
  };
  chip.addEventListener('click',()=>{ if(!movedFar) signByFlight(); });
  /* 签名是核心门槛,不能只对鼠标/触屏开放。Enter/Space 与点击同路径,由 signedDone 保证只结算一次。 */
  chip.tabIndex=0;
  chip.setAttribute('role','button');
  chip.setAttribute('aria-label','名牌:林晚。拖动到签名区,或按 Enter 自动签名。');
  chip.addEventListener('keydown',e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    e.preventDefault();
    if(!e.repeat) signByFlight();
  });
  area.addEventListener('click',()=>signByFlight());

  chip.addEventListener('pointerdown',e=>{
    if(signedDone) return;
    dragging=true; movedFar=false;
    downX=e.clientX; downY=e.clientY;
    try{ chip.setPointerCapture(e.pointerId); }catch(err){}
    const cr=chip.getBoundingClientRect();
    off.x=e.clientX-cr.left; off.y=e.clientY-cr.top;
    chip.style.transition='none';
    placeChip(cr.left, cr.top);
  });
  chip.addEventListener('pointermove',e=>{
    if(!dragging) return;
    if(Math.abs(e.clientX-downX)>8 || Math.abs(e.clientY-downY)>8) movedFar=true;
    placeChip(e.clientX-off.x, e.clientY-off.y);
    area.classList.toggle('hovered', insideArea());
  });
  const endDrag=()=>{
    if(!dragging) return; dragging=false;
    const inside=insideArea();
    area.classList.remove('hovered');
    if(inside){ doSign(); }
    else { requestAnimationFrame(homePos); setTimeout(()=>{ movedFar=false; }, 50); }
  };
  chip.addEventListener('pointerup',endDrag);
  chip.addEventListener('pointercancel',endDrag);
}

/* ================= 序章(冷开场) ================= */
function showPrologue(done){
  FX.setMode('night','core');
  const el=h('div','twist');
  el.innerHTML=`<div class="tt gl-text" data-t="序 章">序 章</div><div class="tl"></div><button class="go">继 续</button>`;
  document.body.appendChild(el);
  const lines=[
    '2087 年。\n\n人类不再为了工作而睡觉——\n\n而是为了睡觉,而活着。',
    '"大闲置"拿走了九成职业那年,所有人都以为机器接得住。\n\n接了二十年,撞了三堵墙:电不够;算不出"懂";造不出"没见过"。',
    '于是他们回来找你的大脑。\n\n它是最后一种可再生算力:不用电,只吃饭;不用造,自己长;睡一觉就自动充满。\n\n供体舱里,它有个更短的名字——矿场。',
    '账是这样的:\n\n全民基座每周给你 ₡200。体面舱的租金,每周 ₡600。\n\n中间那 ₡400 的缺口,是这份合同最基础的理由。\n\n机架维护另计:每周 ₡300。\n\n合同里不写这一条——因为它是"耗材"的账。',
    /* 真正驱动这三十天的是第二笔账。此前序章只讲了"活下去",
       而游戏里唯一一开始就欠着的东西(妹妹的脸,开局即已典当)从未被提过 ——
       玩家不知道自己为什么要点那个"赎回"按钮。
       顺带把算术摆平:30 夜 × ₡120 = ₡3,600 < ₡4,500。
       也就是说,**老老实实干活永远赎不回她**——这个不等式就是整个游戏。 */
    '还有一笔账,压在第一页最下面:\n\n你妹妹的脸,三年前典当了 ₡1,500。\n\n赎回价是三倍:₡4,500。\n\n按最稳的活儿一夜 ₡120 算,是 37 个夜晚。\n\n而试用期,只有 30 天。',
    '至于他们要从你身上挖什么——\n\n合同第一页写的是"蛋白质折叠、气候模拟、及其他"。\n\n"及其他"这三个字,值 ₡400 一周。',
    '白天,你是自由的。晚上,你的大脑在替城市出算力。\n\n明码标价,自愿签署,童叟无欺。',
    '——《神经共惠计划》\n\n试用期:30 天。\n\n今日,生效。'
  ];
  const tl=el.querySelector('.tl'), go=el.querySelector('.go');
  let i=0, typing=null, full='';
  /* 幂等守卫:同 showTwist。否则淡出期间点一下覆盖层,finish() 会再排一次 setTimeout,
     使 done() 被调用两次(序章会因此连开两次 showMorning)。 */
  let finished=false;
  function show(line){
    full=line; tl.textContent=''; let k=0;
    clearInterval(typing);
    typing=setInterval(()=>{ k+=2; tl.textContent=full.slice(0,k); if(k>=full.length){clearTimeout(typing); typing=null;} },28);
  }
  function advance(){
    if(finished) return;
    if(typing){ clearTimeout(typing); typing=null; tl.textContent=full; return; }
    i++;
    if(i<lines.length){ show(lines[i]); } else finish();
  }
  function finish(){
    if(finished) return;
    finished=true;
    go.remove();
    el.style.transition='opacity 1s'; el.style.opacity='0';
    setTimeout(()=>{ el.remove(); done&&done(); }, 1000);
  }
  go.addEventListener('click',e=>{ e.stopPropagation(); AUDIO.SFX.click(); advance(); });
  el.addEventListener('click',advance);
  show(lines[0]);
}

/* ================= 档案(信息图鉴) ================= */
function showCodex(){
  const ov=h('div','modal');
  ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true');
  const box=h('div','codexBox');
  ov.appendChild(box); app.appendChild(ov);
  const GUESSES={
    zao:   { name:'阿枣', icon:'🥤', when:()=>true, desc:'邻居,"清醒者"。拒绝签署计划的人,记得每个失眠者的名字。' },
    he:    { name:'何主管', icon:'🏢', when:()=>G.day>=2, desc:'梦巢云算主管。真诚地相信自己在做善事——这比恶意更难反驳。' },
    yu:    { name:'鱼骨', icon:'🐟', when:()=>!!(G.flags.pawnshop_open||G.flags.knows_pawn), desc:'典当行主人。只收不问。全城记忆的中转站。' },
    watch: { name:'守望者', icon:'🧣', when:()=>!!(G.flags.union_helped||G.flags.T4), desc:'醒觉会联络人,017 之前的金牌供体。左边鬓角有一块疤。' },
    mian:  { name:'陈面娘', icon:'🍜', when:()=>G.day>=4, desc:'无招牌面馆的老板娘。她的儿子"在云上"。' },
    j17:   { name:'017 号', icon:'🪖', when:()=>!!(G.flags.j17||G.flags.T4), desc:'清醒在岗的金牌供体,大清算审计者。不能睡觉的人。' },
    sis:   { name:'"妹妹"', icon:'🕯️', when:()=>!!G.flags.T5, desc:'档案说:情感锚点,来源:捐赠。你的眼泪说:她存在过。' },
    r3409: { name:'3409 号', icon:'🌙', when:()=>!!G.flags.met_3409, desc:'第 7 供体舱的"库存"。真正的失主。和她相比,你只是替她保管了三年。' },
    xm:    { name:'小满', icon:'✨', when:()=>(G.flags.xm||0)>=1, desc:'编号 0000,模型测试体。两千一百一十七个名字的容器,正在学做一个人。' },
    archon:{ name:'枢机', icon:'🗄️', when:()=>!!G.flags.T8, desc:'第一代矿机的聚合意识。跑了九十九年还没报废,现在是全城算力的调度台。' },
    wen:  { name:'温先生', icon:'🥂', when:()=>!!G.flags.patron_met, desc:'睡眠收藏家,清醒区的常客。"你们叫它睡班——我们叫它,订阅。"' }
  };
  const TWISTS_LOG=[
    {t:'第 14 条 · 自动签收', ok:()=>G.seen.includes('T1')},
    {t:'去向 · 算力看板', ok:()=>!!G.flags.danmaku},
    {t:'买家编号 · 互相消费', ok:()=>!!G.flags.T3},
    {t:'审计者的脸 · 收编', ok:()=>!!G.flags.T4},
    {t:'妹妹 · 三重真相', ok:()=>!!G.flags.T5},
    {t:'试用期 · 收割仪式', ok:()=>!!G.flags.T6},
    {t:'天空裂缝 · 穹顶', ok:()=>!!G.flags.cracked},
    {t:'第一代 · 枢机真身', ok:()=>!!G.flags.T8},
    {t:'对账 · 23:47', ok:()=>!!G.flags.T9},
    {t:'017 的抗眠素', ok:()=>!!G.flags.j17},
    {t:'小满的越狱令', ok:()=>(G.flags.xm||0)>=1},
    {t:'3409 的守护', ok:()=>!!G.flags.T12},
    {t:'穹顶之外是海', ok:()=>!!G.flags.sea13},
    {t:'估值 · 转正定价', ok:()=>!!G.flags.T14}
  ];
  const GLOSSARY=[
    ['供体','签署神经共惠计划、出租睡眠时段大脑算力的人。宣传语叫他们"共惠者"。',()=>true],
    ['睡班','22:40 至自然醒的接入时段。你一夜里,被开采的那一整段。',()=>true],
    ['情绪','数值即画面。它决定你看见的世界有多暖,也决定今晚的分成打几折。池子管它叫「散热」。',()=>true],
    ['云背','梦境空间。云的背面。白天你在云上,睡班你坠入云背。',()=>G.day>=3],
    ['大清算','每周日的强制审计。顺便告诉你:这周你失去了百分之几的自己。',()=>G.day>=7],
    ['第 14 条','记忆损耗补偿,由系统自动签收,无需再次确认。',()=>!!G.flags.T1],
    ['梦境频道','全市热播的治愈节目。渲染它的算力与情绪样本,采购自你。',()=>!!G.flags.danmaku],
    ['记忆典当','越痛的记忆越值钱。赎回,从来比典当贵。',()=>!!G.flags.pawnshop_open],
    ['样本供体','报酬三倍,专人陪护,自愿参加。',()=>!!G.flags.feed_path],
    ['情感锚点','植入给你的牵挂。有牵挂的人梦更甜——梦更甜,数据更好。',()=>!!G.flags.T5],
    ['试用期','一份三十天的合同。第 11 条:异议通道,自 2081 年起维护中。',()=>!!G.flags.T6],
    ['穹顶裂缝','城市正中央那道谁也不谈论的细缝。',()=>!!G.flags.cracked],
    ['第 7 供体舱','住着的不是供体,是库存。',()=>!!(G.flags.clue_pawn||G.flags.T8)],
    ['抗眠素','每小时一支,连用三十七年。有人把"休息"也卖掉了。',()=>!!G.flags.j17],
    ['人格模型','由数百万供体大脑微调而成。乌托邦的真正货源。',()=>!!(G.flags.T8||(G.flags.xm||0)>=1)],
    ['海','穹顶之外。沉没的城市上方,人类为自己点的最后一片灯。',()=>!!G.flags.sea13],
    ['突触秒','人脑算力的计量单位。你的睡班按突触秒计价:普通单约 1×10⁹ / 夜,高负载单可达 3.4×10⁹。',()=>G.day>=5],
    ['梦税','梦境内容授权税。你做的梦被再利用时,你向系统支付"内容上架费"。',()=>G.day>=8],
    ['清醒区','天际线之上,不用睡班的人住的楼层。他们购买你的算力产出,全程清醒。',()=>!!G.flags.patron_met],
    ['授权费','情感锚点授权费,每周五十。你为植入的记忆付房租。',()=>!!G.flags.fee_seen],
    ['晚霞','渲染农场最贵的品类。客户要求"像回忆里那样"。回忆是谁的回忆,系统没说。',()=>!!G.flags.render_done]
  ];
  function render(tab){
    box.innerHTML='';
    box.appendChild(h('div','codexHead','档 案'));
    const tabsRow=h('div','codexTabs');
    [['who','人物'],['truth','真相'],['mem','记忆'],['gloss','词条'],['world','世界']].forEach(([k,label])=>{
      const b=h('button','codexTab'+(tab===k?' on':''),label);
      b.addEventListener('click',()=>{ AUDIO.SFX.soft(); render(k); });
      tabsRow.appendChild(b);
    });
    box.appendChild(tabsRow);
    const body=h('div','codexBody');
    if(tab==='who'){
      Object.entries(GUESSES).forEach(([id,c])=>{
        const un=c.when();
        body.appendChild(h('div','panel codexRow'+(un?'':' locked'),
          un? `<div class="cn"><span class="codexFace" style="background:${((window.CHARACTERS&&window.CHARACTERS[id])||{}).tone||'#38F2D8'}55">${(window.PORTRAITS&&window.PORTRAITS[id])||c.icon}</span> ${c.name}</div><div class="cd">${c.desc}</div>`
             : `<div class="cn">? ? ?</div><div class="cd dim">尚未相遇。</div>`));
      });
    } else if(tab==='truth'){
      const r=G.route||{ren:0,zhen:0,zhi:0};
      const vals=[r.ren,r.zhen,r.zhi];
      const barsHtml=['人性','真相','体制'].map((n,i)=>`<div class="rb"><span>${n}</span><div class="bar"><i style="width:${Math.min(100,vals[i]*20)}%"></i></div><b>${vals[i]}</b></div>`).join('');
      const routePanel=h('div','panel','<div class="cn">路线三轴</div>');
      routePanel.appendChild(h('div','routeBars',barsHtml));
      body.appendChild(routePanel);
      TWISTS_LOG.forEach(t=>{
        const un=t.ok();
        body.appendChild(h('div','panel codexRow'+(un?'':' locked'),
          un? `<div class="cn">◆ ${t.t}</div>` : `<div class="cn">? ? ?</div>`));
      });
    } else if(tab==='mem'){
      MEMORIES.forEach(m=>{
        const st=G.mems[m.id]||'full';
        const mark = st==='full'
          ?'<span style="color:#3BA55D">●</span> 完整'
          :(st==='pawned'?'<span style="color:#C9A24B">○</span> 已典当':'<span style="color:#B03A2E">▲</span> 污染中');
        body.appendChild(h('div','panel codexRow',
          `<div class="cn">${mark} ${m.name}</div><div class="cd ${st==='tainted'?'dim':''}">${st==='tainted'?'记忆缺失。它在云背里,等着你。':m.line}</div>`));
      });
    } else if(tab==='gloss'){
      GLOSSARY.forEach(([term,desc,ok])=>{
        const un=ok();
        body.appendChild(h('div','panel codexRow'+(un?'':' locked'),
          un? `<div class="cn">${term}</div><div class="cd">${desc}</div>` : `<div class="cn">? ? ?</div><div class="cd dim">尚未知晓。</div>`));
      });
      (window.GLOSSARY_EXT||[]).forEach(([term,desc,ok])=>{
        const un=ok();
        body.appendChild(h('div','panel codexRow'+(un?'':' locked'),
          un? `<div class="cn">${term}</div><div class="cd">${desc}</div>` : `<div class="cn">? ? ?</div><div class="cd dim">尚未知晓。</div>`));
      });
    } else if(tab==='world'){
      const W=window.WORLD, P=window.PRICES;
      if(W){
        const lp=h('div','panel','<div class="cn">常暖市 · 垂直结构</div>');
        lp.appendChild(h('div','waLi dim2','从海到云背,每一层都靠下一层供能。你在倒数第三层。'));
        W.layers.forEach(([n,d])=>lp.appendChild(h('div','waLi','<b>'+n+'</b> — '+d)));
        body.appendChild(lp);

        /* 年表:把序章、017 的抗眠素、枢机的“一百年”和 2081 法案放在同一条轴上。 */
        if(W.timeline && W.timeline.length){
          const tp=h('div','panel','<div class="cn">年表 · 从大闲置到你的试用期</div>');
          tp.appendChild(h('div','waLi dim2', `${W.era}　·　${W.law}`));
          W.timeline.forEach(([y,d])=>tp.appendChild(h('div','waLi','<b>'+y+'</b> — '+d)));
          body.appendChild(tp);
        }

        /* 世界观地基:为什么 2087 年还在用人脑。
           没有这一段,上面所有内容都只是"低薪远程办公",而不是"生物矿场"。 */
        if(W.whyHuman){
          const wh=W.whyHuman, md=s=>String(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
          const wp=h('div','panel','<div class="cn">为什么是你们,而不是机房</div>');
          wp.appendChild(h('div','waLi dim2', md(wh.head)));
          (wh.walls||[]).forEach(([n,d])=>wp.appendChild(h('div','waLi','<b>'+n+'</b> — '+md(d))));
          String(wh.conclusion||'').split('\n').forEach(t=>{
            if(t.trim()) wp.appendChild(h('div','waLi', md(t)));
          });
          body.appendChild(wp);
        }

        const cp=h('div','panel','<div class="cn">算力计价 · 单位:'+W.compute.unit+'</div>');
        cp.appendChild(h('div','waLi',W.compute.note));
        W.compute.graded.forEach(([n,d])=>cp.appendChild(h('div','waLi','<b>'+n+'</b> — '+d)));
        W.compute.charges.forEach(([n,d])=>cp.appendChild(h('div','waLi','<b>'+n+'</b> — '+d)));
        body.appendChild(cp);

        /* 你的账:把"你 ₡120,剩下的归池子"这句台词,变成玩家自己的数字。
           放在计价面板正下方——先告诉他牌价,再告诉他他拿到了几成。 */
        if(G){
          const lg=lifetimeLedger();
          const mp=h('div','panel','<div class="cn">你的账</div>');
          mp.appendChild(h('div','waLi dim2','公开牌价 ₡'+HASH_PRICE+' / 1×10⁹ 突触秒。分成比例写在合同第 9 页,字很小。'));
          if(lg.market>0){
            mp.appendChild(h('div','waLi','已出工 <b>'+(G.nightsWorked||0)+'</b> 夜 · 累计产出 <b>'+hashText(lg.hash)+'</b>'));
            mp.appendChild(h('div','waLi','按牌价折 <b>₡'+lg.market.toLocaleString()+'</b>　你到手 <b>₡'+lg.earn.toLocaleString()+'</b>'));
            mp.appendChild(h('div','waLi cut2','池子留下 <b>₡'+lg.kept.toLocaleString()+'</b>　抽成 <b>'+lg.rate+'%</b>'));
            if(lg.cut>0) mp.appendChild(h('div','waLi','其中因数据降级另扣 <b>₡'+lg.cut.toLocaleString()+'</b>(散热 / 折旧)'));
          } else {
            mp.appendChild(h('div','waLi','你还没有出过工。池子的账上,你暂时是一个零。'));
          }
          body.appendChild(mp);
        }

        const ap=h('div','panel','<div class="cn">他们从你身上拿走什么</div>');
        W.actors.forEach(([n,d])=>ap.appendChild(h('div','waLi','<b>'+n+'</b> — '+d)));
        body.appendChild(ap);

        /* 矿场行话:官方文件写"供体",供体舱里说这两个字 */
        if(W.slang && W.slang.length){
          const sp=h('div','panel','<div class="cn">矿场行话</div>');
          sp.appendChild(h('div','waLi dim2','合同上叫"供体"。供体舱里,叫别的。'));
          W.slang.forEach(([n,d])=>sp.appendChild(h('div','waLi','<b>'+n+'</b> — '+d)));
          body.appendChild(sp);
        }
      }
      if(P){
        const pe=h('div','panel','<div class="cn">你挣的</div>');
        P.earn.forEach(([n,v])=>pe.appendChild(h('div','priceRow','<span>'+n+'</span><b>₡'+v+'</b>')));
        body.appendChild(pe);

        const pc=h('div','panel','<div class="cn">你要付的</div>');
        P.cost.forEach(([n,v])=>pc.appendChild(h('div','priceRow','<span>'+n+'</span><b>'+(typeof v==='number'?'₡'+v:v)+'</b>')));
        body.appendChild(pc);

        const pu=h('div','panel up','<div class="cn">楼上花的</div>');
        P.upper.forEach(([n,v])=>pu.appendChild(h('div','priceRow','<span>'+n+'</span><b>₡'+v+'</b>')));
        P.ratios.forEach(r=>pu.appendChild(h('div','waLi','· '+r)));
        body.appendChild(pu);
      }
      (window.DOCS||[]).forEach(d=>{
        const p=h('div','panel','<div class="cn">'+d.title+'</div>');
        d.body.forEach(l=>p.appendChild(h('div','waLi docLine', l||'&nbsp;')));
        body.appendChild(p);
      });
    }
    box.appendChild(body);
    const close=mkBtn('合上档案','meek',()=>ov.remove());
    const c=h('div','center'); c.appendChild(close); box.appendChild(c);
  }
  render('who');
}

/* ================= 夜晚 ================= */
/* 夜晚流程重入锁:连点"开始今晚的睡班"曾会并行开启多个夜晚流程,
   每个流程各自调用 nextDay(),把 G.day 推进多次,导致在途的剧情序列
   与当前天数错位(典型症状:D7 的清算序列在 D8 才被消费 → 崩溃)。 */
let nightLock=false;
function goSleep(){
  if(nightLock) return;
  nightLock=true;
  app.classList.remove('hasDock');
  const D=DAYS[G.day]||{};
  vib(70);
  app.classList.add('falling');
  FX.fall();
  setTimeout(()=>{
    if(!nightLock) return;               // 期间已被推进(例如读档/回标题)
    app.innerHTML=''; app.classList.remove('falling');
    if(D.night && D.night.forced){
      // 强制剧情夜同样要结算今晚签下的合同,否则这些天等于白干一夜
      let cons=null;
      if(G.contract){
        G.pendingSettle=applyContractEconomy();
        cons=(window.consumerPage&&consumerPage(G.contract, G.pendingSettle.week))||null;
      }
      const dive=()=>startDream(D.night.forced);
      if(cons) runPages([cons], dive); else dive();
      return;
    }
    if(G.contract) settleContract();
    else quietNight();
  }, 1050);
}

/* 今夜算力产出(突触秒)。
   这个世界的计量单位不是工时,是突触秒 —— 所以每夜结算必须先报"产出多少",
   再报"分成多少",顺序不能反(反了就又变成"领工资",而不是"矿池结算")。
   各合同档位与 data_work.js / data_world.js 工单里的口径一致:
   标注 0.91 / 渲染 1.40 / 共作 1.90 / 折叠 2.30 / 金融 2.90 / 私有池 3.40(×10⁹)。 */
const HASH_BY_CONTRACT={biaozhu:0.91,render:1.40,art:1.90,mole:2.30,finance:2.90,black:3.40};
/* 原始数值与格式化分开:结算单上显示的数字必须和累计进 totalHash 的是同一个,
   否则会出现"结算单写 0.91×10⁹,累计却按另一次随机数算"的错位。 */
function tonightHashRaw(cid){
  const base=HASH_BY_CONTRACT[cid];
  if(!base) return 0;
  return base*(0.94+Math.random()*0.12);
}
function tonightHash(cid){
  const v=tonightHashRaw(cid);
  return v ? v.toFixed(2)+'×10⁹' : null;
}
/* 数据质量 = 散热 × 折旧。
   世界观反复承诺了两件事:①"太烫的数据不干净,所以他们奖励你不难过";
   ②"神经磨损是折旧,合同第 14 条自动签收"。但此前两者**都不参与结算** ——
   一台折旧到 30% 的矿机,产出和刚出厂的一模一样,承诺落空。
   这里把它们接进来。**硬性封顶 0.8**:避免"难受 → 少赚 → 更没力气恢复"的死亡螺旋。
   调参就在这两个阈值里;要关掉,把 cool / wear 的取值都改成 1 即可。 */
function nightQuality(){
  if(!G) return { factor:1, grade:'优', why:[] };
  const cool = G.mood>=60 ? 1 : (G.mood>=40 ? 0.95 : 0.85);   // 散热 = 情绪稳定度
  const wear = G.mem >=80 ? 1 : (G.mem >=50 ? 0.95 : 0.90);   // 折旧 = 神经磨损
  const factor = Math.max(0.8, cool*wear);
  const why=[]; if(cool<1) why.push('散热不足'); if(wear<1) why.push('折旧超标');
  const grade = factor>=1 ? '优' : (factor>=0.9 ? '良' : '降级');
  return { factor, cool, wear, grade, why };
}
function settleLine(earn, af, cid, q, gross, hs){
  if(hs===undefined) hs=tonightHash(cid);
  const cut=(gross!=null && gross>earn) ? (gross-earn) : 0;
  const grade=q ? q.grade : '优';
  /* 降级必须写人话:为什么降、少拿了多少。玩家每天读得最细的就是这一行——
     因果链完整,制度才"可信得可怕";因果链含糊,压迫就只是背景音。 */
  const whyMap={ '散热不足':'你带着情绪入睡', '折旧超标':'你忘掉的部分在拖累样本' };
  const why=(q && q.why && q.why.length) ? '('+q.why.map(w=>whyMap[w]||w).join('、')+')' : '';
  const cutTxt=cut>0 ? `,数据降级扣款 −₡${cut}` : '';
  if(!hs) return `睡班结算:<b>+₡${earn}</b>${af?`(含加签 · ${af.name})`:''}。`;
  const market=Math.round(parseFloat(hs)*HASH_PRICE);
  const kept=Math.max(0, market-earn);
  return `睡班结算:本夜产出 <b>${hs} 突触秒</b>,按公开牌价折 <b>₡${market}</b>。数据质量:${grade}${why}。`
    + `\n矿池分成 <b>+₡${earn}</b>${cutTxt}${af?`(含加签 · ${af.name})`:''}。`
    + `\n其余 <b>₡${kept}</b> 归池子。比例写在合同第 9 页,字很小。`;
}
/* 公开牌价:₡793 / 1×10⁹ 突触秒。
   这个数不是拍脑袋——它是从「隔夜风险池」那张唯一同时写明毛利与分成的结算单反推的:
   2.9×10⁹ 突触秒 → 毛利 ₡2,300、矿池分成 ₡900(39%)。2300/2.9 = 793。
   有了牌价,才能把"池子留下了多少"算成一个具体数字。
   这是压迫可算化的最后一笔:此前玩家只知道自己到手 ₡120,从不知道池子拿走了多少。 */
const HASH_PRICE=793;
/* 单位自适应:单夜用 10⁹,累计到几十天用 10¹⁰ —— 否则终局会显示"45.32×10⁹",
   读起来像个小数,冲击感反而没了。 */
function hashText(v){
  v=+v||0;
  if(!v) return '0 突触秒';
  if(v>=10) return (v/10).toFixed(2)+'×10¹⁰ 突触秒';
  return v.toFixed(2)+'×10⁹ 突触秒';
}
/* 终生总账:产出 / 到手 / 池子留下 / 抽成比。终局结算单与大清算共用。 */
function lifetimeLedger(){
  const s=G||{};
  const hash=s.totalHash||0, gross=s.totalGross||0, earn=s.totalEarn||0, cut=s.totalCut||0;
  const market=Math.round(hash*HASH_PRICE);
  const kept=Math.max(0, market-earn);
  const rate= market>0 ? Math.round(kept/market*1000)/10 : 0;
  return { hash, gross, earn, cut, market, kept, rate };
}

/* LOGS 全是"有产出"口吻;没签合同的夜晚必须用 LOGS_IDLE,否则自相矛盾。 */
function nightLog(worked){
  return worked ? rnd(LOGS) : rnd((window.LOGS_IDLE||LOGS));
}

/* 结算合同经济(收益/情绪/记忆/污染/评级/蒙太奇取数)。
   独立出来是为了让"强制剧情夜"也能结算——否则那些夜里签的合同会被静默丢弃。 */
function applyContractEconomy(){
  const c=CONTRACTS[G.contract];
  /* 散热与折旧要在扣情绪之前取样:今晚的数据质量,取决于你带着什么状态入睡。 */
  const q=nightQuality();
  /* 派单/签约/结算共用同一份合同预览,避免"卡面 ₡120、结算却按加签算"。
     这里把预览里的"夜班基础情绪 -3"还原成结算前的 moodDelta。 */
  const rush=(G.flags.rush&&window.RUSH)?RUSH[G.day]:null;
  const p=contractPreview(c.id,G.affix,rush);
  let earn=p.earn, risk=p.risk, moodDelta=p.moodDelta+3, memCost=p.memCost;
  const af=p.af;
  if(c.id==='finance' && !rush) earn=Math.round(earn*(0.6+Math.random()*0.8));
  const gross=earn;                       // 降级前的应得,用于结算单上明写扣了多少
  earn=Math.round(earn*q.factor);
  const hsRaw=tonightHashRaw(c.id), hs=hsRaw?hsRaw.toFixed(2)+'×10⁹':null;
  /* 终生累计:终局要把这三十天的总账算给玩家看 */
  G.totalHash=(G.totalHash||0)+hsRaw;
  G.totalGross=(G.totalGross||0)+gross;
  G.totalEarn=(G.totalEarn||0)+earn;
  G.totalCut=(G.totalCut||0)+(gross-earn);
  G.nightsWorked=(G.nightsWorked||0)+1;     // 终局结算单要写"多少个夜晚"
  G.coins+=earn; G.weekEarn+=earn;
  if(c.id==='black') G.stars=Math.max(0,G.stars-1);
  G.mood=clamp(G.mood+moodDelta-3,0,100);
  if(memCost) G.mem=clamp(G.mem-memCost,0,100);
  if(c.id==='biaozhu') G.flags.biaozhu_done=1;
  if(c.id==='render') G.flags.render_done=1;
  applyMood();

  risk += (G.mood<40?10:0);
  const hit=Math.random()*100<risk;
  const tainted = hit ? taintFromNight() : null;
  const week=Math.min(3,Math.max(1,Math.ceil(G.day/7)));
  /* 工单按"该合同第几次出工"推进,而不是全局日历。
     原实现让 D15 才首次接 finance 的玩家直接读 W3,前面的 W1/W2 正常流程永远看不到;
     同一周反复接同一单还会逐字重播同一组工单。 */
  if(!G.workCounts || typeof G.workCounts!=='object') G.workCounts={};
  if(!G.workSeen || typeof G.workSeen!=='object') G.workSeen={};
  const workNo=(G.workCounts[c.id]||0)+1;
  const workWeek=Math.min(3,workNo);
  const workSeen=!!G.workSeen[c.id+':'+workWeek];
  G.workCounts[c.id]=workNo;
  const mg=(window.getMontage&&getMontage(c.id,workWeek))||null;
  G.affix=null;
  if(rush) G.flags.rush=0;
  return { c, earn, af, hit, tainted, mg, week:workWeek, q, gross, hs, workSeen };
}

function settleContract(){
  const { c, earn, af, hit, tainted, mg, week, q, gross, hs, workSeen }=applyContractEconomy();
  const sceneMap={biaozhu:'annot',render:'render',mole:'lab',finance:'finance',black:'service',art:'zao'};
  const markSeen=()=>{ if(!G.workSeen||typeof G.workSeen!=='object') G.workSeen={}; G.workSeen[c.id+':'+week]=1; };
  /* 白天的那一步,夜里必须有下文。
     旧实现在"风平浪静"的夜里只贴一行通用日志,玩家白天做了什么对当晚零影响。
     这里在结算单与日志之间插一页:池子会根据你今天去过哪儿,给你一句不同的话。 */
  const lead=nightLeadPage(c.id);
  const proceed=()=>{
    if(hit){
      const nodes=[
        { type:'pages', pages:[
          `${settleLine(earn,af,c.id,q,gross,hs)}\n\n然而今晚,${c.dream==='ledger'?'账簿翻页的声音停了':c.dream==='metro'?'地铁在半途断了电':'浅海决堤了'}。\n\n${tainted?`有什么东西,正啃在你的「${memName(tainted)}」上。`:'有什么东西,在你的云背里游荡。'}` ]}
      ];
      taintedList().slice(0,2).forEach(id=>{
        nodes.push({type:'purify',name:'污染体 · '+memName(id),tainted:id});
      });
      if(Math.random()<0.5) nodes.push({type:'echo', id:rnd(Object.keys(ECHOES))});
      if(Math.random()<0.35) nodes.push({type:'chase', n:3, name:'逃逸污染体'});
      if(Math.random()<0.6) nodes.push({type:'collect', n:2+Math.floor(Math.random()*2)});
      startDream({ theme:c.dream, title:'云背 · 意外', nodes });
    } else {
      nightQuietPanel([
        settleLine(earn,af,c.id,q,gross,hs),
        /* nightQuietPanel 的 lines 是纯文本数组,页对象必须先解包 ——
           直接塞对象会渲染成 [object Object](硬约束第 1 条的镜像)。 */
        ...(lead?[lead.text.join('\n\n')]:[]),
        '今晚风平浪静。\n\n你的大脑在池子里连夜跑着,而你只觉得,睡了个好觉。',
        `【 今晚你的脑子算了什么 】\n\n${nightLog(true)}`
      ]);
    }
  };
  if(mg){
    /* 已读工单不再逐字重播。重复接同一合同是玩家主动选择的风险收益,
       不应再强制消费一遍相同叙事;这里保留明确提示,不静默跳过。 */
    if(workSeen){
      markSeen();
      toast(`本周工单已读,直接进入结算。`);
      proceed();
      return;
    }
    const pages=[{scene:sceneMap[c.id]||'bedroom', who:'sys', text:[mg.ticket]}, ...mg.beats];
    // 同一时刻,楼上:你今夜算了什么,被谁买走,他们拿它享受了什么
    const cons=(window.consumerPage&&consumerPage(c.id, week))||null;
    if(cons) pages.push(cons);
    if(lead) pages.push(lead);
    runPages(pages, ()=>{ markSeen(); proceed(); });
  } else proceed();
}

function quietNight(){
  G.mood=clamp(G.mood+3,0,100);
  G.mem=clamp(G.mem+1,0,100);
  applyMood();
  const lead=nightLeadPage(null);
  nightQuietPanel([
    '今晚没有合同。\n\n你睡了一个属于你自己的觉——\n\n在这个城市,这几乎算一种奢侈。',
    ...(lead?[lead.text.join('\n\n')]:[]),
    '记忆完整性 +1% · 情绪回升',
    `【 今晚,池子没有叫你 】\n\n${nightLog(false)}`
  ]);
}

/* 白天那一步在夜里的下文。cid 为空表示今晚没接单。
   写法上刻意让池子(而不是主角)开口:它把你白天的行动,重新折算成了"数据质量"。
   这是全篇的压迫方式——它不禁止你去,它只是把你去了这件事记进账。 */
function nightLeadPage(cid){
  if(!G || !G.flags || !G.flags.dayLead) return null;
  const L=G.flags.dayLead;
  const idle = !cid;
  const T={
    tower: idle
      ? '你没有出工,但超频会的记录还在池里:\n\n"矿机主动申请深度睡眠。判定:服从性优。"\n\n今晚这两百块不算数,只是"服从性"三个字被记了一笔。'
      : '超频会上登记的那次"自愿",今晚生效了。\n\n监测备注:本次深睡时长 +40 分钟,由矿机自行申请。\n\n补偿:无。它不需要补偿——它是你自己要的。',
    noodle: idle
      ? '今晚池子没叫你。\n\n你在家煮了半锅清水面,没有蛋。\n\n面娘的蛋今天算你赚了 —— 这是这座城里唯一一笔不会被抽成的收入。'
      : '散热量比昨夜低了 0.4。\n\n系统把这条记进了"体检数据",备注写得很客气:\n\n"矿机进食状况良好。"\n\n它们连你吃没吃饱都在监测,只是不为它付钱。',
    partjob: idle
      ? '便利店的零工干了六小时,₡80。\n\n不够今夜的分成,但够今天的晚饭。\n\n池子没有叫你,于是你今天第一次,是靠醒着自己活下去的。'
      : '今天的工时:六小时,₡80。\n\n今夜的工时:八小时,分成已结算。\n\n系统在两张表之间做了一次核对,结论是:\n\n"该矿机醒着时段的产出效率,显著低于睡眠时段。建议优化。"',
    clinic: idle
      ? '诊所的账单 ₡150 已经开好。\n\n今晚没有产出,所以这一天在你人生账本上是纯支出。\n\n医生没说出口的那句话,比账单更贵。'
      : '诊所的数据同步过来了。\n\n池子比你先看到那份神经检测报告 —— 它每晚都在看。\n\n它只关心一件:今夜的数据质量,是否仍然达标。',
    radio: '你把收音机带进了舱。\n\n88.4 的杂音混进了采样。\n\n系统试图把它判成"干扰",判了三次,最后标记为:人声,低价值有噪。\n\n它没有删掉。它只是给它定了价。',
    observatory: '你白天记的星历,在昨晚的采样里露了头。\n\n系统把它识别为"虚构天体坐标",判定:无价值,未计入产量。\n\n你笑了。\n\n三十天里,这是第一次有东西从池子里漏了出去。',
    zao: '阿枣天台那段谈话混进了样本。\n\n系统标了一行备注:\n\n"检测到矿机与清醒者(拒签)接触。已记录,不影响当期结算。"\n\n"不影响当期结算"——这七个字,是它们仅剩的仁慈。',
    park: '今天下午那三个小时,池子没有收到任何数据。\n\n它查了一遍日志,确认你没有掉线,只是什么都没干。\n\n它的批注只有两个字:闲置。',
    bookstore: '一本诗集跟着你进了舱,压在枕头底下。\n\n采样抓到了几句不成句的句子,系统判为"低语义密度",丢弃。\n\n这是今晚唯一一次,你赢了。',
    gym: '汗还没干。\n\n云背里你的动作比平常快 —— 系统把这归因于"散热良好",并擅自提高了今夜的采样频率。\n\n你替自己省下的时间,被它换成了产量。',
    metro: '地铁站那行粉笔字,一直跟着你躺下。\n\n系统在样本里认出这个问句,判定:非授权内容。\n\n"你睡着的 8 小时,去了哪里?"\n\n它们没有回答。它们只是把它从产量里剔掉了。',
    pawnshop: '池子的轨迹记录:甜水巷,47 分钟。\n\n系统标注:无算力产出区域,风险:低。\n\n他们不怕那家店。全城的记忆从那里过手,他们连税都不收。\n\n想一想,这是为什么。'
  };
  const body=T[L];
  if(!body) return null;
  return { who:'sys', text:[body] };
}

function nightQuietPanel(lines){
  setScene('bedroom');
  /* 安静的夜也是夜:此前这里从不切夜间主题,纸色面板浮在黑暗卧室上,
     像一块亮着的补丁。切到夜间(海的主题——你睡了自己的觉,池子替你放了片海),
     次日清晨 showMorning 会切回白天。 */
  FX.setMode('night','sea');
  app.innerHTML=hudHTML();
  const panel=h('div','panel fadeIn stagger');
  lines.forEach(l=>panel.appendChild(h('p','t',l)));
  panel.appendChild(mkBtn('天亮了','primary',()=>{ nextDay(); }));
  app.appendChild(panel);
}

/* 同一天只允许推进一次(不持久化,避免读档后被卡住) */
let dayClosed=-1;
function nextDay(){
  if(dayClosed===G.day) return;          // 防止重复点击把一天推进两次
  dayClosed=G.day;
  nightLock=false;
  /* 三十天账本:每一天收一行(D 号/标签/记忆)——终局前整体滚过 */
  if(!Array.isArray(G.history)) G.history=[];
  if(G.history.length < 31){
    /* 昨夜体征:由天数确定性生成(被监测的压迫感日常化) */
    G.flags.vitals = `深睡 ${5 + G.day % 3}h${(17 + G.day * 7) % 43}m · 梦次 ${1 + G.day % 3} · 心率 ${52 + (G.day * 7) % 18} · 体温 ${(36.1 + (G.day % 5) * 0.1).toFixed(1)}°C`;
    const auditDay = !!(DAYS[G.day]||{}).audit;
    const tag = auditDay ? '大清算' : (G.contract ? (CONTRACTS[G.contract].name.split('·')[0].trim()) : '裸睡');
    G.history.push({ d: G.day, tag: tag, mem: G.mem });
  }
  G.day++;
  if(G.day>30){ showEndingChoice(); return; }
  // weekEarn 按周累计,由大清算单展示后归零(见 showAudit),此处不可清零
  G.contract=null;
  showMorning();
}

/* ================= 梦境 ================= */
function startDream(spec){
  setScene(null);
  if(window.AUDIO && AUDIO.setAmbient) AUDIO.setAmbient(72,108,.034);
  FX.setMode('night', spec.theme||'sea');
  setGlitch(Math.max(glitchBase(), spec.theme==='core'?3:1));
  app.innerHTML=hudHTML();
  app.appendChild(h('div','',`<div class="dayTag">CLOUDBACK · ${spec.theme==='ledger'?'LEDGER':spec.theme==='metro'?'METRO':spec.theme==='core'?'CORE':'SEA'}</div><div class="dayTitle gl-text" data-t="${spec.title}">${spec.title}</div>`));
  const stage=h('div','dreamStage');
  app.appendChild(stage);
  /* 操作提示必须与当前节点一致,并且放在舞台上方。
     旧版固定"按住污染体拖拽净化 · 点触收集碎片":净化其实要持续按住、逃逸后重按,
     追踪是点中三次;横屏下这条提示还落在视口外,玩家根本看不到。 */
  const tip=h('div','dreamTip');
  app.insertBefore(tip, stage);
  const guideText=n=>{
    if(!n) return '夜班开始 · 按屏幕提示操作';
    if(n.type==='pages') return '夜间记录 · 点击对话框继续';
    if(n.type==='purify') return n.calm
      ? `净化「${n.name||'污染体'}」 · 持续按住即可`
      : `净化「${n.name||'污染体'}」 · 持续按住;它逃逸后重新按住`;
    if(n.type==='echo') return '回声 · 选择净化、聆听或击碎';
    if(n.type==='collect') return `收集记忆碎片 · 点中 ${n.n||3} 个光点`;
    if(n.type==='chase') return `追踪逃逸污染体 · 点中 ${n.n||3} 次`;
    if(n.type==='twist') return '档案更新 · 点击继续';
    return '按屏幕提示操作';
  };
  G.loot={coins:0,mem:0,frag:0,redeem:[]};

  const nodes=(spec.nodes||[]).slice();
  // 自动插入待赎回的污染记忆(最多2;终局夜除外)
  if(!spec.ending){
    taintedList().slice(0,2).forEach(id=>{
      if(!nodes.some(n=>n.tainted===id)) nodes.push({type:'purify',name:'污染体 · '+memName(id),tainted:id});
    });
  }
  /* 白天那一步,今夜有手感:行动不只改数值,也改夜里的操作本身——
     公园把海面铺平(净化体不逃逸)、诗集让梦变轻(碎片更少)、
     收音机把别人的梦带了进来(多一段回声)。
     只作用于常规夜:强排剧情夜保持原样,不掺随机奖励。
     对应的系统批注文本在 nightLeadPage,两边说的是同一件事。 */
  const dl=(G.flags&&G.flags.dayLead)||null;
  const forcedNight=!!(window.DAYS&&DAYS[G.day]&&DAYS[G.day].night);
  if(!spec.ending && !forcedNight && dl){
    if(dl==='park') nodes.forEach(n=>{ if(n&&n.type==='purify') n.calm=1; });
    if(dl==='bookstore') nodes.forEach(n=>{ if(n&&n.type==='collect'&&n.n>2) n.n--; });
    if(dl==='radio'&&!nodes.some(n=>n&&n.type==='echo')) nodes.push({type:'echo',id:'lullaby'});
  }

  let danTimer=null;
  function spawnDM(){
    /* 顺序不能反:showTitle() 会把 G 置为 null,而本函数由 setTimeout 自我续期。
       先判 G 再判宿主 —— 否则 G 已是 null 时读 G.flags 直接抛异常
       (实测 "Cannot read properties of null (reading 'flags')")。
       再判宿主:梦境舞台若已拆掉(回标题 / 读档 / 整块重绘)必须停止续期,
       否则 #danmaku 是 body 上的常驻层,弹幕会一直飘在标题页上面且永不停止。 */
    if(!G || !G.flags.danmaku) return;
    if(!stage.isConnected) return;
    const dm=h('div','dm',rnd(DANMAKU));
    dm.style.top=(8+Math.random()*70)+'%';
    dm.style.animationDuration=(7+Math.random()*7)+'s';
    $('#danmaku').appendChild(dm);
    setTimeout(()=>dm.remove(),14000);
    danTimer=setTimeout(spawnDM, 2200+Math.random()*3600);
  }
  danTimer=setTimeout(spawnDM,1500);

  function finish(){
    clearTimeout(danTimer); $('#danmaku').innerHTML='';
    const L=G.loot;
    const lines=[];
    if(spec.ending){ G.pendingSettle=null; showEndingChoice(); return; }
    const worked=!!G.contract;
    const pe=G.pendingSettle; G.pendingSettle=null;
    if(pe) lines.push(settleLine(pe.earn, pe.af, pe.c && pe.c.id, pe.q, pe.gross, pe.hs));
    lines.push('云背合拢。你浮了上来。');
    if(L.frag) lines.push(`记忆碎片 ×${L.frag} → <b>+₡${L.coins}</b>`);
    /* 面娘的蛋:吃饱的打捞更稳。与 nightLeadPage 的「矿机进食状况良好」互为表里——
       系统把这件事记成了体检数据,而它实际长在这里。 */
    if(G.flags.dayLead==='noodle' && L.coins>0){
      L.coins+=60;
      lines.push('面馆的蛋还在身体里 → 打捞分成 <b style="color:#C9A24B">+₡60</b>');
    }
    if(L.mem) lines.push(`净化安抚 → <b>记忆完整性 +${L.mem}%</b>`);
    if(L.redeem.length) lines.push(`赎回:「${L.redeem.map(memName).join('」「')}」`);
    G.coins+=L.coins; G.mem=clamp(G.mem+L.mem,0,100);
    G.mood=clamp(G.mood-2,0,100); applyMood();
    lines.push(worked ? `【 今晚你的脑子算了什么 】\n\n${nightLog(true)}` : `【 今晚,池子没有叫你 】\n\n${nightLog(false)}`);
    app.innerHTML=hudHTML();
    const p=h('div','panel fadeIn stagger'); lines.forEach(l=>p.appendChild(h('p','t',l)));
    p.appendChild(mkBtn('天亮了','primary',()=>{ FX.setMode('day'); nextDay(); }));
    app.appendChild(p);
  }

  function next(i){
    if(i>=nodes.length){ finish(); return; }
    let n = nodes[i];
    try{ if(typeof n==='function') n = n(G); }catch(e){ n=null; }
    tip.textContent=guideText(n);
    if(!n){ next(i+1); return; }
    if(n.type==='pages'){
      stageOverlay(stage, ov=>{
        runPages(n.pages, ()=>{ ov.remove(); next(i+1); }, {host:ov});
      });
    }
    else if(n.type==='purify'){ doPurify(stage, n, ()=>next(i+1)); }
    else if(n.type==='echo'){ doEcho(stage, n, ()=>next(i+1)); }
    else if(n.type==='collect'){ doCollect(stage, n, ()=>next(i+1)); }
    else if(n.type==='chase'){ doChase(stage, n, ()=>next(i+1)); }
    else if(n.type==='twist'){
      showTwist(n.id, ()=>next(i+1));
    }
    else next(i+1);
  }
  next(0);
}

function stageOverlay(stage, cb){
  const ov=h('div','stageOv');
  ov.style.cssText='position:absolute;inset:14px;display:flex;flex-direction:column;justify-content:flex-end;z-index:5';
  stage.appendChild(ov);
  cb(ov);
}

/* --- 净化:按住拖拽 --- */
function doPurify(stage, node, done){
  const slow=node.slow;
  const gymBoost=G.flags.gym?0.85:1;
  const calmBoost=node.calm?0.9:1;      // 公园的白噪音跟着你进了海:更平静,更好按
  const need=(slow?2.2:1.5)*gymBoost*calmBoost;   // 秒(健身房状态更快)
  const timeout=slow?22000:16000;
  let progress=0, holding=false, escapesLeft=(slow||node.calm)?0:1;
  let finished=false, frame=null;
  const start=performance.now();
  /* 倒计时按"可见时长"走,不按墙钟。
     原实现用 timeout-(now-start):切后台/锁屏/来电时请求照常倒计时,
     玩家回来只看见一行"它挣脱了"。这是唯一一个会因为系统行为直接判负的关卡,不能这么算。 */
  let budget=timeout, lastT=start;
  function onVis(){ if(!document.hidden) lastT=performance.now(); }
  document.addEventListener('visibilitychange', onVis);
  const blot=h('div','blot');
  blot.dataset.name=node.name;
  const ring=h('div','blot ring'); ring.style.setProperty('--p',0);
  const pos=()=>({x:15+Math.random()*70, y:18+Math.random()*62});
  let P=pos();
  function place(){
    blot.style.left=P.x+'%'; blot.style.top=P.y+'%';
    ring.style.left=P.x+'%'; ring.style.top=P.y+'%';
  }
  stage.appendChild(blot); stage.appendChild(ring); place();
  /* 净化 HUD:进度 + 剩余时间。旧版只有环,16/22 秒限时完全不可见,
     失败时玩家只看到"它挣脱了",不知道规则,也没有再来一次的反馈。 */
  const hud=h('div','purifyHud',
    `<span class="phName">${node.name||'污染体'}${node.calm?' · <span style="color:#3BA55D">平静</span>':''}</span>`+
    `<span class="phBar"><i style="width:0%"></i></span>`+
    `<b class="phTime">${(budget/1000).toFixed(1)}s</b>`);
  stage.appendChild(hud);
  const phBar=hud.querySelector('.phBar i');
  const phTime=hud.querySelector('.phTime');
  blot.classList.add('hint');
  blot.addEventListener('pointerdown',()=>{ blot.classList.remove('hint'); });
  /* 键盘也要能过这一关:Enter/Space 切换按住状态,否则键盘玩家永远到不了结算。 */
  blot.tabIndex=0;
  blot.setAttribute('role','button');
  blot.setAttribute('aria-label',`按住净化${node.name||'污染体'},按 Enter 或空格开始/暂停`);
  blot.addEventListener('keydown',e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    e.preventDefault();
    if(e.repeat) return;
    blot.classList.remove('hint');
    holding=!holding;
    hud.classList.toggle('holding',holding);
    if(holding) AUDIO.SFX.soft();
  });
  blot.addEventListener('blur',()=>{ holding=false; hud.classList.remove('holding'); });

  /* 宿主被摘掉(回标题 / 读档 / 整块重绘)时必须自己收手。
     否则:① 定时器到期后 fail() 去读 G.mem,而 G 那时可能已是 null → 抛异常;
     ② rAF loop 永远跑下去 —— 玩家没按住,progress 永远到不了 1,没有任何出口。
     实测:宿主移除后 interval 与 rAF 都还活着,到期即抛 "Cannot read properties of null"。 */
  const alive=()=>!finished && !!G && stage.isConnected;
  const timer=setInterval(()=>{
    if(!alive()){ cleanup(); return; }
    const now=performance.now(), dt=now-lastT; lastT=now;
    if(document.hidden) return;                 // 后台不倒计时(见上方 budget 注释)
    budget-=dt;
    if(budget<=0){ fail(); }
  },200);

  function hit(e){
    const r=stage.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width*100, y=(e.clientY-r.top)/r.height*100;
    return Math.hypot(x-P.x, (y-P.y)*0.9) < 15;
  }
  function onDown(e){ if(hit(e)){ holding=true; hud.classList.add('holding'); AUDIO.SFX.soft(); } }
  function onMove(e){ if(holding && !hit(e)){ holding=false; hud.classList.remove('holding'); } }
  function onUp(){ holding=false; hud.classList.remove('holding'); }

  let last=performance.now();
  function loop(){
    if(!alive()){ cleanup(); return; }        // 舞台已不在 DOM / 存档已卸载 → 停止,不再续帧
    const now=performance.now();
    /* dt 上限(必守):rAF 停摆期间——切后台/锁屏/来电/系统弹窗——或主线程长卡顿(GC、低端机)时,
       时钟仍在走而帧不再回调,恢复后第一帧的 dt 会等于整段停顿。实测停摆 3s → dt≈3s →
       progress 一步跨过终点,玩家没按就白送通关;停摆 200ms 也会白涨 7% 进度。
       正常帧 dt≤0.033s(30fps),上限取 0.1s 只在低于 10fps 时才生效,不影响手感。 */
    const dt=Math.min((now-last)/1000, 0.1); last=now;
    if(holding){
      progress=Math.min(1, progress+dt/need);
      AUDIO.SFX.purge && Math.random()<0.06 && AUDIO.SFX.purge();
      if(progress>0.33 && escapesLeft>0){ escapesLeft--; jump(); }
      if(progress>0.72 && escapesLeft>0){ escapesLeft--; jump(); }
    }
    const sc=1-progress*0.7;
    blot.style.transform=`scale(${sc})`;
    blot.style.opacity=String(1-progress*0.6);
    ring.style.setProperty('--p', (progress*100).toFixed(1));
    phBar.style.width=(progress*100).toFixed(1)+'%';
    phTime.textContent=(Math.max(0,budget)/1000).toFixed(1)+'s';
    if(progress>=1){ win(); return; }
    frame=requestAnimationFrame(loop);
  }
  function jump(){
    P=pos(); place(); progress=Math.max(0,progress-0.06);
    FX.glitch(5); AUDIO.SFX.glitch(); holding=false; hud.classList.remove('holding');
  }
  function cleanup(){ finished=true; holding=false; hud.remove(); cancelAnimationFrame(frame); clearInterval(timer); document.removeEventListener('visibilitychange',onVis); stage.removeEventListener('pointerdown',onDown); stage.removeEventListener('pointermove',onMove); window.removeEventListener('pointerup',onUp); window.removeEventListener('pointercancel',onUp); }
  function win(){
    if(!alive()){ cleanup(); return; }
    cleanup();           // 没有可结算的对象(宿主已消失)就直接退出
    FX.burst(innerWidth/2, innerHeight/2, 168, 40); AUDIO.SFX.chime();
    blot.remove(); ring.remove();
    if(node.tainted){
      G.mems[node.tainted]='full';
      G.loot.mem+=3; G.loot.redeem.push(node.tainted);
      stageOverlay(stage, ov=>{
        runPages([`污染散开了。\n\n「${memName(node.tainted)}」回到你手里——带着一点别人的指纹,但它是你的。`], ()=>{ov.remove();done();},{host:ov});
      });
    } else { done(); }
  }
  function fail(){
    if(!alive()){ cleanup(); return; }
    cleanup();           // 同上:避免对已卸载的存档扣分
    AUDIO.SFX.bad(); FX.glitch(8);
    G.mem=clamp(G.mem-2,0,100); applyMood();
    blot.remove(); ring.remove();
    stageOverlay(stage, ov=>{
      runPages([`它挣脱了,钻进更深的褶皱里。\n\n(记忆完整性 -2%。它还会回来——它们总会回来。)`], ()=>{ov.remove();done();},{host:ov});
    });
  }
  stage.addEventListener('pointerdown',onDown);
  stage.addEventListener('pointermove',onMove);
  window.addEventListener('pointerup',onUp);
  /* 触屏必需:浏览器接管手势(系统边缘返回/长按菜单/多指)时会发 pointercancel 而非 pointerup。
     若只监听 pointerup,onUp 永不触发 → holding 卡在 true → 进度自己涨,玩家不按也会通关。
     签名拖拽(chip 的 endDrag)已有同样处理,此处补齐。 */
  window.addEventListener('pointercancel',onUp);
  frame=requestAnimationFrame(loop);
}

/* --- 回声 --- */
function doEcho(stage, node, done){
  const E=ECHOES[node.id]||ECHOES.wedding;
  stageOverlay(stage, ov=>{
    ov.innerHTML='';
    const box=h('div','panel echoBox fadeIn');
    box.appendChild(h('div','who',E.name));
    box.appendChild(h('div','what',E.intro));
    const mk=(label,cls,fn)=>{ const b=mkBtn(label,cls,fn); b.style.fontSize='15px'; return b; };
    box.appendChild(mk('净化它','primary',()=>{
      G.loot.frag+=1; G.loot.coins+=80; G.loot.mem+=1;
      AUDIO.SFX.echo(); applyMood();
      showResult(E.clean);
    }));
    box.appendChild(mk('凑近聆听','',()=>{
      G.mem=clamp(G.mem-1,0,100); G.mood=clamp(G.mood-2,0,100); applyMood();
      showResult(E.listen);
    }));
    box.appendChild(mk('击碎','danger',()=>{ AUDIO.SFX.bad(); showResult(E.shatter); }));
    function showResult(text){
      box.innerHTML=`<div class="who">${E.name}</div><div class="what">${text}</div>`;
      box.appendChild(mkBtn('继续','primary',()=>{ ov.remove(); done(); }));
    }
    ov.appendChild(box);
  });
}

/* --- 收集 --- */
function doCollect(stage, node, done){
  let left=node.n||3;
  const tip=h('div','dreamTip','触碰光点 · 剩余 '+left+' 个');
  stage.appendChild(tip);
  for(let k=0;k<left;k++){
    const f=h('div','frag');
    f.style.left=(12+Math.random()*76)+'%';
    f.style.top=(15+Math.random()*66)+'%';
    f.style.animationDelay=(Math.random()*2)+'s';
    f.tabIndex=0; f.setAttribute('role','button');
    f.setAttribute('aria-label','记忆碎片,按 Enter 收集');
    const collect=()=>{
      if(!f.isConnected) return;                 // 连点/键盘重复触发只结算一次
      FX.burst(f.offsetLeft+stage.offsetLeft, f.offsetTop+stage.offsetTop, 168, 14);
      AUDIO.SFX.purge();
      G.loot.frag+=1; G.loot.coins+=80;
      f.remove(); left--;
      tip.textContent='触碰光点 · 剩余 '+Math.max(0,left)+' 个';
      if(left<=0){ tip.remove(); done(); }
    };
    f.addEventListener('pointerdown',collect);
    f.addEventListener('keydown',e=>{
      if(e.key!=='Enter' && e.key!==' ') return;
      e.preventDefault(); if(!e.repeat) collect();
    });
    stage.appendChild(f);
  }
}

/* --- 追踪:点中瞬移的污染体三次 --- */
function doChase(stage, node, done){
  let hits=0; const needN=node.n||3;
  const b=h('div','blot chase hint');
  b.dataset.name=node.name||'逃逸污染体';
  const tip=h('div','dreamTip','点中逃逸污染体 · 0/'+needN);
  stage.appendChild(tip);
  function place(){
    b.style.left=(12+Math.random()*76)+'%';
    b.style.top=(15+Math.random()*66)+'%';
  }
  place();
  const hit=()=>{
    hits++;
    AUDIO.SFX.glitch(); FX.glitch(5);
    tip.textContent='点中逃逸污染体 · '+Math.min(hits,needN)+'/'+needN;
    if(hits>=needN){
      const br=b.getBoundingClientRect();
      FX.burst(br.x+br.width/2, br.y+br.height/2, 300, 30);
      b.remove(); tip.remove();
      done();
    } else {
      place();
    }
  };
  b.addEventListener('pointerdown',hit);
  b.tabIndex=0; b.setAttribute('role','button');
  b.setAttribute('aria-label','逃逸污染体,按 Enter 追踪');
  b.addEventListener('keydown',e=>{
    if(e.key!=='Enter' && e.key!==' ') return;
    e.preventDefault(); if(!e.repeat) hit();
  });
  stage.appendChild(b);
}

/* ================= 反转演出 ================= */
function showTwist(id, done){
  const T=TWISTS[id]; if(!T){ done&&done(); return; }
  if(G.seen.includes(id)){ T.fx&&T.fx(G); done&&done(); return; }
  G.seen.push(id);
  FX.setMode('night','core');
  const el=h('div','twist');
  el.innerHTML=`<div class="tt gl-text" data-t="${T.title}">${T.title}</div><div class="tl"></div><button class="go">继 续</button>`;
  document.body.appendChild(el);
  AUDIO.SFX.drone();

  const tl=el.querySelector('.tl'), go=el.querySelector('.go');
  let i=0, typing=null, full='';
  /* 幂等守卫:finish() 会结算 T.mood / 执行 T.fx / 追加选项框。
     若不加锁,正文结束或选项出现后点一下覆盖层空白处,advance() 会再走一遍 finish(),
     导致情绪被重复扣减、选项框不断堆叠、done() 被重复调用。 */
  let finished=false;
  /* close() 的一次性守卫(见 close 内注释),与 finished 分开:finish() 末尾才调 close()。 */
  let closed=false;
  function show(line){
    full=line; tl.textContent=''; let k=0;
    clearInterval(typing);
    typing=setInterval(()=>{
      k+=2; tl.textContent=full.slice(0,k);
      if(k>=full.length){ clearTimeout(typing); typing=null; }
    },30);
  }
  function advance(){
    if(finished) return;
    if(typing){ clearTimeout(typing); typing=null; tl.textContent=full; return; }
    i++;
    if(i<T.lines.length){ AUDIO.SFX.glitch(); show(T.lines[i]); }
    else finish();
  }
  function finish(){
    if(finished) return;
    finished=true;
    vib([15,30,15]);
    go.remove(); el.querySelector('.tt').classList.remove('gl-text');
    if(T.mood) G.mood=clamp(G.mood+T.mood,0,100);
    T.fx&&T.fx(G);
    setGlitch(T.glitch||glitchBase()); applyMood();
    if(T.choices){
      const box=h('div'); box.style.marginTop='4vh';
      T.choices.forEach(c=>{
        const b=h('button','go',c.label);
        b.addEventListener('click',e=>{
          e.stopPropagation();
          const before={coins:G.coins,mem:G.mem,mood:G.mood,stars:G.stars};
          c.fx&&c.fx(G); AUDIO.SFX.soft(); applyMood();
          const delta=stateDelta(before,G);
          el.querySelector('.tl').textContent=(c.line||'')+(delta?`\n\n（选择回执：${delta}）`:'');
          refreshHud();
          box.remove();
          const nx=h('button','go','继 续');
          el.appendChild(nx);
          nx.addEventListener('click',ev=>{ ev.stopPropagation(); close(); });
        });
        box.appendChild(b);
      });
      el.appendChild(box);
    } else {
      if(T.black){ blackFlash(()=>close()); } else close();
    }
  }
  function close(){
    /* 幂等守卫:close() 会排一个 1s 后的 done()。
       若不加锁,选项页的「继 续」按钮连点/双击会排两次 setTimeout,
       使 done() 被调用两次(夜晚序列会因此重复推进 → 跳过节点/重复结算)。
       注意不能复用 finished:finish() 开头就把 finished 置真,末尾才调 close()。 */
    if(closed) return;
    closed=true;
    el.style.transition='opacity 1s'; el.style.opacity='0';
    setTimeout(()=>{ el.remove(); done&&done(); }, 1000);
  }
  go.addEventListener('click',e=>{ e.stopPropagation(); AUDIO.SFX.click(); advance(); });
  el.addEventListener('click',advance);
  show(T.lines[0]);

  function blackFlash(cb){
    const bo=$('#blackout');
    bo.innerHTML='<div class="stars">✦ &nbsp; ✦&nbsp;&nbsp; ✦&nbsp; &nbsp;&nbsp;✦</div>';
    bo.style.opacity='1';
    bo.querySelector('.stars').style.opacity='1';
    AUDIO.SFX.black();
    setTimeout(()=>{ bo.style.opacity='0'; bo.innerHTML=''; cb&&cb(); }, 900);
  }
}

/* ================= 转正合同(T6 交互化) ================= */
/* T6 的恐怖不在于"读到条款",在于亲手确认无路可走。
   「提交书面异议」可以点——每点一次,系统记一次账。第三次之后,连提示都懒得换了。 */
function showTransferLetter(done){
  const modal=h('div','modal');
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
  const paper=h('div','paper');
  paper.innerHTML=`
    <header>梦巢云算 · 转正合同 <small>№ 3409-02 · 密件</small></header>
    <div class="body">
      <p class="t" style="margin:0 0 8px">第三条:转正供体的中枢神经系统所有权,连同此后全部算力产出,一并让渡于梦巢云算,永久有效。</p>
      <p class="t" style="margin:0 0 8px">第九条:试用期评估不通过者,执行记忆格式化,重新进入安置流程。</p>
      <p class="t" style="margin:0">第十一条:试用期届满未提交书面异议者,视为自动转入永久供体。<br><b>异议通道:维护中(自 2081 年起)。</b></p>
      <p class="t dim" style="margin-top:10px">(本合同无需再次签署。您于三十天前签署的第 11 条之自动转入条款,已生效。)</p>
    </div>
    <footer>
      <div class="center" style="margin-top:4px">
        <button class="btn meek" id="objBtn" style="display:inline-block">提交书面异议</button>
        <div class="tip" id="objTip">维护中(自 2081 年起)</div>
      </div>
      <button class="btn primary" id="okBtn">我知道了</button>
    </footer>`;
  modal.appendChild(paper); app.appendChild(modal);
  const tip=modal.querySelector('#objTip');
  modal.querySelector('#objBtn').addEventListener('click',()=>{
    G.flags.objection=(G.flags.objection||0)+1;
    const n=G.flags.objection;
    AUDIO.SFX.soft();
    tip.textContent = n===1 ? '维护中(自 2081 年起)。'
      : n===2 ? '维护中。已记录您的第 2 次尝试。'
      : '已记录。';
    if(n===3) toast('您的异议尝试,已写入档案。评估字段:服从性 −。');
  });
  modal.querySelector('#okBtn').addEventListener('click',()=>{ AUDIO.SFX.click(); modal.remove(); done&&done(); });
}

/* ================= 大清算 ================= */
function showAudit(audit, done){
  audit = audit || {};
  setScene('audit');
  FX.setMode('day');
  app.innerHTML=hudHTML();
  // 格式化坏结局:记忆完整性崩塌
  if(audit.formattable && G.mem<25){
    app.innerHTML=hudHTML();
    const f=h('div','panel fadeIn');
    f.appendChild(h('p','t','周报告打印到一半,打印机停了。\n\n一个穿白衬衫的人走进大厅,朝你露出训练有素的微笑:\n\n"您的神经评估,持续低于安全线。"\n\n"请跟我们走一趟。不必紧张——很快的。"'));
    f.appendChild(mkBtn('跟他们走','primary',()=>showEnding('formatted')));
    app.appendChild(f);
    return;
  }
  /* 磨损按天确定(不再随机):玩家看过清算单后退出再进,重放的清算单必须
     是同一张——随机数会让"同一份文件"前后数字不一致,还可能被读档重刷。 */
  const wear=(G.flags.T1?2:1)+(G.day%2);
  G.mem=clamp(G.mem-wear,0,100);
  let net=200-600;
  const fees=[];
  const wa=(window.worldAudit&&worldAudit(G.day))||null;
  if(wa && wa.fees && wa.fees.length){
    // 世界观数据层提供了本周的完整费用明细
    wa.fees.forEach(f=>fees.push(f));
    G.flags.fee_seen=1;
  } else {
    if(G.day>=8){ fees.push(['梦税(梦境内容授权)',40]); }
    if(G.day>=8){ fees.push(['情感锚点授权费',50]); G.flags.fee_seen=1; }
    if(G.day>=15){ fees.push(['高级供体数据险',30]); }
    fees.push(['机架维护 · 散热液',300]);
  }
  fees.forEach(f=>{ net-=f[1]; });
  G.coins+=net; applyMood();
  /* 评级在清算时升降 —— 清算大厅本来就是评级的地方,此前却是唯一不评级的场合。
     没有这条,星级只有"接黑单 -1"和"云梯塔 +1"两个来源:
     finance(tier 3)在 D15 首现,而 D6 之后下一次云梯塔是 D21,
     不主动刷塔的玩家会被整整锁六天。升降必须在清算里发生,门槛才立得住。 */
  const starBefore=G.stars;
  /* 污染体必须计入评级:它是这游戏里唯一一个"你没做错任何事也会中"的惩罚,
     若不影响评级,玩家就没有理由冒着风险去云背里净化 —— 整个梦境玩法会失去支点。
     实测:只看 mem/mood 的话,D15 就满星了,门槛形同虚设。 */
  const taintedN=taintedList().length;
  const starNote=(()=>{
    if(G.mem>=70 && G.mood>=50 && taintedN===0){ G.stars=Math.min(5,G.stars+1); return '产出稳定,散热良好,无残留污染。评级上调。'; }
    if(G.mem<45 || G.mood<32 || taintedN>0){
      G.stars=Math.max(0,G.stars-1);
      return taintedN>0 ? `检出残留污染体 ${taintedN} 处。评级下调。(净化可恢复)`
                        : '折旧超标 / 散热不足。评级下调。';
    }
    return '各项指标在阈值内。评级维持。';
  })();
  const starDelta = G.stars-starBefore;
  const stars='★★★★★'.slice(0,G.stars)+'☆☆☆☆☆'.slice(0,5-G.stars);
  const wrap=h('div','panel auditIn');
  const recapMap={7:'本周你学会了读合同——可惜,是在签完之后。',14:'本周你看见了自己的梦,在别人的屏幕上。',21:'本周,有人叫对了你的名字——用的是别人的声音。',28:'本周的钟,停在 23:47。你没有告诉任何人。'};
  const recap=recapMap[G.day];
  /* 累计算力产出按实际产出实时算,不写死在数据表里——写死就会和每夜结算单上的
     0.91~3.4×10⁹ 对不上(旧版写死 2.17×10¹⁰/周,反推 3.09×10⁹/夜,正是这个坑)。 */
  const lg=lifetimeLedger();
  const produceRows=[`累计算力产出 <b>${hashText(lg.hash)}</b>`].concat((wa&&wa.produce)||[]);
  const splitRow= lg.market>0
    ? `按公开牌价 ₡${HASH_PRICE} / 1×10⁹ 突触秒折 <b>₡${lg.market.toLocaleString()}</b>　你到手 <b>₡${lg.earn.toLocaleString()}</b>　池子留下 <b>₡${lg.kept.toLocaleString()}</b>(${lg.rate}%)`
    : '本周期你没有被派单。池子不需要你的时候,连抽成都懒得抽。';
  const doc=h('div','doc');
  doc.innerHTML=`
    <h4>${audit.title}</h4>
    <div class="sub">${audit.sub}</div>
    <div class="docRule"></div>
    <div class="row"><span>本周矿池分成</span><b>+₡${G.weekEarn}</b></div>
    <div class="row"><span>全民基座(UBI)</span><b>+₡200</b></div>
    <div class="row"><span>住房租金 · 体面舱</span><b>-₡600</b></div>
    <div class="row"><span>公司评级 · 内部 ${starLetter(G.stars)} 级</span><b class="starsTxt">${stars}</b></div>
    <div class="row ${starDelta>0?'':(starDelta<0?'bad':'')}"><span>评级变动</span><b>${starBefore===G.stars?'维持':starLetter(starBefore)+' → '+starLetter(G.stars)}</b></div>
    ${starNote?`<div class="waNote">${starNote}</div>`:''}
    ${fees.map(f=>`<div class="row bad"><span>${f[0]}</span><b>-₡${f[1]}</b></div>`).join('')}
    <div class="row bad"><span>神经磨损(折旧)</span><b>-${wear}%</b></div>
    <div class="row bad"><span>记忆损耗补偿</span><b>已自动为您签收</b></div>
    <div class="row"><span>剩余记忆完整性</span><b>${G.mem}%</b></div>
    ${G.day>=28?`<div class="row ${G.mem>=85?'':'bad'}"><span>残值预评 · 机架折旧后</span><b>${G.mem>=85?'建议保留':'₡'+(G.mem*40).toLocaleString()}</b></div>`:''}
    ${recap?`<div class="recap">本周记录:${recap}</div>`:''}
    <div class="waBlock"><div class="waHead">产出清单 · 开舱至今</div>${produceRows.map(x=>`<div class="waLi">· ${x}</div>`).join('')}<div class="waLi cut">${splitRow}</div></div>
    ${wa&&wa.upstairs?`<div class="waBlock up"><div class="waHead">同一周 · 楼上</div><div class="waLi">${wa.upstairs}</div></div>`:''}
    ${wa&&wa.note?`<div class="waNote">${wa.note}</div>`:''}
    <div class="stamp">已自动签收<br><i>梦巢云算</i></div>`;
  wrap.appendChild(doc);
  setTimeout(() => vib([25,45,60]), 600);
  wrap.appendChild(mkBtn('查看完毕','primary',()=>{ G.weekEarn=0; done&&done(); }));
  app.appendChild(wrap);
}

/* ================= 结局 ================= */
function showEndingChoice(){
  FX.setMode('night','core');
  setGlitch(3);
  app.innerHTML='';
  const head=h('div','',`<div class="dayTag">23:47 · 结算</div><div class="dayTitle gl-text" data-t="第 31 天,由你选择">第 31 天,由你选择</div>`);
  app.appendChild(head);
  // 路线评语:三轴取最高
  const r=G.route||{ren:0,zhen:0,zhi:0};
  const axes=[
    ['ren', r.ren,  '这一路,你把具体的人,一个一个从系统里捞了出来。'],
    ['zhen',r.zhen, '这一路,你把真相,一块一块从墙上拆了下来。'],
    ['zhi', r.zhi,  '这一路,你在体制的齿轮之间,给自己换了个好位置。']
  ].sort((a,b)=>b[1]-a[1]);
  const line = axes[0][1]===0 ? '这一路,你只是在睡觉。\n\n睡觉,也是一种活法。' : axes[0][2];
  app.appendChild(h('div','routeLine fadeIn',line));
  /* 三十天账本:自己的三十天被排成一行,像池子的账本(T9 具象) */
  if(Array.isArray(G.history) && G.history.length){
    const tl=h('div','ledgerTL');
    const rr=h('div','ledgerRows');
    G.history.forEach((e2,i)=>{
      rr.appendChild(h('div','ledgerLine'+(i===G.history.length-1?' last':''),
        `<span class="ld">D${String(e2.d).padStart(2,'0')}</span><span class="lt">${e2.tag}</span><span class="lm">记忆 ${e2.mem}%</span>`));
      rr.lastChild.style.animationDelay = (i * 0.06) + 's';
    });
    tl.appendChild(rr);
    app.appendChild(tl);
  }
  app.appendChild(h('div','h','云背在身后展开,等你选'));
  const cards=h('div','cards stagger');
  const conds={
    wake:()=>true,
    dream:()=>true,
    feed:()=>!!G.flags.feed_path,
    return:()=>!!G.flags.return_sis,
    blackout:()=>!!G.flags.union_helped,
    keeper:()=>G.mem>=88 && !!G.flags.return_sis && !!G.flags.union_helped,
    formatted:()=>false
  };
  const order=['wake','dream','feed','return','blackout','noodle','j17sleep','family','xiaoman','dealer','upstairs','keeper'];
  for(const id of order){
    const E=ENDINGS[id]; if(!E) continue;
    const ok = E.cond ? E.cond(G) : (conds[id]?conds[id](G):false);
    if(!ok) continue;
    const card=h('div','cCard');
    card.style.setProperty('--c1','#38F2D8'); card.style.setProperty('--c2','#7B61FF');
    const cat = E.tag.includes('隐藏') ? '✦ 隐藏结局' : '结局';
    card.innerHTML=`<div class="cname">${cat} — ${E.name}</div><div class="cdesc">${(E.lines&&E.lines[0]||'').replace(/\n/g,' ').slice(0,60)}</div>`;
    card.addEventListener('click',()=>{ AUDIO.SFX.chime(); showEnding(id); });
    cards.appendChild(card);
  }
  app.appendChild(cards);
  /* 未走之路:只提示"差一步"的结局,不剧透条件细节——多周目的钩子。
     规则:每条都要求"种子已种下"(相关 flag 已出现)但门槛未达标,最多亮一条。 */
  const nearMiss=[
    [G.stars===5 && (G.route.zhi||0)>=3 && !G.flags.feed_path && G.mem<90,
      '有一张卡没有亮起。它要求你的数据完整度达到 90——你忘掉的太多了。'],
    [G.mem>=70 && G.mem<88 && (!!G.flags.return_sis||!!G.flags.union_helped),
      '有一张卡没有亮起。它要求你记得更多——至少 88%。'],
    [(G.flags.mian_helped||G.flags.mian_deal) && G.route.ren<2,
      '有一张卡没有亮起。这一路,你把具体的人捞出来的次数,还不够多。'],
    [(G.flags.xm||0)===1 && !G.flags.teach_dream,
      '有一张卡没有亮起。有人还在等你教她做梦。'],
    [!!G.flags.clue_pawn && (G.flags.pawn_count||0)<3,
      '有一张卡没有亮起。典当行只把柜台钥匙,交给卖掉过三次自己的人。'],
    [!G.flags.union_helped && !!G.flags.T4,
      '有一张卡没有亮起。有些门,你当初没有推开。']
  ].find(x=>x[0]);
  if(nearMiss) app.appendChild(h('div','dimHint',nearMiss[1]));
}

function showEnding(id){
  const E=ENDINGS[id];
  FX.setMode('night','core'); setGlitch(0);
  setScene(null);
  if(E.ng) setMeta({ng:1});
  const lines=E.lines.concat(E.extra?E.extra(G):[]);
  app.innerHTML='';
  const wrap=h('div','ending');
  wrap.appendChild(h('div','etag',E.tag));
  wrap.appendChild(h('div','ename',E.name));
  const lineBox=h('div');
  wrap.appendChild(lineBox);
  app.appendChild(wrap);
  let i=0, finished=false;
  function next(){
    if(i>=lines.length){
      /* 幂等守卫:「终」按钮在完成块执行后仍留在 lineBox 里且可点。
         若不加锁,再点一次会再追加一份「本局档案」+ 制作名单 + 一个「回到标题」
         (实测点 3 次 → 3 份档案、3 个按钮)。同时清空 lineBox,让「终」不再看起来可点。 */
      if(finished) return;
      finished=true;
      lineBox.innerHTML='';
      const r=G.route||{ren:0,zhen:0,zhi:0};
      const twistsSeen=['T1','T2','T3','T4','T5','T6','T7','T8','T9'].filter(t=>G.seen.includes(t)).length
        +(G.flags.j17?1:0)+((G.flags.xm||0)>=1?1:0)+(G.flags.T12?1:0)+(G.flags.sea13?1:0)+(G.flags.T14?1:0);
      const lg=lifetimeLedger();
      const nw=G.nightsWorked||0;
      /* 终局结算单:把三十天的总账一次性摊在玩家面前。
         此前玩家只知道自己一晚到手 ₡120;这里第一次告诉他,池子拿走了多少。 */
      const ledgerBlock = lg.market>0 ? [
        `—— 你这一生的产出 ——`,
        `${nw} 个夜晚 · 累计产出 ${hashText(lg.hash)}`,
        `按公开牌价 ₡${HASH_PRICE} / 1×10⁹ 折:₡${lg.market.toLocaleString()}`,
        `矿池分成(你到手):₡${lg.earn.toLocaleString()}`,
        `池子留下:₡${lg.kept.toLocaleString()}　抽成 ${lg.rate}%`,
        lg.cut>0?`另因数据降级被扣:₡${lg.cut.toLocaleString()}`:null,
        `\n你产出的每一秒算力,都不在你名下。`
      ].filter(Boolean).join('\n') : `—— 你这一生的产出 ——\n\n你没有接过一单。\n\n在这座城市,这既不叫自由,也不叫抵抗。\n\n这叫:没有被开采的价值。`;
      const st=h('div','panel epistats',
        `本局档案 · 第 ${G.day} 天\n\n人性 ${r.ren} · 真相 ${r.zhen} · 体制 ${r.zhi}\n\n记忆完整性 ${G.mem}% · 典当 ${G.flags.pawn_count||0} 次 · 赎回 ${G.flags.redeem_count||0} 次\n\n${ledgerBlock}\n\n已见证的真相:${twistsSeen} / 14`);
      const cr=h('div','credits','《睡班》 SLEEP SHIFT<br>梦 · 工作组<br><br>感谢你,替我们做梦');
      wrap.appendChild(st); wrap.appendChild(cr);
      wrap.appendChild(mkBtn('回到标题','primary',showTitle));
      return;
    }
    const p=h('p','eline fadeIn',lines[i++]);
    lineBox.innerHTML=''; lineBox.appendChild(p);
    const b=mkBtn(i>=lines.length?'终':'继续','primary',next);
    lineBox.appendChild(b);
  }
  next();
}

/* ================= 调试 ================= */
function showDebugBar(){
  const bar=$('#debugBar'); bar.style.display='flex';
  const mk=(label,fn)=>{ const b=document.createElement('button'); b.textContent=label; b.onclick=fn; bar.appendChild(b); };
  mk('+₡1000',()=>{ if(G){G.coins+=1000; toast('debug +₡1000');} });
  mk('mem90',()=>{ if(G)G.mem=90; });
  mk('mem45',()=>{ if(G)G.mem=45; });
  [3,7,9,11,12,17,19,26,27,29,30].forEach(n=>{
    mk('D'+n,()=>{ if(!G) return; G.day=n; G.contract=null; G.weekEarn=0;
      setGlitch(0); G.flags.th25done=1; showMorning(); });
  });
  mk('污染',()=>{ if(G){ const id=taintFromNight(); toast('污染:'+memName(id||'')); } });
}

/* ================= 启动 ================= */
window.addEventListener('pointerdown',function once(){ AUDIO.ambientOn(); window.removeEventListener('pointerdown',once); },{once:true});
window.addEventListener('keydown',e=>{ if(e.key==='m') $('#muteBtn').click(); });
$('#muteBtn').addEventListener('click',()=>{
  const m=AUDIO.toggleMute();
  $('#muteBtn').textContent = m?'✕':'♪';
});
/* title 在触屏上不可用;把关键规则做成可点/可键盘触达的回执。 */
document.addEventListener('click',e=>{
  const info=e.target.closest && e.target.closest('[data-hudinfo]');
  if(!info || !G) return;
  e.stopPropagation();
  if(info.dataset.hudinfo==='mood'){
    toast(`情绪 = 散热。当前 ${G.mood}：≥60 数据质量优；40–59 分成 ×0.95；<40 分成 ×0.85，且污染风险 +10%。`);
  }
});
if(new URLSearchParams(location.search).has('debug')) showDebugBar();
showTitle();
