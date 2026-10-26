/* 《睡班》— 30 天剧本 · D16-30 */
'use strict';
window.DAYS = window.DAYS || {};

Object.assign(window.DAYS, {

16: {
  morning:[ '旧书店的猫今天没有出现。', '你开始随身带一个小本子。清醒者的习惯。' ],
  story:[
    '你把"001 号供体"写进本子。\n\n笔尖顿了顿,你又在后面加了三个字:\n\n"……是谁?"',
    '写字的手,比脑子先难过起来。'
  ],
  moodDelta:-3,
  fx:(G)=>{ G.flags.sawBadge=1; },
  life:['bookstore','radio','partjob'],
  offers:['biaozhu','render','finance','art']
},

17: {
  morning:[ '今晚,梦巢将在云背做"例行维护"。', '通知说:"供体无需配合,只需正常睡眠。"' ],
  life:['park','zao','clinic'],
  offers:['biaozhu','render','mole','finance'],
  night:{ forced:{ theme:'metro', title:'无脸地铁 · 维护夜', taint:false, nodes:[
    { type:'pages', pages:[
      '车厢里坐满了乘客。\n\n他们都没有脸,领带打得一丝不苟。\n\n列车报站:"下一站——清算。"' ]},
    { type:'echo', id:'betrayal' },
    { type:'pages', pages:[
      '车厢尽头,坐着一个穿制服的身影。\n\n大清算审计者。它站起身,朝你走来。\n\n每走一步,车灯熄灭一格。' ]},
    { type:'twist', id:'T4' }
  ]}}
},

18: {
  morning:[ '你醒得比闹钟早。', '小本子上,多了你半夜摸黑写下的一行字:\n\n"017 号。清醒着。"' ],
  story:[
    { text:['接下来怎么办?'],
      choices:[
        { label:'去旧地铁站,找"守望者"', fx:(G)=>{ G.flags.union_helped=1; if(G.route)G.route.zhen++; G.mood=Math.min(100,G.mood+3); },
          lines:['守望者第一次摘下兜帽——是个比你想象的年轻得多的女人。\n\n左边鬓角,有一块再没长出头发的疤。',
                 { who:'guardian', text:['"我是 017 之前的金牌供体。"她说,"他知道我们会查。他让你看见他——是警告。\n\n或者,邀请。"'] },
                 '她从怀里抽出一页内部备忘,拍在铁皮桌上:\n\n《关于"醒觉会"年度赞助的公关预算批复》——盖章,签发,2085年。',
                 { who:'guardian', text:['"我们收了。"她说得很平,"收了,才有地方站着说话。站不住的人,连梦都保不住。"\n\n(反抗在这个城市里,是分层收费的。)'] },
                 '(黑单 · 数据走私 已解锁。旧地铁站的门,为你常开。)'] },
        { label:'算了。有些门不推开就不会响', fx:(G)=>{ G.flags.laid_low=1; },
          lines:['你把本子合上,压在枕头下面。\n\n那一晚,你睡得意外地沉。'] }
      ]}
  ],
  life:['tower','zao','metro'],
  offers:['biaozhu','render','finance','black']
},

19: {
  morning:[ '今晚你会梦见账簿。', '你自己都不知道,你为什么会知道。' ],
  life:['park','clinic','noodle'],
  offers:['biaozhu','render','finance','art'],
  night:{ forced:{ theme:'ledger', title:'账簿 · 档案房', taint:false, nodes:[
    { type:'pages', pages:[
      '倒悬的账簿深处,每一页都记着一个名字。\n\n你随手一翻——\n\n"001 号供体。"' ]},
    { type:'twist', id:'T5' },
    { type:'pages', pages:[
      '档案房在你身后轻轻关上了门。\n\n你哭醒了。\n\n——第一次,为一段"不属于你"的失去。' ]}
  ]}}
},

20: {
  morning: Day20Morning,
  story:[
    '便利店里,一个陌生人忽然叫住你:\n\n"我见过你。在梦里。"',
    '"我们每隔几夜,会拼在同一片浅海里。你总是背对我,打捞同一样东西。"\n\n他不觉得奇怪,你也是。这才是最奇怪的。',
    '"相邻供体的算力,是打包出售的。"他耸耸肩,拿起咖啡,"他们管这个叫——邻里。"\n\n(他走后你才发现:你的梦,原来从来不是一个人的房间。)'
  ],
  fx:(G)=>{ G.flags.neighbor=1; },
  life:['noodle','partjob','zao','park'],
  offers:['biaozhu','render','finance','black','art']
},

21: {
  morning:[ '第三次大清算。', '何主管在大厅门口"恰好"等你。' ],
  audit:{
    title:'大清算 · 第 3 周',
    sub:'NEURAL MUTUAL AUDIT · WEEK 3 · 23:47',
    pages:[
      '大厅里,何主管把评估表转过来给你看。\n\n试用评估:优。',
      '"另外,"他微笑,"公司想邀请您加入一个特别计划。"\n\n【样本供体 · 特批】。报酬是普通单的三倍,夜间有专人陪护。\n\n"当然,"他把笔轻轻放在桌上,"您自愿。"',
      { text:['笔,就在那里。'],
        choices:[
          { label:'接受特批', fx:(G)=>{ G.flags.feed_path=1; if(G.route)G.route.zhi++; G.coins+=2000; G.mood=Math.max(0,G.mood-6); },
            lines:['"明智。"何主管握了握你的手。他的手很凉。\n\n当晚你收到了 ₡2,000。\n\n你盯着那串数字看了很久——它安静得像买断。'] },
          { label:'拒绝', fx:(G)=>{ G.flags.refused_sample=1; G.mood=Math.min(100,G.mood+3); },
            lines:['"没关系。"何主管收回笔,笑容没有任何变化。\n\n但走廊的灯,在你身后暗了一格。'] }
        ]}
    ]
  },
  life:['zao','tower','observatory','gym'],
  offers:['biaozhu','render','finance','black']
},

22: {
  morning:[ '转正在即。\n\n你决定,在把自己交出去之前,查清楚。' ],
  story:[
    { text:['三条线,今天走哪条?'],
      choices:[
        { label:'潜入云梯塔档案室', fx:(G)=>{ G.flags.clue_file=1; G.mood=Math.max(0,G.mood-4); },
          lines:['门禁"恰好"为你离线了三分钟。\n\n你拍下的名单上,一整页都是熟悉的名字——\n\n不是名人。是"梦境频道"每集片头鸣谢的、那些不存在的"编剧"。'] },
        { label:'找守望者要证据', fx:(G)=>{ G.flags.clue_union=1; },
          lines:['她给你看了中继站的监控截图:\n\n每晚 23:47,全城供体的梦,经由 9 条干线,汇向同一个坐标。\n\n云背,最深处。'] },
        { label:'问鱼骨要总账', fx:(G)=>{ G.flags.clue_pawn=1; },
          lines:[{ who:'yu', text:['鱼骨翻出典当行的总账:"三十年来,所有\'情感锚点\'的记忆,采购自同一个源头——第 7 供体舱。"\n\n"那里住的不是供体。"他合上账本,"是库存。"'] }] }
      ]}
  ],
  life:['park','zao','tower'],
  offers:['biaozhu','render','finance','black']
},

23: {
  morning:[ '你拍了拍小本子。\n\n还差两条线。' ],
  story:[
    { text:['今天走哪条?'],
      choices:[
        { label:'潜入云梯塔档案室', fx:(G)=>{ G.flags.clue_file=1; if(G.route)G.route.zhen++; G.mood=Math.max(0,G.mood-4); },
          lines:['编剧名单的下一页,是一张"素材结算表"。\n\n每一集《浅海与少女》后面,挂着一个供体编号。\n\n单价:₡1,200 / 集。\n\n其中 4 集后面,是你的编号。\n\n你拿到的:₡0。'] },
        { label:'找守望者要证据', fx:(G)=>{ G.flags.clue_union=1; if(G.route)G.route.zhen++; },
          lines:['中继站的墙上钉着一张价目表,边角卷了。\n\n「供体干线 · 批发　　₡0.3 / 小时」\n\n九条干线,每晚汇出 4.1 万小时的梦。',
                 { who:'guardian', text:['"这是他们的进货价。"守望者说,"零售价,在梦境频道的广告位上。"'] }] },
        { label:'问鱼骨要总账', fx:(G)=>{ G.flags.clue_pawn=1; if(G.route)G.route.zhen++; },
          lines:['总账里夹着一张采购单:\n\n「情感锚点 · 类型:妹妹 · 数量:1 · 单价:₡180,000」\n\n采购方:梦巢云算。供货方:第 7 供体舱。',
                 { who:'yu', text:['"他们花十八万买了它,"鱼骨说,"然后每周向你收五十块授权费。"'] }] }
      ]}
  ],
  life:['zao','bookstore','clinic'],
  offers:['biaozhu','render','finance','black']
},

24: {
  morning:[ '线索快齐了。\n\n风有点凉。是采购清单之外的那种凉。' ],
  story:[
    { text:['最后一站。'],
      choices:[
        { label:'潜入云梯塔档案室', fx:(G)=>{ G.flags.clue_file=1; G.mood=Math.max(0,G.mood-4); },
          lines:['这一次,你没有翻别人的名单。你翻了自己的档案。\n\n第一页很普通:编号,评级,入住日期。\n\n第二页有一栏,叫"衍生价值"。\n\n结算记录:41 次。最近一次:昨天。\n\n你终于明白——你不是档案的读者。\n\n你是档案里的资产。'] },
        { label:'找守望者要证据', fx:(G)=>{ G.flags.clue_union=1; },
          lines:[
            '她摊开一张全城地图。每一个亮点,是一台正在跑的矿机。\n\n"这张图,楼上的人每天晚上看一次。"她说,"像看天气预报。"\n\n"他们管这叫\'算力分布\'。"\n\n"我们管这叫——九百万个还在转的人。"',
            '临走时她忽然问了一句你没料到的话:\n\n"如果真相需要有人替它值班——你愿意吗?"\n\n你没有回答。你把它记在了本子上。'
          ] },
        { label:'问鱼骨要总账', fx:(G)=>{ G.flags.clue_pawn=1; },
          lines:[
            { who:'yu', text:[
              '鱼骨把一枚黄铜牌子推给你,和第一天那枚一样。\n\n只是背面多刻了一行字:\n\n「本店亦为梦巢云算授权回收点」',
              '"你现在知道了。"他说,"我们不是黑市,我们是他们的下水道。\n\n没有我们,脏东西就得摆在客厅里。"' ] },
            '总账最后一页,他用铅笔写了一行小字:\n\n"收梦人,也是做梦的。"\n\n你没懂。你总觉得快懂了。'
          ] }
      ]}
  ],
  life:['radio','bookstore','metro'],
  offers:['biaozhu','render','finance','black'],
  night:{ forced:{ theme:'ledger', title:'账簿 · 镜面房', taint:false, nodes:[
    { type:'pages', pages:[
      '今晚的账簿里,多了一间镜面房。\n\n每一面镜子里,都坐着一个正在睡班的你——同一个姿势,同一种呼吸。' ]},
    { type:'pages', pages:[
      { text:['镜中的"你"先开了口,声音像隔着的水:'],
        choices:[
          { label:'伸手,碰碰镜面', fx:(G)=>{ G.flags.mirror_seen=1; G.mood=Math.max(0,G.mood-4); },
            lines:['指尖传来的不是玻璃的凉,是电流的麻。\n\n镜子里的"你"笑了,用你的嘴角,向一个你没见过的方向。\n\n"它在预演你。"你想起本子上的一句话,"在你睡着的每个夜里。"'] },
          { label:'后退,不碰', fx:(G)=>{ G.flags.mirror_seen=1; },
            lines:['你退到门口。镜子里的"你"退到同一个门口。\n\n一模一样。\n\n太一模一样了——真人是不会这么整齐的。'] }
        ]},
      '你醒来时,窗外的晴天刚刚升起。\n\n你对着镜子刷了牙。\n\n刷到一半,停了下来,多看了那面镜子一眼。'
    ]}
  ]}}
},

25: {
  morning:[ '明天,信箱里会有一封烫金的信。', '你居然睡了个好觉。\n\n身体永远比脑子诚实。' ],
  story:(G)=>{
    /* 阿枣在 CHARACTERS 里挂了很久,却从未登场过名牌 —— 她是全作唯一一个
       从头到尾不图你算力的人,恰恰不该是个没有脸的叙述音。 */
    if((G.flags.zao||0)>=3) return [
      '天台上,阿枣已经把两瓶汽水都开好了。她记得你的口味——从第一天起就记得。',
      { who:'zao', text:['"明天之后,不管你变成什么,"她碰了碰你的瓶子,"汽水管够。"\n\n她补了一句,声音很轻:\n\n"我说的不是饮料。"'] }
    ];
    return [
      '阿枣在天台替你把汽水开了。',
      { who:'zao', text:['"明天之后,不管你变成什么,"她碰了碰你的瓶子,"汽水管够。"\n\n——如果你还有第 31 天的话。'] }
    ];
  },
  moodDelta:6,
  life:['noodle','zao','observatory'],
  offers:['biaozhu','render','finance','black']
},

26: {
  morning:[ '信箱里,躺着一封烫金的信。', '你的心跳,比阅读速度快。' ],
  story:{ twist:'T6' },
  storyAfter:[
    '你把信折好,放回信箱。\n\n动作很稳。\n\n你为这份"稳",感到毛骨悚然。',
    (G)=>{
      if(!G.flags.biaozhu_done) return null;
      if(G.route) G.route.zhen++;
      return { text:[
        '傍晚,一条新闻推送挤掉了天气预报:\n\n"云梯安保发布「情绪安防系统」,实时识别员工的倦怠与假笑,已获百家企业采购。"',
        '配图是一张标注界面。一张在笑的女人。判定:牙齿。\n\n你标过这张脸。三万次。\n\n照片里的人,和你睡在同一个城区。而买走这张脸的技术,正在被卖回给疲惫的公司——用来盯住更多疲惫的人。'
      ] };
    }
  ],
  life:['gym','metro','clinic'],
  offers:['biaozhu','render','finance','black']
},

27: {
  morning:[ '今天的天,特别蓝。\n\n蓝得像开足了亮度的屏幕。' ],
  story:{ twist:'T7' },
  storyAfter:[
    '傍晚,阿枣在天台等你。她指了指城市正中央那道细缝。\n\n"清醒者的工作,"她说,"就是替所有人,记得这件事发生过。"',
    '夜里,你翻开天文馆抄来的 2087 星历:\n\n"10 月 26 日,满月。"\n\n你抬头。\n\n穹顶上,什么都没有。'
  ],
  moodDelta:4,
  life:['zao','observatory','tower'],
  offers:['biaozhu','render','finance','black']
},

28: {
  morning:[ '最后一次大清算。', '你突然意识到——你从没看清过清算大厅的钟。' ],
  audit:{
    title:'大清算 · 第 4 周',
    sub:'NEURAL MUTUAL AUDIT · WEEK 4 · 23:47',
    formattable:true,
    pages:[
      '结算大厅的电子钟,显示 23:47。\n\n奇怪。现在是上午。\n\n你揉了揉眼。\n\n钟显示:23:47。',
      '走出大厅时,何主管在门口等你。他没有提评估,只是深深看了你一眼:\n\n"明天,云背深处维护。\n\n您被选中,陪同进入。"\n\n这不是询问。'
    ]
  },
  life:['partjob','bookstore','clinic'],
  offers:['biaozhu','render','finance','black']
},

29: {
  morning:[ '今天,云背的"最深处"对你开放。', '你在房间里坐到天黑。\n\n哪里都没去。' ],
  life:['park','zao','gym'],
  offers:['biaozhu','render'],
  night:{ forced:{ theme:'core', title:'云背 · 最深处', taint:false, nodes:[
    { type:'pages', pages:[
      '你坠了很久,很久。\n\n浅海在头顶合拢,账簿在远处翻页,地铁驶向没有站名的远方。\n\n而最深处,亮着一盏灯。' ]},
    { type:'twist', id:'T8' },
    { type:'pages', pages:[
      '灯还亮着。\n\n你忽然意识到,那不是值班台的灯。\n\n那是一盏——留给夜班的人的灯。' ]}
  ]}}
},

30: {
  morning:[ '第三十天。', '常暖市,晴。一如既往。', '今晚,只剩最后一班。' ],
  story:[
    '白天很长。长得像一辈子。\n\n你把小本子写满了最后一页。阿枣看完,在上面补了一行字:\n\n"第 31 天,见。"\n\n——如果你还有第 31 天的话。'
  ],
  moodDelta:4,
  life:['park','zao','clinic','radio'],
  life_note:'最后一天',
  offers:['biaozhu'],
  night:{ forced:{ theme:'core', title:'最后一班', taint:false, ending:true, nodes:[
    { type:'pages', pages:[
      '睡班开始。\n\n一切都很正常。数据流,浅海,灯光。\n\n太正常了。' ]},
    { type:'twist', id:'T9' }
  ]}}
},

});

function Day20Morning(){
  const m = (typeof G!=='undefined' && G) ? G.mems : null;
  if (m && m.sis_name && m.sis_name !== 'full')
    return [ '你想去查妹妹的事。拿起笔——\n\n却发现想不起她的名字。\n\n本子上那一页是空的。你盯着空页看了很久,忽然分不清,哪种更痛。' ];
  if (typeof G!=='undefined' && G && G.flags.return_sis)
    return [ '你摸了摸胸口那格光。\n\n"等我。"你说。\n\n它轻轻亮了一下。' ];
  return [ '"妹妹"两个字,在你心里换了一种重量。\n\n假的。\n\n但是重的。' ];
}
