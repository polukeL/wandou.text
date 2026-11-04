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

  // 把提示显示出来（覆盖在启动图之上，否则会被 #boot 遮住）
  R.showError = function (html) {
    var el = document.getElementById('game');
    if (el) el.innerHTML = '<div class="boot-error">' + html + '</div>';
    var boot = document.getElementById('boot');
    if (boot) { boot.classList.add('hide'); boot.style.display = 'none'; }
  };

  // Phaser 加载失败时的兜底提示
  R.checkEngine = function () {
    if (!window.Phaser) {
      R.showError('<h2>引擎加载失败</h2>' +
        '<p>请检查网络，或确认 vendor/phaser.min.js 存在。</p>');
      return false;
    }
    return true;
  };

  R.start = function () {
    if (!R.checkEngine()) return;
    // file:// 直开检测：浏览器会拦截图片加载，assets 覆盖全部失效
    if (location.protocol === 'file:') {
      R.showError('<h2>⚠️ 请勿直接双击打开</h2>' +
        '<p>当前通过 file:// 打开，浏览器安全策略会拦截贴图加载，<br>assets/ 里的替换图片全部不会生效。</p>' +
        '<p style="margin-top:16px">正确做法（任选其一）：</p>' +
        '<p style="margin-top:8px">① 双击游戏文件夹里的 <b>启动游戏.bat</b>（需已安装 Python）<br>' +
        '② 或在文件夹地址栏输入 <b>cmd</b> 回车，执行：<br>' +
        '<b>&nbsp;&nbsp;&nbsp;python -m http.server 8080</b><br>' +
        '&nbsp;&nbsp;&nbsp;然后访问 <b>http://127.0.0.1:8080</b></p>');
      return;
    }
    // 微信内禁止页面滚动/下拉
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    // 测试模式：先把地址栏 ?dev=1&key=xxx 换成授权（普通玩家无感）
    if (R.Dev) R.Dev.init();
    if (R.Meta) R.Meta.load();   // 载入研究所存档（金币/永久强化）
    // 先探测 assets/ 下哪些可选素材真的存在（分组目录优先），再启动引擎，
    // 这样 Preload 里加载的都是确定存在的单地址，不会因 404 回退失败。
    R.prepareAssets(function () {
      R.boot('game');
      R.emit('boot');
    });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(R.start, 0);
  } else {
    document.addEventListener('DOMContentLoaded', R.start);
  }
})(window.RogueGame = window.RogueGame || {});
