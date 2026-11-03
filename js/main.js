/* =========================================================
 * main.js —— 入口：事件总线 + 启动
 * 后续接后端 / 广告 / 埋点，都在 R.emit 上挂
 * ========================================================= */
(function (R) {
  'use strict';

  // 极简事件总线（埋点、成就、后端上报都走这里）
  var listeners = {};
  R.on = function (evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); };
  R.off = function (evt, fn) {
    if (!listeners[evt]) return;
    listeners[evt] = listeners[evt].filter(function (f) { return f !== fn; });
  };
  R.emit = function (evt, payload) {
    if (window.__ROGUE_DEBUG__) console.log('[event]', evt, payload);
    (listeners[evt] || []).forEach(function (fn) {
      try { fn(payload); } catch (e) { console.warn(e); }
    });
  };

  // Phaser 加载失败时的兜底提示
  R.checkEngine = function () {
    var el = document.getElementById('game');
    if (!window.Phaser) {
      if (el) {
        el.innerHTML = '<div class="boot-error"><h2>引擎加载失败</h2>' +
          '<p>请检查网络，或把 phaser.min.js 放到本地后重试。</p></div>';
      }
      return false;
    }
    return true;
  };

  R.start = function () {
    if (!R.checkEngine()) return;
    // 微信内禁止页面滚动/下拉
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    // 测试模式：先把地址栏 ?dev=1&key=xxx 换成授权（普通玩家无感）
    if (R.Dev) R.Dev.init();
    if (R.Meta) R.Meta.load();   // 载入研究所存档（金币/永久强化）
    R.boot('game');
    R.emit('boot');
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(R.start, 0);
  } else {
    document.addEventListener('DOMContentLoaded', R.start);
  }
})(window.RogueGame = window.RogueGame || {});
