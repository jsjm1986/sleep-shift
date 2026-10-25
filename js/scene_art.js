/* 《睡班》— 程序化矢量场景美术
   风格:极简渐变风景 + 多层剪影 + 大气光效(Alto/GRIS 式)
   SceneArt.build(key) → 内联 SVG(铺满视口,preserveAspectRatio slice) */
'use strict';
window.SceneArt = (function(){

  const W=390, H=600;

  function rng(seed){ let s=seed%2147483647; if(s<=0)s+=2147483646; return ()=>{ s=s*16807%2147483647; return (s-1)/2147483646; }; }

  /* 剪影楼群:一整条 path */
  function skyline(rand, baseY, minH, maxH, minW, maxW){
    let x=-12, d='';
    while(x<W+12){
      const w=minW+rand()*(maxW-minW);
      const h=minH+rand()*(maxH-minH);
      const top=baseY-h;
      d+=`M${x.toFixed(1)},${baseY} L${x.toFixed(1)},${top.toFixed(1)} L${(x+w).toFixed(1)},${top.toFixed(1)} L${(x+w).toFixed(1)},${baseY} Z `;
      x+=w+(rand()<.35?3+rand()*8:0);
    }
    return d;
  }
  function windows(rand, n, yMin, yMax, color='#FFE2A8', opMin=.25){
    let s='';
    for(let i=0;i<n;i++){
      const x=(rand()*W).toFixed(1), y=(yMin+rand()*(yMax-yMin)).toFixed(1);
      s+=`<rect x="${x}" y="${y}" width="3" height="4.5" rx=".6" fill="${color}" opacity="${(opMin+rand()*.55).toFixed(2)}"/>`;
    }
    return s;
  }
  function stars(rand, n, yMax){
    let s='';
    for(let i=0;i<n;i++){
      const x=(rand()*W).toFixed(1), y=(rand()*yMax).toFixed(1);
      s+=`<circle cx="${x}" cy="${y}" r="${(0.4+rand()*1.1).toFixed(2)}" fill="#fff" opacity="${(0.25+rand()*.65).toFixed(2)}"/>`;
    }
    return s;
  }
  function books(rand, y, rowH){
    let s='', x=14;
    const cols=['#B85C3A','#C98A4B','#7A9E6B','#5C7A9E','#A85C7A','#C9A24B'];
    while(x<W-14){
      const w=5+rand()*9, h=rowH*(0.68+rand()*0.32);
      s+=`<rect x="${x.toFixed(1)}" y="${(y+rowH-h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${cols[Math.floor(rand()*cols.length)]}" opacity="${(0.75+rand()*.25).toFixed(2)}"/>`;
      x+=w+1.2;
    }
    return s;
  }
  function treeCluster(rand, cx, baseY, scale, color){
    let s=`<rect x="${cx-2.5}" y="${baseY-26*scale}" width="5" height="${26*scale}" fill="${color}"/>`;
    for(let i=0;i<5;i++){
      const ox=(rand()-.5)*44*scale, oy=(rand()-.5)*30*scale;
      s+=`<circle cx="${(cx+ox).toFixed(1)}" cy="${(baseY-34*scale+oy).toFixed(1)}" r="${(16+rand()*14)*scale}" fill="${color}"/>`;
    }
    return s;
  }
  function glow(id, cx, cy, r, color, op){
    return { def:`<radialGradient id="${id}"><stop offset="0%" stop-color="${color}" stop-opacity="${op}"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient>`,
             use:`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>` };
  }
  function svg(key, defs, body){
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%">${defs}${body}</svg>`;
  }

  const builders={

    home(){
      const r=rng(41);
      const sun=glow('g-home-sun',300,110,120,'#FFF3D0',.9);
      const g1=glow('g-home-g1',200,430,180,'#FF9F5A',.25);
      const d=`<defs>
        <linearGradient id="g-home-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFE9C4"/><stop offset="55%" stop-color="#FFD094"/><stop offset="100%" stop-color="#FFB877"/>
        </linearGradient>
        <linearGradient id="g-home-gr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E2A876"/><stop offset="100%" stop-color="#B57E4E"/>
        </linearGradient>
        ${sun.def}${g1.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-home-sky)"/>
      <circle cx="300" cy="110" r="34" fill="#FFF6DF"/>
      ${sun.use}
      <path d="${skyline(rng(7),330,36,96,22,46)}" fill="#E39A63" opacity=".55"/>
      ${windows(rng(8),26,250,322,'#FFF0CE',.3)}
      <path d="${skyline(rng(9),392,56,150,26,54)}" fill="#C57A46" opacity=".85"/>
      ${windows(rng(10),44,268,386,'#FFE2A8')}
      ${g1.use}
      <path d="${skyline(rng(11),486,70,168,30,60)}" fill="#7A4A2E"/>
      ${windows(rng(12),52,352,478,'#FFD98A')}
      <rect y="${H-114}" width="${W}" height="114" fill="url(#g-home-gr)"/>`;
      return svg('home',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    park(){
      const r=rng(52);
      const d=`<defs>
        <linearGradient id="g-park-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#C4E9F4"/><stop offset="60%" stop-color="#E4F6EC"/><stop offset="100%" stop-color="#D8F0DC"/>
        </linearGradient>
        <linearGradient id="g-park-gr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8CCB97"/><stop offset="100%" stop-color="#5FA371"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-park-sky)"/>
      <path d="${skyline(rng(21),300,28,80,24,48)}" fill="#A8CFC4" opacity=".5"/>
      <circle cx="70" cy="80" r="26" fill="#FFFFFF" opacity=".7"/>
      <circle cx="98" cy="86" r="20" fill="#FFFFFF" opacity=".6"/>
      ${treeCluster(rng(22),60,392,1.25,'#4C8F5A')}
      ${treeCluster(rng(23),200,384,1.55,'#437F51')}
      ${treeCluster(rng(24),340,392,1.1,'#4C8F5A')}
      <rect y="${H-208}" width="${W}" height="208" fill="url(#g-park-gr)"/>
      <rect x="150" y="${H-208}" width="90" height="14" rx="7" fill="#3E7A4C"/>
      <rect x="160" y="${H-196}" width="6" height="26" fill="#3E7A4C"/>
      <rect x="224" y="${H-196}" width="6" height="26" fill="#3E7A4C"/>
      <ellipse cx="195" cy="${H-36}" rx="150" ry="30" fill="#4C8F5A" opacity=".55"/>`;
      return svg('park',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    noodle(){
      const r=rng(63);
      const l1=glow('g-no-l1',80,64,150,'#FFC46B',.85);
      const l2=glow('g-no-l2',300,72,150,'#FFC46B',.8);
      const l3=glow('g-no-l3',195,108,130,'#FFD98A',.7);
      const d=`<defs>
        <linearGradient id="g-no-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4A2A16"/><stop offset="55%" stop-color="#6B3E20"/><stop offset="100%" stop-color="#7A4826"/>
        </linearGradient>
        ${l1.def}${l2.def}${l3.def}
        <filter id="g-no-blur"><feGaussianBlur stdDeviation="9"/></filter>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-no-bg)"/>
      ${l1.use}${l2.use}${l3.use}
      <rect x="68" y="46" width="26" height="36" rx="9" fill="#A03620"/>
      <rect x="73" y="78" width="16" height="12" rx="3" fill="#FFC96B" opacity=".95"/>
      <rect x="286" y="54" width="26" height="36" rx="9" fill="#A03620"/>
      <rect x="291" y="86" width="16" height="12" rx="3" fill="#FFC96B" opacity=".95"/>
      <rect x="146" y="92" width="98" height="60" rx="8" fill="#1E1206" opacity=".95"/>
      <rect x="146" y="92" width="98" height="60" rx="8" fill="none" stroke="#8A5A2E" stroke-width="2"/>
      <rect x="156" y="104" width="78" height="7" rx="3" fill="#E8B366" opacity=".9"/>
      <rect x="156" y="120" width="56" height="7" rx="3" fill="#E8B366" opacity=".7"/>
      <rect x="156" y="136" width="66" height="7" rx="3" fill="#E8B366" opacity=".5"/>
      <ellipse cx="140" cy="200" rx="30" ry="56" fill="#FFF3D8" opacity=".16" filter="url(#g-no-blur)"/>
      <ellipse cx="252" cy="225" rx="28" ry="52" fill="#FFF3D8" opacity=".18" filter="url(#g-no-blur)"/>
      <rect y="330" width="${W}" height="270" fill="#241408"/>
      <rect y="330" width="${W}" height="10" fill="#8A5A2E"/>
      <rect x="40" y="380" width="120" height="14" rx="7" fill="#31200F"/>
      <rect x="52" y="394" width="8" height="40" fill="#31200F"/>
      <rect x="140" y="394" width="8" height="40" fill="#31200F"/>
      <ellipse cx="195" cy="470" rx="130" ry="60" fill="#7A4526" opacity=".5"/>`;
      return svg('noodle',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    zao(){
      const r=rng(74);
      const sun=glow('g-zao-sun',195,300,170,'#FFD9A0',.8);
      const d=`<defs>
        <linearGradient id="g-zao-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFC178"/><stop offset="45%" stop-color="#FF8E6E"/><stop offset="100%" stop-color="#8E4A6B"/>
        </linearGradient>
        ${sun.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-zao-sky)"/>
      <circle cx="195" cy="300" r="40" fill="#FFE8C4"/>
      ${sun.use}
      <path d="${skyline(rng(31),376,30,86,22,44)}" fill="#6B3E58" opacity=".7"/>
      ${windows(rng(32),20,300,368,'#FFD1A0',.35)}
      <path d="${skyline(rng(33),452,52,140,26,52)}" fill="#3A2340"/>
      ${windows(rng(34),38,330,444,'#FFC490',.4)}
      <rect y="${H-148}" width="${W}" height="148" fill="#241826"/>
      <rect x="0" y="${H-150}" width="${W}" height="6" fill="#181022"/>
      <rect x="120" y="${H-116}" width="150" height="10" rx="5" fill="#181022"/>
      <circle cx="150" cy="${H-128}" r="11" fill="#181022"/>
      <circle cx="176" cy="${H-130}" r="11" fill="#181022"/>
      <rect x="144" y="${H-118}" width="12" height="30" rx="5" fill="#181022"/>
      <rect x="170" y="${H-120}" width="12" height="32" rx="5" fill="#181022"/>
      <rect x="252" y="${H-142}" width="14" height="22" rx="3" fill="#181022"/>`;
      return svg('zao',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    bookstore(){
      const r=rng(85);
      const lamp=glow('g-bk-lamp',195,60,140,'#FFD98A',.4);
      let shelves='';
      for(let i=0;i<4;i++){
        const y=90+i*118;
        shelves+=books(r,y,64)+`<rect x="8" y="${y+64}" width="${W-16}" height="7" rx="2" fill="#241408"/>`;
      }
      const d=`<defs>
        <linearGradient id="g-bk-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4A2E14"/><stop offset="100%" stop-color="#2A1808"/>
        </linearGradient>
        ${lamp.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-bk-bg)"/>
      ${lamp.use}
      ${shelves}
      <ellipse cx="195" cy="${H-20}" rx="150" ry="40" fill="#6B4A22" opacity=".4"/>`;
      return svg('bookstore',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    clinic(){
      const cross=glow('g-cl-cross',195,140,90,'#7FC4E8',.5);
      const d=`<defs>
        <linearGradient id="g-cl-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F2F9FD"/><stop offset="100%" stop-color="#D2E9F6"/>
        </linearGradient>
        ${cross.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-cl-bg)"/>
      ${cross.use}
      <rect x="120" y="110" width="42" height="12" rx="4" fill="#FFFFFF" opacity=".9"/>
      <rect x="135" y="95" width="12" height="42" rx="4" fill="#FFFFFF" opacity=".9"/>
      <rect x="30" y="230" width="330" height="180" rx="14" fill="#FFFFFF" opacity=".65"/>
      <rect x="52" y="256" width="130" height="10" rx="5" fill="#BFE0F2"/>
      <rect x="52" y="280" width="180" height="10" rx="5" fill="#D6ECFA"/>
      <rect x="52" y="304" width="100" height="10" rx="5" fill="#D6ECFA"/>
      <ellipse cx="195" cy="${H-30}" rx="140" ry="34" fill="#B7DBEE" opacity=".6"/>`;
      return svg('clinic',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    tower(){
      const r=rng(96);
      const moon=glow('g-tw-moon',320,80,80,'#CFE6FF',.5);
      const d=`<defs>
        <linearGradient id="g-tw-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0E1526"/><stop offset="100%" stop-color="#26344F"/>
        </linearGradient>
        <linearGradient id="g-tw-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2E4066"/><stop offset="100%" stop-color="#16203A"/>
        </linearGradient>
        ${moon.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-tw-bg)"/>
      ${stars(r,40,240)}
      ${moon.use}
      <path d="${skyline(rng(41),330,40,110,26,50)}" fill="#101A30" opacity=".9"/>
      ${windows(rng(42),30,250,322,'#9EC8FF',.3)}
      <path d="M150,486 L165,180 L255,180 L270,486 Z" fill="url(#g-tw-glass)"/>
      <path d="M150,486 L165,180 L175,180 L162,486 Z" fill="#3A5280" opacity=".5"/>
      ${windows(rng(43),56,200,470,'#BFDCFF',.35)}
      <rect x="205" y="150" width="8" height="34" fill="#16203A"/>
      <circle cx="209" cy="146" r="3" fill="#FF6B7A"/>
      <rect y="${H-114}" width="${W}" height="114" fill="#0C1322"/>
      <ellipse cx="195" cy="${H-40}" rx="140" ry="44" fill="#1B2A47" opacity=".7"/>`;
      return svg('tower',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    metro(){
      const r=rng(107);
      let lights='';
      for(let i=0;i<5;i++){
        const rr=8-i*1.2, cx=60+i*66, cy=200-i*14;
        lights+=`<circle cx="${cx}" cy="${cy}" r="${rr}" fill="#FFE7B0" opacity="${(0.9-i*0.14).toFixed(2)}"/>
                 <circle cx="${cx}" cy="${cy}" r="${rr*2.6}" fill="#FFE7B0" opacity="${(0.16-i*0.02).toFixed(2)}"/>`;
      }
      const d=`<defs>
        <linearGradient id="g-mt-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#191E29"/><stop offset="100%" stop-color="#0C0F16"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-mt-bg)"/>
      <path d="M-10,320 Q195,120 400,320" stroke="#2A3040" stroke-width="16" fill="none"/>
      <path d="M-10,340 Q195,160 400,340" stroke="#232837" stroke-width="10" fill="none"/>
      ${lights}
      <rect y="420" width="${W}" height="8" fill="#D8B94A" opacity=".85"/>
      <rect y="428" width="${W}" height="${H-428}" fill="#0A0C11"/>
      <path d="M-10,430 L130,${H} M400,430 L260,${H}" stroke="#1C212C" stroke-width="8"/>
      <rect x="150" y="452" width="90" height="26" rx="6" fill="#141821"/>
      <rect x="164" y="446" width="62" height="8" rx="4" fill="#38F2D8" opacity=".55"/>`;
      return svg('metro',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    store(){
      const r=rng(118);
      const fridge=glow('g-st-fr',330,240,110,'#BFE9FF',.5);
      let rows='';
      for(let i=0;i<3;i++){
        const y=150+i*120;
        rows+=books(r,y,58)+`<rect x="10" y="${y+58}" width="${W-20}" height="6" rx="2" fill="#C9A24B" opacity=".8"/>`;
      }
      const d=`<defs>
        <linearGradient id="g-st-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFF6DE"/><stop offset="100%" stop-color="#FFE3AC"/>
        </linearGradient>
        ${fridge.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-st-bg)"/>
      ${rows}
      ${fridge.use}
      <rect x="284" y="180" width="86" height="180" rx="10" fill="#BFE9FF" opacity=".35"/>
      <rect x="292" y="192" width="70" height="70" rx="6" fill="#E8F7FF" opacity=".55"/>
      <ellipse cx="195" cy="${H-24}" rx="150" ry="36" fill="#E8CE96" opacity=".6"/>`;
      return svg('store',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    observatory(){
      const r=rng(129);
      const band=glow('g-ob-band',195,180,150,'#8FA8FF',.28);
      const d=`<defs>
        <linearGradient id="g-ob-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#131B3E"/><stop offset="100%" stop-color="#0A0D1E"/>
        </linearGradient>
        ${band.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-ob-bg)"/>
      ${stars(r,110,320)}
      ${band.use}
      <path d="M60,430 Q195,300 330,430" stroke="#1E2540" stroke-width="46" fill="none"/>
      <path d="M100,430 Q195,330 290,430" stroke="#151A30" stroke-width="30" fill="none"/>
      <rect x="185" y="300" width="20" height="14" rx="4" fill="#38F2D8" opacity=".7"/>
      <rect y="430" width="${W}" height="${H-430}" fill="#0C0F20"/>
      <ellipse cx="195" cy="${H-30}" rx="150" ry="40" fill="#151A30" opacity=".8"/>`;
      return svg('observatory',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    gym(){
      const r=rng(140);
      const win=glow('g-gy-win',300,180,120,'#8FB6D8',.4);
      const d=`<defs>
        <linearGradient id="g-gy-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#28303C"/><stop offset="100%" stop-color="#161B24"/>
        </linearGradient>
        ${win.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-gy-bg)"/>
      ${win.use}
      <rect x="240" y="120" width="120" height="150" rx="8" fill="#8FB6D8" opacity=".22"/>
      ${windows(rng(51),14,130,258,'#CFE6F8',.35)}
      <rect x="40" y="300" width="140" height="12" rx="6" fill="#0F131A"/>
      <rect x="48" y="312" width="10" height="70" fill="#0F131A"/>
      <rect x="162" y="312" width="10" height="70" fill="#0F131A"/>
      <rect x="220" y="260" width="10" height="150" fill="#0F131A"/>
      <rect x="220" y="260" width="90" height="10" fill="#0F131A"/>
      <rect x="300" y="260" width="10" height="150" fill="#0F131A"/>
      <rect y="410" width="${W}" height="${H-410}" fill="#10141B"/>
      <ellipse cx="195" cy="${H-24}" rx="150" ry="34" fill="#1C232E" opacity=".8"/>`;
      return svg('gym',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    pawn(){
      const r=rng(151);
      const lamp=glow('g-pw-lamp',195,60,130,'#FFC46B',.45);
      let cage='';
      for(let i=0;i<3;i++){
        const y=120+i*110;
        cage+=`<rect x="26" y="${y}" width="${W-52}" height="5" fill="#4A3418"/>
               <rect x="40" y="${y+5}" width="4" height="105" fill="#4A3418" opacity=".8"/>
               <rect x="120" y="${y+5}" width="4" height="105" fill="#4A3418" opacity=".8"/>
               <rect x="200" y="${y+5}" width="4" height="105" fill="#4A3418" opacity=".8"/>
               <rect x="280" y="${y+5}" width="4" height="105" fill="#4A3418" opacity=".8"/>
               <rect x="346" y="${y+5}" width="4" height="105" fill="#4A3418" opacity=".8"/>`;
      }
      const d=`<defs>
        <linearGradient id="g-pw-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A2810"/><stop offset="100%" stop-color="#1E1408"/>
        </linearGradient>
        ${lamp.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-pw-bg)"/>
      ${lamp.use}
      ${cage}
      <ellipse cx="195" cy="${H-24}" rx="150" ry="40" fill="#553A16" opacity=".5"/>`;
      return svg('pawn',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    audit(){
      const r=rng(162);
      const d=`<defs>
        <linearGradient id="g-au-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E9F0F6"/><stop offset="100%" stop-color="#B4C6D6"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-au-bg)"/>
      <circle cx="195" cy="128" r="74" fill="#FFFFFF" stroke="#8FA6BA" stroke-width="7"/>
      <circle cx="195" cy="128" r="59" fill="#F8FAFC"/>
      <line x1="195" y1="128" x2="195" y2="84" stroke="#2E3D4E" stroke-width="7" stroke-linecap="round"/>
      <line x1="195" y1="128" x2="249" y2="155" stroke="#2E3D4E" stroke-width="5" stroke-linecap="round"/>
      <circle cx="195" cy="128" r="6" fill="#2E3D4E"/>
      <rect x="0" y="330" width="${W}" height="6" fill="#AFC2D2"/>
      <rect x="36" y="336" width="26" height="${H-336}" fill="#DDE7EF"/>
      <rect x="150" y="336" width="26" height="${H-336}" fill="#DDE7EF"/>
      <rect x="264" y="336" width="26" height="${H-336}" fill="#DDE7EF"/>
      <rect x="328" y="336" width="26" height="${H-336}" fill="#DDE7EF"/>
      <ellipse cx="195" cy="${H-16}" rx="160" ry="30" fill="#B7C9D8" opacity=".7"/>`;
      return svg('audit',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    bedroom(){
      const r=rng(173);
      const moon=glow('g-bd-moon',300,120,90,'#E8D8FF',.4);
      const lamp=glow('g-bd-lamp',70,330,90,'#FFB36B',.55);
      const d=`<defs>
        <linearGradient id="g-bd-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#262033"/><stop offset="100%" stop-color="#171221"/>
        </linearGradient>
        ${moon.def}${lamp.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-bd-bg)"/>
      <rect x="230" y="90" width="120" height="170" rx="10" fill="#0F0C18"/>
      ${stars(r,26,250)}
      <circle cx="300" cy="150" r="20" fill="#EFE3FF" opacity=".9"/>
      ${moon.use}
      <rect x="24" y="140" width="14" height="220" rx="6" fill="#332A44"/>
      <rect x="20" y="132" width="120" height="90" rx="8" fill="#FFB36B" opacity=".28"/>
      ${lamp.use}
      <circle cx="70" cy="320" r="14" fill="#FFC98F" opacity=".9"/>
      <rect x="130" y="330" width="200" height="26" rx="13" fill="#3A3050"/>
      <rect x="146" y="300" width="90" height="34" rx="12" fill="#4A3E64"/>
      <rect x="120" y="352" width="220" height="90" rx="14" fill="#2C2440"/>
      <rect x="140" y="368" width="180" height="18" rx="9" fill="#514370" opacity=".7"/>
      <ellipse cx="195" cy="500" rx="130" ry="42" fill="#332A48" opacity=".65"/>
      <ellipse cx="120" cy="540" rx="16" ry="9" fill="#4A3E64"/>
      <ellipse cx="152" cy="546" rx="16" ry="9" fill="#4A3E64"/>`;
      return svg('bedroom',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    /* ---- v0.7 工作实感场景 ---- */
    annot(){
      const r=rng(184);
      const grid=glow('g-an-grid',195,200,180,'#7FC4E8',.35);
      let faces='';
      for(let i=0;i<24;i++){
        const x=28+(i%6)*58, y=64+Math.floor(i/6)*92;
        faces+=`<rect x="${x}" y="${y}" width="46" height="58" rx="6" fill="#0F2233" stroke="#2E5B7C" stroke-width="1.5"/>
                <circle cx="${x+23}" cy="${y+22}" r="11" fill="#7FC4E8" opacity="${(0.2+r()*0.4).toFixed(2)}"/>
                <rect x="${x+10}" y="${y+42}" width="26" height="4" rx="2" fill="#7FC4E8" opacity=".35"/>`;
      }
      const d=`<defs>
        <linearGradient id="g-an-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0A1826"/><stop offset="100%" stop-color="#0E2233"/>
        </linearGradient>
        ${grid.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-an-bg)"/>
      ${grid.use}
      ${faces}
      <rect x="28" y="436" width="46" height="22" rx="4" fill="#38F2D8" opacity=".85"/>
      <text x="51" y="451" text-anchor="middle" font-size="12" fill="#062018" font-weight="700">正常</text>`;
      return svg('annot',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    render(){
      const r=rng(195);
      const sun=glow('g-rd-sun',195,330,150,'#FFD9A0',.85);
      let waves='';
      for(let i=0;i<5;i++){
        const y=396+i*26;
        waves+=`<path d="M-10,${y} Q95,${y-9} 195,${y} T400,${y}" stroke="#FFE7C4" stroke-width="${(2.6-i*0.35).toFixed(1)}" fill="none" opacity="${(0.5-i*0.07).toFixed(2)}"/>`;
      }
      const d=`<defs>
        <linearGradient id="g-rd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6B4A8E"/><stop offset="45%" stop-color="#C86B6E"/><stop offset="72%" stop-color="#FFB36B"/>
        </linearGradient>
        <linearGradient id="g-rd-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3E4E7E"/><stop offset="100%" stop-color="#1E2A4E"/>
        </linearGradient>
        ${sun.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-rd-sky)"/>
      <circle cx="195" cy="330" r="46" fill="#FFE8C4"/>
      ${sun.use}
      <rect y="386" width="${W}" height="${H-386}" fill="url(#g-rd-sea)"/>
      <rect x="187" y="330" width="16" height="60" fill="#FFE8C4" opacity=".55"/>
      ${waves}
      <rect x="0" y="470" width="120" height="${H-470}" fill="#141C30" opacity=".85"/>
      <rect x="270" y="486" width="120" height="${H-486}" fill="#141C30" opacity=".85"/>
      ${windows(rng(61),16,480,540,'#9EC8FF',.5)}`;
      return svg('render',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    finance(){
      const r=rng(206);
      let bars='';
      for(let i=0;i<26;i++){
        const x=16+i*14, up=r()<.55;
        const bh=20+r()*70, body=(8+r()*26).toFixed(1);
        const yTop=330-bh-(r()*30);
        const col=up?'#3BA55D':'#E5484D';
        bars+=`<line x1="${x+7}" y1="${yTop}" x2="${x+7}" y2="${yTop+bh+Number(body)}" stroke="${col}" stroke-width="1.4" opacity=".8"/>
               <rect x="${x}" y="${(yTop+bh*0.4).toFixed(1)}" width="14" height="${body}" fill="${col}" opacity=".85"/>`;
      }
      const d=`<defs>
        <linearGradient id="g-fi-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0D1420"/><stop offset="100%" stop-color="#101B2E"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-fi-bg)"/>
      ${bars}
      <rect x="120" y="120" width="150" height="52" rx="8" fill="#101B2E" stroke="#2E4A6E" stroke-width="1.5"/>
      <text x="195" y="142" text-anchor="middle" font-size="15" fill="#3BA55D" font-weight="700">+1,804.60</text>
      <text x="195" y="160" text-anchor="middle" font-size="9" fill="#7C93B4" letter-spacing="2">供体疲劳指数期货 · 多头</text>
      <rect y="470" width="${W}" height="${H-470}" fill="#0A0F18"/>
      <ellipse cx="195" cy="${H-40}" rx="150" ry="36" fill="#101B2E" opacity=".9"/>`;
      return svg('finance',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    lab(){
      const r=rng(217);
      const glowC=glow('g-lb-glow',195,210,130,'#9FE8D8',.4);
      let mol='';
      for(let i=0;i<7;i++){
        const a=i/7*Math.PI*2, cx=195+Math.cos(a)*46, cy=210+Math.sin(a)*46*0.8;
        mol+=`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="10" fill="#9FE8D8" opacity=".8"/>`;
        mol+=`<line x1="195" y1="210" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#9FE8D8" stroke-width="2" opacity=".5"/>`;
      }
      mol+='<circle cx="195" cy="210" r="16" fill="#D6FFF4"/>';
      const d=`<defs>
        <linearGradient id="g-lb-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#101C1A"/><stop offset="100%" stop-color="#0B1412"/>
        </linearGradient>
        ${glowC.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-lb-bg)"/>
      ${glowC.use}
      ${mol}
      <circle cx="195" cy="210" r="72" fill="none" stroke="#9FE8D8" stroke-width="1" opacity=".35"/>
      <rect x="30" y="330" width="330" height="6" fill="#183230"/>
      <rect x="52" y="336" width="90" height="42" rx="4" fill="#122624"/>
      <rect x="60" y="344" width="46" height="8" rx="3" fill="#9FE8D8" opacity=".5"/>
      <rect x="240" y="336" width="110" height="60" rx="6" fill="#122624"/>
      <rect x="252" y="346" width="86" height="5" rx="2" fill="#9FE8D8" opacity=".45"/>
      <rect x="252" y="358" width="66" height="5" rx="2" fill="#9FE8D8" opacity=".3"/>
      <rect y="410" width="${W}" height="${H-410}" fill="#081210"/>
      <text x="195" y="450" text-anchor="middle" font-size="11" fill="#3E6B62" letter-spacing="3">临床级 · 保密协议已签署</text>`;
      return svg('lab',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    service(){
      const r=rng(228);
      let racks='';
      for(let i=0;i<3;i++){
        const x=20+i*126;
        racks+=`<rect x="${x}" y="180" width="104" height="240" rx="6" fill="#10151E" stroke="#232B3A" stroke-width="2"/>`;
        for(let j=0;j<8;j++){
          const ly=192+j*28;
          racks+=`<rect x="${x+8}" y="${ly}" width="88" height="18" rx="3" fill="#1B2230"/>
                  <circle cx="${x+18}" cy="${ly+9}" r="2.4" fill="#38F2D8" opacity="${(0.4+r()*0.5).toFixed(2)}"/>
                  <circle cx="${x+27}" cy="${ly+9}" r="2.4" fill="#FF4FD8" opacity="${(0.3+r()*0.5).toFixed(2)}"/>
                  <rect x="${x+38}" y="${ly+7}" width="50" height="4" rx="2" fill="#2E3A4E"/>`;
        }
      }
      const d=`<defs>
        <linearGradient id="g-sv-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0E1119"/><stop offset="100%" stop-color="#161C29"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-sv-bg)"/>
      ${racks}
      <rect x="0" y="150" width="130" height="290" rx="8" fill="#1B2130" opacity=".85"/>
      <rect x="8" y="160" width="114" height="270" rx="6" fill="#3A2E28" opacity=".9"/>
      <rect y="430" width="${W}" height="${H-430}" fill="#0A0D13"/>
      <ellipse cx="195" cy="${H-20}" rx="150" ry="36" fill="#10151E" opacity=".9"/>`;
      return svg('service',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    },

    penthouse(){
      const r=rng(239);
      const chand=glow('g-ph-chand',195,70,120,'#FFE2A8',.6);
      const city=glow('g-ph-city',195,420,170,'#FF9F5A',.35);
      let people='';
      for(let i=0;i<8;i++){
        const x=34+i*46, hgt=30+r()*22;
        people+=`<circle cx="${x+8}" cy="${430-hgt}" r="7" fill="#141B30"/>
                 <rect x="${x+1}" y="${430-hgt+7}" width="14" height="${hgt}" rx="5" fill="#141B30"/>`;
      }
      const d=`<defs>
        <linearGradient id="g-ph-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#241B2E"/><stop offset="60%" stop-color="#3A2540"/><stop offset="100%" stop-color="#1C1226"/>
        </linearGradient>
        ${chand.def}${city.def}
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g-ph-bg)"/>
      ${city.use}
      <rect x="0" y="352" width="${W}" height="80" fill="#FF9F5A" opacity=".16"/>
      ${people}
      <rect x="0" y="430" width="${W}" height="10" fill="#0F1220"/>
      <rect y="440" width="${W}" height="${H-440}" fill="#0D0A16"/>
      <path d="M60,440 L60,560 M330,440 L330,560" stroke="#3A2E50" stroke-width="3"/>
      ${chand.use}
      <rect x="150" y="48" width="90" height="16" rx="4" fill="#FFE2A8" opacity=".25"/>`;
      return svg('penthouse',d.match(/<defs>[\s\S]*<\/defs>/)[0], d.slice(d.indexOf('</defs>')+8));
    }
  };

  function build(key){
    const fn=builders[key];
    if(!fn) return null;
    try{ return fn(); }catch(e){ SceneArt.lastErr=key+': '+e.message; return null; }
  }
  return { build, keys:Object.keys(builders) };
})();
