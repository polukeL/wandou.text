/* =========================================================
 * ui/shop.js —— 商店（头像 / 头像框分两栏 + 预览栏）
 * 交互：点击卡片 → 上方预览栏显示大图与信息，预览下方是购买/装备按钮
 *       已购买的商品卡片下方显示「已购买」（点击可装备）
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
    this.tab = (data && data.tab) || 'avatar';   // avatar | frame | skin
    this.sel = null;                             // 当前预览选中的商品 id
  };

  Shop.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;

    var bg = this.add.graphics();
    bg.fillGradientStyle(0x3a2b4a, 0x3a2b4a, 0x211425, 0x211425, 1);
    bg.fillRect(0, 0, W, H);

    this.add.text(W / 2, 46, '商 店', {
      fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#ffe14d',
      stroke: '#2b1d2b', strokeThickness: 9
    }).setOrigin(0.5);
    this.goldText = this.add.text(W / 2, 88, '⛃ ' + R.Meta.gold, {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffd23f',
      stroke: '#2b1d2b', strokeThickness: 6
    }).setOrigin(0.5);

    // ---- 预览栏（点击卡片后显示在上方，y 中心约 195） ----
    this.preview = this.add.container(0, 0).setDepth(5);
    this.renderPreview(null);

    // 分栏按钮（预览栏下方，三栏）
    this.buildTab(W * 0.20, 348, '头像', 'avatar');
    this.buildTab(W * 0.50, 348, '头像框', 'frame');
    this.buildTab(W * 0.80, 348, '皮肤', 'skin');

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

  /* ---------------- 公共判定 ---------------- */
  function kindOf(def) {
    if (String(def.id).indexOf('skin_') === 0) return 'skin';
    return String(def.id).indexOf('av_') === 0 ? 'avatar' : 'frame';
  }
  function isEquipped(def) {
    var k = kindOf(def);
    if (k === 'skin') return R.Meta.skin === def.id;
    if (k === 'avatar') return R.Meta.avatar === def.id;
    return R.Meta.frame === def.id;
  }
  /* 皮肤的通关解锁条件是否达成 */
  function unlockLocked(def) {
    return kindOf(def) === 'skin' && !R.Meta.skinUnlockMet(def);
  }
  /* 卡片/预览按钮的文案与配色 */
  function btnStyle(def, owned, equipped) {
    if (equipped) return { label: '使用中', col1: 0x4a3a52, col2: 0x6b5a74, txtCol: '#e0d6ea', enabled: false };
    if (owned) return { label: '装 备', col1: 0x3f8f2e, col2: 0x6cc24a, txtCol: '#12300a', enabled: true };
    if (unlockLocked(def)) {
      return { label: '🔒 通关解锁', col1: 0x4a3a52, col2: 0x5f5566, txtCol: '#c9bcd6', enabled: false };
    }
    if (R.Meta.gold >= (def.price || 0)) {
      return { label: '⛃ ' + def.price, col1: 0xf9a825, col2: 0xffd05a, txtCol: '#4a2c00', enabled: true };
    }
    return { label: '⛃ ' + def.price, col1: 0x6b4a3a, col2: 0x8d5a3b, txtCol: '#f0d7c8', enabled: true };
  }

  /* 皮肤缩略图：直接画角色纹理（和游戏内一致） */
  function skinPreview(scene, x, y, size, def) {
    var key = scene.textures.exists(def.id) ? def.id : 'player';
    var c = scene.add.container(x, y);
    var g = scene.add.graphics();
    g.fillStyle(0x1d1428, 0.85); g.fillCircle(0, 0, size / 2 + 6);
    g.lineStyle(3, 0x53d9ff, 0.5); g.strokeCircle(0, 0, size / 2 + 6);
    c.add(g);
    c.add(scene.add.image(0, 0, key).setDisplaySize(size, size));
    return c;
  }

  /* 皮肤大图全身预览（v0.8.0）：圆角展示台 + 底座光圈，展示完整立绘 */
  function skinShowcase(scene, x, y, w, h, def) {
    var key = scene.textures.exists(def.id) ? def.id : 'player';
    var c = scene.add.container(x, y);
    var g = scene.add.graphics();
    // 展示台底板
    g.fillStyle(0x1d1428, 0.9); g.fillRoundedRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 24);
    g.lineStyle(4, 0xf9a825, 0.75); g.strokeRoundedRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, 24);
    // 底部光圈（脚下聚光效果）
    g.fillStyle(0x53d9ff, 0.16); g.fillEllipse(0, h / 2 - 14, w * 0.72, 26);
    g.fillStyle(0x53d9ff, 0.28); g.fillEllipse(0, h / 2 - 14, w * 0.5, 16);
    c.add(g);
    // 全身立绘：按高撑满（贴图通常 96x96，全身占满画面）
    var img = scene.add.image(0, 0, key);
    var sc = Math.min(w / img.width, h / img.height);
    img.setScale(sc * 0.96);
    c.add(img);
    return c;
  }

  /* ---------------- 预览栏 ----------------
   * def 为 null 时显示提示文案；有 def 时：
   *   左：大预览（头像+框叠加）  中：名称 + 状态/价格
   *   预览下方：购买 / 装备 / 使用中 按钮
   * --------------------------------------- */
  Shop.prototype.renderPreview = function (def) {
    var self = this, W = this.scale.width;
    this.preview.removeAll(true);
    this.sel = def ? def.id : null;
    var cy = 190;   // 面板中心（面板总高 260：y 60~320）

    // 面板底（v0.8.0 加高以容纳全身立绘）
    var panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.28); panel.fillRoundedRect(W / 2 - 300, cy - 130, 600, 260, 20);
    panel.fillStyle(0x241a2e, 1);    panel.fillRoundedRect(W / 2 - 294, cy - 124, 588, 248, 16);
    panel.lineStyle(3, 0xf9a825, 0.6);
    panel.strokeRoundedRect(W / 2 - 294, cy - 124, 588, 248, 16);
    this.preview.add(panel);

    if (!def) {
      this.preview.add(this.add.text(W / 2, cy - 12, '点击下方商品查看预览', {
        fontFamily: FONT, fontSize: '22px', color: '#b9a8cc'
      }).setOrigin(0.5));
      this.preview.add(this.add.text(W / 2, cy + 26, '皮肤会直接改变游戏里主角的外观', {
        fontFamily: FONT, fontSize: '16px', color: '#7f6f92'
      }).setOrigin(0.5));
      return;
    }

    var kind = kindOf(def);
    var owned = R.Meta.owns(def.id);
    var equipped = isEquipped(def);
    var locked = unlockLocked(def);

    // 大预览（v0.8.0：皮肤改为全身立绘大图 260×220）
    if (kind === 'skin') {
      this.preview.add(skinShowcase(this, W / 2 - 195, cy, 236, 222, def));
    } else {
      // 头像 + 框叠加（预览框时用当前头像，预览头像时用当前框）
      var prevAvatar = kind === 'avatar' ? def.id : R.Meta.avatar;
      var prevFrame = kind === 'avatar' ? R.Meta.frame : def.id;
      this.preview.add(R.Avatar.add(this, W / 2 - 195, cy, 120, { avatar: prevAvatar, frame: prevFrame }));
    }

    // 名称 + 状态文字
    var status = equipped ? '· 使用中' : (owned ? '· 已购买' : (locked ? '· 未解锁' : ''));
    var kindName = kind === 'skin' ? '皮肤' : (kind === 'avatar' ? '头像' : '头像框');
    this.preview.add(this.add.text(W / 2 - 62, cy - 62, def.name, {
      fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#fff6e2',
      stroke: '#2b1d2b', strokeThickness: 6
    }).setOrigin(0, 0.5));
    this.preview.add(this.add.text(W / 2 - 62, cy - 26,
      kindName + '  ' + status, {
      fontFamily: FONT, fontSize: '19px', color: owned ? '#8fe08a' : '#ffe9a8'
    }).setOrigin(0, 0.5));
    // 一行说明（皮肤用 desc，其他用 kind 提示）
    var sub = def.desc || '';
    if (locked) sub = def.desc || ('通关 ' + ((R.DATA.SKINS_UNLOCK_CLEARS) || 1) + ' 次解锁');
    this.preview.add(this.add.text(W / 2 - 62, cy + 8, sub, {
      fontFamily: FONT, fontSize: '15px', color: locked ? '#ffb0a0' : '#b9a8cc',
      wordWrap: { width: 180 }, lineSpacing: 2
    }).setOrigin(0, 0.5));

    // 预览右侧操作按钮
    var st = btnStyle(def, owned, equipped);
    this._previewAction = { def: def, owned: owned, equipped: equipped, locked: locked, st: st };

    var px = W / 2 + 150, btn = this.add.container(px, cy + 86);
    var bg2 = this.add.graphics();
    bg2.fillStyle(0x2b1d2b, 1); bg2.fillRoundedRect(-105, -30, 210, 60, 30);
    bg2.fillStyle(st.col2, 1);  bg2.fillRoundedRect(-99, -24, 198, 48, 24);
    if (st.enabled) { bg2.fillStyle(st.col1, 1); bg2.fillRoundedRect(-99, -24, 198, 24, 12); }
    btn.add(bg2);
    // 购买按钮上的金币图标与价格分两行显示更清楚
    var plabel = owned ? st.label : (def.price ? '⛃ ' + def.price + ' 购买' : st.label);
    btn.add(this.add.text(0, -1, plabel, {
      fontFamily: FONT, fontSize: st.label.length > 6 ? '20px' : '24px',
      fontStyle: 'bold', color: st.txtCol
    }).setOrigin(0.5));
    btn.setSize(210, 60).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () {
      R.Sfx.play('click');
      if (locked) { self.toast('通关 ' + ((R.DATA.SKINS_UNLOCK_CLEARS) || 1) + ' 次即可获得这款皮肤'); return; }
      if (!st.enabled) return;
      self.tapItem(def, owned, equipped);
    });
    this.preview.add(btn);

    // 未装备的已拥有商品：按钮下方小字提示
    if (owned && !equipped) {
      this.preview.add(this.add.text(px, cy + 52, '点击装备', {
        fontFamily: FONT, fontSize: '16px', color: '#8fe08a'
      }).setOrigin(0.5));
    }
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
    c.setSize(170, 54).setInteractive({ useHandCursor: true });
    c.on('pointerdown', function () {
      R.Sfx.play('click');
      self.tab = key;
      self.sel = null;
      self.renderTabs();
      self.renderPreview(null);
      self.renderGrid();
    });
    this['tab_' + key] = c;
    this.renderTabs();
  };

  Shop.prototype.renderTabs = function () {
    var self = this;
    ['avatar', 'frame', 'skin'].forEach(function (k) {
      var c = self['tab_' + k];
      if (!c) return;
      var on = self.tab === k;
      c.bg.clear();
      c.bg.fillStyle(0x2b1d2b, 1);
      c.bg.fillRoundedRect(-82, -27, 164, 54, 27);
      c.bg.fillStyle(on ? 0xf9a825 : 0x4a3a52, 1);
      c.bg.fillRoundedRect(-77, -22, 154, 44, 22);
    });
  };

  /* 网格：2 列（卡片高度略压缩以给预览栏让位） */
  Shop.prototype.renderGrid = function () {
    var self = this, W = this.scale.width;
    this.grid.removeAll(true);
    var list = this.tab === 'avatar' ? R.DATA.AVATARS
             : (this.tab === 'frame' ? R.DATA.FRAMES : R.DATA.SKINS);
    var cols = 2, cellW = (W - 72) / cols, cellH = 200;
    var startY = 470;

    list.forEach(function (def, i) {
      var cx = 36 + cellW * (i % cols) + cellW / 2;
      var cy = startY + Math.floor(i / cols) * (cellH + 12);
      self.buildCell(def, cx, cy, cellW - 16, cellH);
    });
  };

  Shop.prototype.buildCell = function (def, x, y, w, h) {
    var self = this;
    var kind = kindOf(def);
    var owned = R.Meta.owns(def.id);
    var equipped = isEquipped(def);
    var locked = unlockLocked(def);
    var selected = this.sel === def.id;

    var cell = this.add.container(x, y);

    var g = this.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 18);
    g.fillStyle(equipped ? 0xf9a825 : (selected ? 0x53d9ff : 0x2b1d2b), 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.fillStyle(equipped ? 0x3d2a12 : 0x241a2e, 1);
    g.fillRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 14);
    cell.add(g);

    // 预览：皮肤 → 角色图；头像/框 → 叠加预览
    if (kind === 'skin') {
      cell.add(skinPreview(this, 0, -h / 2 + 58, 74, def));
    } else {
      var prevAvatar = kind === 'avatar' ? def.id : R.Meta.avatar;
      var prevFrame = kind === 'avatar' ? R.Meta.frame : def.id;
      cell.add(R.Avatar.add(this, 0, -h / 2 + 58, 72, { avatar: prevAvatar, frame: prevFrame }));
    }

    // 名称
    cell.add(this.add.text(0, -h / 2 + 108, def.name, {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold', color: locked ? '#a593b8' : '#fff6e2'
    }).setOrigin(0.5));

    // 底部状态按钮：未购买 → 价格；已购买 → 「已购买」；使用中 → 「使用中」；未解锁 → 「🔒 通关解锁」
    var label, col1, col2, txtCol;
    if (equipped) { label = '使用中'; col1 = 0x4a3a52; col2 = 0x6b5a74; txtCol = '#e0d6ea'; }
    else if (owned) { label = '已购买'; col1 = 0x2e7d32; col2 = 0x4caf50; txtCol = '#eafff0'; }
    else if (locked) { label = '🔒 通关解锁'; col1 = 0x4a3a52; col2 = 0x5f5566; txtCol = '#c9bcd6'; }
    else if (R.Meta.gold >= (def.price || 0)) { label = '⛃ ' + def.price; col1 = 0xf9a825; col2 = 0xffd05a; txtCol = '#4a2c00'; }
    else { label = '⛃ ' + def.price; col1 = 0x6b4a3a; col2 = 0x8d5a3b; txtCol = '#f0d7c8'; }

    var btn = this.add.container(0, h / 2 - 32);
    var bg2 = this.add.graphics();
    bg2.fillStyle(0x2b1d2b, 1); bg2.fillRoundedRect(-w / 2 + 14, -20, w - 28, 42, 21);
    bg2.fillStyle(col2, 1);     bg2.fillRoundedRect(-w / 2 + 18, -16, w - 36, 34, 17);
    if (!locked) { bg2.fillStyle(col1, 1); bg2.fillRoundedRect(-w / 2 + 18, -16, w - 36, 18, 9); }
    btn.add(bg2);
    btn.add(this.add.text(0, -1, label, {
      fontFamily: FONT, fontSize: label.length > 5 ? '16px' : '19px', fontStyle: 'bold', color: txtCol
    }).setOrigin(0.5));
    btn.setSize(w - 28, 42).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', function () {
      if (locked) {
        R.Sfx.play('hit', 150);
        self.toast('通关 ' + ((R.DATA.SKINS_UNLOCK_CLEARS) || 1) + ' 次即可获得「' + def.name + '」');
        self.renderPreview(def);
        return;
      }
      if (equipped || owned) { self.renderPreview(def); return; }   // 已拥有 → 弹预览，可点装备
      self.tapItem(def, owned, equipped);
    });
    cell.add(btn);

    // 解锁条件小字（皮肤专属，未解锁时显示在名称下）
    if (locked) {
      cell.add(this.add.text(0, -h / 2 + 130, '通关 ' + ((R.DATA.SKINS_UNLOCK_CLEARS) || 1) + ' 次解锁', {
        fontFamily: FONT, fontSize: '13px', color: '#ffb0a0'
      }).setOrigin(0.5));
    }

    // 点卡片任意处 = 选中预览
    cell.setSize(w, h).setInteractive({ useHandCursor: true });
    cell.on('pointerdown', function () {
      R.Sfx.play('click');
      self.renderPreview(def);
    });

    this.grid.add(cell);
  };

  /* 点击行为：预览栏/卡片按钮共用
   * owned → 装备；否则尝试购买（买完自动装备） */
  Shop.prototype.tapItem = function (def, owned, equipped) {
    if (equipped) { R.Sfx.play('click'); this.renderPreview(def); return; }
    if (unlockLocked(def)) {
      R.Sfx.play('hit', 150);
      this.toast('通关 ' + ((R.DATA.SKINS_UNLOCK_CLEARS) || 1) + ' 次即可获得这款皮肤');
      return;
    }
    if (owned) {
      R.Meta.equip(def);
      R.Sfx.play('select');
      this.refreshAll();
      return;
    }
    if (R.Meta.gold < (def.price || 0)) {
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
    // 保持预览栏指向同一商品（状态可能已变化）
    var list = this.tab === 'avatar' ? R.DATA.AVATARS
             : (this.tab === 'frame' ? R.DATA.FRAMES : R.DATA.SKINS);
    var wantId = this.sel, sel = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === wantId) { sel = list[i]; break; }
    this.renderPreview(sel || null);
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
