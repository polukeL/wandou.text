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

  /* 全局脚本错误兜底（v0.7.9）
   * 某个 js 文件被改坏 / 部署成不完整版本时（典型：git 冲突标记残留），
   * 浏览器只会白屏卡住，玩家看不到任何线索。这里把错误显示到页面上。 */
  var bootErrorShown = false;
  window.addEventListener('error', function (e) {
    if (bootErrorShown) return;
    var msg = (e && e.message) ? e.message : '';
    // 只拦脚本语法/运行错误，图片 404 之类不打扰玩家
    if (!msg || /Unexpected token|is not a function|is not defined|SyntaxError/i.test(msg) === false) return;
    bootErrorShown = true;
    R.showError('<h2>游戏启动出错了</h2>' +
      '<p>错误信息：<code>' + msg.replace(/[<>]/g, '') + '</code></p>' +
      '<p style="margin-top:12px">如果是你自己部署的版本，最常见的原因是<br>' +
      '某个 js 文件里残留了 git 合并冲突标记（<code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>），' +
      '导致该文件整体无法解析。</p>' +
      '<p style="margin-top:8px">请检查并重新部署，或按 F12 查看具体是哪个文件报错。</p>');
  }, true);

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

    // 模块完整性自检：某个 js 文件语法错误 / 被错误提交（如残留 git 冲突标记）
    // 时，对应模块的方法会缺失，这里提前报出来，避免只卡在启动屏看不出原因。
    var missing = [];
    if (!R.boot) missing.push('core/boot.js');
    if (!R.Art || !R.Art.generate) missing.push('core/art.js');
    if (!R.DATA) missing.push('core/data.js');
    if (!R.UISkin) missing.push('ui/skin.js');
    if (missing.length) {
      R.showError('<h2>游戏文件加载失败</h2>' +
        '<p>以下模块没有正确加载：<b>' + missing.join('、') + '</b></p>' +
        '<p style="margin-top:12px">常见原因：</p>' +
        '<p style="margin-top:8px">① 部署时文件被覆盖成不完整版本（如 git 合并冲突未解决，文件里残留 ' +
        '<code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code> 标记）<br>' +
        '② 上传中断，文件不完整<br>' +
        '③ 强缓存了旧的损坏版本 → 试试 Ctrl+F5 / 清缓存</p>' +
        '<p style="margin-top:12px">开发者：按 F12 看 Console 第一条红色报错。</p>');
      return;
    }
    // 兼容极旧版本（没有 prepareAssets 时直接启动，不让游戏卡死）
    if (typeof R.prepareAssets !== 'function') {
      R.boot('game');
      R.emit('boot');
      return;
    }
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
