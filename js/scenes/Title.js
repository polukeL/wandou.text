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
    var t2 = this.add.text(0, 26, T.titleEn, {
      fontFamily: 'system-ui,sans-serif', fontSize: '20px', color: '#7a6a68', letterSpacing: 2
    }).setOrigin(0.5);
    plate.add([t1, t2]);

    // 版本号 + 更新简介入口（点了打开更新日志）
    this.buildVersionBtn(W / 2, H * 0.60 + 100);

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
    var lab = this.buildSideBtn(W - 92, btnY, '研究所', '⛃ ' + R.Meta.gold, 0x9b5de5, 0xb585f0, 'Lab');
    // 商店入口
    this.buildSideBtn(92, btnY, '商 店', '金币购买装扮', 0xf9a825, 0xffc93c, 'Shop');

    // 头像 + 头像框（可替换；点击进商店）
    var avY = btnY + 108;
    var av = R.Avatar.add(this, W / 2, avY, 84, { depth: 5 });
    av.setSize(140, 140).setInteractive({ useHandCursor: true });
    av.on('pointerdown', function () {
      R.Sfx.play('click');
      self.scene.start('Shop', { tab: 'avatar' });
    });
    // 彩虹框缓慢旋转
    if (R.Meta.frame === 'fr_rainbow') R.Avatar.spinFrame(this, av, 9000);
    // 昵称条
    var nameDef = R.Meta.avatarDef();
    var avName = this.add.text(W / 2, avY + 60, nameDef ? nameDef.name : '豌豆仔', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '18px', fontStyle: 'bold',
      color: '#2b1d2b'
    }).setOrigin(0.5).setAlpha(0.85);

    // 通关时间榜入口
    var bestT = R.Meta.bestClear();
    var lbBtn = this.add.container(W / 2, avY + 104);
    var lbg = this.add.graphics();
    lbg.fillStyle(C.outline, 0.9); lbg.fillRoundedRect(-108, -19, 216, 38, 19);
    lbg.fillStyle(0x5a4a68, 1);    lbg.fillRoundedRect(-103, -15, 206, 30, 15);
    lbBtn.add(lbg);
    lbBtn.add(this.add.text(-92, 0, '🏆', { fontSize: '17px' }).setOrigin(0, 0.5));
    lbBtn.add(this.add.text(-64, -1, bestT ? '最佳 ' + R.Meta.fmtTime(bestT.time) : '通关时间榜', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#ffe14d'
    }).setOrigin(0, 0.5));
    lbBtn.setSize(216, 38).setInteractive({ useHandCursor: true });
    lbBtn.on('pointerdown', function () {
      R.Sfx.play('click');
      self.scene.start('Board');
    });

    // 提示（在通关榜入口 avY+104+19 ≈ btnY+231 之下，避免重叠）
    this.add.text(W / 2, H - 52, R.DATA.TEXT.hint, {
      fontFamily: 'system-ui,sans-serif', fontSize: '19px', color: '#3d5a20'
    }).setOrigin(0.5).setAlpha(0.9);

    // 音效开关
    this.buildSoundToggle(W - 56, 56);

    // 测试模式入口：只有地址带 ?dev=1 且密码校验通过才出现（详见 core/devmode.js）
    if (R.Dev && R.Dev.exposed()) this.buildDevEntry();

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

    // 测试模式快捷开局：?dev=1&key=xxx&go=15 直接进关，不用手点
    if (R.Dev && R.Dev.ENABLED && R.Dev.isUnlocked()) {
      var p = R.Dev.urlParams();
      if (p.go || p.god || p.gold) {
        this.time.delayedCall(300, function () { self.scene.start('Game'); });
      }
    }
  };

  /* 版本号 + 更新简介按钮
   * 内容来自 data.js 的 D.VERSION / D.CHANGELOG，点击进入 Changelog 场景
   */
  Title.prototype.buildVersionBtn = function (x, y) {
    var self = this;
    var D = R.DATA;
    var latest = (D.CHANGELOG && D.CHANGELOG[0]) || {};
    var c = this.add.container(x, y).setDepth(8);

    var label = 'v' + D.VERSION + '  ·  ' + (latest.title || '更新内容') + '  ›';

    // 宽度按文字估算，保证不溢出
    var estW = Math.max(240, label.length * 15 + 52);
    var g = this.add.graphics();
    g.fillStyle(0x2b1d2b, 0.28); g.fillRoundedRect(-estW / 2 + 2, -20, estW, 42, 21);
    g.fillStyle(0xfff6e2, 0.92); g.fillRoundedRect(-estW / 2, -22, estW, 42, 21);
    g.lineStyle(2.5, 0xc9b8a0, 0.9);
    g.strokeRoundedRect(-estW / 2, -22, estW, 42, 21);
    c.add(g);

    // 小圆点（提示有新内容）
    c.add(this.add.text(-estW / 2 + 18, -1, '🎉', { fontSize: '17px' }).setOrigin(0.5));

    c.add(this.add.text(6, -1, label, {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif',
      fontSize: '17px', fontStyle: 'bold', color: '#4a3a52'
    }).setOrigin(0.5));

    c.setSize(estW, 42).setInteractive({ useHandCursor: true });
    c.on('pointerdown', function () {
      c.setScale(0.95);
      R.Sfx.play('click');
      self.time.delayedCall(70, function () { self.scene.start('Changelog'); });
    });
    c.on('pointerup', function () { c.setScale(1); });
    c.on('pointerout', function () { c.setScale(1); });
    return c;
  };

  /* 测试模式入口按钮（仅作者可见：?dev=1 + 密码） */
  Title.prototype.buildDevEntry = function () {
    var self = this;
    var c = this.add.container(56, 56);
    var g = this.add.graphics();
    g.fillStyle(0xff5c8a, 0.9); g.fillCircle(0, 0, 30);
    g.fillStyle(0x2b1d2b, 1);   g.fillCircle(0, 0, 24);
    c.add(g);
    c.add(this.add.text(0, 0, '🔧', { fontSize: '24px' }).setOrigin(0.5));
    c.setSize(60, 60).setInteractive({ useHandCursor: true });
    c.on('pointerdown', function () {
      R.Sfx.play('click');
      R.DevPanel.open(self);
    });
    // 已解锁时角标提示
    if (R.Dev.isUnlocked()) {
      c.add(this.add.text(22, -22, '✓', {
        fontSize: '16px', color: '#6cc24a', fontStyle: 'bold'
      }).setOrigin(0.5));
    }
    return c;
  };

  /* 两侧功能按钮（研究所 / 商店） */
  Title.prototype.buildSideBtn = function (x, y, label, sub, colA, colB, sceneKey) {
    var self = this;
    var c = this.add.container(x, y);
    var g = this.add.graphics();
    g.fillStyle(C.outline, 1); g.fillRoundedRect(-84, -40, 168, 80, 40);
    g.fillStyle(colA, 1);      g.fillRoundedRect(-78, -34, 156, 68, 34);
    g.fillStyle(colB, 1);      g.fillRoundedRect(-78, -34, 156, 36, 18);
    c.add(g);
    c.add(this.add.text(0, -17, label, {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#3a2410'
    }).setOrigin(0.5));
    c.add(this.add.text(0, 14, sub, {
      fontFamily: 'system-ui,sans-serif', fontSize: '15px', color: '#fff3d0'
    }).setOrigin(0.5).setShadow(0, 1, '#00000066', 2));
    c.setSize(168, 80).setInteractive({ useHandCursor: true });
    c.on('pointerdown', function () {
      R.Sfx.unlock(); R.Sfx.play('click');
      c.setScale(0.94);
      self.time.delayedCall(90, function () { self.scene.start(sceneKey); });
    });
    c.on('pointerup', function () { c.setScale(1); });
    return c;
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
