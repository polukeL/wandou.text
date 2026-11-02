/* =========================================================
 * systems/registry.js —— 扩展注册表（后续加玩法从这里进）
 * =========================================================
 * 核心思想：新内容都以「数据 + 行为函数」的方式挂到这里，
 * 不改动核心逻辑。示例都在文件末尾，取消注释即可看到效果。
 * ========================================================= */
(function (R) {
  'use strict';
  var Reg = R.Registry = {
    weapons: {},   // 额外武器：{ key: { def:{...}, fire: function(scene, stats){...} } }
    enemies: {},   // 额外敌人：{ key: { def:{...}, update: function(scene, enemy, dt){...} } }
    upgrades: [],  // 额外升级卡：与 DATA.UPGRADES 同结构
    modifiers: [], // 全局规则修改器（如"子弹会反弹""时间越久越强"）
    hooks: {}      // 生命周期钩子：roomStart / roomClear / levelUp / kill / hurt
  };

  Reg.addWeapon = function (key, impl) { Reg.weapons[key] = impl; };
  Reg.addEnemy = function (key, impl) { Reg.enemies[key] = impl; };
  Reg.addUpgrade = function (def) { Reg.upgrades.push(def); };
  Reg.addModifier = function (m) { Reg.modifiers.push(m); };
  Reg.on = function (hook, fn) { (Reg.hooks[hook] = Reg.hooks[hook] || []).push(fn); };
  Reg.trigger = function (hook, payload) {
    (Reg.hooks[hook] || []).forEach(function (fn) { try { fn(payload); } catch (e) { console.warn(e); } });
  };

  /* 把注册表里额外内容并入 DATA（在 Preload 之前调用） */
  Reg.merge = function () {
    var D = R.DATA;
    Object.keys(Reg.weapons).forEach(function (k) {
      if (!D.WEAPONS[k]) D.WEAPONS[k] = Reg.weapons[k].def;
    });
    Object.keys(Reg.enemies).forEach(function (k) {
      if (!D.ENEMIES[k]) D.ENEMIES[k] = Reg.enemies[k].def;
    });
    Reg.upgrades.forEach(function (u) {
      if (!D.UPGRADES.some(function (x) { return x.id === u.id; })) D.UPGRADES.push(u);
    });
  };

  /* ---------------------------------------------------------
   * 扩展示例（真实接入时取消注释）
   * ------------------------------------------------------- */

  // ① 新增武器：激光
  // Reg.addWeapon('laser', {
  //   def: { name: '激光笔', dmg: 20, cd: 1.1, speed: 1400, radius: 6, count: 1, spread: 0, pierce: 3, life: 0.4, knock: 40, sfx: 'shoot' },
  //   fire: function (scene, st) { scene.fireWeapon('laser', st); }
  // });
  // Reg.addUpgrade({ id: 'w_laser', type: 'weapon', weapon: 'laser', name: '激光笔', text: '高速穿透射线', icon: 'arrow', max: 1 });

  // ② 新增敌人：分裂史莱姆
  // Reg.addEnemy('splitter', {
  //   def: { art: 'slime', name: '分裂怪', hp: 50, speed: 70, size: 40, dmg: 1, xp: 5, gold: 2, kind: 'chaser', squash: true }
  // });

  // ③ 新增规则：每 30 秒来一波精英
  // Reg.addModifier({ id: 'elite_wave', on: 'timer', interval: 30, run: function (scene) { scene.spawnEnemy('slime', { elite: true }); } });
})(window.RogueGame = window.RogueGame || {});
