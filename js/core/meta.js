/* =========================================================
 * core/meta.js —— 永久成长（研究所）
 * 金币是跨局永久货币：拾取金币同时累计到 Meta.gold，
 * 在主界面「研究所」消费，永久强化后续每局的角色属性。
 * 存档：localStorage 'pearogue.meta.v1'
 * ========================================================= */
(function (R) {
  'use strict';
  var LS = 'pearogue.meta.v1';

  var Meta = R.Meta = {
    gold: 0,
    perks: {},        // id -> 等级
    totalRuns: 0,
    totalKills: 0,
    // 装扮
    avatar: 'av_pea',
    frame: 'fr_basic',
    owned: { av_pea: true, fr_basic: true },
    // 通关记录：【新版在前】{ time:秒, kills, level, room, date, seed }
    clears: []
  };

  Meta.load = function () {
    try {
      var d = JSON.parse(localStorage.getItem(LS) || '{}');
      if (d.gold) Meta.gold = d.gold | 0;
      if (d.perks && typeof d.perks === 'object') Meta.perks = d.perks;
      if (d.totalRuns) Meta.totalRuns = d.totalRuns | 0;
      if (d.totalKills) Meta.totalKills = d.totalKills | 0;
      if (d.avatar) Meta.avatar = d.avatar;
      if (d.frame) Meta.frame = d.frame;
      if (d.owned && typeof d.owned === 'object') {
        for (var k in d.owned) if (d.owned[k]) Meta.owned[k] = true;
      }
      Meta.owned[Meta.avatar] = true;
      Meta.owned[Meta.frame] = true;
      if (Array.isArray(d.clears)) Meta.clears = d.clears.filter(function (r) { return r && r.time > 0; });
    } catch (e) {}
    // 对局结束时累计次数（R.on 在 main.js 里定义，此时已可用）
    if (R.on && !Meta._hooked) {
      Meta._hooked = true;
      R.on('run:end', function (d) { Meta.recordRun((d && d.kills) || 0); });
    }
  };

  Meta.save = function () {
    try {
      localStorage.setItem(LS, JSON.stringify({
        gold: Meta.gold, perks: Meta.perks,
        totalRuns: Meta.totalRuns, totalKills: Meta.totalKills,
        avatar: Meta.avatar, frame: Meta.frame, owned: Meta.owned,
        clears: Meta.clears
      }));
    } catch (e) {}
  };

  /* ---------------- 装扮（头像 / 头像框） ---------------- */
  Meta.owns = function (id) { return !!Meta.owned[id]; };

  Meta.buyCosmetic = function (def) {
    if (Meta.owns(def.id)) return false;
    if (Meta.gold < def.price) return false;
    Meta.gold -= def.price;
    Meta.owned[def.id] = true;
    Meta.save();
    return true;
  };

  Meta.equip = function (def) {
    if (!Meta.owns(def.id)) return false;
    if (String(def.id).indexOf('av_') === 0) Meta.avatar = def.id;
    else Meta.frame = def.id;
    Meta.save();
    return true;
  };

  Meta.avatarDef = function (id) {
    var list = (R.DATA && R.DATA.AVATARS) || [];
    return list.filter(function (a) { return a.id === (id || Meta.avatar); })[0] || list[0];
  };
  Meta.frameDef = function (id) {
    var list = (R.DATA && R.DATA.FRAMES) || [];
    return list.filter(function (f) { return f.id === (id || Meta.frame); })[0] || list[0];
  };

  /* ---------------- 通关榜单（本地） ---------------- */
  /* 记录一次通关，返回 {record, isBest, prevBest} */
  Meta.addClear = function (info) {
    var rec = {
      time: Math.max(1, Math.round(info.time)),
      kills: info.kills | 0,
      level: info.level | 0,
      room: info.room | 0,
      date: Date.now(),
      seed: info.seed | 0
    };
    var prevBest = Meta.bestClear();
    Meta.clears.push(rec);
    // 按时间升序，只保留前 N 条
    Meta.clears.sort(function (a, b) { return a.time - b.time; });
    Meta.clears = Meta.clears.slice(0, ((R.DATA && R.DATA.LEADERBOARD) || {}).max || 20);
    Meta.save();
    var best = Meta.bestClear();
    return {
      record: rec,
      isBest: !prevBest || rec.time < prevBest.time,
      prevBest: prevBest,
      best: best
    };
  };

  Meta.bestClear = function () {
    if (!Meta.clears.length) return null;
    return Meta.clears.reduce(function (a, b) { return b.time < a.time ? b : a; });
  };

  /* 榜单：按时间升序；rank 从 1 开始 */
  Meta.board = function () {
    return Meta.clears.slice().sort(function (a, b) { return a.time - b.time; })
      .map(function (r, i) { r.rank = i + 1; return r; });
  };

  /* 格式化秒 → mm:ss */
  Meta.fmtTime = function (sec) {
    sec = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
  };

  Meta.addGold = function (n) {
    Meta.gold += n;
    Meta.save();
  };

  Meta.perkLevel = function (id) { return Meta.perks[id] || 0; };

  /* 某等级的升级价格 */
  Meta.cost = function (def, lvl) {
    lvl = lvl === undefined ? Meta.perkLevel(def.id) : lvl;
    return Math.round(def.cost * Math.pow(1.55, lvl) / 5) * 5;
  };

  Meta.canBuy = function (def) {
    var lvl = Meta.perkLevel(def.id);
    return lvl < def.max && Meta.gold >= Meta.cost(def, lvl);
  };

  Meta.buy = function (def) {
    if (!Meta.canBuy(def)) return false;
    Meta.gold -= Meta.cost(def);
    Meta.perks[def.id] = Meta.perkLevel(def.id) + 1;
    Meta.save();
    return true;
  };

  /* 把研究所等级折算成对一局的加成（Run 构造时调用） */
  Meta.buffsFor = function () {
    return {
      dmg:    Meta.perkLevel('dmg')    * 0.04,   // 每级 +4% 伤害
      atk:    Meta.perkLevel('atk')    * 0.04,   // 每级 +4% 攻速
      spd:    Meta.perkLevel('spd')    * 0.03,   // 每级 +3% 移速
      hp:     Meta.perkLevel('hp'),              // 每级 +1 生命上限
      magnet: Meta.perkLevel('magnet') * 0.15,   // 每级 +15% 拾取范围
      gain:   Meta.perkLevel('gain')   * 0.10    // 每级 +10% 金币获取
    };
  };

  Meta.recordRun = function (kills) {
    Meta.totalRuns++;
    Meta.totalKills += kills | 0;
    Meta.save();
  };
})(window.RogueGame = window.RogueGame || {});
