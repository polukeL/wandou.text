/* =========================================================
 * ui/skin.js —— UI 皮肤系统
 * 让每个 UI 组件都可以用「图片」替换代码绘制，优先级：
 *   1. assets/ui/<id>.png（静态托管放图即生效）
 *   2. uiskin_gen_<id>（程序生成的简单占位图）
 * 都没有 → 各 UI 处的代码绘制兜底
 *
 * 注意：早期版本的「游戏内上传图片」面板已移除。
 * 现在只支持把 PNG 放进 assets/ui/ 目录（重新部署后生效）。
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
    'panel'        // 结算页白色面板              建议 588x566
  ];

  /* 取某组件当前最优贴图 key；没有返回 null（用代码绘制兜底） */
  function keyOf(id) {
    var t;
    try { t = R.game ? R.game.textures : null; } catch (e) { t = null; }
    if (!t) return null;
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
  function loadStored(scene) {
    IDS.forEach(function (id) {
      scene.load.image('uiskin_file_' + id, 'assets/ui/' + id + '.png');
    });
    scene.load.on('loaderror', function () {});
  }

  function waitReady(cb) { cb(); }

  R.UISkin = {
    IDS: IDS,
    key: keyOf, has: has, apply: apply,
    loadStored: loadStored, waitReady: waitReady
  };
})(window.RogueGame = window.RogueGame || {});
