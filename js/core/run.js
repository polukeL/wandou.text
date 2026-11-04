/* =========================================================
 * core/run.js —— 一局游戏的状态机
 * 抽出来独立于场景：方便回放 / 测试 / 存档 / 后续接服务器校验
 * ========================================================= */
(function (R) {
  'use strict';
  var D = R.DATA;

  function Run(opts) {
    opts = opts || {};
    this.seed = opts.seed || (Math.random() * 1e9 | 0);
    // 简易可复现随机（mulberry32）
    this._s = this.seed >>> 0;
    this.hp = D.HP.base;        // 数值血量（默认 100）
    this.maxHp = D.HP.base;
    this.hpFloat = 0;           // 回血累加的小数缓冲（回血被动是小数/秒）
    this.dmgTaken = 0;          // 本局累计受到伤害（结算展示用）
    this.gold = 0;
    this.kills = 0;
    this.room = 0;             // 房间序号
    this.chapter = 1;
    this.level = 1;
    this.xp = 0;
    this.xpNeed = 5;
    this.time = 0;
    this.pendingLevels = 0;
    this.upgrades = {};        // id -> 次数
    this.buffs = {
      dmg: 0, atkSpeed: 0, speed: 0, magnet: 0, crit: 0.05, bulletSpd: 0, size: 0,
      regen: 0, bonusMult: 0, pierce: 0, bounce: false, vamp: false
    };
    this.weapons = [];         // [{key, level}]
    this.addWeapon('pea');
    this.shield = { level: 0, hp: 0 };   // 护盾：等级 1~5，hp=剩余可抵挡格数
    this.alive = true;
    this.won = false;

    // 研究所永久加成
    if (R.Meta && R.Meta.buffsFor) {
      var m = R.Meta.buffsFor();
      this.buffs.dmg += m.dmg;
      this.buffs.atkSpeed += m.atk;
      this.buffs.speed += m.spd;
      this.buffs.magnet += m.magnet;
      this.metaGoldMul = 1 + m.gain;
      this.metaPetAtk = 1 + (m.petAtk || 0);       // 宠物伤害倍率
      this.metaPetHatch = Math.max(0.4, 1 - (m.petHatch || 0));   // 孵化需求折减（最低 40%）
      if (this.metaPetHatch < 0.4) this.metaPetHatch = 0.4;
      this.metaWaveAdd = m.waveAdd || 0;           // 每波额外怪物数
      if (m.hp > 0) { this.maxHp += m.hp; this.hp += m.hp; }   // m.hp 已是点数
    } else {
      this.metaGoldMul = 1;
      this.metaPetAtk = 1; this.metaPetHatch = 1; this.metaWaveAdd = 0;
    }

    /* ---------------- 宠物状态（每局重新孵化） ----------------
     * stage: 'none' 未获得蛋 | 'egg' 随身携带 | 'pet' 已孵化
     * hatch: 已击杀数（携带期间累计） */
        var need = Math.max(8, Math.round(D.PET.hatchKills * this.metaPetHatch));
    this.pet = { stage: 'none', hatch: 0, need: need, cd: 0, angle: 0 };

    /* 诅咒（祭坛负面效果，本局持续）：id -> true */
    this.curses = {};
  }

  Run.prototype.rand = function () {
    this._s = (this._s + 0x6D2B79F5) >>> 0;
    var t = this._s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Run.prototype.pick = function (arr) { return arr[Math.floor(this.rand() * arr.length)]; };

  Run.prototype.addWeapon = function (key) {
    if (this.weapons.some(function (w) { return w.key === key; })) return false;
    this.weapons.push({ key: key, level: 1 });
    return true;
  };

  Run.prototype.hasWeapon = function (key) {
    return this.weapons.some(function (w) { return w.key === key; });
  };

  Run.prototype.getWeapon = function (key) {
    return this.weapons.filter(function (w) { return w.key === key; })[0] || null;
  };

  /* 武器等级上限 */
  Run.WEAPON_MAX = 8;

  /* 升武器等级，返回是否成功 */
  Run.prototype.levelUpWeapon = function (key) {
    var w = this.getWeapon(key);
    if (!w || w.level >= Run.WEAPON_MAX) return false;
    w.level += 1;
    return true;
  };

  /* 取某武器最终数值（应用所有 buff + 武器自身等级成长）
   * 每级成长：伤害 +12%、攻速 +5%、弹体 +4%、
   * 第 4 级 +1 发弹，第 7 级再 +1 发；穿透类每 3 级 +1 穿透 */
  Run.prototype.weaponStats = function (key) {
    var base = D.WEAPONS[key];
    var b = this.buffs;
    var w = this.getWeapon(key);
    var lv = w ? (w.level || 1) : 1;
    var k = lv - 1;                              // 已升级次数 0..7
    return {
      key: key,
      level: lv,
      maxLevel: Run.WEAPON_MAX,
      dmg: base.dmg * (1 + b.dmg) * (1 + k * 0.12),
      cd: base.cd / this.atkSpeedMul() / (1 + k * 0.05),
      speed: base.speed * (1 + b.bulletSpd),
      radius: base.radius * (1 + b.size) * (1 + k * 0.04),
      count: base.count + b.bonusMult + (lv >= 7 ? 2 : (lv >= 4 ? 1 : 0)),
      spread: base.spread,
      pierce: (base.pierce || 0) + b.pierce + Math.floor(k / 3),
      life: base.life,
      knock: base.knock * (1 + k * 0.06),
      sfx: base.sfx,
      explode: base.explode
        ? { r: base.explode.r * (1 + k * 0.05), dmg: base.explode.dmg * (1 + k * 0.1) }
        : null,
      homing: base.homing ? base.homing * (1 + k * 0.08) : 0,
      boomerang: base.boomerang,
      orbit: base.orbit
        ? { radius: base.orbit.radius * (1 + k * 0.03), speed: base.orbit.speed * (1 + k * 0.04), hitCd: base.orbit.hitCd / (1 + k * 0.06) }
        : null
    };
  };

  Run.prototype.speedMul = function () {
    var m = 1 + this.buffs.speed;
    if (this.curses && this.curses.slow) m *= 0.8;      // 迟缓诅咒
    return m;
  };
  /* 攻速乘区（含诅咒） */
  Run.prototype.atkSpeedMul = function () {
    var m = 1 + this.buffs.atkSpeed;
    if (this.curses && this.curses.clumsy) m *= 0.8;    // 笨拙诅咒
    return m;
  };
  /* 受伤乘区（含诅咒） */
  Run.prototype.dmgTakenMul = function () {
    return (this.curses && this.curses.frail) ? 1.25 : 1;  // 脆弱诅咒
  };
  Run.prototype.magnetR = function () { return 90 * (1 + this.buffs.magnet); };

  /* 加经验，返回本次升了几级 */
  Run.prototype.addXp = function (n) {
    this.xp += n;
    var ups = 0;
    while (this.xp >= this.xpNeed) {
      this.xp -= this.xpNeed;
      this.level++;
      this.xpNeed = Math.floor(this.xpNeed * 1.28 + 3);
      ups++;
    }
    if (ups) this.pendingLevels += ups;
    return ups;
  };

  /* 升级卡池：按权重抽取 3 张不重复
   * 武器已拥有 → 变为「技能升级」卡（同名，最高 8 级）
   * 已满级(8) → 不再出现 */
  Run.prototype.rollUpgrades = function (n) {
    n = n || 3;
    var self = this;
    var pool = [];
    D.UPGRADES.forEach(function (u) {
      var taken = self.upgrades[u.id] || 0;
      if (u.type === 'weapon') {
        var w = self.getWeapon(u.weapon);
        if (w) {
          // 已拥有：给升级卡（同 card id，显示 Lv.N → Lv.N+1）；满级则不再出现
          if (w.level < Run.WEAPON_MAX) pool.push({ def: self.weaponUpgradeDef(u), w: 1.6 });
          return;
        }
        // 未拥有：武器槽已满或有同级武器时可抽到，但已拥有满级的武器不重复给
        if (self.weapons.length >= 6) return;
        pool.push({ def: u, w: self.weapons.length >= 4 ? 0.35 : 1.5 });
        return;
      }
      if (taken >= (u.max || 1)) return;
      var w2 = u.type === 'passive' ? 1.15 : 1;
      if (u.id === 'p_maxHp' && self.hp <= self.maxHp * 0.3) w2 *= 2.2; // 残血（<30%）更容易刷到回血
      pool.push({ def: u, w: w2 });
    });
    var out = [];
    for (var i = 0; i < n && pool.length; i++) {
      var total = pool.reduce(function (a, p) { return a + p.w; }, 0);
      var r = this.rand() * total, acc = 0, idx = 0;
      for (var j = 0; j < pool.length; j++) {
        acc += pool[j].w;
        if (r <= acc) { idx = j; break; }
      }
      out.push(pool[idx].def);
      pool.splice(idx, 1);
    }
    return out;
  };

  /* 把武器卡包装成「升级」卡（复用同一 id，便于统计） */
  Run.prototype.weaponUpgradeDef = function (u) {
    var w = this.getWeapon(u.weapon);
    var lv = w ? w.level : 1;
    var next = Math.min(Run.WEAPON_MAX, lv + 1);
    var desc = D.WEAPON_LEVEL_TEXT && D.WEAPON_LEVEL_TEXT[next];
    return {
      id: u.id, type: 'weapon', weapon: u.weapon,
      name: u.name, icon: u.icon, max: Run.WEAPON_MAX,
      upgrade: true, fromLevel: lv, toLevel: next,
      text: desc || ('威力提升 · Lv.' + lv + ' → Lv.' + next),
      apply: null
    };
  };

  Run.prototype.applyUpgrade = function (def) {
    // 武器升级卡不重复计入 upgrades 次数统计（用武器自身等级表达）
    if (def.type === 'weapon') {
      if (this.hasWeapon(def.weapon)) this.levelUpWeapon(def.weapon);
      else this.addWeapon(def.weapon);
      return def;
    }
    this.upgrades[def.id] = (this.upgrades[def.id] || 0) + 1;
    if (def.type === 'passive') {
      var p = D.PASSIVES[def.passive];
      var b = this.buffs;
      if (p.fmt === 'p') b[def.passive] += p.v / 100;
      else if (def.passive === 'maxHp') {
        // 生命上限 +20，同时把新增的额度补成当前生命
        this.maxHp += p.v;
        this.hp = Math.min(this.maxHp, this.hp + p.v);
      }
      else if (def.passive === 'regen') b.regen += p.v;   // 每秒 +0.8 点
    } else if (def.apply) def.apply(this.buffs);
    return def;
  };

  /* 受到伤害（数值）。返回是否存活 */
  Run.prototype.takeDamage = function (n) {
    n = Math.max(1, Math.round(n || 0));
    this.hp -= n;
    this.dmgTaken += n;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; }
    return this.alive;
  };

  /* 回复生命（数值，支持小数累积）。返回实际回复量 */
  Run.prototype.heal = function (n) {
    if (!(n > 0)) return 0;
    var before = this.hp;
    var want = this.hp + n;
    if (want > this.maxHp) want = this.maxHp;
    this.hp = want;
    return this.hp - before;
  };

  /* 每帧回血（回血被动：小数/秒，攒够 1 点才回，避免显示抖动） */
  Run.prototype.tickRegen = function (dt) {
    var r = this.buffs.regen;
    if (!r || r <= 0) return 0;
    if (this.hp >= this.maxHp) { this.hpFloat = 0; return 0; }
    this.hpFloat += r * dt;
    var whole = Math.floor(this.hpFloat);
    if (whole <= 0) return 0;
    this.hpFloat -= whole;
    return this.heal(whole);
  };

  Run.prototype.chapterDef = function () {
    return D.CHAPTERS[Math.min(this.chapter - 1, D.CHAPTERS.length - 1)];
  };

  R.Run = Run;
})(window.RogueGame = window.RogueGame || {});
