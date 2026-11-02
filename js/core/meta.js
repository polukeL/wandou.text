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
    totalKills: 0
  };

  Meta.load = function () {
    try {
      var d = JSON.parse(localStorage.getItem(LS) || '{}');
      if (d.gold) Meta.gold = d.gold | 0;
      if (d.perks && typeof d.perks === 'object') Meta.perks = d.perks;
      if (d.totalRuns) Meta.totalRuns = d.totalRuns | 0;
      if (d.totalKills) Meta.totalKills = d.totalKills | 0;
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
        totalRuns: Meta.totalRuns, totalKills: Meta.totalKills
      }));
    } catch (e) {}
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
