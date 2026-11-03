/* =========================================================
 * ui/leaderboard.js —— 通关时间榜
 * 目前为本地榜（与自己历史通关对比）；结构已按"可联网"设计：
 *   R.Leaderboard.fetch(cb)  —— 默认从 localStorage 读，
 *   接入服务器时只要替换这个函数（返回数组即可）。
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var FONT = '"Baloo 2","Fredoka","PingFang SC","Microsoft YaHei",system-ui,sans-serif';

  /* ---------------- 数据接口（联网时只改这里） ---------------- */
  var LB = R.Leaderboard = {
    /* 获取榜单：cb(list) —— list 元素 {time, kills, level, date, rank} */
    fetch: function (cb) {
      cb(R.Meta.board());
    },
    /* 提交一次通关 */
    submit: function (rec, cb) {
      var res = R.Meta.addClear(rec);
      if (cb) cb(res);
      return res;
    }
  };

  function Board() { Phaser.Scene.call(this, { key: 'Board' }); }
  Board.prototype = Object.create(Phaser.Scene.prototype);
  Board.prototype.constructor = Board;

  Board.prototype.init = function (data) {
    this.highlight = data && data.highlight;   // 刚创造的那条记录
    this.fromResult = !!(data && data.fromResult);
  };

  Board.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;

    var bg = this.add.graphics();
    bg.fillGradientStyle(0x2f2748, 0x2f2748, 0x160f1e, 0x160f1e, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(W / 2, 62, '🏆 ' + R.DATA.LEADERBOARD.title, {
      fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#ffe14d',
      stroke: '#2b1d2b', strokeThickness: 10
    }).setOrigin(0.5);
    this.add.text(W / 2, 104, '按通关耗时排序 · 目前只与自己的记录对比', {
      fontFamily: FONT, fontSize: '17px', color: '#b7a6c9'
    }).setOrigin(0.5);

    this.list = this.add.container(0, 0);
    LB.fetch(function (rows) { self.render(rows); });

    // 返回
    var back = this.add.container(W / 2, H - 60);
    var bgg = this.add.graphics();
    bgg.fillStyle(C.outline, 1); bgg.fillRoundedRect(-120, -28, 240, 56, 28);
    bgg.fillStyle(0x8d6bb8, 1);  bgg.fillRoundedRect(-114, -22, 228, 44, 22);
    back.add(bgg);
    back.add(this.add.text(0, -1, '返 回', {
      fontFamily: FONT, fontSize: '27px', fontStyle: 'bold', color: '#fff6e2'
    }).setOrigin(0.5));
    back.setSize(240, 56).setInteractive({ useHandCursor: true });
    back.on('pointerdown', function () {
      R.Sfx.play('click');
      // 从结算页进来时：Game 还在暂停态，必须彻底停掉，否则残留场景
      if (self.fromResult) {
        self.scene.stop('Result');
        self.scene.stop('Game');
      }      self.scene.start('Title');
    });
  };

  Board.prototype.render = function (rows) {
    var self = this, W = this.scale.width;
    this.list.removeAll(true);

    if (!rows || !rows.length) {
      this.list.add(this.add.text(W / 2, this.scale.height * 0.42, '还没有通关记录\n\n打败终局 Boss「豌豆王」就能上榜', {
        fontFamily: FONT, fontSize: '22px', color: '#8f7fa0', align: 'center', lineSpacing: 8
      }).setOrigin(0.5));
      return;
    }

    // 表头
    var startY = 150, rowH = 62;
    var head = this.add.graphics();
    head.fillStyle(0xffffff, 0.06);
    head.fillRoundedRect(28, startY - 34, W - 56, 34, 8);
    this.list.add(head);
    var heads = [['#', 62], ['用时', 165], ['击杀', 300], ['等级', 400], ['日期', 525]];
    heads.forEach(function (h) {
      self.list.add(self.add.text(h[1], startY - 17, h[0], {
        fontFamily: FONT, fontSize: '16px', color: '#9a8aad'
      }).setOrigin(0, 0.5));
    });

    var best = rows[0].time;
    rows.slice(0, 12).forEach(function (r, i) {
      var y = startY + i * rowH;
      var isNew = self.highlight && Math.abs(r.time - self.highlight.time) < 0.5 &&
                  r.date === self.highlight.date;
      var g = self.add.graphics();
      if (isNew) {
        g.fillStyle(0xffe14d, 0.22);
      } else {
        g.fillStyle(0xffffff, i % 2 ? 0.03 : 0.07);
      }
      g.fillRoundedRect(28, y - rowH / 2 + 6, W - 56, rowH - 12, 10);
      if (isNew) {
        g.lineStyle(2, 0xffe14d, 0.9);
        g.strokeRoundedRect(28, y - rowH / 2 + 6, W - 56, rowH - 12, 10);
      }
      self.list.add(g);

      // 名次徽章
      var medalCol = [0xffd23f, 0xd8d8d8, 0xc98a4b][r.rank - 1];
      var rankTxt = self.add.text(62, y, String(r.rank), {
        fontFamily: FONT, fontSize: '22px', fontStyle: 'bold',
        color: medalCol ? '#2b1d2b' : '#cbb8d8',
        stroke: medalCol ? '#ffffff' : undefined, strokeThickness: 2
      }).setOrigin(0, 0.5);
      if (medalCol) {
        var mc = self.add.graphics();
        mc.fillStyle(medalCol, 1);
        mc.fillCircle(70, y, 17);
        mc.lineStyle(3, 0x2b1d2b, 1);
        mc.strokeCircle(70, y, 17);
        rankTxt.setPosition(70, y).setOrigin(0.5).setDepth(2);
      }
      self.list.add(rankTxt);

      // 用时
      self.list.add(self.add.text(165, y, R.Meta.fmtTime(r.time), {
        fontFamily: FONT, fontSize: '26px', fontStyle: 'bold',
        color: r.time === best ? '#ffd23f' : '#fff6e2'
      }).setOrigin(0, 0.5));

      self.list.add(self.add.text(300, y, String(r.kills || '-'), {
        fontFamily: FONT, fontSize: '19px', color: '#cbb8d8'
      }).setOrigin(0, 0.5));

      self.list.add(self.add.text(400, y, 'Lv.' + (r.level || '-'), {
        fontFamily: FONT, fontSize: '19px', color: '#cbb8d8'
      }).setOrigin(0, 0.5));

      var d = new Date(r.date || Date.now());
      var ds = (d.getMonth() + 1) + '/' + d.getDate();
      self.list.add(self.add.text(525, y, ds, {
        fontFamily: FONT, fontSize: '16px', color: '#9a8aad'
      }).setOrigin(0, 0.5));

      if (isNew) {
        self.list.add(self.add.text(W - 46, y, 'NEW', {
          fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffe14d'
        }).setOrigin(1, 0.5));
      }
    });
  };

  R.SCENES.push(Board);
})(window.RogueGame = window.RogueGame || {});
