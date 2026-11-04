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

    /* 读条图片自定义（放图即生效，无需改代码）：
     *   assets/ui/loading_bar_bg.png   读条底图（显示为 368×18 区域）
     *   assets/ui/loading_bar_fill.png 读条填充图（按进度从左往右裁切显示）
     * 存在时替换默认矩形读条；图片按自然尺寸适配到 368×18。
     * 候选路径已在启动前由 R.prepareAssets 探测，这里只加载确定存在的地址。
     */
    var uiRes = R.RESOLVED || {};
    if (uiRes['loadbar_bg']) this.load.image('loadbar_bg', uiRes['loadbar_bg']);
    if (uiRes['loadbar_fill']) this.load.image('loadbar_fill', uiRes['loadbar_fill']);
    var imgs = { bg: null, fill: null };

    function texUsable(key) {
      var t = self.textures.get(key);
      return !!(t && t.key !== '__MISSING' && t.source && t.source[0] && t.source[0].width > 0);
    }

    function tryShowImages() {
      if (!imgs.bg && texUsable('loadbar_bg')) {
        imgs.bg = self.add.image(w / 2 - 184, h / 2, 'loadbar_bg')
          .setOrigin(0, 0.5).setDisplaySize(368, 18).setDepth(1);
        barBg.setVisible(false);
      }
      if (!imgs.fill && texUsable('loadbar_fill')) {
        imgs.fill = self.add.image(w / 2 - 184, h / 2, 'loadbar_fill')
          .setOrigin(0, 0.5).setDisplaySize(368, 18).setDepth(2);
        imgs.fill.setCrop(0, 0, 0, imgs.fill.height);
        bar.setVisible(false);
      }
    }
    this.load.on('filecomplete', function (key) {
      if (key === 'loadbar_bg' || key === 'loadbar_fill') tryShowImages();
    });
    this.load.on('progress', function (v) {
      if (imgs.fill) {
        // 按进度裁切填充图（只显示左侧 v 比例）
        imgs.fill.setCrop(0, 0, imgs.fill.width * v, imgs.fill.height);
      } else {
        bar.width = 368 * v;
      }
    });

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
