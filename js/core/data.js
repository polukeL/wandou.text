/* =========================================================
 * core/data.js —— 游戏数据表（唯一需要改数值的地方）
 * 所有美术 / 数值 / 内容都走 id 索引，方便后续扩充。
 * ========================================================= */
(function (R) {
  'use strict';
  var D = (R.DATA = {});

  D.VERSION = '0.8.10';

  /* ---------------------------------------------------------
   * 更新日志（改版本号 + 更新简介就改这里）
   * ---------------------------------------------------------
   * 每个版本一条，最新的放最前面。
   *   version : 版本号（显示在标题页）
   *   date    : 日期（任意文本，建议 YYYY-MM-DD）
   *   title   : 这一版的一句话主题
   *   tag     : 可选标签 new / fix / opt / dev
   *   items   : 本次更新内容，一条一行
   * 加新版本：在数组最前面 push 一条，并把 D.VERSION 改成对应版本号。
   * ------------------------------------------------------- */
  D.CHANGELOG = [
    {
      version: '0.8.10', date: '2024-11-27', title: '编辑模式再修：头像与金币可拖动', tag: 'fix',
      items: [
        '修复头像在编辑模式一按就跳商店：编辑模式下点击让位给拖拽，正常模式仍可点进商店换头像',
        '修复金币组拖不动：命中区从兜底 100px 扩到整个金币底框（224×76），抓框上任意位置都能拖',
        '实测：头像/金币/建筑拖动保存全通过，正常模式六点交互回归通过'
      ]
    },
    {
      version: '0.8.9', date: '2024-11-27', title: '主城场景底更换 · 修复编辑模式无法拖动', tag: 'fix',
      items: [
        '主城场景底更换为荒野版新图（风车/卡车/木桥），各组件位置保持不变',
        '修复编辑模式(?uiedit=1)建筑与按钮无法拖动：已注册过交互的对象需显式 setDraggable',
        '拖拽时组件提层高亮，松手保存并提示坐标；位置限制在画面内防止拖丢',
        '美术资源清单新增【主城 UI 组件替换说明】：同名覆盖 assets/ui/title2_* 即可换肤'
      ]
    },
    {
      version: '0.8.8', date: '2024-11-26', title: '主城建筑按参考效果图重新对位', tag: 'fix',
      items: [
        '建筑位置重新按参考效果图对位（模板匹配）：科研所/建设中×2/资源商店各归其位',
        '背景保持空白地块版场景图，建筑素材叠加不再偏移'
      ]
    },
    {
      version: '0.8.7', date: '2024-11-26', title: '主城场景底更换 · 取消建筑浮动 · 头像对位修正', tag: 'ui',
      items: [
        '主城场景底更换为空白地块版效果图，四座建筑重新落位（左上/右上/左中/右中地块）',
        '取消建筑的上下浮动动效，画面更稳定',
        '修正头像偏移：按信息底圆形开口实测中心 (57,50) 对位，头像不再偏右'
      ]
    },
    {
      version: '0.8.6', date: '2024-11-26', title: '主城场景更新 · UI 可视化拖拽调整', tag: 'ui',
      items: [
        '更换新主城场景底图，四座建筑按场景画稿重新精确定位（模板匹配对齐）',
        '新增主城 UI 可视化调整：地址加 ?uiedit=1 进入编辑模式，拖动任意组件松手即保存',
        '编辑模式支持导出坐标 JSON（定稿）、重置默认、完成退出',
        '布局数据存 localStorage，正常模式自动应用；也可直接改 Title.js 的 CITY_DEFAULTS 定稿'
      ]
    },
    {
      version: '0.8.5', date: '2024-11-26', title: '主界面重制：小镇主城布局（按效果图）', tag: 'ui',
      items: [
        '主界面按美术效果图完全重制：顶部玩家信息（头像/昵称/等级/经验条）+ 金币 + 声音开关',
        '中部四座可点击建筑：科研所（进研究所）、资源商店（进商店）、两座建设中（轻提示不跳转）',
        '底部功能栏：公告（带新版本红点，进更新日志）/ 出战（开始冒险）/ 排行榜（通关时间榜）',
        '修复看门狗误判：进入主界面后不再因场景切换瞬间"无活跃场景"而强制刷新页面',
        '修复 Container 交互区认知偏差：统一 setSize+setInteractive（默认即居中命中）',
        '新增素材缺失自动回退：主城素材加载失败时回到旧版标题布局，不会白屏'
      ]
    },
    {
      version: '0.8.4', date: '2024-11-26', title: '修复放入主角/怪物贴图后进主界面黑屏', tag: 'fix',
      items: [
        '修复：放入正式主角/怪物贴图后，后台加载完成时替换正在渲染的纹理会导致 WebGL 报 "glTexture null" 而黑屏',
        '方案：游戏启动后所有贴图替换一律挂起（TILES_DIRTY 标记），只在场景切换的安全间隙（标题页创建 / 战斗挂地面时）执行替换',
        '同类问题彻底封堵：无论放入主角、怪物、场景图还是任意美术文件，都不会再在战斗中触发纹理销毁崩溃'
      ]
    },
    {
      version: '0.8.3', date: '2024-11-25', title: '修复手机端加载卡 83% · 场景大图改为后台加载', tag: 'fix',
      items: [
        '修复：1600×1600 场景整图（单张可达数 MB）之前在加载界面阻塞下载，手机网络下读条卡在 80%+ 进不了主界面',
        '场景大图不再阻塞加载：读条只反映小资源，进入标题页后大图后台下载，完成后地面自动换成正式图',
        '场景图支持 JPG（assets/world/tile_ch1.jpg 等），大图导出 JPG 体积只有 PNG 的十分之一，强烈推荐',
        '加载界面新增标题 logo（assets/ui/boot_logo.png），直接复用启动屏已加载的图片，进度 0% 起即完整显示背景插画 + logo + 读条'
      ]
    },
    {
      version: '0.8.2', date: '2024-11-25', title: '修复手机端加载完成后卡住不进主界面', tag: 'fix',
      items: [
        '修复：assets/audio/ 为空时，音效 404 的响应在部分手机内核（微信 X5 等）被当作音频长时间解码，加载队列挂起、读条 100% 也进不了主界面',
        '音效改为启动前探测，真实存在才进加载队列；没有音效文件时队列零等待',
        '电脑端启动屏改为与游戏画布相同的竖屏比例居中布局，切换不再大图跳小图',
        '音效文件放进 assets/audio/（bgm_main、shoot 等 .mp3）即自动启用，仍无需改代码'
      ]
    },
    {
      version: '0.8.1', date: '2024-11-25', title: '加载界面按效果图重做 · 读条移到底部', tag: 'new',
      items: [
        '加载界面换新：assets/ui/boot_bg.png 全屏插画背景，启动屏与引擎加载阶段共用一张图，过渡无跳变',
        '读条移到画面底部 81.5% 处（368×40），新增百分比数字，文字改为「资源加载中...」',
        '读条图片自定义：assets/ui/loading_bar_bg.png / loading_bar_fill.png 放图即生效，填充图按进度裁切',
        '修复：加载/主界面大图（boot_bg、title_bg 等）未按 assets/ui/ 分组路径探测的问题'
      ]
    },
    {
      version: '0.8.0', date: '2024-11-24', title: '精英怪独立造型 · 建筑分章风格 · 商店全身预览', tag: 'new',
      items: [
        '精英怪不再用普通怪放大染色：新增 5 款独立造型（王冠 + 尖刺 + 凶相），支持 assets/enemies/<怪>_elite.png 替换',
        '建筑支持每章不同美术风格：assets/obstacles/ch1~3/ 分章目录，命名探测 ob_xxx > ob_xxx_ch<章>',
        '建筑尺寸可调：D.OBSTACLES.scale 全局缩放 + 每种建筑单独 scale',
        '商店皮肤预览改为全身立绘大图（236×222 展示台），面板同步加高',
        'assets/obstacles/ 下新增 ch1/ch2/ch3 三个分章子目录与说明文件'
      ]
    },
    {
      version: '0.7.9', date: '2024-11-23', title: '启动失败不再白屏', tag: 'fix',
      items: [
        '新增模块完整性自检：core/boot.js 等关键模块加载失败时，页面直接显示原因',
        '新增全局脚本错误兜底：JS 语法错误（如部署版本残留 git 冲突标记）会在页面上提示',
        'boot.js 缺少 R.prepareAssets 时自动降级启动，不再卡死在启动屏',
        '修复：部分部署版本因 git 合并冲突标记未清理，导致手机端打开后停在启动画面'
      ]
    },
    {
      version: '0.7.8', date: '2024-11-22', title: '场景替换改为固定 1600×1600 整图制', tag: 'new',
      items: [
        '场景图不再平铺瓦片，改为一张 1600×1600 整图 1:1 铺满战场，所见即所画',
        'tile_ch1~3.png / tile.png 尺寸不符时自动等比拉伸铺满，并在控制台提示实际尺寸',
        '换章时新场景淡入 260ms，不再是硬切',
        '新增 D.ARENA / D.FLOOR_TILE 配置，战场边长与出图尺寸集中管理',
        '占位地板改用独立纹理键 tile_ph，避免与正式 tile.png 互相覆盖'
      ]
    },
    {
      version: '0.7.7', date: '2024-11-21', title: '修复角色与敌人脚下投影消失', tag: 'fix',
      items: [
        '修复投影占位纹理中心透明度过低（约 47%）导致角色/敌人脚下阴影几乎不可见的问题',
        '投影纹理改为「中心不透明 + 边缘羽化」，深浅仍由运行时 tint + alpha 控制，柔边外观不变',
      ]
    },
    {
      version: '0.7.6', date: '2024-11-20', title: '美术资源按类型分组', tag: 'new',
      items: [
        'assets 目录按类型拆成 11 个分组：characters / enemies / fx / pickups / world / props / obstacles / avatars / icons / ui / audio',
        '每个分组目录内都有「_本目录放什么.txt」说明该放哪些文件名',
        '启动时自动探测候选路径：优先读分组目录，找不到再读 assets 根目录（老文件继续有效，无需搬动）',
        '修复多候选路径加载时「第一个 404 就放弃、正式贴图全部不生效」的隐藏 bug',
        '控制台新增探测汇总日志，一眼看出命中几个素材、还缺哪些'
      ]
    },
    {
      version: '0.7.5', date: '2024-11-19', title: '角色尺寸可调', tag: 'new',
      items: [
        '新增 D.SIZE 配置：主角 / 小怪 / 精英 / Boss 的显示缩放各自独立',
        '支持单个敌人单独设定尺寸：在 D.ENEMIES[x].scale 写数字即可',
        '碰撞体、阴影、弹跳动画随尺寸自动等比缩放，不会出现"看着大打不中"',
        '主角脚下投影大小跟随主角尺寸'
      ]
    },
    {
      version: '0.7.4', date: '2024-11-18', title: '主界面背景与 UI 图片全面可替换', tag: 'new',
      items: [
        '主界面背景支持图片替换：assets/ui/title_bg.png（放图自动隐藏代码绘制的草地与云朵）',
        '主界面标题牌支持图片替换：assets/ui/title_plate.png',
        '主界面主角改用当前装备的皮肤（之前固定显示 player）',
        'UI 皮肤清单扩充到 10 项，全部放图即生效'
      ]
    },
    {
      version: '0.7.3', date: '2024-11-17', title: '主角投影 · 加载界面自定义', tag: 'new',
      items: [
        '主角脚下新增明显椭圆投影，随弹跳缩放、跳跃时变窄变淡',
        '投影贴图可替换：assets/blob_soft.png',
        '加载界面支持自定义图片：assets/ui/boot_logo.png（logo）、assets/ui/boot_bg.png（全屏背景）',
        '加载读条支持自定义图片：assets/ui/loading_bar_bg.png + loading_bar_fill.png',
        '读条填充图按进度从左往右裁切显示，无需改代码'
      ]
    },
    {
      version: '0.7.2', date: '2024-11-16', title: '宝箱概率 · 传送门视觉 · 地图替换', tag: 'opt',
      items: [
        '宝箱掉落改为概率制并整体调低：精英怪 100% → 60%，普通怪新增 2% 掉率',
        '掉落概率集中在 data.js → D.LOOT，想再调改数字即可',
        '传送门视觉拆分：石座不再整体旋转，只有中间漩涡单独旋转',
        '新增 portal_swirl 贴图位（assets/portal_swirl.png 可替换漩涡）',
        '新增地图地板替换：assets/tile.png / tile_ch1~3.png 自动覆盖',
        '启动脚本重构：自动找 Python/Node、自动换端口、报错不再闪退',
        '文档体系升级：新增「怎么打开游戏-必读」，美术清单与接入指南全面重写并与代码同步'
      ]
    },
    {
      version: '0.7.0', date: '2024-11-14', title: '祭坛 · 泉水 · 传送门改版', tag: 'new',
      items: [
        '新增祝福祭坛：站进中心读条 4 秒，期间刷大量小怪，完成获得宝箱',
        '新增诅咒祭坛：读条期间刷精英怪，完成获得高级宝箱 + 随机负面（迟缓/脆弱/笨拙）',
        '新增随机泉水：触碰后可饮用，回复 40% 生命',
        '祭坛与泉水每关只能使用一次',
        '传送门改为石门座 + 紫色旋涡新样式',
        '修复石头建筑悬空、生命上限道具导致血量超过上限的问题'
      ]
    },
    {
      version: '0.6.0', date: '2024-11-12', title: '宠物系统', tag: 'new',
      items: [
        '每关随机刷新蛋巢，走近即可捡蛋随身携带',
        '携带蛋期间击杀 25 只怪物即可孵化出战斗宠物',
        '宠物环绕跟随玩家，自动发射星丸攻击范围内敌人',
        '研究所新增：兽灵符文（宠物攻击 +25%/级）、暖巢香炉（孵化需求 -12%/级）、战鼓（每波怪物 +2 只/级）',
        '修复商店分栏按钮与商品卡片重叠'
      ]
    },
    {
      version: '0.5.0', date: '2024-11-10', title: '角色皮肤系统', tag: 'new',
      items: [
        '新增 6 款角色皮肤：豌豆少年 / 夜行豆 / 烈焰豆 / 霜雪豆 / 皇家豆 / 云端豆',
        '皮肤直接改变游戏里主角的外观（身体/背心/帽子/配饰全套换装）',
        '「云端豆」通过通关 1 次解锁，结算页会提示解锁信息',
        '商店新增「皮肤」分栏，购买 / 装备 / 已购买 / 通关解锁状态齐全',
        '预览栏支持皮肤大图预览（和游戏内形象一致）'
      ]
    },
    {
      version: '0.4.0', date: '2024-11-08', title: '数值血量与数值伤害', tag: 'new',
      items: [
        '血量改为数值制：基础 100 点，血条 + 数字（如 81/120）实时显示',
        '怪物伤害全部数值化：小怪 8 / 精英 16 / Boss 24 点起，随关卡增长',
        '护盾改为吸收点数：每级 30 点，Lv.5 = 150 点，可挡多次攻击',
        '回血被动改为每秒回复（每级 +0.8/秒），红心回复 12 点',
        '生命上限道具 / 「生命」被动 / 研究所图腾统一 +20 点/次',
        '新增受击飘字（-8）与吸血按伤害比例回血',
        '商店新增预览栏：点击商品上方显示大图预览与购买按钮，已购买显示「已购买」'
      ]
    },
    {
      version: '0.3.0', date: '2024-11-02', title: '地图建筑与 UI 布局调试', tag: 'new',
      items: [
        '新增随机建筑物：小屋 / 岩石 / 树 / 木箱 / 灌木 / 水井 / 墓碑 / 石柱',
        '建筑有碰撞体积，人物、怪物、子弹都无法穿过；可以躲在房子后面挡子弹',
        '刷怪点、传送门、Boss 召唤都会自动避开建筑，不会卡在墙里',
        '新增 UI 可视化布局调试：测试模式下可拖动 HUD 元素，实时调整位置',
        '修复手机摇杆位置漂移（摇杆固定在手指按下的位置）'
      ]
    },
    {
      version: '0.2.0', date: '2024-11-02', title: '终局 Boss · 通关榜 · 商店', tag: 'new',
      items: [
        '新增终极大 Boss「豌豆王」：跳跃震地、环形弹幕、召唤小怪、残血狂暴',
        '新增通关时间榜：与自己历史成绩对比，结算页显示新纪录/慢了多久',
        '新增头像与头像框，可自由搭配替换',
        '新增商店：用金币购买头像和头像框，两栏分开摆放',
        '新增开发者测试模式（跳关 / 刷怪 / 调难度 / 无敌）'
      ]
    },
    {
      version: '0.1.0', date: '2024-10-31', title: '首个可玩版本', tag: 'new',
      items: [
        '三章 15 关，每 5 关一个 Boss',
        '6 种武器、9 种被动，技能可重复拾取升级至 8 级',
        '金币系统与研究所永久强化',
        '护盾、血量上限道具，波次制关卡'
      ]
    }
  ];

  /* 更新日志标签的显示名与配色 */
  D.CHANGELOG_TAGS = {
    new: { text: '新内容', color: '#6cc24a' },
    fix: { text: '修复',   color: '#53b3e8' },
    opt: { text: '优化',   color: '#f9a825' },
    dev: { text: '开发',   color: '#9b5de5' }
  };

  /* ---------------------------------------------------------
   * 美术资源表 —— 图集内每一帧的名字（占位图形由代码画出）
   * 正式美术替换时保持这些 id 不变即可，详见 美术资源清单.md
   * ------------------------------------------------------- */
  D.ART = [
    { id: 'player',   desc: '玩家角色（朝右），尺寸建议 96x96' },
    { id: 'slime',    desc: '史莱姆小怪 64x64' },
    { id: 'bat',      desc: '蝙蝠小怪 64x64' },
    { id: 'charger',  desc: '冲刺怪（野猪/土豆人）80x80' },
    { id: 'spitter',  desc: '远程怪（吐籽怪）72x72' },
    { id: 'skull',    desc: '骷髅怪（第二章）64x64' },
    { id: 'skull_gold', desc: '黄金骷髅精英 80x80' },
    { id: 'golem',    desc: '石头人 Boss 160x160' },
    { id: 'king_pea', desc: '终局 Boss 豌豆王 180x180' },
    { id: 'bullet_pea', desc: '玩家子弹（豌豆/饼干屑）24x24' },
    { id: 'bullet_seed', desc: '敌人子弹（果核）24x24' },
    { id: 'pickup_gem', desc: '经验宝石 24x24' },
    { id: 'pickup_heart', desc: '红心 32x32' },
    { id: 'pickup_maxhp', desc: '血量上限道具 36x36' },
    { id: 'pickup_shield', desc: '护盾道具 36x36' },
    { id: 'pickup_coin', desc: '金币 32x32' },
    { id: 'chest',    desc: '宝箱 64x64' },
    { id: 'portal',   desc: '关卡传送门（石座底图） 128x128' },
    { id: 'portal_swirl', desc: '传送门中间漩涡（单独旋转） 96x96' },
    { id: 'blob',     desc: '通用阴影/粒子圆点 32x32' },
    { id: 'blob_soft', desc: '脚下投影（柔边圆，代码染色并压扁） 64x64' }
  ];

  /* ---------------------------------------------------------
   * 武器（可叠加的属主 buff）
   * ------------------------------------------------------- */
  D.WEAPONS = {
    pea:      { name: '豌豆枪', dmg: 12, cd: 0.42, speed: 620, radius: 9,  count: 1, spread: 0.10, pierce: 0, life: 0.78, knock: 130, sfx: 'shoot' },
    shot:     { name: '霰弹',   dmg: 7,  cd: 0.70, speed: 540, radius: 6,  count: 5, spread: 0.34, pierce: 0, life: 0.45, knock: 90,  sfx: 'shot' },
    boomer:   { name: '回旋镖', dmg: 14, cd: 0.95, speed: 420, radius: 12, count: 1, spread: 0.0,  pierce: 99, life: 1.5, knock: 60, sfx: 'boomer', boomerang: true },
    ball:     { name: '滚动爆球', dmg: 22, cd: 1.25, speed: 200, radius: 14, count: 1, spread: 0, pierce: 0, life: 1.4, knock: 120, sfx: 'ball', explode: { r: 88, dmg: 24 } },
    bubble:   { name: '泡泡枪', dmg: 6,  cd: 0.30, speed: 320, radius: 10, count: 1, spread: 0.22, pierce: 0, life: 1.1, knock: 40,  sfx: 'bubble', homing: 3.2 },
    shield:   { name: '回旋盾', dmg: 10, cd: 1.4, speed: 0, radius: 15, count: 1, spread: 0, pierce: 99, life: 0, knock: 0, sfx: 'ring', orbit: { radius: 74, speed: 2.6, hitCd: 0.45 } }
  };

  /* ---------------------------------------------------------
   * 被动（同种可叠加）
   * ------------------------------------------------------- */
  D.PASSIVES = {
    dmg:      { name: '伤害',   icon: 'sword',  fmt: 'p',  v: 12 },
    atkSpeed: { name: '攻速',   icon: 'speed',  fmt: 'p',  v: 10 },
    speed:    { name: '移速',   icon: 'feet',   fmt: 'p',  v: 8  },
    maxHp:    { name: '生命',   icon: 'heart',  fmt: 'flat', v: 20 },   // +20 生命上限
    regen:    { name: '回血',   icon: 'leaf',   fmt: 'flat', v: 0.8 },  // 每秒 +0.8 生命
    magnet:   { name: '拾取',   icon: 'magnet', fmt: 'p',  v: 30 },
    crit:     { name: '暴击',   icon: 'star',   fmt: 'p',  v: 7  },
    bulletSpd:{ name: '弹速',   icon: 'arrow',  fmt: 'p',  v: 12 },
    size:     { name: '弹体',   icon: 'circle', fmt: 'p',  v: 14 }
  };

  /* ---------------------------------------------------------
   * 敌人
   * ------------------------------------------------------- */
  D.ENEMIES = {
    /* dmg 为接触伤害点数（受 D.scaling.dmg 加成） */
    slime:   { art: 'slime', name: '果冻怪', hp: 30,  speed: 78,  size: 34, dmg: 6,  xp: 3,  gold: 1, kind: 'chaser', squash: true },
    bat:     { art: 'bat',   name: '蝙蝠',   hp: 18,  speed: 138, size: 30, dmg: 5,  xp: 3,  gold: 1, kind: 'chaser', float: true },
    charger: { art: 'charger', name: '冲锋猪', hp: 58, speed: 62, size: 42, dmg: 14, xp: 6,  gold: 2, kind: 'charger', windup: 0.55, dash: 520 },
    spitter: { art: 'spitter', name: '吐籽怪', hp: 36, speed: 58, size: 34, dmg: 6,  xp: 6,  gold: 2, kind: 'spitter', range: 300, shootCd: 1.8, bullet: { speed: 260, dmg: 6, radius: 8 } },
    skull:   { art: 'skull',  name: '骷髅兵', hp: 44,  speed: 92,  size: 34, dmg: 10, xp: 5,  gold: 2, kind: 'chaser' }
  };

  /* 精英怪（v0.8.0 起使用独立造型 <art>_elite，不再是普通怪放大染色）
   * size 仍控制体型倍率；size: 0 则按贴图原始尺寸（正式美术建议 1~1.2） */
  D.ELITE = { hp: 7, size: 1.45, dmg: 16, xp: 6, gold: 6 };   // dmg 为点数（同 D.DMG.elite）

  /* ---------------------------------------------------------
   * 角色尺寸（v0.7.5）
   * ---------------------------------------------------------
   * scale 是「显示缩放倍数」，1 = 素材原始大小，1.2 = 放大 20%。
   * 注意：改了 scale 之后，碰撞体（hitR / 玩家圆）会同步按比例缩放，
   *      所以视觉和手感保持一致，不会出现"看着大却打不中"。
   * 想按单个敌人调 → 在 D.ENEMIES[x].scale 单独写（优先级高于全局）。
   * ------------------------------------------------------- */
  D.SIZE = {
    player: 1.0,      // 主角　（0.8 偏小 / 1.2 偏大）
    enemy: 2.0,       // 全部小怪统一缩放倍数
    elite: 2.0,      // 精英怪额外放大倍数（在原基础上再乘）
    boss: 2.0         // Boss 统一缩放倍数
  };

  /* ---------------------------------------------------------
   * 掉落概率表（v0.7.2）—— 想再调就改这里的数字
   * chestMobChance   普通怪死亡掉宝箱概率（0.02 = 2%）
   * chestEliteChance 精英怪死亡掉宝箱概率（1 = 必掉；v0.7.2 由必掉调低为 60%）
   * chestBossExtra   Boss 击破后掉几个宝箱
   * ------------------------------------------------------- */
  D.LOOT = {
    chestMobChance: 0.02,
    chestEliteChance: 0.6,
    chestBossExtra: 2
  };

  /* Boss：多阶段参数 */
  D.BOSSES = {
    golem: {
      art: 'golem', name: '石头人', hp: 1400, size: 120, dmg: 24, xp: 120, gold: 60,
      step: 34, jumpCd: 2.2, jumpScale: 6.5, shockwaveDmg: 24, ringCd: 3.6, ringCount: 16
    },
    golem_hard: {
      art: 'golem', name: '狂暴石头人', hp: 2600, size: 132, dmg: 32, xp: 200, gold: 120,
      step: 40, jumpCd: 1.7, jumpScale: 7.4, shockwaveDmg: 32, ringCd: 2.8, ringCount: 20
    },
    /* 终局 Boss：豌豆王（三阶段） */
    king_pea: {
      art: 'king_pea', name: '豌豆王', hp: 5200, size: 150, dmg: 40, xp: 400, gold: 300,
      step: 46, jumpCd: 1.5, jumpScale: 8.2, shockwaveDmg: 40, ringCd: 2.2, ringCount: 24,
      final: true
    }
  };

  /* ---------------------------------------------------------
   * 地图 / 帧
   * ch = 章节（1..2），每章构成一条"房间链"，末尾是 Boss
   * ------------------------------------------------------- */
  /* ---------------------------------------------------------
   * 战场尺寸（v0.7.8）
   * ---------------------------------------------------------
   * 固定 1600×1600。场景替换图必须按这个尺寸出图，1:1 贴合，
   * 不裁切、不缩放、不平铺。改这里会连带影响相机边界、刷怪范围、
   * 建筑避让距离，非必要不要动。
   * ------------------------------------------------------- */
  D.ARENA = 1600;

  /* 场景贴图（固定尺寸制，v0.7.8）
   *   · tile_ch<章节id>.png  → 该章节专用场景图，1600×1600
   *   · tile.png             → 三章共用的兜底场景图，1600×1600
   * 命中任意一张 → 整张铺满战场、不染色、不平铺；都没有 → 程序化占位地板。
   * figure 为空时用章节的 floor 颜色画占位图。 */
  D.FLOOR_TILE = {
    size: 1600,          // 出图尺寸，与 D.ARENA 一致
    fit: 'cover'         // 尺寸不符时按等比铺满（cover）处理，避免出现空白边
  };

  /* ---------------------------------------------------------
   * 章节：最后一章的第 5 关为「终局 Boss」（finalBoss）
   * ------------------------------------------------------- */
  D.CHAPTERS = [
    {
      id: 1, name: '软糖草地', sub: '第一章',
      floor: ['#BFE36B', '#AED95C'], grid: 'rgba(255,255,255,0.16)',
      tile: 'tile_ch1',
      pool: ['slime', 'slime', 'slime', 'bat', 'bat', 'charger'],
      boss: 'golem', roomTime: 26, eliteChance: 0.22
    },
    {
      id: 2, name: '苹果酒矿坑', sub: '第二章',
      floor: ['#C9A67C', '#B8935F'], grid: 'rgba(255,255,255,0.14)',
      tile: 'tile_ch2',
      pool: ['slime', 'bat', 'charger', 'spitter', 'skull', 'skull'],
      boss: 'golem_hard', roomTime: 30, eliteChance: 0.3
    },
    {
      id: 3, name: '豌豆王座', sub: '终章',
      floor: ['#4a3350', '#3a2740'], grid: 'rgba(255,255,255,0.10)',
      tile: 'tile_ch3',
      pool: ['skull', 'skull', 'spitter', 'charger', 'bat'],
      boss: 'golem_hard', finalBoss: 'king_pea', roomTime: 30, eliteChance: 0.36
    }
  ];

  /* 通关条件：打到终章第 5 关并击败终局 Boss */
  D.FINAL = { chapter: 3, roomInChapter: 5 };

  /* ---------------------------------------------------------
   * 数值血量 / 数值伤害（v0.4.0 起统一为数值制）
   * ---------------------------------------------------------
   * 玩家：基础 100 点生命，所有伤害、治疗、护盾都以"点"为单位。
   * 怪物：伤害是点数，受章节/关卡加成。
   * 旧版的"格"已全部换算：1 格 = D.HP.perBar 点（默认 20）
   * ------------------------------------------------------- */
  D.HP = {
    base: 100,            // 玩家初始生命
    perBar: 20,           // 1 旧"格"折算点数（换算用；新数值体系下不要再改它）
    /* 治疗类数值（单位：点） */
    healOrb: 12,          // 红心道具回复
    regenPerStack: 0.8,   // 「回血」被动每级：每秒回复点数
    maxHpPerStack: 20,    // 「生命」被动每级：生命上限 +20
    maxHpItem: 20,        // 血量上限道具：+20 上限并回 20
    metaHpPerLevel: 20,   // 研究所「生命图腾」每级 +20 上限
    /* 护盾：每级能吸收的点数 */
    shieldPerTier: 30,
    /* 受伤后无敌时间（秒） */
    invuln: 0.9
  };

  /* 玩家受伤基准值（怪物最终伤害 = 基准 × 章节/关卡加成） */
  D.DMG = {
    mob: 8,          // 小怪近战
    elite: 16,       // 精英近战（mob × 2）
    boss: 24,        // Boss 近战 / 震地（mob × 3）
    bullet: 6,       // 小怪远程弹
    eliteBullet: 12, // 精英远程弹
    bossBullet: 16   // Boss 弹幕单发
  };

  /* ---------------------------------------------------------
   * 障碍物 / 建筑（后期替换为正式场景物品）
   * ---------------------------------------------------------
   * solid: 是否有碰撞体积（true 时人物/怪物/子弹都无法穿过）
   * w/h  : 逻辑碰撞盒尺寸（图片会自动拉伸到这个尺寸）
   * 摆放规则（见 Game.buildObstacles）：
   *   · 不与玩家出生点重叠
   *   · 建筑之间互不重叠（留出通道）
   *   · 不贴地图边缘（避免形成死角和卡位）
   *   · 刷怪 / 生成传送门时会自动避开
   * ------------------------------------------------------- */
  D.OBSTACLES = {
    /* 数量：每关随机生成几个 */
    countPerRoom: { min: 4, max: 7 },
    /* 距离玩家出生点的最小安全距离 */
    safeFromSpawn: 200,
    /* 距离地图边缘的最小距离 */
    edgePadding: 150,
    /* 建筑之间额外留出的通道宽度 */
    gap: 110,
    /* 出生点周围的"净空区"半径（刷怪/传送门不会生成在这之内） */
    spawnClearRadius: 70,

    /* 尺寸缩放（v0.8.0）：实际尺寸 = w/h × 全局scale × 单项scale。
     * 全局 scale 一处调全部建筑；单项 scale 微调个别建筑。1 = 原始大小。 */
    scale: 1,

    types: [
      { id: 'house',    art: 'ob_house',    w: 150, h: 130, weight: 3, scale: 1 },
      { id: 'rock',     art: 'ob_rock',     w: 110, h: 110, weight: 3, scale: 1 },
      { id: 'tree',     art: 'ob_tree',     w: 84,  h: 96,  weight: 4, scale: 1 },
      { id: 'crate',    art: 'ob_crate',    w: 76,  h: 76,  weight: 3, scale: 1 },
      { id: 'bush',     art: 'ob_bush',     w: 92,  h: 80,  weight: 3, scale: 1 },
      { id: 'well',     art: 'ob_well',     w: 96,  h: 96,  weight: 2, scale: 1 },
      { id: 'tomb',     art: 'ob_tomb',     w: 72,  h: 96,  weight: 2, scale: 1 },
      { id: 'pillar',   art: 'ob_pillar',   w: 76,  h: 118, weight: 2, scale: 1 }
    ]
  };

  /* ---------------------------------------------------------
   * 头像 / 头像框 / 商店
   * id 与占位图一致；价格单位为跨局金币（Meta.gold）
   * ------------------------------------------------------- */
  D.AVATARS = [
    { id: 'av_pea',     name: '小豌豆',   price: 0,    desc: '默认头像' },
    { id: 'av_slime',   name: '果冻怪',   price: 120,  desc: '呆萌的紫色果冻' },
    { id: 'av_bat',     name: '小蝙蝠',   price: 150,  desc: '夜里也精神' },
    { id: 'av_skull',   name: '骷髅兵',   price: 220,  desc: '其实很怕黑' },
    { id: 'av_king',    name: '豌豆王',   price: 600,  desc: '通关三次解锁纪念' },
    { id: 'av_golem',   name: '石头人',   price: 800,  desc: '曾经的噩梦' }
  ];

  D.FRAMES = [
    { id: 'fr_basic',  name: '木框',   price: 0,    desc: '默认头像框' },
    { id: 'fr_leaf',   name: '藤叶框', price: 100,  desc: '绿意盎然' },
    { id: 'fr_bone',   name: '骨牙框', price: 180,  desc: '矿坑风' },
    { id: 'fr_gold',   name: '黄金框', price: 400,  desc: '闪亮登场' },
    { id: 'fr_rainbow',name: '彩虹框', price: 700,  desc: '会缓缓转动' }
  ];

  /* ---------------------------------------------------------
   * 角色皮肤（游戏中主角的外观）
   * ---------------------------------------------------------
   * 6 款：1 款默认 + 4 款金币购买 + 1 款通关解锁
   * paint 是绘制参数，交给 art.js 的 drawHero 生成贴图：
   *   body 身体 / vest 背心 / head 头 / hat 头顶 / accent 腮红 / gun 枪
   *   accessory: antenna 豆荚尾 | crown 王冠 | goggles 护目镜 | horn 尖角 | halo 光环
   * 解锁：unlock:'clear' → 通关 1 次自动获得（D.SKINS_UNLOCK_CLEARS 次）
   * ------------------------------------------------------- */
  D.SKINS_UNLOCK_CLEARS = 1;

  D.SKINS = [
    {
      id: 'skin_default', name: '豌豆少年', price: 0, unlock: 'default',
      desc: '豌豆镇最常见的打扮',
      paint: { body: 0x4aa3df, vest: 0xffd23f, head: 0x8fd968, hat: 0x3f8f2e, accent: 0xf272b6, accessory: 'antenna' }
    },
    {
      id: 'skin_night', name: '夜行豆', price: 260, unlock: 'gold',
      desc: '戴护目镜的夜行者，看得很清楚',
      paint: { body: 0x5b5ba8, vest: 0x9b8ec4, head: 0x7ec46a, hat: 0x2f5c26, accent: 0x9b8ec4, accessory: 'goggles', gun: 0x6d7681 }
    },
    {
      id: 'skin_ember', name: '烈焰豆', price: 380, unlock: 'gold',
      desc: '浑身冒火，跑起来带风',
      paint: { body: 0xe05a3a, vest: 0xffb300, head: 0xf2994a, hat: 0xc0392b, accent: 0xff8a3d, accessory: 'horn', gun: 0x8d5a3b }
    },
    {
      id: 'skin_frost', name: '霜雪豆', price: 450, unlock: 'gold',
      desc: '冰蓝色的冷静派',
      paint: { body: 0x5bc8e8, vest: 0xd6f4ff, head: 0xbfe8f5, hat: 0x4a9fc4, accent: 0x9fd8ff, accessory: 'antenna', gun: 0x9aa3ad }
    },
    {
      id: 'skin_royal', name: '皇家豆', price: 700, unlock: 'gold',
      desc: '王冠一戴，谁都不爱',
      paint: { body: 0xf0c419, vest: 0xff5c8a, head: 0x8fd968, hat: 0x7a5c10, accent: 0xff9aa8, accessory: 'crown', gun: 0xf0c419 }
    },
    {
      id: 'skin_angel', name: '云端豆', price: 0, unlock: 'clear',
      desc: '通关 1 次解锁 · 头顶光环的荣誉装',
      paint: { body: 0xfff6e2, vest: 0xffe14d, head: 0xfffdf5, hat: 0xffe9a8, accent: 0xffb3c1, accessory: 'halo', gun: 0xf0c419 }
    }
  ];

  /* ---------------------------------------------------------
   * 宠物系统（v0.6.0）
   * ---------------------------------------------------------
   * 流程：每关随机刷一个蛋巢（避开建筑）→ 走近捡蛋随身携带
   *      → 击杀 hatchKills 只怪后孵化 → 宠物环绕跟随并自动打怪
   * 宠物每局重新孵化（孵化进度不跨局）；研究所加成永久生效。
   * ------------------------------------------------------- */
  D.PET = {
    atk: 8,               // 宠物子弹基准伤害（点）
    cd: 0.85,             // 攻击间隔（秒）
    bulletSpeed: 380,     // 弹速
    range: 340,           // 索敌范围
    followDist: 58,       // 跟随距离（环绕玩家）
    hatchKills: 25,       // 孵化需要击杀数
    nestPerRoom: 1,       // 每个房间蛋巢数
    eggPickupDist: 46     // 捡蛋距离
  };

  /* ---------------------------------------------------------
   * 祭坛与泉水（v0.7.0）
   * ------------------------------------------------------- */
  D.ALTAR = {
    channelTime: 4,        // 读条时长（秒）
    standDist: 34,         // 站进中心多大范围开始读条
    blessMobs: 12,         // 祝福祭坛读条期间刷怪数
    curseElites: 6         // 诅咒祭坛读条期间刷精英数
  };
  D.FOUNTAIN = {
    healPct: 0.4,          // 饮用回复最大生命的 40%
    useDist: 52            // 触碰距离
  };
  /* 诅咒祭坛的随机负面效果池（本局生效） */
  D.CURSES = [
    { id: 'slow',    name: '迟缓诅咒', desc: '移动速度 -20%' },
    { id: 'frail',   name: '脆弱诅咒', desc: '受到伤害 +25%' },
    { id: 'clumsy',  name: '笨拙诅咒', desc: '攻击速度 -20%' }
  ];

  /* 皮肤查表 */
  D.skinDef = function (id) {
    var list = D.SKINS || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  };

  /* ---------------------------------------------------------
   * 文案（欧美卡通口吻，后续可整包替换）
   * ------------------------------------------------------- */

  /* 成长曲线：第 n 个房间的强度 */
  /* 测试模式下的临时难度覆盖（调试面板改，正常游戏恒为 null）
   * 形如 { hpMul:1, dmgMul:1, speedMul:1 } —— 只影响当次调试 */
  D.debugTune = null;

  D.scaling = {
    enemyHp: function (room, ch) {
      var v = (1 + room * 0.13) * (1 + (ch - 1) * 0.85);
      return D.debugTune ? v * (D.debugTune.hpMul || 1) : v;
    },
    /* 敌人伤害倍率：随章节 / 关卡增长 */
    enemyDmg: function (room, ch) {
      var v = (1 + (ch - 1) * 0.45) * (1 + room * 0.035);
      return D.debugTune ? v * (D.debugTune.dmgMul || 1) : v;
    },
    /* 把基准伤害换算成实际点数伤害（整数，至少 1 点） */
    dmg: function (base, room, ch) {
      var v = base * D.scaling.enemyDmg(room, ch);
      return Math.max(1, Math.round(v));
    },
    spawnInterval: function (room) { return Math.max(0.16, 0.72 - room * 0.028); },
    spawnCount: function (room) { return 1 + Math.floor(room / 2); }
  };

  /* ---------------------------------------------------------
   * 升级卡池（id 稳定，便于后续增删）
   * ------------------------------------------------------- */
  D.UPGRADES = [
    // 武器
    { id: 'w_pea',    type: 'weapon', weapon: 'pea',    name: '豌豆枪',   desc: '基础射击', icon: 'pea', text: '发射豌豆子弹', max: 1 },
    { id: 'w_shot',   type: 'weapon', weapon: 'shot',   name: '饼干霰弹', desc: '5 颗扇形弹片', icon: 'shot', text: '扇形散射，近距离很痛', max: 1 },
    { id: 'w_boomer', type: 'weapon', weapon: 'boomer', name: '回旋镖',   desc: '来回穿透', icon: 'boomer', text: '飞出后返回，可穿透', max: 1 },
    { id: 'w_ball',   type: 'weapon', weapon: 'ball',   name: '滚动爆球', desc: '命中爆炸', icon: 'ball', text: '缓慢飞行，撞击后范围爆炸', max: 1 },
    { id: 'w_bubble', type: 'weapon', weapon: 'bubble', name: '泡泡枪',   desc: '自动追踪', icon: 'bubble', text: '泡泡会追踪最近的敌人', max: 1 },
    { id: 'w_shield', type: 'weapon', weapon: 'shield', name: '回旋盾',   desc: '环绕护体', icon: 'shield', text: '绕身旋转，撞到敌人即伤害', max: 1 },

    // 多元 / 数量
    { id: 'multi',    type: 'special', name: '弹幕齐射', desc: '', icon: 'multi', text: '所有武器多发 +1', max: 3, apply: function (s) { s.bonusMult += 1; } },
    { id: 'pierce',   type: 'special', name: '穿甲尖刺', desc: '', icon: 'pierce', text: '子弹多穿透 1 个敌人', max: 3, apply: function (s) { s.pierce += 1; } },
    { id: 'bounce',   type: 'special', name: '弹球技巧', desc: '', icon: 'bounce', text: '子弹命中后弹向附近敌人', max: 1, apply: function (s) { s.bounce = true; } },
    { id: 'vamp',     type: 'special', name: '吸血獠牙', desc: '', icon: 'vamp', text: '暴击时回复少量生命', max: 1, apply: function (s) { s.vamp = true; } },

    // 被动（可叠加）
    { id: 'p_dmg',      type: 'passive', passive: 'dmg',      text: '全武器伤害 +12%', icon: 'sword',  max: 6 },
    { id: 'p_atkSpeed', type: 'passive', passive: 'atkSpeed', text: '攻击速度 +10%',   icon: 'speed',  max: 6 },
    { id: 'p_speed',    type: 'passive', passive: 'speed',    text: '移动速度 +8%',    icon: 'feet',   max: 5 },
    { id: 'p_maxHp',    type: 'passive', passive: 'maxHp',    text: '生命上限 +20，并立即回复 20', icon: 'heart', max: 5 },
    { id: 'p_regen',    type: 'passive', passive: 'regen',    text: '每秒回复 0.8 生命', icon: 'leaf',  max: 3 },
    { id: 'p_magnet',   type: 'passive', passive: 'magnet',   text: '拾取范围 +30%',   icon: 'magnet', max: 4 },
    { id: 'p_crit',     type: 'passive', passive: 'crit',     text: '暴击率 +7%',      icon: 'star',   max: 5 },
    { id: 'p_bulletSpd',type: 'passive', passive: 'bulletSpd',text: '子弹速度 +12%',   icon: 'arrow',  max: 4 },
    { id: 'p_size',     type: 'passive', passive: 'size',     text: '子弹体积 +14%',   icon: 'circle', max: 4 }
  ];

  /* 武器升到该等级时的文案（Lv.2 ~ Lv.8；Lv.1 为初始获得） */
  D.WEAPON_LEVEL_TEXT = {
    2: '伤害 +12%',
    3: '伤害 +12% · 攻速 +5%',
    4: '弹道 +1 · 伤害再提升',
    5: '伤害 +12% · 穿透 +1',
    6: '攻速提升 · 弹体变大',
    7: '弹道 +1 · 全面强化',
    8: '满级！终极威力'
  };

  /* ---------------------------------------------------------
   * 研究所永久强化（金币跨局消费）
   * ------------------------------------------------------- */
  D.META_PERKS = [
    { id: 'dmg',    name: '力量研钵', desc: '全武器伤害',      per: '+4%/级',   max: 10, cost: 30,  icon: 'sword' },
    { id: 'atk',    name: '快手齿轮', desc: '攻击速度',        per: '+4%/级',   max: 10, cost: 30,  icon: 'speed' },
    { id: 'hp',     name: '生命图腾', desc: '生命上限',        per: '+20/级',   max: 6,  cost: 45,  icon: 'heart' },
    { id: 'spd',    name: '轻羽靴',   desc: '移动速度',        per: '+3%/级',   max: 8,  cost: 35,  icon: 'feet' },
    { id: 'magnet', name: '磁石核心', desc: '拾取范围',        per: '+15%/级',  max: 6,  cost: 25,  icon: 'magnet' },
    { id: 'gain',   name: '聚宝盆',   desc: '金币获取',        per: '+10%/级',  max: 8,  cost: 40,  icon: 'star' },
    { id: 'petAtk', name: '兽灵符文', desc: '宠物攻击',        per: '+25%/级',  max: 6,  cost: 50,  icon: 'sword' },
    { id: 'petHatch', name: '暖巢香炉', desc: '孵化速度',      per: '-12%需求/级', max: 5, cost: 45, icon: 'heart' },
    { id: 'wave',   name: '战鼓',     desc: '每波怪物数量',    per: '+2只/级',  max: 6,  cost: 55,  icon: 'skull' }
  ];

  /* ---------------------------------------------------------
   * 文案（欧美卡通口吻，后续可整包替换）
   * ------------------------------------------------------- */
  D.TEXT = {
    title: '豌豆镇大冒险', titleEn: 'PEA TOWN ROGUE',
    subtitle: '肉鸽冒险 · 越打越强',
    hint: '拖动屏幕或 WASD 移动，武器自动开火',
    tutorial: '拖动移动 · 自动开火 · 升级时三选一',
    win: '通关啦！', lose: '你被掀翻了…',
    winSub: '豌豆镇的传说又多了一个',
    loseSub: '种子还没发芽就已经…',
    level: '级'
  };

  /* 通关榜单（本地；后续可替换为联网接口） */
  D.LEADERBOARD = {
    max: 20,
    title: '通关时间榜'
  };
})(window.RogueGame = window.RogueGame || {});
