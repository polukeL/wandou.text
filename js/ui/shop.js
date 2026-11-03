/* =========================================================
 * ui/shop.js —— 商店（头像 / 头像框分两栏）
 * 金币来源：局内拾取（同时入账 Meta.gold）
 * 后续接入联网时，只需替换 Meta.buyCosmetic / Meta.owns 的数据来源。
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var FONT = '"Baloo 2","Fredoka","PingFang SC","Microsoft YaHei",system-ui,sans-serif';

  function Shop() { Phaser.Scene.call(this, { key: 'Shop' }); }
  Shop.prototype = Object.create(Phaser.Scene.prototype);
  Shop.prototype.constructor = Shop;

  Shop.prototype.init = function (data) {
    this.tab = (data && data.tab) || 'avatar';   // avatar | frame
  };

  Shop.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;

    var bg = this.add.graphics();
    bg.fillGradientStyle(0x3a2b4a, 0x3a2b4a, 0x211425, 0x211425, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(W / 2, 58, '商 店', {
      fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#ffe14d',
      stroke: '#2b1d2b', strokeThickness: 10
    }).setOrigin(0.5);
    this.goldText = this.add.text(W / 2, 100, '⛃ ' + R.Meta.gold, {
      fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffd23f',
      stroke: '#2b1d2b', strokeThickness: 6
    }).setOrigin(0.5);

    // 两个分栏按钮（在网格上方，网格起始 y=300 不会盖住这里）
    this.buildTab(W * 0.29, 158, '头像', 'avatar');
    this.buildTab(W * 0.71, 158, '头像框', 'frame');

    this.grid = this.add.container(0, 0);
    this.renderGrid();

    // 返回
    var back = this.add.container(W / 2, H - 62);
    var bgg = this.add.graphics();
    bgg.fillStyle(C.outline, 1); bgg.fillRoundedRect(-120, -30, 240, 60, 30);
    bgg.fillStyle(0x8d6bb8, 1);  bgg.fillRoundedRect(-114, -24, 228, 48, 24);
    back.add(bgg);
    back.add(this.add.text(0, -1, '返 回', {
      fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#fff6e2'
    }).setOrigin(0.5));
    back.setSize(240, 60).setInteractive({ useHandCursor: true });
    back.on('pointerdown', function () {
      R.Sfx.play('click');
      self.scene.start('Title');
    });
  };

  Shop.prototype.buildTab = function (x, y, label, key) {
    var self = this;
    var c = this.add.container(x, y);
    var g = this.add.graphics();
    c.bg = g;
    c.add(g);
    c.add(this.add.text(0, -1, label, {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#fff6e2'
    }).setOrigin(0.5));
    c.setSize(200, 54).setInteractive({ useHandCursor: true });
    c.on('pointerdown', function () {
      R.Sfx.play('click');
      self.tab = key;
      self.renderTabs();
      self.renderGrid();
    });
    this['tab_' + key] = c;
    this.renderTabs();
  };

  Shop.prototype.renderTabs = function () {
    var self = this;
    ['avatar', 'frame'].forEach(function (k) {
      var c = self['tab_' + k];
      if (!c) return;
      var on = self.tab === k;
      c.bg.clear();
      c.bg.fillStyle(0x2b1d2b, 1);
      c.bg.fillRoundedRect(-100, -27, 200, 54, 27);
      c.bg.fillStyle(on ? 0xf9a825 : 0x4a3a52, 1);
      c.bg.fillRoundedRect(-95, -22, 190, 44, 22);
    });
  };

  /* 网格：2 列 */
  Shop.prototype.renderGrid = function () {
    var self = this, W = this.scale.width;
    this.grid.removeAll(true);
    var list = this.tab === 'avatar' ? R.DATA.AVATARS : R.DATA.FRAMES;
    var cols = 2, cellW = (W - 72) / cols, cellH = 210;
    var startY = 310;

    list.forEach(function (def, i) {
      var cx = 36 + cellW * (i % cols) + cellW / 2;
      var cy = startY + Math.floor(i / cols) * (cellH + 14);
      self.buildCell(def, cx, cy, cellW - 16, cellH);
    });
  };

  Shop.prototype.buildCell = function (def, x, y, w, h) {
    var self = this;
    var isAvatar = def.id.indexOf('av_') === 0;
    var owned = R.Meta.owns(def.id);
    var equipped = isAvatar ? R.Meta.avatar === def.id : R.Meta.frame === def.id;

    var cell = this.add.container(x, y);

    var g = this.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 18);
    g.fillStyle(equipped ? 0xf9a825 : 0x2b1d2b, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.fillStyle(equipped ? 0x3d2a12 : 0x241a2e, 1);
    g.fillRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 14);
    cell.add(g);

    // 头像预览（头像 + 框叠加，方便预览框效果）
    var prevAvatar = isAvatar ? def.id : R.Meta.avatar;
    var prevFrame = isAvatar ? R.Meta.frame : def.id;
    var av = R.Avatar.add(this, 0, -h / 2 + 62, 78, { avatar: prevAvatar, frame: prevFrame });
    cell.add(av);

    // 名称
    cell.add(this.add.text(0, -h / 2 + 118, def.name, {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#fff6e2'
    }).setOrigin(0.5));

    // 状态按钮
    var label, col1, col2, txtCol;
    if (equipped) { label = '使用中'; col1 = 0x4a3a52; col2 = 0x6b5a74; txtCol = '#e0d6ea'; }
    else if (owned) { label = '装 备'; col1 = 0x3f8f2e; col2 = 0x6cc24a; txtCol = '#12300a'; }
    else if (R.Meta.gold >= def.price) { label = '⛃ ' + def.price; col1 = 0xf9a825; col2 = 0xffd05a; txtCol = '#4a2c00'; }
    else { label = '⛃ ' + def.price; col1 = 0x6b4a3a; col2 = 0x8d5a3b; txtCol = '#f0d7c8'; }

    var btn = this.add.container(0, h / 2 - 34);
    var bg2 = this.add.graphics();
    bg2.fillStyle(0x2b1d2b, 1); bg2.fillRoundedRect(-w / 2 + 14, -20, w - 28, 42, 21);
    bg2.fillStyle(col2, 1);     bg2.fillRoundedRect(-w / 2 + 18, -16, w - 36, 34, 17);
    bg2.fillStyle(col1, 1);     bg2.fillRoundedRect(-w / 2 + 18, -16, w - 36, 18, 9);
    btn.add(bg2);
    btn.add(this.add.text(0, -1, label, {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: txtCol
    }).setOrigin(0.5));
    btn.setSize(w - 28, 42).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () {
      self.tapItem(def, owned, equipped);
    });
    cell.add(btn);

    this.grid.add(cell);
  };

  Shop.prototype.tapItem = function (def, owned, equipped) {
    var self = this;
    if (equipped) { R.Sfx.play('click'); return; }
    if (owned) {
      R.Meta.equip(def);
      R.Sfx.play('select');
      this.refreshAll();
      return;
    }
    if (R.Meta.gold < def.price) {
      R.Sfx.play('hit', 150);
      this.toast('金币不够，去多打几局吧');
      return;
    }
    if (R.Meta.buyCosmetic(def)) {
      R.Meta.equip(def);
      R.Sfx.play('coin'); R.Sfx.play('reward');
      this.refreshAll();
      this.toast('购买成功！已自动装备');
    }
  };

  Shop.prototype.refreshAll = function () {
    this.goldText.setText('⛃ ' + R.Meta.gold);
    this.renderGrid();
  };

  Shop.prototype.toast = function (msg) {
    var t = this.add.text(this.scale.width / 2, this.scale.height * 0.88, msg, {
      fontFamily: FONT, fontSize: '20px', color: '#ffffff', stroke: '#2b1d2b', strokeThickness: 5
    }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 1100, onComplete: function () { t.destroy(); } });
  };

  R.SCENES.push(Shop);
})(window.RogueGame = window.RogueGame || {});
