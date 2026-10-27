/* 《睡班》— 绘制图标系统(替代 emoji)
   线性风格:1.6px 描边、圆角端点、24×24 viewBox、stroke=currentColor。
   window.ICONS.contract[cid] / window.ICONS.life[lid] → 内联 SVG 字符串。 */
'use strict';
window.ICONS = (function(){
  const S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
  const w = body => `<svg viewBox="0 0 24 24" style="width:100%;height:100%;display:block" aria-hidden="true"><g ${S}>${body}</g></svg>`;

  return {
    contract: {
      /* 语义采集:扫描框 + 面部曲线 + 判定勾 */
      biaozhu: w(`
        <path d="M4 8 V5.5 A1.5 1.5 0 0 1 5.5 4 H8"/>
        <path d="M16 4 H18.5 A1.5 1.5 0 0 1 20 5.5 V8"/>
        <path d="M20 16 V18.5 A1.5 1.5 0 0 1 18.5 20 H16"/>
        <path d="M8 20 H5.5 A1.5 1.5 0 0 1 4 18.5 V16"/>
        <path d="M8.5 11 C8.5 13.5 10 15 12 15 C14 15 15.5 13.5 15.5 11"/>
        <circle cx="9.5" cy="9.5" r="0.9" fill="currentColor" stroke="none"/>
        <circle cx="14.5" cy="9.5" r="0.9" fill="currentColor" stroke="none"/>
        <path d="M9 17.5 L11 19 L15 16.5" stroke-width="1.3"/>`),
      /* 感知渲染:落日 + 三层海浪 */
      render: w(`
        <circle cx="12" cy="10" r="3.6"/>
        <path d="M3 15.5 C6 14 9 17 12 15.5 C15 14 18 17 21 15.5"/>
        <path d="M4.5 19 C7.5 17.6 10 20 12 19 C14.5 17.7 16.5 20 19.5 18.9"/>`),
      /* 折叠直觉:分子折叠(三球两键) */
      mole: w(`
        <circle cx="6.5" cy="16.5" r="2.8"/>
        <circle cx="17" cy="6.5" r="2.8"/>
        <circle cx="16" cy="17.5" r="2.2"/>
        <line x1="8.8" y1="14.6" x2="14.4" y2="8.2"/>
        <line x1="9.3" y1="16.6" x2="13.7" y2="17.4"/>`),
      /* 情绪算力:阴线蜡烛 + 折线 */
      finance: w(`
        <line x1="7" y1="4.5" x2="7" y2="19"/>
        <rect x="4.8" y="9" width="4.4" height="6.5" rx="0.8"/>
        <line x1="17" y1="6" x2="17" y2="17.5"/>
        <rect x="14.8" y="8.5" width="4.4" height="6" rx="0.8"/>
        <path d="M3 20.5 C7 19 9 15.5 12 13.5 C15 11.4 17.5 9 21 5.5" stroke-width="1.3"/>`),
      /* 生成式共作:画笔 + 一抹颜色 + 飞点 */
      art: w(`
        <path d="M5 19 C5 15 8 12.5 11 12.5 L18.5 5 C19.6 3.9 21.4 5.2 20.5 6.6 L14.5 15 C13.5 17.5 9 20 5 19 Z"/>
        <circle cx="19.5" cy="17" r="0.9" fill="currentColor" stroke="none"/>
        <circle cx="21" cy="13.5" r="0.7" fill="currentColor" stroke="none"/>
        <circle cx="17" cy="20.5" r="0.7" fill="currentColor" stroke="none"/>`),
      /* 黑单·无签名:密件 + 涂黑签名线 */
      black: w(`
        <path d="M6 3.5 H14.5 L19 8 V20.5 H6 Z"/>
        <path d="M14.5 3.5 V8 H19"/>
        <line x1="9" y1="14" x2="16.5" y2="14"/>
        <rect x="8.6" y="16.2" width="8.4" height="2.6" fill="currentColor" stroke="none"/>
        <path d="M9 9.5 C10.5 8.2 13 8.2 14.5 9.5" stroke-width="1.2"/>`)
    },
    life: {
      /* 公园:长椅 + 音箱柱 */
      park: w(`
        <path d="M5 10 H19 M5.5 13.5 H18.5"/>
        <line x1="6.5" y1="10" x2="6.5" y2="6.5"/><line x1="17.5" y1="10" x2="17.5" y2="6.5"/>
        <path d="M6.5 6.5 H17.5" stroke-width="1.2"/>
        <line x1="7" y1="13.5" x2="7" y2="19"/><line x1="17" y1="13.5" x2="17" y2="19"/>`),
      /* 天台:栏杆 + 汽水瓶 */
      zao: w(`
        <line x1="4" y1="9" x2="4" y2="19"/><line x1="10" y1="9" x2="10" y2="19"/><line x1="16" y1="9" x2="16" y2="19"/>
        <line x1="3" y1="19" x2="21" y2="19"/>
        <path d="M17.5 8.5 V5.5 C17.5 4.5 18.5 4.5 18.5 5.5 V8.5 Z" fill="currentColor" stroke="none"/>`),
      /* 诊所:圆框十字 + 波形 */
      clinic: w(`
        <circle cx="12" cy="12" r="8.5"/>
        <path d="M12 8.5 V15.5 M8.5 12 H15.5"/>
        <path d="M5 20 C7 18.5 9 19.5 11 18.5" stroke-width="1.2"/>`),
      /* 书店:立书三册 */
      bookstore: w(`
        <path d="M5 19.5 V6 L10 5 V19.5 Z"/>
        <path d="M10 19.5 V4.5 L15 6 V19.5"/>
        <line x1="5" y1="19.5" x2="19" y2="19.5"/>
        <line x1="17" y1="6.5" x2="19" y2="6.8"/>`),
      /* 典当行:价签 + 孔 */
      pawnshop: w(`
        <path d="M12.6 3.5 H19 A1.5 1.5 0 0 1 20.5 5 V11.4 C20.5 12 20.3 12.6 19.8 13 L12.5 20.3 A1.6 1.6 0 0 1 10.2 20.3 L3.7 13.8 A1.6 1.6 0 0 1 3.7 11.6 L11 4.2 C11.4 3.8 12 3.5 12.6 3.5 Z"/>
        <circle cx="16.2" cy="7.8" r="1.3"/>
        <path d="M8 12.5 L11.5 16" stroke-width="1.2"/>`),
      /* 云梯塔:塔身 + 信标 */
      tower: w(`
        <path d="M9 20 L9.8 6.5 H14.2 L15 20"/>
        <line x1="7.5" y1="20" x2="16.5" y2="20"/>
        <line x1="10.6" y1="10" x2="13.4" y2="10"/>
        <line x1="10.2" y1="14" x2="13.8" y2="14"/>
        <line x1="12" y1="6.5" x2="12" y2="4.2"/>
        <circle cx="12" cy="3.4" r="1" fill="currentColor" stroke="none"/>`),
      /* 地铁:隧道拱 + 列车头灯 */
      metro: w(`
        <path d="M4 19 C4 9 8 4.5 12 4.5 C16 4.5 20 9 20 19"/>
        <rect x="7.5" y="10" width="9" height="5.5" rx="1"/>
        <circle cx="9.5" cy="17.6" r="0.9" fill="currentColor" stroke="none"/>
        <circle cx="14.5" cy="17.6" r="0.9" fill="currentColor" stroke="none"/>
        <line x1="4" y1="19" x2="20" y2="19"/>`),
      /* 健身房:哑铃 */
      gym: w(`
        <line x1="8.5" y1="12" x2="15.5" y2="12"/>
        <rect x="4.5" y="7" width="3.4" height="10" rx="1"/>
        <rect x="16.1" y="7" width="3.4" height="10" rx="1"/>
        <rect x="2" y="9" width="2" height="6" rx="0.8"/>
        <rect x="20" y="9" width="2" height="6" rx="0.8"/>`),
      /* 面馆:碗 + 筷 + 蒸汽 */
      noodle: w(`
        <path d="M4.5 12.5 H19.5 C19.5 16.5 16.5 19.5 12 19.5 C7.5 19.5 4.5 16.5 4.5 12.5 Z"/>
        <line x1="13" y1="3.5" x2="17.5" y2="11"/>
        <line x1="15.5" y1="3.2" x2="19" y2="10.5"/>
        <path d="M7.5 9 C7 7.8 8 7.4 7.5 6.2" stroke-width="1.2"/>
        <path d="M11 9 C10.5 7.8 11.5 7.4 11 6.2" stroke-width="1.2"/>`),
      /* 天文馆:望远镜 + 星 */
      observatory: w(`
        <path d="M9.5 13.5 L4.5 18.5 M11.5 15.5 L13 19"/>
        <path d="M10.5 6.5 L15.5 12.5 L13 14.8 L8 8.8 Z"/>
        <path d="M15.5 12.5 L17.5 10.5 L19.5 12" stroke-width="1.2"/>
        <circle cx="19" cy="5.5" r="0.9" fill="currentColor" stroke="none"/>
        <circle cx="21.5" cy="9" r="0.7" fill="currentColor" stroke="none"/>
        <circle cx="5" cy="6" r="0.8" fill="currentColor" stroke="none"/>`),
      /* 便利店:雨棚 + 门 + 橱窗 */
      partjob: w(`
        <path d="M4 9 L5.5 4.5 H18.5 L20 9 C20 10.4 18.8 11.2 17.4 11.2 C16.2 11.2 15.2 10.3 15 9.4 C14.8 10.3 13.6 11.2 12 11.2 C10.4 11.2 9.2 10.3 9 9.4 C8.8 10.3 7.8 11.2 6.6 11.2 C5.2 11.2 4 10.4 4 9 Z"/>
        <path d="M6 13 V19.5 H18 V13"/>
        <rect x="13.5" y="14.5" width="3" height="5"/>
        <rect x="8" y="14.5" width="4" height="3"/>`),
      /* 电台:收音机 + 频率刻度 + 天线 */
      radio: w(`
        <rect x="4" y="10" width="16" height="9.5" rx="1.6"/>
        <circle cx="8.5" cy="14.7" r="2.1"/>
        <rect x="12.5" y="12.4" width="5.5" height="2" rx="1"/>
        <line x1="12.5" y1="16" x2="18" y2="16" stroke-width="1.1"/>
        <line x1="17.5" y1="10" x2="20" y2="4.5"/>
        <path d="M6 7 C7 5.8 9 5.8 10 7" stroke-width="1.1"/>`)
    }
  };
})();
