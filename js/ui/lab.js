/* =========================================================
 * ui/lab.js —— 研究所（永久强化）
 * 从标题页进入，用跨局金币购买永久属性。
 * 数据：core/meta.js；强化表：DATA.META_PERKS
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var FONT = '"Baloo 2","Fredoka","PingFang SC","Microsoft YaHei",system-ui,sans-serif';

  function Lab() { Phaser.Scene.call(this, { key: 'Lab' }); }
  Lab.prototype = Object.create(Phaser.Scene.prototype);
  Lab.prototype.constructor = Lab;

  Lab.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;

    // 背景
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x3a2b4a, 0x3a2b4a, 0x2b1d2b, 0x2b1d2b, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(W / 2, 70, '研 究 所', {
      fontFamily: FONT, fontSize: '46px', fontStyle: 'bold', color: '#ffe14d',
      stroke: '#2b1d2b', strokeThickness: 10
    }).setOrigin(0.5);
    this.add.text(W / 2, 116, '用冒险攒下的金币，永久强化小豌豆', {
      fontFamily: FONT, fontSize: '19px', color: '#cbb8d8'
    }).setOrigin(0.5);

    // 金币余额
    this.goldText = this.add.text(W / 2, 158, '⛃ ' + R.Meta.gold, {
      fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#ffd23f',
      stroke: '#2b1d2b', strokeThickness: 6
    }).setOrigin(0.5);

    // 强化列表
    this.rows = [];
    var perks = R.DATA.META_PERKS;
    var rowH = 112, startY = 236;
    perks.forEach(function (def, i) {
      var row = self.buildRow(def, W / 2, startY + i * (rowH + 12), W - 64, rowH);
      self.rows.push({ def: def, row: row });
    });

    // 返回按钮
    var back = this.add.container(W / 2, H - 66);
    var bg2 = this.add.graphics();
    bg2.fillStyle(C.outline, 1); bg2.fillRoundedRect(-120, -30, 240, 60, 30);
    bg2.fillStyle(0x8d6bb8, 1);  bg2.fillRoundedRect(-114, -24, 228, 48, 24);
    back.add(bg2);
    back.add(this.add.text(0, -1, '返 回', {
      fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#fff6e2'
    }).setOrigin(0.5));
    back.setSize(240, 60).setInteractive({ useHandCursor: true });
    back.on('pointerdown', function () {
      R.Sfx.play('click');
      self.scene.start('Title');
    });

    this.refresh();
  };

  Lab.prototype.buildRow = function (def, x, y, w, h) {
    var row = this.add.container(x, y);
    var g = this.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 18);
    g.fillStyle(0x1d1428, 1);    g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.fillStyle(0x9b5de5, 0.25); g.fillRoundedRect(-w / 2, -h / 2, 76, h, 18);
    g.lineStyle(3, 0x9b5de5, 0.8); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    row.add(g);

    // 图标
    var iconKey = 'icon_' + (def.icon || 'star');
    if (this.textures.exists(iconKey)) {
      row.add(this.add.image(-w / 2 + 38, 0, iconKey).setScale(0.72));
    }

    // 名称 / 描述
    row.add(this.add.text(-w / 2 + 88, -h / 2 + 14, def.name, {
      fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#fff6e2'
    }));
    row.add(this.add.text(-w / 2 + 88, -h / 2 + 48, def.desc + ' ' + def.per, {
      fontFamily: FONT, fontSize: '18px', color: '#b7a6c9'
    }));

    // 等级
    var lvlText = this.add.text(-w / 2 + 88, h / 2 - 32, '', {
      fontFamily: FONT, fontSize: '16px', color: '#ffd23f'
    });
    row.add(lvlText);
    row.lvlText = lvlText;

    // 购买按钮
    var btn = this.add.container(w / 2 - 78, 0);
    var bg3 = this.add.graphics();
    bg3.fillStyle(0x000000, 0.3); bg3.fillRoundedRect(-62, -24, 128, 52, 26);
    bg3.fillStyle(0x2b1d2b, 1);   bg3.fillRoundedRect(-66, -28, 128, 52, 26);
    bg3.fillStyle(0x6cc24a, 1);   bg3.fillRoundedRect(-60, -22, 116, 40, 20);
    btn.add(bg3);
    var costText = this.add.text(0, -1, '', {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#1c3d0e'
    }).setOrigin(0.5);
    btn.add(costText);
    row.costText = costText;
    row.buyBtn = btn;
    row.buyBg = bg3;
    btn.setSize(128, 52).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () {
      if (R.Meta.buy(def)) {
        R.Sfx.play('coin'); R.Sfx.play('reward');
        this.refresh();
      } else {
        R.Sfx.play('hit', 150);
        this.tweens.add({ targets: btn, x: btn.x + 4, duration: 40, yoyo: true, repeat: 2 });
      }
    }, this);
    row.add(btn);

    return row;
  };

  Lab.prototype.refresh = function () {
    var self = this;
    this.goldText.setText('⛃ ' + R.Meta.gold);
    this.rows.forEach(function (r) {
      var lvl = R.Meta.perkLevel(r.def.id);
      var maxed = lvl >= r.def.max;
      var cost = R.Meta.cost(r.def);
      r.row.lvlText.setText('Lv.' + lvl + ' / ' + r.def.max);
      if (maxed) {
        r.row.costText.setText('已满级');
        r.row.buyBg.clear();
        r.row.buyBg.fillStyle(0x2b1d2b, 1);  r.row.buyBg.fillRoundedRect(-66, -28, 128, 52, 26);
        r.row.buyBg.fillStyle(0x5c5464, 1);  r.row.buyBg.fillRoundedRect(-60, -22, 116, 40, 20);
        r.row.costText.setColor('#cbb8d8');
        r.row.buyBtn.disableInteractive();
      } else {
        r.row.costText.setText('⛃ ' + cost);
        var can = R.Meta.gold >= cost;
        r.row.buyBg.clear();
        r.row.buyBg.fillStyle(0x2b1d2b, 1);  r.row.buyBg.fillRoundedRect(-66, -28, 128, 52, 26);
        r.row.buyBg.fillStyle(can ? 0x6cc24a : 0x8d5a3b, 1);
        r.row.buyBg.fillRoundedRect(-60, -22, 116, 40, 20);
        r.row.costText.setColor(can ? '#1c3d0e' : '#f0d7c8');
      }
    });
  };

  R.SCENES.push(Lab);
})(window.RogueGame = window.RogueGame || {});
