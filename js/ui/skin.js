/* =========================================================
 * ui/skin.js —— UI 皮肤系统
 * 让每个 UI 组件都可以用「图片」替换代码绘制，三条优先级：
 *   1. 前端上传（localStorage 持久化，priority 最高）
 *   2. assets/ui/<id>.png（静态托管放图即生效）
 *   3. uiskin_gen_<id>（程序生成的简单占位图）
 *   都没有 → 各 UI 处的代码绘制兜底
 * 标题页左上角 🎨 按钮可打开「UI 自定义」面板（上传/清除图片）。
 * ========================================================= */
(function (R) {
  'use strict';

  /* 可替换的 UI 组件清单（id 即文件名） */
  var IDS = R.UISkin_IDS = [
    'btn_start',   // 标题页「开始冒险」按钮      建议 336x80
    'btn_pause',   // 战斗中右下角暂停按钮        建议 56x56
    'btn_resume',  // 暂停菜单「继续闯关」按钮    建议 336x80
    'btn_quit',    // 暂停菜单「退出对局」按钮    建议 336x80
    'btn_replay',  // 结算页「再来一局」按钮      建议 256x66
    'btn_mute',    // 音效开关圆钮                建议 56x56
    'card',        // 升级三选一卡片底板          建议 648x210
    'panel'        // 结算页白色面板              建议 588x452
  ];

  var LS_KEY = 'pearogue.uiskin.';

  /* 取某组件当前最优贴图 key；没有返回 null（用代码绘制兜底） */
  function keyOf(id) {
    var t;
    try { t = R.game ? R.game.textures : null; } catch (e) { t = null; }
    if (!t) return null;
    if (t.exists('uiskin_custom_' + id)) return 'uiskin_custom_' + id;
    if (t.exists('uiskin_file_' + id)) return 'uiskin_file_' + id;
    if (t.exists('uiskin_gen_' + id)) return 'uiskin_gen_' + id;
    return null;
  }

  /* 在场景里放一张 UI 皮肤图（自动缩放到 w×h）；无皮肤返回 null */
  function apply(scene, id, x, y, w, h) {
    var k = keyOf(id);
    if (!k) return null;
    return scene.add.image(x, y, k).setDisplaySize(w, h);
  }

  /* 皮肤是否可用（供调用方决定走图片分支还是绘制分支） */
  function has(id) { return !!keyOf(id); }

  /* ---------------- Preload 阶段加载 ---------------- */
  var pending = 0;

  function loadStored(scene) {
    pending = 0;
    // 1) assets/ui/<id>.png（加载失败静默，走占位）
    IDS.forEach(function (id) {
      scene.load.image('uiskin_file_' + id, 'assets/ui/' + id + '.png');
    });
    scene.load.on('loaderror', function () {});
    // 2) 前端上传过的自定义图（localStorage dataURL）
    scene.textures.on(Phaser.Textures.Events.ADD, function (tex) {
      if (tex && tex.key && tex.key.indexOf('uiskin_custom_') === 0) pending--;
    });
    scene.textures.on(Phaser.Textures.Events.ERROR, function (k) {
      if (k && k.indexOf('uiskin_custom_') === 0) pending--;
    });
    IDS.forEach(function (id) {
      var d = null;
      try { d = localStorage.getItem(LS_KEY + id); } catch (e) {}
      if (d) {
        pending++;
        scene.textures.addBase64('uiskin_custom_' + id, d);
      }
    });
  }

  function waitReady(cb) {
    if (pending <= 0) { cb(); return; }
    setTimeout(function () { waitReady(cb); }, 60);
  }

  /* ---------------- 前端上传控制 ---------------- */
  function setCustom(id, dataURL) {
    try { localStorage.setItem(LS_KEY + id, dataURL); } catch (e) { alert('图片太大，存储失败'); return; }
    if (R.game && R.game.textures.exists('uiskin_custom_' + id)) R.game.textures.remove('uiskin_custom_' + id);
    R.game.textures.addBase64('uiskin_custom_' + id, dataURL);
  }
  function clearCustom(id) {
    try { localStorage.removeItem(LS_KEY + id); } catch (e) {}
    if (R.game && R.game.textures.exists('uiskin_custom_' + id)) R.game.textures.remove('uiskin_custom_' + id);
  }

  /* DOM 自定义面板（标题页 🎨 按钮触发） */
  function openCustomizer() {
    var old = document.getElementById('ui-customizer');
    if (old) { old.remove(); return; }
    var box = document.createElement('div');
    box.id = 'ui-customizer';
    box.style.cssText = 'position:fixed;inset:0;z-index:50;background:rgba(26,16,32,.92);' +
      'color:#fff6e2;font:14px system-ui,sans-serif;overflow:auto;padding:18px;';
    var html = '<div style="max-width:520px;margin:0 auto">' +
      '<h2 style="color:#ffe14d;margin:6px 0 2px">🎨 UI 自定义</h2>' +
      '<p style="opacity:.75;margin:0 0 14px">上传 PNG 替换对应界面组件（立即生效，刷新后仍保留）。' +
      '建议尺寸见「美术资源清单.md」第六节。不放图则使用占位图。</p><div id="ui-cus-rows">';
    IDS.forEach(function (id) {
      html += '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.12)">' +
        '<span style="flex:1">' + id + '</span>' +
        '<img id="ui-prev-' + id + '" style="width:64px;height:28px;object-fit:contain;background:rgba(255,255,255,.08);border-radius:4px">' +
        '<input type="file" accept="image/png,image/jpeg,image/webp" data-ui="' + id + '" style="max-width:190px;font-size:12px">' +
        '<button data-clear="' + id + '" style="font-size:12px;padding:4px 8px">清除</button>' +
        '</div>';
    });
    html += '</div><div style="text-align:center;margin-top:16px">' +
      '<button id="ui-cus-close" style="padding:10px 40px;font-size:16px;border-radius:24px;border:0;background:#6cc24a;color:#12300a;font-weight:bold">关 闭</button>' +
      '</div></div>';
    box.innerHTML = html;
    document.body.appendChild(box);

    // 回显当前自定义图
    IDS.forEach(function (id) {
      var d = null;
      try { d = localStorage.getItem(LS_KEY + id); } catch (e) {}
      if (d) document.getElementById('ui-prev-' + id).src = d;
    });

    box.querySelectorAll('input[type=file]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var id = inp.getAttribute('data-ui');
        var f = inp.files && inp.files[0];
        if (!f) return;
        var rd = new FileReader();
        rd.onload = function () {
          setCustom(id, rd.result);
          document.getElementById('ui-prev-' + id).src = rd.result;
          refreshOpenScene(id);
        };
        rd.readAsDataURL(f);
      });
    });
    box.querySelectorAll('button[data-clear]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-clear');
        clearCustom(id);
        document.getElementById('ui-prev-' + id).src = '';
        refreshOpenScene(id);
      });
    });
    document.getElementById('ui-cus-close').addEventListener('click', function () { box.remove(); });
  }

  /* 改动后让打开中的标题页立即重绘（战斗中改动在下次进界面生效） */
  function refreshOpenScene() {
    if (!R.game) return;
    var title = R.game.scene.getScene('Title');
    if (title && title.sys.isActive()) title.scene.restart();
  }

  R.UISkin = {
    key: keyOf, has: has, apply: apply,
    loadStored: loadStored, waitReady: waitReady,
    setCustom: setCustom, clearCustom: clearCustom,
    openCustomizer: openCustomizer
  };
})(window.RogueGame = window.RogueGame || {});
