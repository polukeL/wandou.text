/* =========================================================
 * core/data.js —— 游戏数据表（唯一需要改数值的地方）
 * 所有美术 / 数值 / 内容都走 id 索引，方便后续扩充。
 * ========================================================= */
(function (R) {
  'use strict';
  var D = (R.DATA = {});

  D.VERSION = '0.1.0';

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
    { id: 'bullet_pea', desc: '玩家子弹（豌豆/饼干屑）24x24' },
    { id: 'bullet_seed', desc: '敌人子弹（果核）24x24' },
    { id: 'pickup_gem', desc: '经验宝石 24x24' },
    { id: 'pickup_heart', desc: '红心 32x32' },
    { id: 'pickup_maxhp', desc: '血量上限道具 36x36' },
    { id: 'pickup_shield', desc: '护盾道具 36x36' },
    { id: 'pickup_coin', desc: '金币 32x32' },
    { id: 'chest',    desc: '宝箱 64x64' },
    { id: 'portal',   desc: '关卡传送门 128x128' },
    { id: 'blob',     desc: '通用阴影/粒子圆点 32x32' }
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
    maxHp:    { name: '生命',   icon: 'heart',  fmt: 'flat', v: 1 },
    regen:    { name: '回血',   icon: 'leaf',   fmt: 'flat', v: 1 },
    magnet:   { name: '拾取',   icon: 'magnet', fmt: 'p',  v: 30 },
    crit:     { name: '暴击',   icon: 'star',   fmt: 'p',  v: 7  },
    bulletSpd:{ name: '弹速',   icon: 'arrow',  fmt: 'p',  v: 12 },
    size:     { name: '弹体',   icon: 'circle', fmt: 'p',  v: 14 }
  };

  /* ---------------------------------------------------------
   * 敌人
   * ------------------------------------------------------- */
  D.ENEMIES = {
    slime:   { art: 'slime', name: '果冻怪', hp: 30,  speed: 78,  size: 34, dmg: 1, xp: 3,  gold: 1, kind: 'chaser', squash: true },
    bat:     { art: 'bat',   name: '蝙蝠',   hp: 18,  speed: 138, size: 30, dmg: 1, xp: 3,  gold: 1, kind: 'chaser', float: true },
    charger: { art: 'charger', name: '冲锋猪', hp: 58, speed: 62, size: 42, dmg: 2, xp: 6,  gold: 2, kind: 'charger', windup: 0.55, dash: 520 },
    spitter: { art: 'spitter', name: '吐籽怪', hp: 36, speed: 58, size: 34, dmg: 1, xp: 6,  gold: 2, kind: 'spitter', range: 300, shootCd: 1.8, bullet: { speed: 260, dmg: 1, radius: 8 } },
    skull:   { art: 'skull',  name: '骷髅兵', hp: 44,  speed: 92,  size: 34, dmg: 2, xp: 5,  gold: 2, kind: 'chaser' }
  };

  D.ELITE = { hp: 7, size: 1.45, dmg: 1, xp: 6, gold: 6 };

  /* Boss：多阶段参数 */
  D.BOSSES = {
    golem: {
      art: 'golem', name: '石头人', hp: 1400, size: 120, dmg: 2, xp: 120, gold: 60,
      step: 34, jumpCd: 2.2, jumpScale: 6.5, shockwaveDmg: 3, ringCd: 3.6, ringCount: 16
    },
    golem_hard: {
      art: 'golem', name: '狂暴石头人', hp: 2600, size: 132, dmg: 3, xp: 200, gold: 120,
      step: 40, jumpCd: 1.7, jumpScale: 7.4, shockwaveDmg: 3, ringCd: 2.8, ringCount: 20
    }
  };

  /* ---------------------------------------------------------
   * 地图 / 帧
   * ch = 章节（1..2），每章构成一条"房间链"，末尾是 Boss
   * ------------------------------------------------------- */
  D.CHAPTERS = [
    {
      id: 1, name: '软糖草地', sub: '第一章',
      floor: ['#BFE36B', '#AED95C'], grid: 'rgba(255,255,255,0.16)',
      pool: ['slime', 'slime', 'slime', 'bat', 'bat', 'charger'],
      boss: 'golem', roomTime: 26, eliteChance: 0.22
    },
    {
      id: 2, name: '苹果酒矿坑', sub: '第二章',
      floor: ['#C9A67C', '#B8935F'], grid: 'rgba(255,255,255,0.14)',
      pool: ['slime', 'bat', 'charger', 'spitter', 'skull', 'skull'],
      boss: 'golem_hard', roomTime: 30, eliteChance: 0.3
    }
  ];

  /* 成长曲线：第 n 个房间的强度 */
  D.scaling = {
    enemyHp: function (room, ch) { return (1 + room * 0.13) * (1 + (ch - 1) * 0.85); },
    enemyDmg: function (room, ch) { return (1 + (ch - 1) * 0.5) + Math.floor(room / 4) * 0.5; },
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
    { id: 'p_maxHp',    type: 'passive', passive: 'maxHp',    text: '生命上限 +1 并治疗', icon: 'heart', max: 5 },
    { id: 'p_regen',    type: 'passive', passive: 'regen',    text: '每 10 秒回复 1 生命', icon: 'leaf',  max: 3 },
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
    { id: 'hp',     name: '生命图腾', desc: '生命上限',        per: '+1/级',    max: 6,  cost: 45,  icon: 'heart' },
    { id: 'spd',    name: '轻羽靴',   desc: '移动速度',        per: '+3%/级',   max: 8,  cost: 35,  icon: 'feet' },
    { id: 'magnet', name: '磁石核心', desc: '拾取范围',        per: '+15%/级',  max: 6,  cost: 25,  icon: 'magnet' },
    { id: 'gain',   name: '聚宝盆',   desc: '金币获取',        per: '+10%/级',  max: 8,  cost: 40,  icon: 'star' }
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
})(window.RogueGame = window.RogueGame || {});
