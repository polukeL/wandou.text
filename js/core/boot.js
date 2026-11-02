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
    var audio = ['bgm_main', 'shoot', 'hit', 'kill', 'hurt', 'pickup', 'level', 'coin', 'heal', 'reward', 'boss'];
    files.forEach(function (f) {
      if (!scene.textures.exists(f.key + '_real')) scene.load.image(f.key + '_real', f.path);
    });
    audio.forEach(function (k) {
      scene.load.audio('a_' + k, ['assets/audio/' + k + '.mp3', 'assets/audio/' + k + '.ogg']);
    });
    // 加载失败静默处理
    scene.load.on('loaderror', function () {});
  };

  /* 把 assets 下成功加载的真实贴图替换占位图 */
  R.applyRealArt = function (scene) {
    (R.DATA.ART || []).forEach(function (a) {
      var realKey = a.id + '_real';
      if (scene.textures.exists(realKey)) {
        var src = scene.textures.get(realKey).getSourceImage();
        if (scene.textures.exists(a.id)) scene.textures.remove(a.id);
        scene.textures.addImage(a.id, src);
      }
    });
  };
})(window.RogueGame = window.RogueGame || {});
