/* =========================================================
 * scenes/Title.js —— 标题页
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;

  function Title() { Phaser.Scene.call(this, { key: 'Title' }); }
  Title.prototype = Object.create(Phaser.Scene.prototype);
  Title.prototype.constructor = Title;

  Title.prototype.create = function () {
    var self = this;
    var W = this.scale.width, H = this.scale.height;
    var T = R.DATA.TEXT;

    // 背景
    var bg = this.add.graphics();
    bg.fillGradientStyle(0xbfe36b, 0xbfe36b, 0x7ec850, 0x7ec850, 1);
    bg.fillRect(0, 0, W, H);
    // 装饰云朵
    for (var i = 0; i < 5; i++) {
      var cx = (i * 173 + 60) % W, cy = 90 + (i % 3) * 70;
      var cloud = this.add.image(cx, cy, 'blob_soft').setScale(1.6).setAlpha(0.5);
      cloud.setTint(0xffffff);
      this.tweens.add({ targets: cloud, x: cx + 30, duration: 3000 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    // 地面
    var ground = this.add.graphics();
    ground.fillStyle(0x6cae3e, 1);
    ground.fillEllipse(W / 2, H + 60, W * 1.6, 460);
    ground.fillStyle(0x8ecc5a, 1);
    ground.fillEllipse(W / 2, H + 110, W * 1.6, 420);

    // 主角大图
    var hero = this.add.image(W / 2, H * 0.40, 'player').setScale(2.6);
    this.tweens.add({ targets: hero, y: hero.y - 16, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // 周围小怪
    var mobs = [['slime', 0.18, 0.55], ['bat', 0.84, 0.36], ['charger', 0.12, 0.72], ['spitter', 0.88, 0.66]];
    mobs.forEach(function (m, i) {
      var o = this.add.image(W * m[1], H * m[2], m[0]).setScale(1.5).setAlpha(0.95);
      this.tweens.add({ targets: o, y: o.y + 12, angle: i % 2 ? 8 : -8, duration: 900 + i * 220, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }, this);

    // 标题牌
    var plate = this.add.container(W / 2, H * 0.60);
    var g = this.add.graphics();
    g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-248, -66, 500, 140, 34);
    g.fillStyle(C.outline, 1);   g.fillRoundedRect(-254, -72, 500, 140, 34);
    g.fillStyle(0xfff6e2, 1);    g.fillRoundedRect(-246, -64, 484, 124, 28);
    plate.add(g);
    var t1 = this.add.text(0, -26, T.title, {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '52px', fontStyle: 'bold', color: '#2b1d2b'
    }).setOrigin(0.5);
    var t2 = this.add.text(0, 26, T.titleEn + '  ·  v' + R.DATA.VERSION, {
      fontFamily: 'system-ui,sans-serif', fontSize: '20px', color: '#7a6a68', letterSpacing: 2
    }).setOrigin(0.5);
    plate.add([t1, t2]);

    // 开始按钮：优先用 UI 皮肤图（btn_start），否则代码绘制
    var btnY = H * 0.76;
    var btn = this.add.container(W / 2, btnY);
    var bskin = R.UISkin.apply(this, 'btn_start', 0, 0, 352, 96);
    var btnChildren = [];
    if (bskin) {
      btn.add(bskin);
    } else {
      var bg1 = this.add.graphics();
      bg1.fillStyle(0x000000, 0.25); bg1.fillRoundedRect(-172, -40, 352, 96, 48);
      bg1.fillStyle(C.outline, 1);   bg1.fillRoundedRect(-180, -48, 352, 96, 48);
      bg1.fillStyle(0xf9a825, 1);    bg1.fillRoundedRect(-172, -40, 336, 80, 40);
      bg1.fillStyle(0xffc93c, 1);    bg1.fillRoundedRect(-172, -40, 336, 52, 26);
      btnChildren.push(bg1);
    }
    var bt = this.add.text(-4, -2, '开始冒险', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#4a2c00'
    }).setOrigin(0.5);
    btnChildren.push(bt);
    btn.add(btnChildren);
    btn.setSize(352, 96).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () {
      R.Sfx.unlock(); R.Sfx.play('click');
      btn.setScale(0.94);
      this.time.delayedCall(90, function () { this.startGame(); }, [], this);
    }, this);
    btn.on('pointerup', function () { btn.setScale(1); });

    // 研究所入口（显示当前金币）
    var lab = this.add.container(W - 96, btnY);
    var lg = this.add.graphics();
    lg.fillStyle(C.outline, 1);  lg.fillRoundedRect(-84, -38, 172, 76, 38);
    lg.fillStyle(0x9b5de5, 1);   lg.fillRoundedRect(-78, -32, 160, 64, 32);
    lg.fillStyle(0xb585f0, 1);   lg.fillRoundedRect(-78, -32, 160, 34, 17);
    lab.add(lg);
    lab.add(this.add.text(0, -20, '研究所', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#fff6e2'
    }).setOrigin(0.5));
    lab.add(this.add.text(0, 10, '⛃ ' + R.Meta.gold, {
      fontFamily: 'system-ui,sans-serif', fontSize: '17px', color: '#ffe9a8'
    }).setOrigin(0.5));
    lab.setSize(172, 76).setInteractive({ useHandCursor: true });
    lab.on('pointerdown', function () {
      R.Sfx.unlock(); R.Sfx.play('click');
      lab.setScale(0.94);
      var sc = self;
      sc.time.delayedCall(90, function () { sc.scene.start('Lab'); });
    });
    lab.on('pointerup', function () { lab.setScale(1); });

    // 提示
    this.add.text(W / 2, H - 120, R.DATA.TEXT.hint, {
      fontFamily: 'system-ui,sans-serif', fontSize: '20px', color: '#3d5a20'
    }).setOrigin(0.5).setAlpha(0.9);

    // 音效开关
    this.buildSoundToggle(W - 56, 56);

    // UI 自定义入口（🎨）
    var cus = this.add.container(56, 56);
    var cg = this.add.graphics();
    cg.fillStyle(C.outline, 0.85); cg.fillCircle(0, 0, 30);
    cg.fillStyle(0xfff6e2, 1); cg.fillCircle(0, 0, 24);
    cus.add(cg);
    cus.add(this.add.text(0, 0, '🎨', { fontSize: '24px' }).setOrigin(0.5));
    cus.setSize(60, 60).setInteractive({ useHandCursor: true });
    cus.on('pointerdown', function () {
      R.Sfx.play('click');
      R.UISkin.openCustomizer();
    });

    // 最佳记录
    var best = 0;
    try { best = parseInt(localStorage.getItem('pearogue.best') || '0', 10) || 0; } catch (e) {}
    if (best > 0) {
      this.add.text(W / 2, H - 76, '最远到达：第 ' + best + ' 关', {
        fontFamily: 'system-ui,sans-serif', fontSize: '18px', color: '#3d5a20'
      }).setOrigin(0.5).setAlpha(0.8);
    }

    // 动画入场
    plate.setScale(0.8).setAlpha(0);
    this.tweens.add({ targets: plate, scale: 1, alpha: 1, duration: 420, ease: 'Back.out' });
    hero.setAlpha(0);
    this.tweens.add({ targets: hero, alpha: 1, duration: 300 });
  };

  Title.prototype.buildSoundToggle = function (x, y) {
    var c = this.add.container(x, y);
    var g = this.add.graphics();
    g.fillStyle(C.outline, 0.85); g.fillCircle(0, 0, 30);
    g.fillStyle(0xfff6e2, 1); g.fillCircle(0, 0, 24);
    c.add(g);
    var label = this.add.text(0, 0, R.Sfx.muted ? '🔇' : '🔊', { fontSize: '26px' }).setOrigin(0.5);
    c.add(label);
    c.setSize(60, 60).setInteractive({ useHandCursor: true });
    c.on('pointerdown', function () {
      var on = R.Sfx.toggle(); label.setText(on ? '🔊' : '🔇');
      R.Sfx.play('click');
    });
  };

  Title.prototype.startGame = function () {
    this.cameras.main.fadeOut(160, 43, 29, 43);
    this.time.delayedCall(170, function () { this.scene.start('Game'); }, [], this);
  };

  R.SCENES.push(Title);
})(window.RogueGame = window.RogueGame || {});
