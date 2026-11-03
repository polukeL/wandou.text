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

    // 通关：提交成绩到榜单（本地；后续接服务器只改 R.Leaderboard.submit）
    var clearRes = null;
    if (this.win) {
      clearRes = R.Leaderboard.submit({
        time: this.run.time, kills: this.run.kills,
        level: this.run.level, room: this.run.room, seed: this.run.seed
      });
    }
    this.clearRes = clearRes;

    this.add.rectangle(0, 0, W, H, 0x1a1020, 0.82).setOrigin(0).setInteractive();

    var title = this.win ? T.win : T.lose;
    var sub = this.win ? T.winSub : T.loseSub;
    var color = this.win ? '#ffe14d' : '#ff8a80';

    var panel = this.add.container(W / 2, H * 0.46);
    // 面板：优先用 UI 皮肤图（panel），否则代码绘制
    // 高度按"标题+副标+对比条+5行数据+强化列表+2个按钮"排布，勿压缩
    var pskin = R.UISkin.apply(this, 'panel', 0, 0, 588, 566);
    if (pskin) {
      panel.add(pskin);
    } else {
      var g = this.add.graphics();
      g.fillStyle(0x000000, 0.3); g.fillRoundedRect(-286, -277, 588, 566, 30);
      g.fillStyle(C.outline, 1);  g.fillRoundedRect(-292, -283, 588, 566, 30);
      g.fillStyle(0xfff6e2, 1);   g.fillRoundedRect(-284, -275, 572, 550, 24);
      panel.add(g);
    }

    panel.add(this.add.text(0, -222, title, {
      fontFamily: R.FONT, fontSize: '50px', fontStyle: 'bold', color: color, stroke: '#2b1d2b', strokeThickness: 8
    }).setOrigin(0.5));
    panel.add(this.add.text(0, -174, sub, {
      fontFamily: R.FONT, fontSize: '19px', color: '#7a6a68'
    }).setOrigin(0.5));

    // 通关成绩对比（与自己的历史最佳对比）
    if (clearRes) {
      var prev = clearRes.prevBest;
      var bestTxt = '用时 ' + R.Meta.fmtTime(clearRes.record.time);
      var cmpTxt, cmpColor;
      if (!prev) {
        cmpTxt = '首次通关！已记录到榜单';
        cmpColor = '#b08a2a';
      } else if (clearRes.isBest) {
        var diff = prev.time - clearRes.record.time;
        cmpTxt = '★ 新纪录！比上次快 ' + R.Meta.fmtTime(diff);
        cmpColor = '#e8a33c';
      } else {
        var slow = clearRes.record.time - prev.time;
        cmpTxt = '慢了 ' + R.Meta.fmtTime(slow) + '（最佳 ' + R.Meta.fmtTime(prev.time) + '）';
        cmpColor = '#9a8a88';
      }
      // 对比条底
      var cg = this.add.graphics();
      cg.fillStyle(clearRes.isBest ? 0xffe14d : 0x000000, clearRes.isBest ? 0.22 : 0.06);
      cg.fillRoundedRect(-262, -146, 524, 38, 19);
      panel.add(cg);
      panel.add(this.add.text(0, -127, bestTxt + '   ' + cmpTxt, {
        fontFamily: R.FONT, fontSize: '18px', fontStyle: 'bold', color: cmpColor
      }).setOrigin(0.5));
    }

    var r = this.run;
    var t = Math.floor(r.time);
    var isWin = !!this.win;
    var rows = [
      ['通关关卡', isWin ? '★ 全通关 · ' + (r.chapterDef() ? r.chapterDef().name : '') : '第 ' + (r.room + 1) + ' 关 · ' + (r.chapterDef() ? r.chapterDef().name : '')],
      ['存活时间', ('0' + Math.floor(t / 60)).slice(-2) + ':' + ('0' + (t % 60)).slice(-2)],
      ['击杀数', r.kills + ' 只'],
      ['等级', 'Lv.' + r.level],
      ['金币', '⛃ ' + r.gold]
    ];
    rows.forEach(function (row, i) {
      var y = -96 + i * 42;
      panel.add(self.add.text(-246, y, row[0], {
        fontFamily: R.FONT, fontSize: '21px', color: '#9a8a88'
      }).setOrigin(0, 0));
      panel.add(self.add.text(246, y, row[1], {
        fontFamily: R.FONT, fontSize: '23px', fontStyle: 'bold', color: '#2b1d2b'
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
    panel.add(this.add.text(0, 130, names || '—', {
      fontFamily: R.FONT, fontSize: '17px', color: '#6b5a58', align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5, 0));

    // 按钮：有皮肤用图片，否则代码绘制
    var btn = this.add.container(0, 236);
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
    btn.add(this.add.text(-2, -1, this.win ? '再来一局' : '再来一局', {
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

    // 查看通关榜单
    var lb = this.add.container(0, 314);
    var lgg = this.add.graphics();
    lgg.fillStyle(C.outline, 1); lgg.fillRoundedRect(-120, -22, 240, 44, 22);
    lgg.fillStyle(0x9b5de5, 1);  lgg.fillRoundedRect(-115, -18, 230, 36, 18);
    lb.add(lgg);
    lb.add(this.add.text(0, -1, '🏆 通关时间榜', {
      fontFamily: R.FONT, fontSize: '21px', fontStyle: 'bold', color: '#fff6e2'
    }).setOrigin(0.5));
    lb.setSize(240, 44).setInteractive({ useHandCursor: true });
    lb.on('pointerdown', function () {
      R.Sfx.play('click');
      // Game 是暂停态残留，先彻底停掉，Board 返回时就不会有幽灵场景
      self.scene.stop('Game');
      self.scene.start('Board', { highlight: self.clearRes && self.clearRes.record, fromResult: true });
    });
    panel.add(lb);

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
