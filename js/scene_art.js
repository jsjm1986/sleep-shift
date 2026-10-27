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
/* v2.3 美术升级:场景深化(层级/光源/地点身份)——覆盖既有 builder,接口不变 */
Object.assign(builders, {

  /* 白天 hub:三层城市 + 云梯塔地标 + 光带 */
  home(){
    const r=rng(41);
    const sun=glow('g-home-sun',300,150,150,'#FFF3D0',.95);
    const g1=glow('g-home-g1',110,470,200,'#FF9F5A',.28);
    const d=`<defs>
      <linearGradient id="g-home-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FFCE8E"/><stop offset="45%" stop-color="#FFAE64"/><stop offset="100%" stop-color="#FF9448"/>
      </linearGradient>
      <linearGradient id="g-home-tower" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8F5D30"/><stop offset="100%" stop-color="#6E4520"/>
      </linearGradient>
      ${sun.def}${g1.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-home-sky)"/>
    ${sun.use}
    <circle cx="300" cy="150" r="34" fill="#FFF3D6"/>
    ${windows(r,30,170,300,'#FFFFFF',.2)}
    <path d="${skyline(rng(7),H,120,210,26,52)}" fill="#D89A5E" opacity=".9"/>
    <path d="${skyline(rng(17),H,90,170,22,44)}" fill="#C08048"/>
    <!-- 云梯塔:地标 -->
    <g opacity=".92">
      <rect x="318" y="128" width="30" height="${H-128}" fill="url(#g-home-tower)"/>
      <rect x="322" y="120" width="22" height="10" fill="#B87B42"/>
      <path d="M322 120 L333 96 L344 120 Z" fill="#A26D38"/>
      <circle cx="333" cy="92" r="2.4" fill="#FF5A5A"/>
      ${windows(rng(27),9,150,440,'#FFE2A8',.5)}
    </g>
    <path d="${skyline(rng(37),H,60,120,30,64)}" fill="#9A6535"/>
    ${windows(r,40,470,560,'#FFE9B8',.65)}
    <rect y="500" width="${W}" height="100" fill="url(#g-home-gr)" opacity="0"/>
    ${g1.use}
    <path d="M0 520 Q195 500 390 522 L390 600 L0 600 Z" fill="#B57E4E" opacity=".5"/>`;
    return svg('home', '', d);
  },

  /* 卧室/供体舱:机架身份 + 监测屏 + 管线 + 夜窗 */
  bedroom(){
    const r=rng(88);
    const lamp=glow('g-bed-lamp',96,392,86,'#FFB36B',.55);
    const mon=glow('g-bed-mon',258,296,60,'#5AD8E8',.2);
    const moon=glow('g-bed-moon',524,20,70,'#C9C4F2',.5);
    const d=`<defs>
      <linearGradient id="g-bed-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#191D33"/><stop offset="100%" stop-color="#11142A"/>
      </linearGradient>
      <linearGradient id="g-bed-bed" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2A2C4C"/><stop offset="100%" stop-color="#1E2040"/>
      </linearGradient>
      ${lamp.def}${mon.def}${moon.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-bed-wall)"/>
    ${stars(r,26,160)}
    <!-- 舱壁面板线 -->
    <rect x="0" y="0" width="${W}" height="600" fill="none"/>
    <g opacity=".25" stroke="#3A3E66" stroke-width="1">
      <line x1="0" y1="150" x2="${W}" y2="150"/><line x1="0" y1="452" x2="${W}" y2="452"/>
      <line x1="130" y1="0" x2="130" y2="600"/><line x1="360" y1="0" x2="360" y2="600"/>
    </g>
    <!-- 夜窗:城市一线灯 + 月 -->
    <g>
      <rect x="380" y="0" width="130" height="212" rx="6" fill="#05070F"/>
      ${stars(r,10,120)}
      <circle cx="524" cy="20" r="22" fill="#CFC8F0" opacity=".9"/>
      ${moon.use}
      <rect x="380" y="100" width="130" height="3" fill="#2A2E52"/>
      ${windows(r,8,110,190,'#8FB8FF',.5)}
      <line x1="380" y1="0" x2="380" y2="212" stroke="#2A2E52" stroke-width="3"/>
    </g>
    <!-- 床头监测条 -->
    <g>
      <rect x="196" y="256" width="180" height="30" rx="4" fill="#0A0E1E" stroke="#2A2E52"/>
      <circle cx="212" cy="271" r="2.6" fill="#38F2D8" opacity=".9"/>
      <rect x="224" y="266" width="66" height="3" rx="1.5" fill="#38F2D8" opacity=".35"/>
      <rect x="224" y="274" width="40" height="3" rx="1.5" fill="#7B61FF" opacity=".4"/>
      <rect x="356" y="262" width="8" height="18" fill="#151936"/>
    </g>
    ${mon.use}
    <!-- 供体舱床:机架半包裹 -->
    <rect x="118" y="330" width="10" height="230" fill="#262A4E"/>
    <rect x="392" y="330" width="10" height="230" fill="#262A4E"/>
    <path d="M118 330 C200 300 330 300 402 330 L402 344 C330 316 200 316 118 344 Z" fill="#262A4E"/>
    <rect x="146" y="352" width="228" height="150" rx="14" fill="url(#g-bed-bed)"/>
    <rect x="170" y="356" width="88" height="34" rx="10" fill="#333663"/>
    <rect x="168" y="452" width="186" height="22" rx="11" fill="#333663"/>
    <rect x="140" y="540" width="250" height="14" rx="4" fill="#151936"/>
    <!-- 输液管 + 深眠糖盒 -->
    <path d="M402 350 C436 372 430 430 396 448" stroke="#3A3E66" stroke-width="3" fill="none" opacity=".8"/>
    <rect x="384" y="440" width="20" height="14" rx="3" fill="#2A2E52"/>
    ${lamp.use}
    <!-- 床头灯 -->
    <g>
      <rect x="88" y="404" width="16" height="6" rx="3" fill="#3A3E66"/>
      <rect x="93" y="410" width="6" height="26" fill="#2A2E52"/>
      <circle cx="96" cy="392" r="11" fill="#FFCF8E"/>
    </g>`;
    return svg('bedroom', '', d);
  },

  /* 旧地铁站:站台缘石 + 轨道坑 + 立柱 + 粉笔字 + 摇灯 */
  metro(){
    const r=rng(52);
    const lamp1=glow('g-met-l1',120,54,66,'#E8C46B',.4);
    const lamp2=glow('g-met-l2',300,30,60,'#E8C46B',.3);
    const chalk=glow('g-met-chalk',255,320,110,'#8FD8C8',.14);
    const d=`<defs>
      <linearGradient id="g-met-air" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#141A2E"/><stop offset="100%" stop-color="#0A0D18"/>
      </linearGradient>
      ${lamp1.def}${lamp2.def}${chalk.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-met-air)"/>
    <!-- 隧道拱 -->
    <path d="M-20 420 C60 180 330 180 410 420" stroke="#232B48" stroke-width="16" fill="none"/>
    <path d="M-20 448 C70 220 320 220 410 448" stroke="#1B2238" stroke-width="12" fill="none"/>
    ${lamp1.use}${lamp2.use}
    <circle cx="120" cy="54" r="9" fill="#F2D894"/><circle cx="300" cy="30" r="7" fill="#E8C46B" opacity=".8"/>
    <!-- 站牌 -->
    <g opacity=".85">
      <rect x="196" y="86" width="86" height="22" rx="3" fill="#10152A" stroke="#2A3352"/>
      <rect x="204" y="94" width="52" height="3" rx="1.5" fill="#5AC8FA" opacity=".7"/>
      <rect x="204" y="101" width="34" height="2.4" rx="1.2" fill="#5AC8FA" opacity=".4"/>
    </g>
    <!-- 粉笔字 -->
    ${chalk.use}
    <g opacity=".8">
      <rect x="196" y="300" width="120" height="4" rx="2" fill="#8FD8C8" opacity=".55"/>
      <rect x="204" y="312" width="88" height="4" rx="2" fill="#8FD8C8" opacity=".4"/>
      <rect x="196" y="324" width="104" height="4" rx="2" fill="#8FD8C8" opacity=".3"/>
    </g>
    <!-- 立柱与广告残影 -->
    <rect x="52" y="300" width="26" height="220" fill="#171D33"/>
    <rect x="330" y="286" width="26" height="234" fill="#171D33"/>
    <rect x="57" y="322" width="16" height="52" fill="#20263F" opacity=".8"/>
    <rect x="335" y="308" width="16" height="52" fill="#20263F" opacity=".8"/>
    <!-- 站台 -->
    <rect x="0" y="500" width="${W}" height="100" fill="#0D1120"/>
    <rect x="0" y="494" width="${W}" height="7" fill="#C9A24B" opacity=".85"/>
    <rect x="0" y="501" width="${W}" height="2.4" fill="#8A6D2E" opacity=".7"/>
    <!-- 轨道坑对面的壁 -->
    <path d="M0 600 L0 540 C120 560 270 560 390 540 L390 600 Z" fill="#070A14"/>`;
    return svg('metro', '', d);
  },

  /* 清算大厅:日光灯带 + 排队栏 + 柜台 + 23:47 大钟 */
  audit(){
    const r=rng(64);
    const l1=glow('g-aud-l1',195,84,190,'#F2F6FA',.55);
    const d=`<defs>
      <linearGradient id="g-aud-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#DDE4EE"/><stop offset="100%" stop-color="#C2CCDC"/>
      </linearGradient>
      ${l1.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-aud-wall)"/>
    <!-- 天花灯带 -->
    <g fill="#F6F9FD">
      <rect x="30" y="26" width="120" height="9" rx="4.5"/>
      <rect x="240" y="26" width="120" height="9" rx="4.5"/>
      <rect x="120" y="52" width="150" height="9" rx="4.5"/>
    </g>
    ${l1.use}
    <!-- 23:47 大钟 -->
    <circle cx="195" cy="120" r="52" fill="#FDFEFF" stroke="#93A3BC" stroke-width="5"/>
    <line x1="195" y1="120" x2="195" y2="86" stroke="#2A3A55" stroke-width="4" stroke-linecap="round"/>
    <line x1="195" y1="120" x2="220" y2="132" stroke="#2A3A55" stroke-width="4" stroke-linecap="round"/>
    <circle cx="195" cy="120" r="3.4" fill="#B03A2E"/>
    <!-- 叫号屏 -->
    <g>
      <rect x="286" y="88" width="76" height="30" rx="3" fill="#101826"/>
      <text x="324" y="109" font-family="ui-monospace,monospace" font-size="15" fill="#FF6B5E" text-anchor="middle" letter-spacing="1">23:47</text>
    </g>
    <!-- 地面分界 -->
    <rect x="0" y="386" width="${W}" height="4" fill="#AAB6C8"/>
    <rect x="0" y="390" width="${W}" height="210" fill="#D3DBE8"/>
    <!-- 排队栏 -->
    <g stroke="#8A98AE" stroke-width="2.4" fill="none">
      <path d="M22 470 L22 440"/><path d="M96 470 L96 440"/><path d="M170 470 L170 440"/>
    </g>
    <g fill="#B03A2E" opacity=".75">
      <rect x="14" y="452" width="90" height="5" rx="2.5"/>
      <rect x="88" y="452" width="90" height="5" rx="2.5"/>
    </g>
    <g fill="#8A98AE">
      <circle cx="22" cy="472" r="3"/><circle cx="96" cy="472" r="3"/><circle cx="170" cy="472" r="3"/>
    </g>
    <!-- 柜台与办事员剪影 -->
    <rect x="0" y="470" width="${W}" height="16" fill="#B8C2D4"/>
    <rect x="0" y="486" width="${W}" height="114" fill="#C4CEE0"/>
    <g fill="#5A6A85">
      <circle cx="70" cy="452" r="9"/>
      <path d="M56 470 C58 460 82 460 84 470 Z"/>
      <circle cx="290" cy="450" r="9"/>
      <path d="M276 470 C278 459 304 459 306 470 Z"/>
    </g>
    <rect x="120" y="458" width="60" height="12" rx="2" fill="#E8EDF5"/>
    <rect x="236" y="458" width="60" height="12" rx="2" fill="#E8EDF5"/>`;
    return svg('audit', '', d);
  },

  /* 白噪音公园:层次树 + 长椅细节 + 音箱柱 + 穹顶光带 */
  park(){
    const r=rng(23);
    const sun=glow('g-park-sun',195,90,150,'#FFFFFF',.6);
    const spk=glow('g-park-spk',60,330,70,'#9EC5AB',.28);
    const d=`<defs>
      <linearGradient id="g-park-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#EAF2EA"/><stop offset="100%" stop-color="#D2E4D4"/>
      </linearGradient>
      ${sun.def}${spk.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-park-sky)"/>
    ${sun.use}
    <path d="${skyline(rng(9),H-160,90,170,26,50)}" fill="#C2D6C4" opacity=".55"/>
    <!-- 穹顶光带:极细接缝 -->
    <line x1="150" y1="0" x2="255" y2="330" stroke="#FFFFFF" stroke-width="1.2" opacity=".5"/>
    <!-- 树:远中近三层 -->
    ${treeCluster(r,330,336,.9,'#A9C4AC')}
    ${treeCluster(r,60,394,1.15,'#8FB394')}
    ${treeCluster(r,196,436,1.5,'#7BA381')}
    <!-- 白噪音音箱柱 + 声波 -->
    <g>
      <rect x="54" y="330" width="10" height="120" fill="#5A7A60"/>
      <rect x="50" y="322" width="18" height="12" rx="3" fill="#4A6650"/>
      <path d="M78 328 a14 14 0 0 1 0 24" stroke="#9EC5AB" stroke-width="2" fill="none" opacity=".7"/>
      <path d="M88 322 a22 22 0 0 1 0 36" stroke="#9EC5AB" stroke-width="2" fill="none" opacity=".45"/>
      ${spk.use}
    </g>
    <!-- 地面与小径 -->
    <rect x="0" y="430" width="${W}" height="170" fill="#A8C4AA"/>
    <path d="M120 600 C180 520 240 500 390 490 L390 600 Z" fill="#B7CFB5" opacity=".8"/>
    <!-- 长椅:板条 + 靠背 -->
    <g>
      <rect x="150" y="486" width="120" height="9" rx="4" fill="#6E8A72"/>
      <rect x="154" y="472" width="112" height="7" rx="3.5" fill="#7C987E"/>
      <rect x="154" y="461" width="112" height="7" rx="3.5" fill="#86A286"/>
      <rect x="158" y="495" width="8" height="26" fill="#5E7A64"/>
      <rect x="254" y="495" width="8" height="26" fill="#5E7A64"/>
    </g>`;
    return svg('park', '', d);
  },

  /* 陈记面馆:蒸汽 + 菜单吊牌 + 凳 + 暖光增强 */
  noodle(){
    const r=rng(77);
    const lamp1=glow('g-noo-l1',150,64,90,'#FFD9A0',.5);
    const lamp2=glow('g-noo-l2',290,80,80,'#FFD9A0',.42);
    const steam=glow('g-noo-st',210,470,120,'#FFF2DC',.3);
    const d=`<defs>
      <linearGradient id="g-noo-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#5A4028"/><stop offset="55%" stop-color="#4A3320"/><stop offset="100%" stop-color="#33241608"/>
      </linearGradient>
      <linearGradient id="g-noo-low" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3A2A18"/><stop offset="100%" stop-color="#241A0E"/>
      </linearGradient>
      ${lamp1.def}${lamp2.def}${steam.def}
    </defs>
    <rect width="${W}" height="${H}" fill="#4A3320"/>
    <rect width="${W}" height="360" fill="url(#g-noo-wall)"/>
    ${lamp1.use}${lamp2.use}
    <!-- 吊灯 -->
    <rect x="144" y="0" width="12" height="52" fill="#2A1D10"/>
    <rect x="284" y="0" width="12" height="68" fill="#2A1D10"/>
    <path d="M132 52 L168 52 L160 72 L140 72 Z" fill="#E8B96B"/>
    <path d="M272 68 L308 68 L300 88 L280 88 Z" fill="#E8B96B"/>
    <!-- 菜单吊牌 -->
    <g opacity=".9">
      <rect x="60" y="90" width="34" height="52" rx="2" fill="#E8D8B8"/>
      <rect x="66" y="100" width="22" height="3" rx="1.5" fill="#8A6A42"/>
      <rect x="66" y="110" width="16" height="3" rx="1.5" fill="#8A6A42"/>
      <rect x="66" y="120" width="20" height="3" rx="1.5" fill="#8A6A42"/>
      <rect x="96" y="96" width="34" height="52" rx="2" fill="#E0CDA8"/>
      <rect x="102" y="106" width="22" height="3" rx="1.5" fill="#8A6A42"/>
      <rect x="102" y="116" width="14" height="3" rx="1.5" fill="#8A6A42"/>
    </g>
    <!-- 灶台白砖 -->
    <rect x="0" y="330" width="${W}" height="34" fill="#C8B494"/>
    <g stroke="#A89678" stroke-width="1" opacity=".7">
      <line x1="0" y1="344" x2="${W}" y2="344"/><line x1="0" y1="356" x2="${W}" y2="356"/>
      <line x1="60" y1="330" x2="60" y2="364"/><line x1="150" y1="330" x2="150" y2="364"/><line x1="240" y1="330" x2="240" y2="364"/><line x1="330" y1="330" x2="330" y2="364"/>
    </g>
    <rect x="0" y="364" width="${W}" height="236" fill="url(#g-noo-low)"/>
    <!-- 凳子两只 -->
    <g fill="#5A4426">
      <rect x="64" y="486" width="58" height="10" rx="5"/>
      <rect x="70" y="496" width="7" height="52"/><rect x="108" y="496" width="7" height="52"/>
      <rect x="272" y="486" width="58" height="10" rx="5"/>
      <rect x="278" y="496" width="7" height="52"/><rect x="316" y="496" width="7" height="52"/>
    </g>
    <!-- 大碗与蒸汽 -->
    ${steam.use}
    <path d="M150 560 C150 520 270 520 270 560 L262 588 L158 588 Z" fill="#D8C8A8"/>
    <path d="M142 560 C150 574 270 574 278 560" stroke="#B8A480" stroke-width="6" fill="none"/>
    <g stroke="#FFF2DC" stroke-width="2.4" fill="none" opacity=".65">
      <path d="M186 508 C180 494 192 486 186 472"/>
      <path d="M210 504 C204 488 216 480 210 464"/>
      <path d="M234 508 C228 494 240 486 234 472"/>
    </g>`;
    return svg('noodle', '', d);
  },
});
/* v2.4 美术升级第二批:clinic/gym/bookstore/store/observatory 重绘 + pawn 细节 */
Object.assign(builders, {

  /* 社区诊所:检测仪 + 输液架 + 等候椅 + 叫号屏 */
  clinic(){
    const r=rng(31);
    const l1=glow('g-cli-l1',195,70,170,'#F2F8FC',.5);
    const mon=glow('g-cli-mon',300,240,60,'#7FD4E8',.25);
    const d=`<defs>
      <linearGradient id="g-cli-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#EAF2F8"/><stop offset="100%" stop-color="#D4E2EE"/>
      </linearGradient>
      ${l1.def}${mon.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-cli-wall)"/>
    <!-- 墙上十字(小,不喧宾) -->
    <g opacity=".8">
      <rect x="46" y="88" width="10" height="30" rx="2" fill="#FFFFFF"/>
      <rect x="36" y="98" width="30" height="10" rx="2" fill="#FFFFFF"/>
    </g>
    ${l1.use}
    <!-- 神经检测仪:屏幕 + 波形 -->
    <g>
      <rect x="236" y="180" width="118" height="84" rx="6" fill="#FDFEFF" stroke="#B8CCD8" stroke-width="2"/>
      <rect x="250" y="194" width="90" height="42" rx="3" fill="#0F2030"/>
      <path d="M254 218 L270 218 L278 202 L290 230 L300 212 L312 218 L336 218" stroke="#5AD8E8" stroke-width="2" fill="none"/>
      <rect x="250" y="242" width="56" height="5" rx="2.5" fill="#D8E4EC"/>
      <rect x="316" y="242" width="24" height="5" rx="2.5" fill="#D8E4EC"/>
    </g>
    ${mon.use}
    <!-- 叫号屏:候诊 0 -->
    <g>
      <rect x="60" y="206" width="88" height="30" rx="3" fill="#10202E"/>
      <text x="104" y="227" font-family="ui-monospace,monospace" font-size="13" fill="#7FD4E8" text-anchor="middle" letter-spacing="1">候诊 0</text>
    </g>
    <!-- 诊桌 + 终端 -->
    <rect x="0" y="420" width="${W}" height="10" fill="#C2D2DE"/>
    <rect x="0" y="430" width="${W}" height="170" fill="#D6E2EC"/>
    <rect x="196" y="392" width="130" height="30" rx="3" fill="#E8F0F6" stroke="#B8CCD8"/>
    <rect x="206" y="372" width="34" height="22" rx="2" fill="#22384A"/>
    <!-- 输液架 -->
    <g stroke="#9AB2C4" stroke-width="3" fill="none">
      <line x1="70" y1="352" x2="70" y2="430"/>
      <line x1="52" y1="352" x2="88" y2="352"/>
    </g>
    <rect x="58" y="358" width="9" height="26" rx="4" fill="#DCE8F0"/>
    <!-- 等候椅两只 -->
    <g fill="#AFC4D2">
      <rect x="96" y="398" width="34" height="8" rx="4"/>
      <rect x="98" y="380" width="30" height="20" rx="4"/>
      <rect x="140" y="398" width="34" height="8" rx="4"/>
      <rect x="142" y="380" width="30" height="20" rx="4"/>
    </g>`;
    return svg('clinic', '', d);
  },

  /* 健身房:镜墙 + 哑铃架 + 跑步机 + 顶光 */
  gym(){
    const r=rng(45);
    const spot=glow('g-gym-spot',195,60,170,'#F2E8D8',.4);
    const d=`<defs>
      <linearGradient id="g-gym-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1A1E2C"/><stop offset="100%" stop-color="#12152A"/>
      </linearGradient>
      ${spot.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-gym-wall)"/>
    <!-- 镜墙:反射带 -->
    <rect x="228" y="120" width="150" height="330" fill="#181C30" stroke="#2A2F4A" stroke-width="2"/>
    <rect x="240" y="132" width="126" height="300" fill="#141830"/>
    <path d="M262 132 L262 432" stroke="#20264A" stroke-width="3" opacity=".8"/>
    <!-- 顶光 -->
    <rect x="60" y="18" width="120" height="8" rx="4" fill="#F2E8D8" opacity=".85"/>
    ${spot.use}
    <!-- 哑铃架:架 + 哑铃对 -->
    <g>
      <rect x="40" y="392" width="150" height="10" rx="3" fill="#2A2F4A"/>
      <rect x="46" y="402" width="8" height="70" fill="#20263E"/>
      <rect x="176" y="402" width="8" height="70" fill="#20263E"/>
      ${(() => { let s=''; const xs=[58,88,118,148]; for(const x of xs){ s+=`<rect x="${x}" y="366" width="7" height="28" fill="#2A2F4A"/><circle cx="${x+3.5}" cy="362" r="9" fill="#33395C"/><circle cx="${x+3.5}" cy="362" r="4.5" fill="#454C77"/>`; } return s; })()}
    </g>
    <!-- 跑步机 -->
    <g>
      <path d="M250 470 L360 470 L378 500 L262 500 Z" fill="#20263E"/>
      <rect x="256" y="448" width="96" height="16" rx="6" fill="#181D33"/>
      <rect x="342" y="398" width="10" height="54" fill="#20263E"/>
      <rect x="330" y="384" width="36" height="18" rx="3" fill="#262C4C"/>
      <rect x="336" y="389" width="24" height="4" rx="2" fill="#38F2D8" opacity=".45"/>
    </g>
    <!-- 地垫 -->
    <rect x="24" y="540" width="200" height="14" rx="7" fill="#1A1F36"/>
    <rect x="0" y="556" width="${W}" height="44" fill="#0E1122"/>`;
    return svg('gym', '', d);
  },

  /* 旧书店:书架墙 + 梯 + 柜台阅读灯 + 空猫碗 */
  bookstore(){
    const r=rng(56);
    const l1=glow('g-bk-l1',110,120,120,'#FFD9A0',.4);
    const lamp=glow('g-bk-lamp',300,360,66,'#FFE2A8',.45);
    const d=`<defs>
      <linearGradient id="g-bk-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3A2E20"/><stop offset="100%" stop-color="#2A2014"/>
      </linearGradient>
      ${l1.def}${lamp.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-bk-wall)"/>
    ${l1.use}
    <!-- 书架墙:三层 -->
    <rect x="0" y="120" width="${W}" height="330" fill="#241B10"/>
    <g>
      <rect x="0" y="182" width="${W}" height="5" fill="#4A3822"/>
      <rect x="0" y="292" width="${W}" height="5" fill="#4A3822"/>
      <rect x="0" y="402" width="${W}" height="5" fill="#4A3822"/>
      ${books(r,180,54)}${books(r,290,54)}${books(r,400,54)}
    </g>
    <!-- 靠梯 -->
    <g stroke="#5A4426" stroke-width="5" fill="none">
      <line x1="330" y1="150" x2="286" y2="446"/>
      <line x1="352" y1="150" x2="308" y2="446"/>
    </g>
    <g stroke="#5A4426" stroke-width="3.6">
      <line x1="324" y1="200" x2="348" y2="200"/>
      <line x1="316" y1="266" x2="340" y2="266"/>
      <line x1="308" y1="332" x2="332" y2="332"/>
      <line x1="300" y1="398" x2="324" y2="398"/>
    </g>
    <!-- 柜台 + 绿罩阅读灯 -->
    <rect x="0" y="446" width="${W}" height="10" fill="#4A3822"/>
    <rect x="0" y="456" width="${W}" height="144" fill="#332718"/>
    <rect x="180" y="470" width="120" height="14" rx="3" fill="#4A3822"/>
    <path d="M226 442 L262 442 L250 466 L238 466 Z" fill="#5A7A50"/>
    ${lamp.use}
    <circle cx="244" cy="470" r="7" fill="#FFE2A8"/>
    <!-- 空猫碗:猫今天没有出现 -->
    <g>
      <ellipse cx="90" cy="560" rx="20" ry="7" fill="#5A4426"/>
      <ellipse cx="90" cy="556" rx="14" ry="4.6" fill="#332718"/>
      <rect x="76" y="540" width="28" height="6" rx="3" fill="#4A3822"/>
    </g>`;
    return svg('bookstore', '', d);
  },

  /* 便利店:货架 + 冷柜 + 咖啡机 + 黄昏窗 */
  store(){
    const r=rng(67);
    const l1=glow('g-st-l1',195,60,170,'#FFF2D8',.4);
    const dusk=glow('g-st-dusk',60,150,110,'#FF9F5A',.3);
    const d=`<defs>
      <linearGradient id="g-st-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#E8E2D4"/><stop offset="100%" stop-color="#CFC6B4"/>
      </linearGradient>
      <linearGradient id="g-st-win" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8FA8C8"/><stop offset="100%" stop-color="#E8A878"/>
      </linearGradient>
      ${l1.def}${dusk.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-st-wall)"/>
    ${l1.use}
    <!-- 黄昏窗 -->
    <g>
      <rect x="30" y="110" width="130" height="170" rx="4" fill="url(#g-st-win)"/>
      <circle cx="60" cy="240" r="20" fill="#FFD9A0" opacity=".85"/>
      <rect x="30" y="188" width="130" height="4" fill="#FFFFFF" opacity=".5"/>
      <rect x="88" y="110" width="4" height="170" fill="#FFFFFF" opacity=".5"/>
      <rect x="26" y="106" width="138" height="6" rx="3" fill="#8A8272"/>
    </g>
    ${dusk.use}
    <!-- 货架两排:商品色块 -->
    <g>
      <rect x="196" y="150" width="170" height="8" fill="#B8AE9A"/>
      <rect x="196" y="230" width="170" height="8" fill="#B8AE9A"/>
      ${(() => { let s=''; const cols=['#D86A5A','#5AA8D8','#E8B84B','#7BC47F','#D88AB8','#8A7BD8']; for(let row=0;row<2;row++){ for(let k=0;k<8;k++){ const x=204+k*20+((row%2)*6); s+=`<rect x="${x}" y="${116+row*80}" width="13" height="${30+((k*7)%12)}" rx="2" fill="${cols[(k+row)%6]}"/>`; } } return s; })()}
    </g>
    <!-- 冷柜 -->
    <g>
      <rect x="196" y="330" width="170" height="130" rx="4" fill="#DCE8EC" stroke="#9AB2BC" stroke-width="2"/>
      <rect x="204" y="338" width="154" height="96" fill="#B8D8E0"/>
      ${(() => { let s=''; for(let row=0;row<3;row++){ s+=`<rect x="204" y="${368+row*26}" width="154" height="3" fill="#8FB8C4"/>`; for(let k=0;k<6;k++){ s+=`<rect x="${212+k*25}" y="${344+row*26}" width="9" height="20" rx="2" fill="${['#D86A5A','#5AA8D8','#E8B84B'][k%3]}"/>`; } } return s; })()}
      <rect x="204" y="438" width="60" height="5" rx="2.5" fill="#7A94A0"/>
    </g>
    <!-- 柜台 + 咖啡机 -->
    <rect x="0" y="470" width="${W}" height="14" fill="#A89E88"/>
    <rect x="0" y="484" width="${W}" height="116" fill="#BEB49E"/>
    <g>
      <rect x="60" y="428" width="52" height="42" rx="4" fill="#332E28"/>
      <rect x="68" y="436" width="36" height="14" rx="2" fill="#4A443C"/>
      <rect x="76" y="452" width="18" height="10" rx="2" fill="#8A6A42"/>
      <rect x="80" y="462" width="10" height="8" fill="#E8D8B8"/>
    </g>`;
    return svg('store', '', d);
  },

  /* 天文馆:穹顶 + 投影光锥 + 星座线 + 座位剪影 */
  observatory(){
    const r=rng(78);
    const proj=glow('g-obs-p',195,300,80,'#8FB8FF',.3);
    const d=`<defs>
      <linearGradient id="g-obs-dome" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0A0E22"/><stop offset="100%" stop-color="#101632"/>
      </linearGradient>
      <linearGradient id="g-obs-cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8FB8FF" stop-opacity=".4"/><stop offset="100%" stop-color="#8FB8FF" stop-opacity="0"/>
      </linearGradient>
      ${proj.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-obs-dome)"/>
    <!-- 穹顶弧 -->
    <path d="M-20 260 C80 120 310 120 410 260" stroke="#232B52" stroke-width="10" fill="none"/>
    ${stars(r,60,300)}
    <!-- 投影机 + 光锥 -->
    <rect x="176" y="286" width="38" height="22" rx="4" fill="#1A2040" stroke="#2A3352"/>
    <path d="M180 308 L100 470 L290 470 L210 308 Z" fill="url(#g-obs-cone)"/>
    ${proj.use}
    <!-- 星座连线(投影在穹顶) -->
    <g stroke="#8FB8FF" stroke-width="1.1" opacity=".75" fill="#C8D8FF">
      <path d="M80 90 L130 70 L170 95 L220 60 L270 88 L320 55" fill="none"/>
      <circle cx="80" cy="90" r="2.2"/><circle cx="130" cy="70" r="2.6"/><circle cx="170" cy="95" r="2"/>
      <circle cx="220" cy="60" r="2.8"/><circle cx="270" cy="88" r="2.2"/><circle cx="320" cy="55" r="2.6"/>
    </g>
    <g stroke="#C8D8FF" stroke-width="1" opacity=".55" fill="none">
      <path d="M60 150 L110 132 L150 158 L210 126"/>
    </g>
    <!-- 座位剪影两排 -->
    <g fill="#0C1026">
      <path d="M30 470 L30 448 C30 442 60 442 60 448 L60 470 Z"/>
      <path d="M120 470 L120 448 C120 442 150 442 150 448 L150 470 Z"/>
      <path d="M240 470 L240 448 C240 442 270 442 270 448 L270 470 Z"/>
      <path d="M330 470 L330 448 C330 442 360 442 360 448 L360 470 Z"/>
    </g>
    <rect x="0" y="470" width="${W}" height="130" fill="#0A0D1E"/>
    <g fill="#0E1330">
      <rect x="10" y="500" width="80" height="12" rx="6"/>
      <rect x="150" y="512" width="80" height="12" rx="6"/>
      <rect x="290" y="500" width="80" height="12" rx="6"/>
    </g>`;
    return svg('observatory', '', d);
  },
});

/* pawn 抽屉细节:把手 + 标签 */
(() => {
  const old = builders.pawn;
  builders.pawn = function(){
    const svgStr = old.apply(this, arguments);
    /* 在既有 SVG 末尾追加细节层(抽屉把手与标签) */
    return svgStr.replace('</svg>', `
      <g fill="#2A2014">
        ${(() => { let s=''; for(let row=0;row<4;row++){ for(let col=0;col<4;col++){ const x=44+col*82, y=150+row*108; s+=`<circle cx="${x+38}" cy="${y+46}" r="3.4" fill="#6B5230"/><rect x="${x+26}" y="${y+20}" width="24" height="9" rx="2" fill="#8A7248" opacity=".65"/>`; } } return s; })()}
      </g>
    </svg>`);
  };
})();

/* v2.6 美术升级第三批:剩余 9 张场景全部重做(标注墙/浅海/隔夜池/实验室/服务间/顶层/云梯塔/天台/典当行) */
Object.assign(builders, {

  /* 语义采集·供体池:标注墙(面板×9,红框/通过/驳回) + 工位 + 扫描线 */
  annot(){
    const r=rng(101);
    const l1=glow('g-an-l1',195,120,170,'#5A8FB8',.3);
    const scan=glow('g-an-scan',195,286,90,'#38F2D8',.14);
    const d=`<defs>
      <linearGradient id="g-an-air" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B1220"/><stop offset="100%" stop-color="#070C16"/>
      </linearGradient>
      ${l1.def}${scan.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-an-air)"/>
    ${l1.use}
    ${(() => {
      let s = '';
      const states = ['ok','ok','reject','ok','face','reject','ok','ok','face'];
      for (let i = 0; i < 9; i++) {
        const x = 42 + (i % 3) * 108, y = 66 + Math.floor(i / 3) * 108;
        const st = states[i];
        let inner = `<rect x="${x}" y="${y}" width="88" height="92" rx="4" fill="#101A30" stroke="#22345A" stroke-width="1.4"/>
          <ellipse cx="${x + 44}" cy="${y + 38}" rx="17" ry="21" fill="#1B2A48"/>
          <rect x="${x + 14}" y="${y + 68}" width="60" height="4" rx="2" fill="#22345A"/>
          <rect x="${x + 14}" y="${y + 77}" width="38" height="4" rx="2" fill="#1B2A48"/>`;
        if (st === 'face') inner += `<rect x="${x + 27}" y="${y + 17}" width="34" height="42" fill="none" stroke="#38F2D8" stroke-width="1.2" opacity=".8"/><rect x="${x + 58}" y="${y + 8}" width="24" height="9" rx="1.5" fill="#38F2D8" opacity=".55"/>`;
        if (st === 'reject') inner += `<rect x="${x + 27}" y="${y + 17}" width="34" height="42" fill="none" stroke="#FF6B5E" stroke-width="1.2" opacity=".8"/><path d="M${x + 30} ${y + 14} L${x + 58} ${y + 62}" stroke="#FF6B5E" stroke-width="2" opacity=".75"/><rect x="${x + 58}" y="${y + 8}" width="24" height="9" rx="1.5" fill="#FF6B5E" opacity=".5"/>`;
        if (st === 'ok') inner += `<rect x="${x + 58}" y="${y + 8}" width="24" height="9" rx="1.5" fill="#4A9E6E" opacity=".6"/>`;
        s += inner;
      }
      return s;
    })()}
    ${scan.use}
    <rect x="0" y="430" width="${W}" height="10" fill="#0C1322"/>
    <rect x="0" y="440" width="${W}" height="160" fill="#080D18"/>
    <rect x="70" y="398" width="110" height="34" rx="3" fill="#0E1626" stroke="#22345A"/>
    <rect x="80" y="406" width="40" height="3" rx="1.5" fill="#38F2D8" opacity=".5"/>
    <rect x="80" y="414" width="26" height="3" rx="1.5" fill="#38F2D8" opacity=".3"/>
    <rect x="222" y="398" width="110" height="34" rx="3" fill="#0E1626" stroke="#22345A"/>
    <rect x="232" y="406" width="40" height="3" rx="1.5" fill="#FF6B5E" opacity=".5"/>
    <rect x="232" y="414" width="26" height="3" rx="1.5" fill="#FF6B5E" opacity=".3"/>
    <path d="M40 470 C40 442 66 436 78 452 L78 470 Z" fill="#0E1626"/>
    <g stroke="#141E36" stroke-width="2" opacity=".9">
      <path d="M0 452 C60 444 90 452 130 452"/><path d="M200 452 C260 444 330 452 390 452"/>
    </g>`;
    return svg('annot', '', d);
  },

  /* 感知渲染·浅海:落日海面 + 光路 + 渲染框 + 城市远灯 */
  render(){
    const r=rng(112);
    const sun=glow('g-ren-sun',195,286,120,'#FFE8B8',.75);
    const path=glow('g-ren-path',195,440,60,'#FFD9A0',.4);
    const d=`<defs>
      <linearGradient id="g-ren-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2E2444"/><stop offset="40%" stop-color="#8A4A58"/><stop offset="72%" stop-color="#D9825A"/><stop offset="100%" stop-color="#FFD9A0"/>
      </linearGradient>
      <linearGradient id="g-ren-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#20355C"/><stop offset="100%" stop-color="#101A34"/>
      </linearGradient>
      ${sun.def}${path.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-ren-sky)"/>
    <circle cx="195" cy="286" r="52" fill="#FFEFC8"/>
    ${sun.use}
    <g fill="#FFD9A0">
      <rect x="20" y="296" width="3" height="3" opacity=".8"/><rect x="52" y="300" width="2.4" height="2.4" opacity=".6"/>
      <rect x="330" y="298" width="3" height="3" opacity=".7"/><rect x="358" y="294" width="2.4" height="2.4" opacity=".5"/>
      <rect x="88" y="298" width="2" height="2" opacity=".5"/>
    </g>
    <rect x="0" y="304" width="${W}" height="${H - 304}" fill="url(#g-ren-sea)"/>
    ${path.use}
    <g stroke="#FFD9A0" opacity=".5">
      <line x1="165" y1="316" x2="225" y2="316" stroke-width="2.4"/>
      <line x1="150" y1="342" x2="240" y2="342" stroke-width="2"/>
      <line x1="132" y1="378" x2="258" y2="378" stroke-width="1.8"/>
      <line x1="112" y1="424" x2="278" y2="424" stroke-width="1.6"/>
      <line x1="92" y1="480" x2="298" y2="480" stroke-width="1.4"/>
    </g>
    <g stroke="#8FB8D8" opacity=".35" fill="none">
      <path d="M0 330 C60 326 130 334 195 330 C260 326 330 334 390 330"/>
      <path d="M0 380 C70 376 140 384 195 380 C260 376 320 384 390 380"/>
      <path d="M0 436 C70 432 140 440 195 436 C260 432 320 440 390 436"/>
      <path d="M0 520 C70 516 140 524 195 520 C260 516 320 524 390 520"/>
    </g>
    <g>
      <rect x="252" y="330" width="96" height="72" fill="none" stroke="#DFF6F2" stroke-width="2.4" opacity=".9"/>
      <rect x="256" y="334" width="88" height="64" fill="#2E5E8A" opacity=".35"/>
      <path d="M256 380 C280 372 320 388 344 378" stroke="#DFF6F2" stroke-width="1.4" fill="none" opacity=".7"/>
      <circle cx="300" cy="352" r="10" fill="#FFEFC8" opacity=".8"/>
      <rect x="252" y="322" width="44" height="8" rx="2" fill="#0D1526" opacity=".8"/>
    </g>
    <rect x="20" y="470" width="12" height="90" fill="#0A1020"/>
    <rect x="10" y="464" width="32" height="8" rx="3" fill="#0C1322"/>
    <rect x="352" y="500" width="12" height="70" fill="#0A1020"/>`;
    return svg('render', '', d);
  },

  /* 情绪算力·隔夜池:曲面屏墙(蜡烛) + 交易桌 + 城市夜窗 */
  finance(){
    const r=rng(123);
    const wall=glow('g-fin-wall',195,240,190,'#1E3A5C',.5);
    const lamp=glow('g-fin-lamp',70,430,60,'#E8B96B',.3);
    const d=`<defs>
      <linearGradient id="g-fin-air" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0A0F22"/><stop offset="100%" stop-color="#060A16"/>
      </linearGradient>
      ${wall.def}${lamp.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-fin-air)"/>
    ${wall.use}
    <g stroke="#16233E" stroke-width="1">
      <line x1="0" y1="96" x2="390" y2="96"/><line x1="0" y1="168" x2="390" y2="168"/><line x1="0" y1="240" x2="390" y2="240"/><line x1="0" y1="312" x2="390" y2="312"/>
      <line x1="65" y1="40" x2="65" y2="360"/><line x1="130" y1="40" x2="130" y2="360"/><line x1="195" y1="40" x2="195" y2="360"/><line x1="260" y1="40" x2="260" y2="360"/><line x1="325" y1="40" x2="325" y2="360"/>
    </g>
    ${(() => {
      let s = ''; const rr = rng(9);
      let base = 150;
      for (let i = 0; i < 14; i++) {
        const x = 22 + i * 26;
        const up = rr() > 0.42;
        const bodyH = 14 + rr() * 26;
        const yTop = base - bodyH * (up ? 0.25 : 0.75);
        const col = up ? '#3FBF8F' : '#E85A5A';
        s += `<line x1="${x + 7}" y1="${yTop - 12}" x2="${x + 7}" y2="${yTop + bodyH + 12}" stroke="${col}" stroke-width="1.2" opacity=".85"/>`;
        s += `<rect x="${x}" y="${yTop}" width="14" height="${bodyH}" fill="${col}" opacity=".9"/>`;
        base += (up ? -14 : 10) + (rr() - 0.5) * 16;
        base = Math.max(120, Math.min(300, base));
      }
      return s;
    })()}
    <path d="M20 200 C80 176 140 208 195 172 C250 140 310 156 372 120" stroke="#FFD166" stroke-width="1.6" fill="none" opacity=".8"/>
    <rect x="0" y="392" width="${W}" height="10" fill="#0C1226"/>
    <rect x="0" y="402" width="${W}" height="198" fill="#080C18"/>
    <g fill="#0E1730" stroke="#22345A">
      <rect x="36" y="356" width="110" height="40" rx="3"/>
      <rect x="248" y="356" width="110" height="40" rx="3"/>
    </g>
    <rect x="46" y="364" width="52" height="3" rx="1.5" fill="#3FBF8F" opacity=".6"/>
    <rect x="46" y="372" width="36" height="3" rx="1.5" fill="#E85A5A" opacity=".5"/>
    <rect x="258" y="364" width="52" height="3" rx="1.5" fill="#FFD166" opacity=".6"/>
    <rect x="258" y="372" width="36" height="3" rx="1.5" fill="#3FBF8F" opacity=".4"/>
    ${lamp.use}
    <g fill="#FFD9A0" opacity=".5">
      <rect x="130" y="436" width="3" height="3"/><rect x="180" y="452" width="2.4" height="2.4"/><rect x="240" y="440" width="3" height="3"/><rect x="300" y="460" width="2.4" height="2.4"/>
    </g>`;
    return svg('finance', '', d);
  },

  /* 折叠直觉·生物池:蛋白缎带 + 分子中心 + 样本架 + 冷窗 */
  lab(){
    const r=rng(134);
    const core=glow('g-lab-core',195,210,130,'#7FE8C8',.4);
    const d=`<defs>
      <linearGradient id="g-lab-air" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0A141E"/><stop offset="100%" stop-color="#060C12"/>
      </linearGradient>
      ${core.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-lab-air)"/>
    ${core.use}
    <path d="M60 160 C110 120 160 190 195 160 C230 130 280 200 330 160" stroke="#7FE8C8" stroke-width="5" fill="none" opacity=".9"/>
    <path d="M60 172 C110 132 160 202 195 172 C230 142 280 212 330 172" stroke="#3FA88C" stroke-width="5" fill="none" opacity=".7"/>
    <circle cx="195" cy="210" r="22" fill="#BFF2E0"/>
    <circle cx="195" cy="210" r="30" fill="none" stroke="#7FE8C8" stroke-width="1.2" opacity=".7"/>
    ${(() => { let s = ''; const rr = rng(5); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.3; const x = 195 + Math.cos(a) * 56, y = 210 + Math.sin(a) * 56; s += `<line x1="195" y1="210" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#5AC8B0" stroke-width="1.6" opacity=".8"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#7FE8C8" opacity=".9"/>`; } return s; })()}
    <g>
      <rect x="286" y="330" width="104" height="150" fill="#0F1E2A"/>
      <rect x="296" y="344" width="84" height="60" fill="#12242E"/>
      <path d="M296 404 L380 404" stroke="#1E3A44" stroke-width="3"/>
      <rect x="300" y="412" width="18" height="52" fill="#0A141C"/>
      <rect x="326" y="412" width="18" height="52" fill="#0A141C"/>
    </g>
    <g>
      <rect x="24" y="470" width="110" height="8" rx="3" fill="#12202C"/>
      <rect x="30" y="478" width="98" height="30" fill="#0E1A24"/>
      ${(() => { let s = ''; const cols = ['#7FE8C8','#5AB8E8','#E8D85A','#D86A9E','#9E7FE8']; for (let i = 0; i < 5; i++) { const x = 38 + i * 20; s += `<rect x="${x}" y="452" width="12" height="52" rx="5" fill="#1A2C38"/><rect x="${x + 2.4}" y="${472 + (i % 2) * 6}" width="7.2" height="${32 - (i % 2) * 6}" rx="3" fill="${cols[i]}" opacity=".9"/>`; } return s; })()}
    </g>
    <rect x="0" y="508" width="${W}" height="8" fill="#12202C"/>
    <rect x="0" y="516" width="${W}" height="84" fill="#0A141C"/>
    <text x="195" y="470" font-family="ui-monospace,monospace" font-size="10" fill="#3FA88C" text-anchor="middle" letter-spacing="2" opacity=".8">临床级 · 保密协议已签署</text>`;
    return svg('lab', '', d);
  },

  /* 服务间:服务器通道(透视) + 数据线 + 带头枕的椅子 */
  service(){
    const r=rng(145);
    const l1=glow('g-svc-l1',195,100,150,'#5A8FD8',.25);
    const d=`<defs>
      <linearGradient id="g-svc-air" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0A0C18"/><stop offset="100%" stop-color="#05070F"/>
      </linearGradient>
      ${l1.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-svc-air)"/>
    ${l1.use}
    ${(() => {
      let s = '';
      for (let i = 0; i < 5; i++) {
        const lh = 210 - i * 34, lw = 78 - i * 12;
        const ly = 120 + i * 44, lx = 24 + i * 16;
        const rx = 390 - lx - lw;
        s += `<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" fill="#0D1224" stroke="#1C2542" stroke-width="1.4"/>`;
        s += `<rect x="${390 - lx - lw}" y="${ly}" width="${lw}" height="${lh}" fill="#0D1224" stroke="#1C2542" stroke-width="1.4"/>`;
        for (let u = 0; u < 6; u++) {
          const uy = ly + 16 + u * (lh - 30) / 6;
          s += `<rect x="${lx + 8}" y="${uy}" width="${lw - 16}" height="${(lh - 40) / 6}" rx="2" fill="#111A34"/>`;
          s += `<rect x="${390 - lx - lw + 8}" y="${uy}" width="${lw - 16}" height="${(lh - 40) / 6}" rx="2" fill="#111A34"/>`;
          s += `<circle cx="${lx + 14}" cy="${uy + (lh - 40) / 12}" r="1.6" fill="${i % 2 ? '#38F2D8' : '#FF4FD8'}" opacity=".85"/>`;
          s += `<circle cx="${390 - lx - lw + 14}" cy="${uy + (lh - 40) / 12}" r="1.6" fill="${i % 2 ? '#FF4FD8' : '#38F2D8'}" opacity=".85"/>`;
        }
      }
      return s;
    })()}
    <g stroke="#141C38" stroke-width="2" opacity=".8">
      <line x1="120" y1="500" x2="150" y2="560"/><line x1="270" y1="500" x2="240" y2="560"/>
    </g>
    <g>
      <rect x="168" y="398" width="54" height="14" rx="7" fill="#1C2542"/>
      <line x1="186" y1="412" x2="182" y2="452" stroke="#1C2542" stroke-width="7"/>
      <path d="M160 452 L212 452 L204 486 L168 486 Z" fill="#151A34"/>
      <line x1="170" y1="486" x2="164" y2="520" stroke="#1C2542" stroke-width="6"/>
      <line x1="202" y1="486" x2="208" y2="520" stroke="#1C2542" stroke-width="6"/>
    </g>
    <path d="M182 420 C182 448 190 470 186 492" stroke="#2A3352" stroke-width="2.2" fill="none"/>
    <circle cx="186" cy="494" r="3.2" fill="#38F2D8" opacity=".85"/>`;
    return svg('service', '', d);
  },

  /* 88层顶层:落地窗外城市在脚下 + 香槟与剪影 */
  penthouse(){
    const r=rng(156);
    const room=glow('g-pen-room',195,300,200,'#C89A5A',.28);
    const d=`<defs>
      <linearGradient id="g-pen-win" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0A0E22"/><stop offset="70%" stop-color="#131A38"/><stop offset="100%" stop-color="#2A2038"/>
      </linearGradient>
      ${room.def}
    </defs>
    <rect width="${W}" height="${H}" fill="#171018"/>
    <rect x="34" y="60" width="322" height="380" fill="url(#g-pen-win)"/>
    ${stars(r,20,140)}
    <g>
      <rect x="50" y="240" width="34" height="200" fill="#0C1128"/>
      <rect x="96" y="200" width="42" height="240" fill="#0E1330"/>
      <rect x="150" y="256" width="30" height="184" fill="#0C1128"/>
      <rect x="192" y="216" width="46" height="224" fill="#0E1330"/>
      <rect x="250" y="236" width="36" height="204" fill="#0C1128"/>
      <rect x="298" y="192" width="44" height="248" fill="#0E1330"/>
      ${windows(r,16,220,420,'#FFD9A0',.55)}
      <rect x="192" y="216" width="46" height="4" fill="#FF5A5A" opacity=".7"/>
    </g>
    <rect x="28" y="54" width="334" height="392" fill="none" stroke="#3A2E20" stroke-width="8"/>
    <line x1="195" y1="54" x2="195" y2="446" stroke="#3A2E20" stroke-width="6"/>
    ${room.use}
    <g fill="#E8C46B" opacity=".92">
      <path d="M128 356 L134 356 L132 380 L130 380 Z"/>
      <rect x="129.4" y="380" width="3" height="14"/><rect x="124" y="394" width="14" height="3" rx="1.4"/>
      <path d="M146 352 L152 352 L150 378 L148 378 Z"/>
      <rect x="147.4" y="378" width="3" height="14"/><rect x="142" y="392" width="14" height="3" rx="1.4"/>
    </g>
    <g fill="#0D1226">
      <circle cx="86" cy="372" r="11"/>
      <path d="M70 446 C72 392 100 392 102 446 Z"/>
      <circle cx="262" cy="366" r="11"/>
      <path d="M246 446 C248 390 276 390 278 446 Z"/>
    </g>
    <rect x="0" y="446" width="${W}" height="154" fill="#1A1410"/>
    <path d="M0 446 L390 446 L390 470 L0 470 Z" fill="#241C14"/>`;
    return svg('penthouse', '', d);
  },

  /* 云梯塔:41层塔身亮窗 + 天线缆 + 三层城市 + 顶灯 */
  tower(){
    const r=rng(46);
    const l1=glow('g-tow-l1',195,84,160,'#8FB8D8',.3);
    const d=`<defs>
      <linearGradient id="g-tow-air" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B1020"/><stop offset="100%" stop-color="#070A16"/>
      </linearGradient>
      <linearGradient id="g-tow-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2A3352"/><stop offset="100%" stop-color="#161C36"/>
      </linearGradient>
      ${l1.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-tow-air)"/>
    ${stars(r,30,150)}
    ${l1.use}
    <path d="${skyline(rng(11),H-60,80,150,24,46)}" fill="#121A32" opacity=".9"/>
    <rect x="152" y="150" width="86" height="420" fill="url(#g-tow-body)"/>
    <rect x="146" y="142" width="98" height="12" rx="2" fill="#20283F"/>
    ${windows(r,14,170,520,'#8FB8FF',.5)}
    <g stroke="#1C2542" stroke-width="1.6" opacity=".9">
      <line x1="152" y1="220" x2="238" y2="220"/><line x1="152" y1="300" x2="238" y2="300"/><line x1="152" y1="380" x2="238" y2="380"/><line x1="152" y1="460" x2="238" y2="460"/>
    </g>
    <rect x="191" y="96" width="8" height="48" fill="#20283F"/>
    <circle cx="195" cy="90" r="4" fill="#FF5A5A"/>
    <path d="M153 150 L120 96 M237 150 L270 96" stroke="#1C2542" stroke-width="1.6" fill="none"/>
    <path d="${skyline(rng(21),H-20,60,110,28,54)}" fill="#0D1326"/>
    ${windows(r,20,470,560,'#8FB8FF',.35)}
    <rect x="70" y="20" width="110" height="8" rx="4" fill="#8FB8D8" opacity=".6"/>
    <ellipse cx="195" cy="580" rx="150" ry="26" fill="#121A32" opacity=".8"/>`;
    return svg('tower', '', d);
  },

  /* 天台:晚霞 + 天际线 + 两位剪影(天线/水塔/晾衣绳) */
  zao(){
    const r=rng(57);
    const sun=glow('g-zao-sun',195,336,110,'#FFE8B8',.85);
    const d=`<defs>
      <linearGradient id="g-zao-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2A2044"/><stop offset="45%" stop-color="#7A3E58"/><stop offset="75%" stop-color="#D87850"/><stop offset="100%" stop-color="#FFAE64"/>
      </linearGradient>
      ${sun.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-zao-sky)"/>
    <circle cx="195" cy="336" r="46" fill="#FFF3D0"/>
    ${sun.use}
    <path d="${skyline(rng(13),H-118,70,150,26,48)}" fill="#4A2E4E" opacity=".9"/>
    ${windows(r,16,H-180,H-130,'#FFD9A0',.5)}
    <path d="${skyline(rng(29),H-40,50,100,30,58)}" fill="#2E1E3E"/>
    ${windows(r,22,H-100,H-46,'#FFD9A0',.4)}
    <g fill="#241A34">
      <rect x="52" y="436" width="18" height="26"/>
      <path d="M48 436 L70 436 L66 412 L52 412 Z"/>
      <line x1="61" y1="412" x2="61" y2="396"/>
      <line x1="320" y1="440" x2="320" y2="404"/><line x1="308" y1="404" x2="332" y2="404"/><line x1="308" y1="404" x2="320" y2="440"/><line x1="332" y1="404" x2="320" y2="440"/>
    </g>
    <path d="M240 420 C280 428 330 424 372 418" stroke="#241A34" stroke-width="1.6" fill="none"/>
    <rect x="272" y="420" width="3" height="12" fill="#241A34"/>
    <rect x="330" y="424" width="3" height="10" fill="#241A34"/>
    <rect x="0" y="524" width="${W}" height="12" fill="#1A1028"/>
    <rect x="0" y="536" width="${W}" height="64" fill="#140C20"/>
    <g fill="#0D1226">
      <circle cx="150" cy="470" r="10"/>
      <path d="M136 524 C138 484 164 484 166 524 Z"/>
      <circle cx="222" cy="474" r="10"/>
      <path d="M208 524 C210 488 236 488 238 524 Z"/>
    </g>
    <rect x="182" y="500" width="7" height="18" rx="3" fill="#FF9F5A"/>
    <rect x="240" y="504" width="7" height="16" rx="3" fill="#FF9F5A" opacity=".85"/>`;
    return svg('zao', '', d);
  },

  /* 典当行:暖灯 + 吊牌串 + 戥子 + 抽屉墙(深化) */
  pawn(){
    const r=rng(68);
    const l1=glow('g-pw-l1',195,80,170,'#E8B96B',.45);
    const d=`<defs>
      <linearGradient id="g-pw-air" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#241A0E"/><stop offset="100%" stop-color="#140E06"/>
      </linearGradient>
      ${l1.def}
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g-pw-air)"/>
    ${l1.use}
    <g>
      <rect x="0" y="120" width="${W}" height="330" fill="#1A1208"/>
      ${(() => {
        let s = '';
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            const x = 44 + col * 82, y = 150 + row * 80;
            s += `<rect x="${x}" y="${y}" width="76" height="66" rx="3" fill="#2E2212" stroke="#4A3822" stroke-width="1.4"/>`;
            s += `<circle cx="${x + 38}" cy="${y + 40}" r="3.6" fill="#6B5230"/><rect x="${x + 25}" y="${y + 14}" width="26" height="10" rx="2" fill="#8A7248" opacity=".7"/>`;
          }
        }
        return s;
      })()}
    </g>
    <path d="M20 96 C120 112 280 112 372 94" stroke="#5A4426" stroke-width="1.8" fill="none"/>
    ${(() => {
      let s = ''; const xs = [64, 148, 238, 322];
      for (const x of xs) { s += `<line x1="${x}" y1="102" x2="${x}" y2="122" stroke="#5A4426" stroke-width="1.4"/><rect x="${x - 15}" y="122" width="30" height="20" rx="2" fill="#D8C8A0"/><rect x="${x - 9}" y="128" width="18" height="2.6" rx="1.3" fill="#6B5230"/><rect x="${x - 9}" y="134" width="12" height="2.6" rx="1.3" fill="#6B5230"/>`; }
      return s;
    })()}
    <rect x="0" y="460" width="${W}" height="12" fill="#4A3822"/>
    <rect x="0" y="472" width="${W}" height="128" fill="#332718"/>
    <g>
      <rect x="196" y="430" width="90" height="30" rx="3" fill="#2E2212" stroke="#4A3822"/>
      <line x1="241" y1="404" x2="241" y2="430" stroke="#8A7248" stroke-width="2.4"/>
      <line x1="206" y1="404" x2="276" y2="404" stroke="#8A7248" stroke-width="2.4"/>
      <path d="M198 404 A43 20 0 0 0 284 404" stroke="#C9A24B" stroke-width="2" fill="none"/>
      <circle cx="206" cy="404" r="3" fill="#C9A24B"/><circle cx="276" cy="404" r="3" fill="#C9A24B"/>
    </g>`;
    return svg('pawn', '', d);
  },
});

return { build, keys:Object.keys(builders) };


})();
