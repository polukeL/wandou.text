/* =========================================================
 * ui/pause.js —— 暂停菜单（独立叠加场景）
 * 由 Game.pauseGame() 启动；提供「继续闯关 / 退出对局」。
 * 按钮支持 UI 皮肤（btn_resume / btn_quit），无皮肤走绘制兜底。
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var FONT = '"Baloo 2","Fredoka","PingFang SC","Microsoft YaHei",system-ui,sans-serif';

  function PauseScene() { Phaser.Scene.call(this, { key: 'Pause' }); }
  PauseScene.prototype = Object.create(Phaser.Scene.prototype);
  PauseScene.prototype.constructor = PauseScene;

  PauseScene.prototype.init = function (data) {
    data = data || {};
    this.gameScene = data.game || null;
    this._orphan = !data.game;   // 场景管理器自动启动时无参数，直接自关
  };

  PauseScene.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    if (this._orphan) { this.time.delayedCall(0, function () { this.scene.stop(); }, [], this); return; }

    // 半透明遮罩（挡住下面的点击）
    this.add.rectangle(0, 0, W, H, 0x1a1020, 0.82).setOrigin(0).setInteractive();

    this.add.text(W / 2, H * 0.30, '暂 停', {
      fontFamily: FONT, fontSize: '56px', fontStyle: 'bold', color: '#ffe14d',
      stroke: '#2b1d2b', strokeThickness: 12
    }).setOrigin(0.5);

    // 继续闯关
    this.buildBtn(W / 2, H * 0.44, 'btn_resume', '继续闯关', '#1c3d0e', function () {
      self.scene.stop();
      if (self.gameScene) self.gameScene.resumeGame();
    }, 0x6cc24a, 0x8ada67);

    // 退出对局
    this.buildBtn(W / 2, H * 0.58, 'btn_quit', '退出对局', '#4a1c10', function () {
      R.Sfx.play('click');
      self.scene.stop();
      if (self.gameScene) self.gameScene.quitToTitle();
    }, 0xe8633c, 0xf28a5f);

    // 入场
    this.cameras.main.fadeIn(160, 26, 16, 32);
  };

  /* 通用按钮：有皮肤用图片，没有走圆角绘制 */
  PauseScene.prototype.buildBtn = function (x, y, skinId, label, textColor, onTap, c1, c2) {
    var btn = this.add.container(x, y);
    var skin = R.UISkin.apply(this, skinId, 0, 0, 336, 80);
    if (skin) {
      btn.add(skin);
    } else {
      var g = this.add.graphics();
      g.fillStyle(0x000000, 0.25); g.fillRoundedRect(-164, -36, 336, 80, 40);
      g.fillStyle(C.outline, 1);   g.fillRoundedRect(-172, -44, 336, 80, 40);
      g.fillStyle(c1, 1);          g.fillRoundedRect(-164, -36, 320, 68, 34);
      g.fillStyle(c2, 1);          g.fillRoundedRect(-164, -36, 320, 42, 21);
      btn.add(g);
    }
    btn.add(this.add.text(-2, -2, label, {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: textColor
    }).setOrigin(0.5));
    btn.setSize(336, 80).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () { btn.setScale(0.95); R.Sfx.play('click'); });
    btn.on('pointerup', function () { btn.setScale(1); onTap(); });
    return btn;
  };

  R.SCENES.push(PauseScene);
})(window.RogueGame = window.RogueGame || {});
