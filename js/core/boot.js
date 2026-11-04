/* =========================================================
 * core/boot.js —— 启动、缩放适配、资源（可选）加载
 * 设计目标：竖屏优先（微信里直接点开就能玩），横屏也能自适应。
 * ========================================================= */
(function (R) {
  'use strict';
  var BASE_W = 720, BASE_H = 1280;
  R.SCENES = R.SCENES || [];

  R.getSize = function () {
    var w = Math.min(window.innerWidth || 360, 900);
    var h = window.innerHeight || 720;
    return { w: w, h: h };
  };

  R.boot = function (parentId) {
    var size = R.getSize();
    var config = {
      type: Phaser.AUTO,
      parent: parentId || 'game',
      backgroundColor: '#2b1d2b',
      width: BASE_W,
      height: BASE_H,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: BASE_W,
        height: BASE_H
      },
      render: {
        antialias: true,
        roundPixels: false,
        powerPreference: 'high-performance'
      },
      fps: { target: 60, forceSetTimeOut: false },
      input: { activePointers: 2 },
      scene: R.SCENES || []
    };
    R.game = new Phaser.Game(config);
    return R.game;
  };

  /* 可选的正式音频/贴图预加载：
   * 如果 assets/ 下放了同名文件会自动覆盖占位图；没有就用占位。 */
  R.loadOptionalAssets = function (scene) {
    var files = (R.DATA.ART || []).map(function (a) { return { key: a.id, path: 'assets/' + a.id + '.png' }; });
    // 皮肤贴图同样支持 assets/skin_xxx.png 覆盖（主角实际渲染用的是皮肤纹理）
    (R.DATA.SKINS || []).forEach(function (s) {
      if (s && s.id) files.push({ key: s.id, path: 'assets/' + s.id + '.png' });
    });
    var audio = ['bgm_main', 'shoot', 'hit', 'kill', 'hurt', 'pickup', 'level', 'coin', 'heal', 'reward', 'boss'];
    files.forEach(function (f) {
      if (!scene.textures.exists(f.key + '_real')) scene.load.image(f.key + '_real', f.path);
    });
    audio.forEach(function (k) {
      scene.load.audio('a_' + k, ['assets/audio/' + k + '.mp3', 'assets/audio/' + k + '.ogg']);
    });
    var failedArt = [];
    scene.load.on('loaderror', function (file) {
      var src = (file && file.src ? file.src : '') + '';
      // 只提示角色/皮肤贴图失败（音效、UI 属于可选资源，404 是正常情况）
      var isArt = (R.DATA.ART || []).some(function (a) { return src.indexOf('assets/' + a.id + '.png') >= 0; }) ||
                  (R.DATA.SKINS || []).some(function (s) { return s && src.indexOf('assets/' + s.id + '.png') >= 0; });
      if (isArt) failedArt.push(src);
    });
    scene.load.once('complete', function () {
      if (failedArt.length) {
        console.warn('[豌豆镇] 以下角色/皮肤贴图加载失败（未生效）：\n  ' + failedArt.join('\n  ') +
          '\n请确认：1) 文件确实在 assets/ 目录且扩展名为 .png；2) 通过 http:// 访问而不是 file:// 双击打开；3) 浏览器无缓存（Ctrl+F5 强刷）');
      }
    });
  };

  /* 把 assets 下成功加载的真实贴图替换占位图 */
  R.applyRealArt = function (scene) {
    var defs = (R.DATA.ART || []).slice();
    (R.DATA.SKINS || []).forEach(function (s) { if (s && s.id) defs.push({ id: s.id }); });
    var applied = [];
    defs.forEach(function (a) {
      var realKey = a.id + '_real';
      if (scene.textures.exists(realKey)) {
        var src = scene.textures.get(realKey).getSourceImage();
        if (scene.textures.exists(a.id)) scene.textures.remove(a.id);
        scene.textures.addImage(a.id, src);
        applied.push(a.id);
      }
    });
    if (applied.length) {
      console.info('[豌豆镇] 已替换的正式贴图: ' + applied.join(', '));
    } else {
      console.info('[豌豆镇] 未检测到任何正式贴图（assets/ 下没有可用的 <id>.png，或加载失败）');
    }
  };
})(window.RogueGame = window.RogueGame || {});
