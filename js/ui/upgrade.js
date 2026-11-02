/* =========================================================
 * ui/upgrade.js —— 升级三选一
 * 立绘/图标缺省用 icon_<name>，可在 DATA.UPGRADES[i].art 指定贴图
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;

  function UpgradeScene() { Phaser.Scene.call(this, { key: 'Upgrade' }); }
  UpgradeScene.prototype = Object.create(Phaser.Scene.prototype);
  UpgradeScene.prototype.constructor = UpgradeScene;

  UpgradeScene.prototype.init = function (data) {
    data = data || {};
    this.run = data.run;      // 用引用，选完直接改 run
    this.onDone = data.onDone;
    this.cards = [];
    this._chosen = false;     // 场景实例会复用，必须重置
    this._orphan = !this.run;  // 场景管理器自动启动时无参数，直接自关
  };

  UpgradeScene.prototype.create = function () {
    var self = this;
    if (this._orphan) { this.time.delayedCall(0, function () { this.scene.stop(); }, [], this); return; }
    var W = this.scale.width, H = this.scale.height;

    // 半透明遮罩（不暂停下面场景）
    this.add.rectangle(0, 0, W, H, 0x1a1020, 0.78).setOrigin(0).setInteractive();

    // 标题
    var tt = this.add.text(W / 2, H * 0.12, '升 级 !', {
      fontFamily: R.FONT, fontSize: '54px', fontStyle: 'bold', color: '#ffe14d',
      stroke: '#2b1d2b', strokeThickness: 12
    }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.12 + 50, 'Lv.' + this.run.level + '  ·  选择一项强化', {
      fontFamily: R.FONT, fontSize: '22px', color: '#fff6e2'
    }).setOrigin(0.5);

    this.tweens.add({ targets: tt, scale: { from: 1.4, to: 1 }, duration: 300, ease: 'Back.out' });

    // 抽卡
    var defs = this.run.rollUpgrades(3);
    var cardH = 210, gap = 16;
    var startY = H * 0.30;

    if (defs.length === 0) {
      // 兜底：全满时给金币
      this.run.gold += 30;
      defs = [R.DATA.UPGRADES.find(function (u) { return u.id === 'p_maxHp'; })];
    }

    defs.forEach(function (def, i) {
      var card = self.buildCard(def, W / 2, startY + i * (cardH + gap), W - 72, cardH);
      card.setAlpha(0).setScale(0.9);
      self.tweens.add({
        targets: card, alpha: 1, scale: 1, duration: 260, delay: 60 * i, ease: 'Back.out'
      });
      self.cards.push(card);
    });
  };

  UpgradeScene.prototype.buildCard = function (def, x, y, w, h) {
    var self = this;
    var c = this.add.container(x, y);

    var isWeapon = def.type === 'weapon';
    var accent = isWeapon ? 0xf9a825 : (def.type === 'special' ? 0x9b5de5 : 0x4a9de0);

    // 卡片底板：优先用 UI 皮肤图（card），否则代码绘制
    var skin = R.UISkin.apply(this, 'card', 0, 0, w, h);
    if (skin) {
      c.add(skin);
    } else {
      var g = this.add.graphics();
      // 阴影
      g.fillStyle(0x000000, 0.3); g.fillRoundedRect(-w / 2 + 5, -h / 2 + 7, w, h, 22);
      // 底
      g.fillStyle(accent, 1);      g.fillRoundedRect(-w / 2, -h / 2, w, h, 22);
      g.fillStyle(0xfff6e2, 1);    g.fillRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 18);
      // 左边色块
      g.fillStyle(accent, 0.28);   g.fillRoundedRect(-w / 2 + 5, -h / 2 + 5, 132, h - 10, 18);
      c.add(g);
    }

    // 图标
    var iconKey = 'icon_' + (def.icon || 'star');
    var iconBg = this.add.graphics();
    iconBg.fillStyle(accent, 0.35); iconBg.fillCircle(-w / 2 + 70, 0, 46);
    c.add(iconBg);
    if (this.textures.exists(iconKey)) {
      c.add(this.add.image(-w / 2 + 70, 0, iconKey).setScale(0.78));
    }

    // 类型标签
    var isUp = def.upgrade === true;
    var tagText = isUp ? '技能升级' : (isWeapon ? '新武器' : (def.type === 'special' ? '特殊' : '强化'));
    var tag = this.add.text(-w / 2 + 70, 52, tagText, {
      fontFamily: R.FONT, fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5);
    var tw = tag.width + 16;
    var tg = this.add.graphics();
    tg.fillStyle(isUp ? 0xe8433c : accent, 1); tg.fillRoundedRect(-w / 2 + 70 - tw / 2, 44, tw, 20, 10);
    c.add(tg); c.add(tag);

    // 名称
    var name = def.name || (R.DATA.PASSIVES[def.passive] && R.DATA.PASSIVES[def.passive].name) || '';
    if (def.type === 'weapon') name = R.DATA.WEAPONS[def.weapon].name;
    c.add(this.add.text(-w / 2 + 130, -h / 2 + 34, name, {
      fontFamily: R.FONT, fontSize: '34px', fontStyle: 'bold', color: '#2b1d2b'
    }));

    // 等级变化（技能升级时显示 Lv.N → Lv.N+1，右侧 8 格等级条）
    if (def.type === 'weapon') {
      var maxLv = R.Run.WEAPON_MAX || 8;
      var curLv = isUp ? def.fromLevel : 1;
      var shownLv = isUp ? def.toLevel : curLv;
      c.add(this.add.text(w / 2 - 30, -h / 2 + 34, 'Lv.' + shownLv + ' / ' + maxLv, {
        fontFamily: R.FONT, fontSize: '18px', fontStyle: 'bold',
        color: shownLv >= maxLv ? '#e8433c' : '#b08a2a'
      }).setOrigin(1, 0));
      // 8 格等级点
      for (var li = 0; li < maxLv; li++) {
        var on = li < shownLv;
        var dot = this.add.graphics();
        dot.fillStyle(on ? 0xf9a825 : 0xd8cbb8, 1);
        dot.fillCircle(w / 2 - 30 - (maxLv - 1 - li) * 16, -h / 2 + 60, 5);
        c.add(dot);
      }
    } else {
      // 已有层数
      var taken = this.run.upgrades[def.id] || 0;
      if (taken > 0) {
        c.add(this.add.text(w / 2 - 30, -h / 2 + 34, 'Lv.' + taken, {
          fontFamily: R.FONT, fontSize: '18px', color: '#b08a2a'
        }).setOrigin(1, 0));
      }
    }

    c.add(this.add.text(-w / 2 + 130, -h / 2 + 82, def.text || def.desc || '', {
      fontFamily: R.FONT, fontSize: '20px', color: '#6b5a58', wordWrap: { width: w - 200 }
    }));

    // 交互
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerover', function () { self.tweens.add({ targets: c, scale: 1.02, duration: 90 }); });
    c.on('pointerout', function () { self.tweens.add({ targets: c, scale: 1, duration: 90 }); });
    c.on('pointerdown', function () { self.choose(def, c); });
    return c;
  };

  UpgradeScene.prototype.choose = function (def, card) {
    if (this._chosen) return;
    this._chosen = true;
    var self = this;
    R.Sfx.play('select');
    R.Sfx.play('reward');

    // 其他卡片淡出
    this.cards.forEach(function (k) {
      if (k === card) self.tweens.add({ targets: k, scale: 1.06, duration: 140, yoyo: true });
      else self.tweens.add({ targets: k, alpha: 0, x: k.x + (k.x < this.scale.width / 2 ? -60 : 60), duration: 160 });
    }, this);

    this.run.applyUpgrade(def);
    this.run.pendingLevels = Math.max(0, this.run.pendingLevels - 1);

    this.cameras.main.fadeOut(140, 26, 16, 32);
    this.time.delayedCall(160, function () {
      self.scene.stop();
      if (self.onDone) self.onDone(def);
    });
  };

  R.SCENES.push(UpgradeScene);
})(window.RogueGame = window.RogueGame || {});
