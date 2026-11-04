/* =========================================================
 * scenes/Preload.js —— 生成占位图 + 可选覆盖正式资源
 * ========================================================= */
(function (R) {
  'use strict';

  R.SCENES = R.SCENES || [];

  function Preload() { Phaser.Scene.call(this, { key: 'Preload' }); }
  Preload.prototype = Object.create(Phaser.Scene.prototype);
  Preload.prototype.constructor = Preload;

  Preload.prototype.preload = function () {
    var self = this;
    // 进度条
    var w = this.scale.width, h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x2b1d2b);
    var barBg = this.add.rectangle(w / 2, h / 2, 380, 26, 0x4a3a4a).setStrokeStyle(4, 0xfff6e2);
    var bar = this.add.rectangle(w / 2 - 184, h / 2, 0, 18, 0x6cc24a).setOrigin(0, 0.5);
    var txt = this.add.text(w / 2, h / 2 - 44, R.DATA.TEXT.title, {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '34px', color: '#fff6e2'
    }).setOrigin(0.5);
    this.load.on('progress', function (v) { bar.width = 368 * v; });
    R.loadOptionalAssets(this);
    R.UISkin.loadStored(this);   // UI 皮肤：assets/ui/*.png + 前端上传的自定义图
  };

  Preload.prototype.create = function () {
    var self = this;
    R.Art.generate(this);
    R.Art.generateUI(this);      // UI 占位图
    R.Art.generateObstacles(this); // 建筑/障碍物占位图（ob_*）
    R.Art.generateSkins(this);     // 角色皮肤占位图（skin_*）
    R.Art.generatePet(this);       // 宠物系统贴图（蛋巢/蛋/宠物）
    R.Art.generateProps(this);     // 祭坛与泉水贴图
    R.applyRealArt(this);
    // 等待 localStorage 自定义皮肤纹理写入完成再进标题页
    R.UISkin.waitReady(function () { self.scene.start('Title'); });
  };

  R.SCENES.push(Preload);
})(window.RogueGame = window.RogueGame || {});
