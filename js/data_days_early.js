/* 《睡班》— 30 天剧本 · D1-15
   页面格式: 字符串 | {text:[...], choices:[{label,fx,lines}]} */
'use strict';
window.DAYS = window.DAYS || {};

Object.assign(window.DAYS, {

1: {
  morning:[ '2087 年 10 月,常暖市,晴。' ],
  story:[
    '梦巢云算的签约室,永远是刚消毒过的味道。\n\n"恭喜,您的大脑通过了租用审核。"接待员笑得像练习过一千次。',
    '"从今晚开始,您睡觉时也在为乌托邦贡献力量了。"\n\n她把合同推过来。第一页只有一句话,大得可疑:\n\n【 你睡觉,世界运转 】',
    { text:['"有什么想问的吗?"她问。'],
      choices:[
        { label:'"谢谢,这正是我想要的生活。"', fx:(G)=>{ G.mood+=3; },
          lines:['"这就对了。"盖章的声音很轻,"欢迎加入共惠计划。"'] },
        { label:'"大脑租出去后,我做的梦还是我的吗?"', fx:(G)=>{ G.flags.asked_dream=1; },
          lines:['她眨了眨眼:"梦?合同只采购算力,不采购梦。您想多了。"\n\n后来你会知道,这是你在这座矿场里,听到的第一句谎言。'] },
        { label:'(沉默,签下名字)', fx:(G)=>{ G.flags.silent_start=1; },
          lines:['接待员把沉默理解成了满意。\n\n"安静的人,"她盖章,"梦的质量通常更高。"'] }
      ]},
    '三十天。试用期满,评估"优",即可转正。\n\n当晚,你搬进了体面舱。床很软,枕头刚好托住后颈——\n\n像公司替你保管着头。'
  ],
  life:['park','zao','clinic'],
  offers:['biaozhu','render','art']
},

2: {
  morning:[ '第一次睡班结束。', '账户里到了第一笔矿池分成。\n\n结算单上,产出与分成分两栏写着。你拿的是后面那一栏。\n\n一切正常。至少,数据上是。' ],
  life:['park','zao','tower'],
  offers:['biaozhu','render','art']
},

3: {
  morning:[ '今天有低气压——气象局采购的那种。', '阿枣说,这种天,梦会特别沉。' ],
  life:['park','zao','bookstore'],
  offers:['biaozhu','render','art'],
  night:{ forced:{ theme:'sea', title:'浅海 · 第 3 夜', taint:false, nodes:[
    { type:'pages', pages:[
      '睡班第 3 夜。\n\n你在浅海里"醒着"。发光的水漫到胸口——这不是你的记忆,是渲染工程的残料,像别人家掉进水里的毛线。' ]},
    { type:'purify', name:'数据残渣 · 夜潮', slow:true },
    { type:'collect', n:3 },
    { type:'pages', pages:[
      '水位退了。\n\n你醒来时,晨光刚翻过窗帘。你数了数自己的记忆——都在。\n\n目前,都在。' ]}
  ]}}
},

4: {
  morning:[ '晨间新闻:今日晴天,降水率 0%,已连续 4,102 天。', '没有人问为什么。' ],
  life:['tower','partjob','clinic'],
  offers:['biaozhu','render','art']
},

5: {
  morning:[ '你醒来时,枕头是湿的。', '你在哭。\n\n你不记得梦。' ],
  story:[
    '你想了一个上午,也想不起昨晚。\n\n像一本被撕掉一页的日历——剩下的部分严丝合缝,只有你知道,少了一页。'
  ],
  moodDelta:-5,
  life:['park','clinic','bookstore'],
  offers:['biaozhu','render','art']
},

6: {
  morning:[ '明天是大清算。', '信箱自动弹出提示:"请保持良好情绪,迎接首次评估。"' ],
  story:[
    '天台上,阿枣递给你一瓶汽水,忽然问:"明天大清算,你紧张吗?"\n\n"评什么?"\n\n"评你睡得好不好。"她望着塔尖,"顺带评一评——你还有多少东西,可以拿。"\n\n你笑她危言耸听。\n\n她也笑。笑得没什么底气。'
  ],
  moodDelta:5,
  life:['park','zao','tower'],
  offers:['biaozhu','render','art']
},

7: {
  morning:[ '第一次大清算。', '清算大厅亮得像手术室。' ],
  audit:{
    title:'大清算 · 第 1 周',
    sub:'NEURAL MUTUAL AUDIT · WEEK 1 · 23:47',
    twist:'T1',
    pages:[
      { text:['大厅的椅子里还残留着体温。屏幕上,你本周的报告安静地滚动完毕。'],
        choices:[
          { label:'去找何主管问清楚', fx:(G)=>{ G.flags.asked_he=1; G.mood=Math.max(0,G.mood-3); },
            lines:['41 层。何主管像早就算到你会来。\n\n"第 14 条?标准条款,所有供体都一样。"他真诚地看着你,"这是保护你。\n\n签字多累啊。"'] },
          { label:'去打听那个叫"鱼骨"的人', fx:(G)=>{ G.flags.knows_pawn=1; },
            lines:['你按纸条找到甜水巷最深处。\n\n"鱼骨典当行——只收不问。"招牌下面挂着一个铃铛。\n\n你没有进去。但你知道它在哪了。'] },
          { label:'什么也不做', fx:(G)=>{ G.mood=Math.max(0,G.mood-2); },
            lines:['你把合同存回云盘。系统感谢你的配合。\n\n那一晚你睡得很沉。\n\n像被谁批准了。'] }
        ]}
    ]
  },
  life:['park','zao','clinic'],
  offers:['biaozhu','render','art']
},

8: {
  morning:[ '第二周。', '梦巢推送:"本周可接单类型已扩充。祝您睡眠愉快。"'],
  life:['park','zao','bookstore'],
  offers:['biaozhu','render','mole','art']
},

9: {
  morning:[ '早高峰。', '电梯里挤满了睡眼惺忪的"白日自由人"。' ],
  story:{ twist:'T2' },
  storyAfter:[
    '整层楼的人都在看同一块屏幕。\n\n没有人觉得奇怪。\n\n包括十分钟前的你。'
  ],
  life:['park','noodle','clinic'],
  offers:['biaozhu','render','mole','art']
},

10: {
  morning:[ '梦境频道更新了。\n\n《浅海与少女》第 38 集,播放量破亿。' ],
  story:[
    '你鬼使神差地搜了这部剧的"网民维基"——随时会被删的那种。\n\n第一季主角,供体编号:016。',
    '"016 号,试用评估:未通过。已于 2084 年,格式化。"\n\n配图里,他打捞的姿势,和你的一模一样。',
    { text:['三分钟的检索,抵得上三天的失眠。'],
      choices:[
        { label:'看第 38 集。看看他们怎么剪你', fx:(G)=>{ G.flags.watched_self=1; G.mood=Math.max(0,G.mood-6); },
          lines:['你看完了全集。那一集里,影子捞上来的光团"打开了",弹幕齐刷刷飘过:"全剧泪点。"\n\n你不记得自己昨晚捞过什么。\n\n他们替你记得,还替你加好了滤镜和配乐。\n\n——016 号也是从这里开始,笑得越来越多的。'] },
        { label:'不看', fx:(G)=>{ G.mood=Math.min(100,G.mood+4); },
          lines:['你换了一个频道。动物世界里,一只真的水獭在真的河流里打滚。\n\n你看了十分钟真的东西。'] }
      ]}
  ],
  life:['zao','park','radio'],
  offers:['biaozhu','render','mole','art']
},

11: {
  morning:[ '甜水巷的铃铛,今天响了很久。' ],
  story:[
    '"鱼骨典当行,只收不问。"柜台后的男人抬起眼皮,"记忆,按私密度计价。\n\n越痛的,越值钱。"',
    '你注意到柜台后的墙:钉满了小抽屉,每个抽屉贴着标签,像图书馆。\n\n只是这里的书,是人。',
    '鱼骨把一枚黄铜牌子推给你:"想卖了,随时来。"\n\n(从今天起,你可以在白天光顾典当行。)'
  ],
  fx:(G)=>{ G.flags.pawnshop_open=1; },
  life:['pawnshop','zao','park'],
  offers:['biaozhu','render','mole','art']
},

12: {
  morning:[ '鱼骨的短信:"来一下。带脑子。"\n\n(你所有的脑子都在。你选择忽略这句话的歧义。)' ],
  story:{ twist:'T3' },
  life:['pawnshop','park','clinic'],
  offers:['biaozhu','render','mole','art']
},

13: {
  morning:[ '没有新闻的一天。', '常暖市的新闻,本来就只有天气。' ],
  life:['gym','bookstore','noodle'],
  offers:['biaozhu','render','mole','art']
},

14: {
  morning:[ '第二次大清算。', '楼道里有一张阿枣留的纸条:\n\n"别怕。也别习惯。"' ],
  audit:{
    title:'大清算 · 第 2 周',
    sub:'NEURAL MUTUAL AUDIT · WEEK 2 · 23:47',
    pages:[
      { text:[ Gday14Intro() ],
        choices:[
          { label:'签署补偿协议(领取 ₡400)', fx:(G)=>{ G.coins+=400; G.mem=Math.max(0,G.mem-2); },
            lines:['你签了。\n\n笔尖落下的瞬间,你想起了第 14 条。\n\n你告诉自己这次不一样。\n\n哪里不一样,你说不上来。'] },
          { label:'拒绝', fx:(G)=>{ G.flags.refused_comp=1; G.mood=Math.min(100,G.mood+4); },
            lines:['你在"拒绝"一栏,签下了自己的名字。\n\n工作人员看你的眼神,像在看一台没有调好的机器。\n\n但你按了按胸口。那里还热着。'] }
        ]}
    ]
  },
  life:['park','zao','clinic'],
  offers:['biaozhu','render','mole','art']
},

15: {
  morning:[ '第三周。', '你在梦里第三次参加同一场婚礼。\n\n可你从来、从来不认识那对新人。' ],
  story:[
    '新娘转过头来。\n\n没有脸。数据毛边从领口往上爬,像一件没渲染完的衣领。\n\n但你莫名确定:她很幸福。',
    '"借来的幸福,"你在清醒后写进小本子,"也算幸福吗?"'
  ],
  moodDelta:-4,
  life:['park','observatory','metro'],
  offers:['biaozhu','render','mole','finance']
},

});

function Gday14Intro(){
  return '本周的情绪均值,偏高。\n\n阿枣说过:"你最近笑得太多了。"\n\n屏幕上多出一行:"记忆损耗补偿协议——本月额度 ₡400。是否签署?"\n\n(拒绝不影响评级。系统说的。)';
}
