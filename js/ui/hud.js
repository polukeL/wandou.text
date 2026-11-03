/* =========================================================
 * ui/hud.js —— 战斗界面 HUD（纯 Phaser 绘制，跟随镜头固定）
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var FONT = '"Baloo 2","Fredoka","PingFang SC","Microsoft YaHei",system-ui,sans-serif';

  function HUD(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    this.build();
  }

  HUD.prototype.build = function () {
    var s = this.scene, W = s.scale.width;
    var L = R.UILayout;   // 布局表：位置全部从这里读（见 ui/layout.js）
    // 可拖元素注册表（调试模式用）
    this.elems = {};

    // ---- 左上：生命 ----
    var hpPos = L.pos('hp', 24, 26);
    this.hpRoot = s.add.container(hpPos.x, hpPos.y);
    this.hpBg = s.add.graphics();
    this.hpRoot.add(this.hpBg);
    this.root.add(this.hpRoot);
    this.elems.hp = this.hpRoot;

    // ---- 生命数字 ----
    var htPos = L.pos('hpText', 84, 26);
    this.hpText = s.add.text(htPos.x, htPos.y, '6', {
      fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b1d2b', strokeThickness: 6
    });
    this.root.add(this.hpText);
    this.elems.hpText = this.hpText;

    // ---- 经验条（屏幕最顶端通栏细条，避免与血量重叠） ----
    this.xpH = L.size('xp', 12).h;
    this.xpG = s.add.graphics();
    this.root.add(this.xpG);

    var lvPos = L.pos('lvText', 26, 86);
    this.lvText = s.add.text(lvPos.x, lvPos.y, 'Lv.1', {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#fff6e2', stroke: '#2b1d2b', strokeThickness: 5
    });
    this.root.add(this.lvText);
    this.elems.lvText = this.lvText;

    // ---- 右上：计时 / 杀敌 / 金币 ----
    var stPos = L.pos('statText', W - 24, 26);
    this.statText = s.add.text(stPos.x, stPos.y, '', {
      fontFamily: FONT, fontSize: '22px', color: '#fff6e2', align: 'right', stroke: '#2b1d2b', strokeThickness: 5
    }).setOrigin(1, 0);
    this.root.add(this.statText);
    this.elems.statText = this.statText;

    // ---- 中央上方：关卡进度 ----
    var rmPos = L.pos('roomText', W / 2, 26);
    this.roomText = s.add.text(rmPos.x, rmPos.y, '', {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#fff6e2', stroke: '#2b1d2b', strokeThickness: 6
    }).setOrigin(0.5, 0);
    this.root.add(this.roomText);
    this.elems.roomText = this.roomText;

    // ---- 武器槽 ----
    this.slots = s.add.container(0, 0);
    this.root.add(this.slots);

    // ---- 关卡提示大字 ----
    var bnPos = L.pos('banner', W / 2, s.scale.height * 0.34);
    this.banner = s.add.text(bnPos.x, bnPos.y, '', {
      fontFamily: FONT, fontSize: '64px', fontStyle: 'bold', color: '#fff6e2',
      stroke: '#2b1d2b', strokeThickness: 12, align: 'center'
    }).setOrigin(0.5).setAlpha(0);
    this.root.add(this.banner);
    this.elems.banner = this.banner;

    var bsPos = L.pos('bannerSub', W / 2, s.scale.height * 0.34 + 66);
    this.bannerSub = s.add.text(bsPos.x, bsPos.y, '', {
      fontFamily: FONT, fontSize: '26px', color: '#ffe9a8', stroke: '#2b1d2b', strokeThickness: 6, align: 'center'
    }).setOrigin(0.5).setAlpha(0);
    this.root.add(this.bannerSub);
    this.elems.bannerSub = this.bannerSub;

    // ---- 音效按钮（支持皮肤 btn_mute）----
    // 注意：可交互按钮必须直接挂在场景上并 setScrollFactor(0)，
    // 放进 scrollFactor=0 的父容器会导致镜头滚动后点击命中偏移。
    var mPos = L.pos('muteBtn', W - 56, s.scale.height - 60);
    var mute = s.add.container(mPos.x, mPos.y).setDepth(1000).setScrollFactor(0);
    var muteSkin = R.UISkin.apply(s, 'btn_mute', 0, 0, 56, 56);
    if (muteSkin) {
      mute.add(muteSkin);
    } else {
      var mg = s.add.graphics();
      mg.fillStyle(C.outline, 0.55); mg.fillCircle(0, 0, 28);
      mute.add(mg);
    }
    var ml = s.add.text(0, 0, R.Sfx.muted ? '🔇' : '🔊', { fontSize: '24px' }).setOrigin(0.5);
    mute.add(ml);
    mute.setSize(56, 56).setInteractive({ useHandCursor: true });
    mute.on('pointerdown', function () {
      var on = R.Sfx.toggle(); ml.setText(on ? '🔊' : '🔇'); R.Sfx.play('click');
    });
    this.elems.muteBtn = mute;
    this.muteBtn = mute;

    // ---- 暂停按钮（支持皮肤 btn_pause） ----
    var pPos = L.pos('pauseBtn', W - 56, s.scale.height - 140);
    var pz = s.add.container(pPos.x, pPos.y).setDepth(1000).setScrollFactor(0);
    var pzSkin = R.UISkin.apply(s, 'btn_pause', 0, 0, 56, 56);
    if (!pzSkin) {
      var pg = s.add.graphics();
      pg.fillStyle(C.outline, 0.55); pg.fillCircle(0, 0, 28);
      pg.fillStyle(0xfff6e2, 0.95);  pg.fillRoundedRect(-9, -11, 7, 22, 3);
      pg.fillStyle(0xfff6e2, 0.95);  pg.fillRoundedRect(2, -11, 7, 22, 3);
      pz.add(pg);
    } else {
      pz.add(pzSkin);
      var pl = s.add.text(0, 0, '❚❚', { fontSize: '18px', color: '#2b1d2b' }).setOrigin(0.5);
      pz.add(pl);
    }
    pz.setSize(56, 56).setInteractive({ useHandCursor: true });
    pz.on('pointerdown', function () {
      if (s.pauseGame) s.pauseGame();
    });
    this.elems.pauseBtn = pz;
    this.pauseBtn = pz;
  };

  HUD.prototype.refresh = function (run) {
    var s = this.scene, W = s.scale.width;

    // 生命
    var hearts = Math.min(run.maxHp, 8);
    var per = 7, startX = 42;
    this.hpBg.clear();
    for (var i = 0; i < run.maxHp; i++) {
      var x = startX + i * 24;
      if (i < hearts) {
        var filled = i < run.hp;
        this.hpBg.fillStyle(filled ? C.red : 0x5c4a5c, filled ? 1 : 0.85);
        this.hpBg.lineStyle(3, C.outline, 1);
        this.hpBg.fillCircle(x, 40, per);
        this.hpBg.strokeCircle(x, 40, per);
        if (filled) { this.hpBg.fillStyle(0xffffff, 0.55); this.hpBg.fillCircle(x - 2.4, 36, 2.6); }
      }
    }
    if (run.maxHp > 8) {
      this.hpText.setText('x' + run.hp + '/' + run.maxHp).setPosition(startX + 8 * 24 + 6, 24);
    } else {
      this.hpText.setText('');
    }

    // 护盾格（血量上方，蓝色；剩余格数亮起）
    if (run.shield && run.shield.level > 0) {
      for (var si = 0; si < run.shield.level; si++) {
        var sx = startX + si * 17;
        var on = si < run.shield.hp;
        this.hpBg.fillStyle(on ? 0x53d7ff : 0x5c4a5c, on ? 1 : 0.75);
        this.hpBg.fillRoundedRect(sx - 6, 10, 13, 10, 3);
        this.hpBg.lineStyle(2, C.outline, 1);
        this.hpBg.strokeRoundedRect(sx - 6, 10, 13, 10, 3);
      }
    }

    // 经验条（最顶端通栏，与血量/统计分行，不重叠）
    var xh = this.xpH || 12;
    this.xpG.clear();
    this.xpG.fillStyle(0x2b1d2b, 0.55); this.xpG.fillRect(0, 0, W, xh);
    var p = Phaser.Math.Clamp(run.xp / run.xpNeed, 0, 1);
    if (p > 0.005) {
      this.xpG.fillStyle(0x53d9ff, 1); this.xpG.fillRect(0, 0, W * p, xh);
      this.xpG.fillStyle(0xffffff, 0.35); this.xpG.fillRect(0, 0, W * p, Math.max(3, xh * 0.34));
    }
    var lvP = R.UILayout.pos('lvText', 26, 86);
    this.lvText.setText('Lv.' + run.level).setPosition(lvP.x, lvP.y);

    // 统计
    var t = Math.floor(run.time);
    var mm = ('0' + Math.floor(t / 60)).slice(-2), ss = ('0' + (t % 60)).slice(-2);
    this.statText.setText('⏱ ' + mm + ':' + ss + '   ☠ ' + run.kills + '   ⛃ ' + run.gold);

    // 章节进度
    var shown = run.roomShown || {};
    this.roomText.setText(shown.label || '');

    // 武器槽
    this.slots.removeAll(true);
    var baseX = 26, baseY = s.scale.height - 58;
    run.weapons.forEach(function (w, i) {
      var x = baseX + i * 52 + 24;
      var g = s.add.graphics();
      g.fillStyle(0x2b1d2b, 0.6); g.fillCircle(x, baseY, 25);
      g.lineStyle(3, 0xfff6e2, 0.9); g.strokeCircle(x, baseY, 25);
      this.slots.add(g);
      var ty = { pea: 'pea', shot: 'shot', boomer: 'boomer', ball: 'ball', bubble: 'bubble', shield: 'shield' }[w.key] || 'pea';
      var img = s.add.image(x, baseY, 'icon_' + ty).setScale(0.55);
      this.slots.add(img);
      // 武器等级角标（Lv.2 起显示，满级金色）
      if (w.level > 1) {
        var maxLv = R.Run.WEAPON_MAX || 8;
        var full = w.level >= maxLv;
        var lt = s.add.text(x + 22, baseY - 18, String(w.level), {
          fontFamily: FONT, fontSize: '15px', fontStyle: 'bold',
          color: full ? '#ffe14d' : '#ffffff', stroke: '#2b1d2b', strokeThickness: 4
        }).setOrigin(0.5);
        this.slots.add(lt);
      }
    }, this);
  };

  HUD.prototype.showBanner = function (title, sub, color) {
    var s = this.scene;
    this.banner.setText(title).setColor(color || '#fff6e2').setAlpha(0).setScale(1.6);
    this.bannerSub.setText(sub || '').setAlpha(0);
    s.tweens.killTweensOf(this.banner);
    s.tweens.killTweensOf(this.bannerSub);
    s.tweens.add({ targets: this.banner, alpha: 1, scale: 1, duration: 260, ease: 'Back.out' });
    s.tweens.add({ targets: this.bannerSub, alpha: 1, duration: 300, delay: 120 });
    s.tweens.add({ targets: [this.banner, this.bannerSub], alpha: 0, duration: 400, delay: 1500 });
  };

  HUD.prototype.hurtFlash = function () {
    var s = this.scene;
    var r = s.add.rectangle(0, 0, s.scale.width, s.scale.height, 0xe8433c, 0.34)
      .setOrigin(0).setDepth(1400).setScrollFactor(0);
    s.tweens.add({ targets: r, alpha: 0, duration: 260, onComplete: function () { r.destroy(); } });
  };

  HUD.prototype.toast = function (text, y) {
    var s = this.scene;
    var t = s.add.text(s.scale.width / 2, y || s.scale.height * 0.2, text, {
      fontFamily: FONT, fontSize: '22px', color: '#ffffff', stroke: '#2b1d2b', strokeThickness: 5
    }).setOrigin(0.5).setDepth(1300).setScrollFactor(0);
    s.tweens.add({ targets: t, y: t.y - 44, alpha: 0, duration: 900, onComplete: function () { t.destroy(); } });
  };

  R.HUD = HUD;
  R.FONT = FONT;
})(window.RogueGame = window.RogueGame || {});
