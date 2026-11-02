/* =========================================================
 * ui/result.js —— 结算（胜利 / 失败）
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;

  function ResultScene() { Phaser.Scene.call(this, { key: 'Result' }); }
  ResultScene.prototype = Object.create(Phaser.Scene.prototype);
  ResultScene.prototype.constructor = ResultScene;

  ResultScene.prototype.init = function (data) {
    this.run = data.run;
    this.win = !!data.win;
  };

  ResultScene.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    var T = R.DATA.TEXT;

    this.add.rectangle(0, 0, W, H, 0x1a1020, 0.82).setOrigin(0).setInteractive();

    var title = this.win ? T.win : T.lose;
    var sub = this.win ? T.winSub : T.loseSub;
    var color = this.win ? '#ffe14d' : '#ff8a80';

    var panel = this.add.container(W / 2, H * 0.44);
    // 面板：优先用 UI 皮肤图（panel），否则代码绘制
    var pskin = R.UISkin.apply(this, 'panel', 0, 0, 588, 452);
    if (pskin) {
      panel.add(pskin);
    } else {
      var g = this.add.graphics();
      g.fillStyle(0x000000, 0.3); g.fillRoundedRect(-286, -222, 588, 452, 30);
      g.fillStyle(C.outline, 1);  g.fillRoundedRect(-292, -228, 588, 452, 30);
      g.fillStyle(0xfff6e2, 1);   g.fillRoundedRect(-284, -220, 572, 436, 24);
      panel.add(g);
    }

    panel.add(this.add.text(0, -168, title, {
      fontFamily: R.FONT, fontSize: '52px', fontStyle: 'bold', color: color, stroke: '#2b1d2b', strokeThickness: 8
    }).setOrigin(0.5));
    panel.add(this.add.text(0, -116, sub, {
      fontFamily: R.FONT, fontSize: '20px', color: '#7a6a68'
    }).setOrigin(0.5));

    var r = this.run;
    var t = Math.floor(r.time);
    var rows = [
      ['到达关卡', '第 ' + (r.room + 1) + ' 关 · ' + (r.chapterDef() ? r.chapterDef().name : '')],
      ['存活时间', ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + (t % 60)).slice(-2)],
      ['击杀数', r.kills + ' 只'],
      ['等级', 'Lv.' + r.level],
      ['金币', '⛃ ' + r.gold]
    ];
    rows.forEach(function (row, i) {
      var y = -60 + i * 46;
      panel.add(self.add.text(-230, y, row[0], {
        fontFamily: R.FONT, fontSize: '22px', color: '#9a8a88'
      }));
      panel.add(self.add.text(230, y, row[1], {
        fontFamily: R.FONT, fontSize: '24px', fontStyle: 'bold', color: '#2b1d2b'
      }).setOrigin(1, 0));
    });

    // 已获得强化
    var names = Object.keys(r.upgrades).map(function (id) {
      var d = R.DATA.UPGRADES.find(function (u) { return u.id === id; });
      if (!d) return null;
      var n = d.type === 'weapon' ? R.DATA.WEAPONS[d.weapon].name
            : (d.type === 'passive' ? R.DATA.PASSIVES[d.passive].name : d.name);
      var lv = r.upgrades[id];
      return n + (lv > 1 ? ' x' + lv : '');
    }).filter(Boolean).join('、');
    panel.add(this.add.text(0, 176, names || '—', {
      fontFamily: R.FONT, fontSize: '18px', color: '#6b5a58', align: 'center',
      wordWrap: { width: 520 }
    }).setOrigin(0.5, 0));

    // 按钮：优先用 UI 皮肤图（btn_replay），否则代码绘制
    var btn = this.add.container(0, 380);
    var bskin = R.UISkin.apply(this, 'btn_replay', 0, 0, 268, 78);
    if (bskin) {
      btn.add(bskin);
    } else {
      var bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.22); bg.fillRoundedRect(-130, -34, 268, 78, 38);
      bg.fillStyle(C.outline, 1);   bg.fillRoundedRect(-136, -40, 268, 78, 38);
      bg.fillStyle(0x6cc24a, 1);    bg.fillRoundedRect(-130, -34, 256, 66, 33);
      bg.fillStyle(0x8ada67, 1);    bg.fillRoundedRect(-130, -34, 256, 42, 21);
      btn.add(bg);
    }
    btn.add(this.add.text(-2, -1, '再来一局', {
      fontFamily: R.FONT, fontSize: '34px', fontStyle: 'bold', color: '#1c3d0e'
    }).setOrigin(0.5));
    btn.setSize(268, 78).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () {
      R.Sfx.play('click');
      self.cameras.main.fadeOut(150, 26, 16, 32);
      self.time.delayedCall(160, function () {
        self.scene.stop('Game');
        self.scene.start('Game');
      });
    });
    panel.add(btn);

    panel.setScale(0.85).setAlpha(0);
    this.tweens.add({ targets: panel, scale: 1, alpha: 1, duration: 340, ease: 'Back.out' });

    // 记录
    try {
      var best = parseInt(localStorage.getItem('pearogue.best') || '0', 10) || 0;
      if (r.room + 1 > best) localStorage.setItem('pearogue.best', String(r.room + 1));
    } catch (e) {}
  };

  R.SCENES.push(ResultScene);
})(window.RogueGame = window.RogueGame || {});
