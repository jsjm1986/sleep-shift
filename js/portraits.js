/* 《睡班》— VN 角色剪影头像(几何剪影 + 识别物 + 单色 rim light)
   window.PORTRAITS[who] → 内联 SVG(64×64,填充 .vnPortrait 圆框) */
'use strict';
window.PORTRAITS = (function(){
  const INK = '#0D1226';
  const rim = (tone, d, op) => `<path d="${d}" stroke="${tone}" stroke-width="1.6" fill="none" opacity="${op || .85}" stroke-linecap="round"/>`;
  const bust = (extra, tone, rimPath) => `
    <svg viewBox="0 0 64 64" style="width:100%;height:100%;display:block">
      <rect width="64" height="64" fill="none"/>
      <path d="M32 10 C24 10 19 17 19 26 C19 32 21 36 24 39 C15 42 10 48 9 58 L55 58 C54 48 49 42 40 39 C43 36 45 32 45 26 C45 17 40 10 32 10 Z" fill="${INK}"/>
      ${extra || ''}
      ${rimPath ? rim(tone, rimPath) : ''}
    </svg>`;

  return {
    /* 阿枣:马尾 + 手边汽水 */
    zao: bust(
      `<path d="M42 12 C50 16 51 28 45 35 C49 27 47 18 41 14 Z" fill="${INK}"/>
       <path d="M42 13 C49 17 50 27 45 34" stroke="#FF9F5A" stroke-width="1.4" fill="none" opacity=".8"/>
       <rect x="46" y="40" width="8" height="16" rx="2.5" fill="#FF9F5A" opacity=".92"/>
       <rect x="46" y="44" width="8" height="2.4" fill="#0D1226" opacity=".55"/>`,
      '#FF9F5A', 'M22 14 C20 20 20 30 24 36'),
    /* 面娘:头巾 + 袖口 */
    mian: bust(
      `<path d="M17 26 C16 10 48 10 47 26 L47 20 C47 6 17 6 17 20 Z" fill="#C0392B" opacity=".95"/>
       <path d="M17 26 C22 30 42 30 47 26" stroke="#C0392B" stroke-width="2.4" fill="none" opacity=".9"/>
       <circle cx="24" cy="20" r="1.6" fill="#E8B96B"/><circle cx="40" cy="20" r="1.6" fill="#E8B96B"/>`,
      '#C0392B', 'M21 14 C19 20 19 30 23 37'),
    /* 017:头盔 + 抗眠素输液管 */
    j17: bust(
      `<path d="M18 27 C17 9 47 9 46 27 L46 23 C46 12 18 12 18 23 Z" fill="#5D6D7E"/>
       <rect x="16" y="25" width="32" height="4" rx="2" fill="#5D6D7E"/>
       <path d="M45 22 C55 25 57 39 49 47" stroke="#7C93B4" stroke-width="1.6" fill="none" opacity=".85"/>
       <circle cx="49" cy="47" r="2.2" fill="#7C93B4" opacity=".9"/>`,
      '#5D6D7E', 'M20 14 C18 20 18 30 22 37'),
    /* 3409:长发侧影 + 暖格光 */
    r3409: bust(
      `<path d="M18 40 C12 28 16 8 32 8 C48 8 52 28 46 40 L42 40 C48 30 46 14 32 14 C18 14 16 30 22 40 Z" fill="${INK}"/>
       <circle cx="32" cy="46" r="3" fill="#7B61FF" opacity=".8"/>`,
      '#7B61FF', 'M44 14 C48 22 48 32 44 40'),
    /* 小满:碎光虚线(不画实心) */
    xiaoman: `
    <svg viewBox="0 0 64 64" style="width:100%;height:100%;display:block">
      <circle cx="32" cy="26" r="13" fill="none" stroke="#38F2D8" stroke-width="1.6" stroke-dasharray="3 4.2" opacity=".9"/>
      <path d="M14 56 C16 44 26 40 32 40 C38 40 48 44 50 56" fill="none" stroke="#38F2D8" stroke-width="1.6" stroke-dasharray="3 4.2" opacity=".75"/>
      <circle cx="20" cy="16" r="1.4" fill="#38F2D8" opacity=".8"/>
      <circle cx="46" cy="12" r="1.1" fill="#7B61FF" opacity=".8"/>
      <circle cx="12" cy="30" r="1.1" fill="#FF4FD8" opacity=".7"/>
      <circle cx="32" cy="24" r="1.6" fill="#38F2D8"/>
      <path d="M30 26 C30 30 34 30 34 26" stroke="#38F2D8" stroke-width="1.2" fill="none" opacity=".8"/>
    </svg>`,
    /* 何主管:领带 + 工牌 */
    he: bust(
      `<path d="M32 39 L28.5 43 L32 55 L35.5 43 Z" fill="#8A7B62"/>
       <rect x="24" y="44" width="5" height="8" rx="1" fill="#8A7B62" opacity=".75"/>
       <path d="M19 22 C19 15 26 11 32 11 C38 11 45 15 45 22" stroke="#8A7B62" stroke-width="1.2" fill="none" opacity=".5"/>`,
      '#8A7B62', 'M43 13 C45 20 45 30 42 37'),
    /* 鱼骨:毛线帽 + 烟 */
    yu: bust(
      `<path d="M18 24 C18 10 46 10 46 24 L46 27 L18 27 Z" fill="${INK}"/>
       <path d="M18 24 C22 20 42 20 46 24" stroke="#5D6D7E" stroke-width="1.4" fill="none" opacity=".8"/>
       <rect x="44" y="30" width="9" height="2" rx="1" fill="#E8C46B" opacity=".9"/>
       <path d="M55 26 C60 20 54 16 58 10" stroke="#9AA6B8" stroke-width="1.2" fill="none" opacity=".5"/>`,
      '#5D6D7E', 'M21 14 C19 20 19 30 23 37'),
    /* 守望者:兜帽 + 拉链 */
    guardian: `
    <svg viewBox="0 0 64 64" style="width:100%;height:100%;display:block">
      <path d="M32 6 C17 8 12 26 17 44 L47 44 C52 26 47 8 32 6 Z" fill="${INK}"/>
      <path d="M32 12 C22 14 19 28 23 40 L41 40 C45 28 42 14 32 12 Z" fill="#070B18"/>
      <path d="M32 12 L32 44" stroke="#5AC8FA" stroke-width="1.2" opacity=".55"/>
      <path d="M14 56 C16 46 24 42 32 42 C40 42 48 46 50 56" fill="${INK}"/>
      ${rim('#5AC8FA', 'M17 12 C13 22 14 34 19 42')}
    </svg>`,
    /* 温先生:背头 + 金丝眼镜 */
    wen: bust(
      `<circle cx="26" cy="25" r="5.4" fill="none" stroke="#E8C46B" stroke-width="1.3" opacity=".9"/>
       <circle cx="38" cy="25" r="5.4" fill="none" stroke="#E8C46B" stroke-width="1.3" opacity=".9"/>
       <line x1="31.4" y1="25" x2="32.6" y2="25" stroke="#E8C46B" stroke-width="1.3"/>
       <path d="M22 16 C26 12 38 12 42 16" stroke="#E8C46B" stroke-width="1.2" fill="none" opacity=".6"/>
       <path d="M32 40 L29 44 L32 54 L35 44 Z" fill="#E8C46B" opacity=".85"/>`,
      '#E8C46B', 'M43 13 C45 20 45 30 42 37'),
    /* 睡班系统:CRT */
    sys: `
    <svg viewBox="0 0 64 64" style="width:100%;height:100%;display:block">
      <rect x="12" y="12" width="40" height="30" rx="4" fill="${INK}" stroke="#7C93B4" stroke-width="1.4"/>
      <rect x="16" y="16" width="32" height="22" rx="2" fill="#0A0F1E"/>
      <rect x="20" y="21" width="18" height="2.2" rx="1.1" fill="#7C93B4" opacity=".6"/>
      <rect x="20" y="27" width="24" height="2.2" rx="1.1" fill="#38F2D8" opacity=".5"/>
      <rect x="20" y="33" width="12" height="2.2" rx="1.1" fill="#7C93B4" opacity=".4"/>
      <rect x="28" y="42" width="8" height="6" fill="${INK}" stroke="#7C93B4" stroke-width="1.2"/>
      <rect x="20" y="48" width="24" height="3.4" rx="1.7" fill="${INK}" stroke="#7C93B4" stroke-width="1.2"/>
    </svg>`
  };
})();
