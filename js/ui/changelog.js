/* =========================================================
 * ui/changelog.js —— 更新日志 / 版本说明（可滚动）
 * =========================================================
 * 数据来源：js/core/data.js → D.CHANGELOG（最新在前）、D.VERSION
 * 入口：标题页底部「v0.3.0 · 更新内容 ›」按钮
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var FONT = R.FONT;

  function Changelog() { Phaser.Scene.call(this, { key: 'Changelog', active: false }); }
  Changelog.prototype = Object.create(Phaser.Scene.prototype);
  Changelog.prototype.constructor = Changelog;

  Changelog.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    var D = R.DATA;

    // 背景
    var bg = this.add.graphics();
    bg.fillGradientStyle(0x2f2748, 0x2f2748, 0x160f1e, 0x160f1e, 1);
    bg.fillRect(0, 0, W, H);

    // 标题
    this.add.text(W / 2, 66, '更 新 内 容', {
      fontFamily: FONT, fontSize: '42px', fontStyle: 'bold', color: '#ffe14d',
      stroke: '#2b1d2b', strokeThickness: 10
    }).setOrigin(0.5);
    this.add.text(W / 2, 110, '当前版本 v' + D.VERSION, {
      fontFamily: FONT, fontSize: '19px', color: '#b7a6c9'
    }).setOrigin(0.5);

    // ---- 可滚动内容区 ----
    var top = 148, bottom = H - 108;
    this.viewTop = top;
    this.viewH = bottom - top;

    var maskG = this.make.graphics({ x: 0, y: 0, add: false });
    maskG.fillStyle(0xffffff, 1);
    maskG.fillRect(0, top, W, this.viewH);
    var mask = maskG.createGeometryMask();

    this.content = this.add.container(0, 0).setMask(mask);
    this.buildContent(W, top);

    // 滚动交互
    this.scrollY = 0;
    this.minScroll = Math.min(0, this.viewH - this.contentH);
    this.setupScroll(W, top);

    // 顶部/底部渐隐遮罩（提示可滚动）
    var fade = this.add.graphics().setDepth(30);
    fade.fillStyle(0x1d1526, 0.9);
    fade.fillRect(0, top - 2, W, 2);
    fade.fillStyle(0x160f1e, 0.85);
    fade.fillRect(0, bottom - 18, W, 18);

    // 滚动提示
    if (this.contentH > this.viewH) {
      this.hint = this.add.text(W / 2, bottom - 8, '↑ 上下滑动查看 ↑', {
        fontFamily: FONT, fontSize: '16px', color: '#8f7fa0'
      }).setOrigin(1, 0.5).setAlpha(0.9);
    }

    // 返回
    var back = this.add.container(W / 2, H - 56);
    var bgg = this.add.graphics();
    bgg.fillStyle(C.outline, 1); bgg.fillRoundedRect(-120, -28, 240, 56, 28);
    bgg.fillStyle(0x6cc24a, 1);  bgg.fillRoundedRect(-114, -22, 228, 44, 22);
    back.add(bgg);
    back.add(this.add.text(0, -1, '返 回', {
      fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#12300a'
    }).setOrigin(0.5));
    back.setSize(240, 56).setInteractive({ useHandCursor: true });
    back.on('pointerdown', function () {
      R.Sfx.play('click');
      self.scene.start('Title');
    });
  };

  /* ---------------- 渲染版本列表 ---------------- */
  Changelog.prototype.buildContent = function (W, top) {
    var self = this;
    var D = R.DATA;
    var list = D.CHANGELOG || [];
    var y = 0;                      // 相对 content 容器
    var padX = 40;
    var innerW = W - padX * 2;

    list.forEach(function (ver, vi) {
      var isLatest = vi === 0;
      var tagDef = (D.CHANGELOG_TAGS || {})[ver.tag] || null;

      // 版本卡片底
      var cardTop = y;
      var items = ver.items || [];
      // 估算卡片高度：头 66 + 每行 34
      var cardH = 74 + items.length * 34 + 16;

      var card = this.add.graphics();
      card.fillStyle(0x000000, 0.25);
      card.fillRoundedRect(padX - 2, cardTop + 2, innerW + 4, cardH, 18);
      card.fillStyle(isLatest ? 0x3a2a52 : 0x241a2e, 1);
      card.fillRoundedRect(padX, cardTop, innerW, cardH, 18);
      if (isLatest) {
        card.lineStyle(3, 0xffe14d, 0.9);
        card.strokeRoundedRect(padX, cardTop, innerW, cardH, 18);
      }
      this.content.add(card);

      // 版本号
      var vx = padX + 22;
      this.content.add(this.add.text(vx, cardTop + 18, 'v' + ver.version, {
        fontFamily: FONT, fontSize: '26px', fontStyle: 'bold',
        color: isLatest ? '#ffe14d' : '#fff6e2'
      }));
      // 日期
      if (ver.date) {
        this.content.add(this.add.text(padX + innerW - 20, cardTop + 24, ver.date, {
          fontFamily: FONT, fontSize: '15px', color: '#8f7fa0'
        }).setOrigin(1, 0));
      }
      // 标签
      if (tagDef) {
        var tw = tagDef.text.length * 16 + 20;
        var tg = this.add.graphics();
        tg.fillStyle(Phaser.Display.Color.HexStringToColor(tagDef.color).color, 1);
        tg.fillRoundedRect(vx + 96, cardTop + 20, tw, 28, 14);
        this.content.add(tg);
        this.content.add(this.add.text(vx + 96 + tw / 2, cardTop + 34, tagDef.text, {
          fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#12200a'
        }).setOrigin(0.5));
      }

      // 主题句
      this.content.add(this.add.text(vx, cardTop + 52, ver.title || '', {
        fontFamily: FONT, fontSize: '17px', color: '#c9b8dc'
      }));

      // 条目
      items.forEach(function (it, ii) {
        var iy = cardTop + 84 + ii * 34;
        // 圆点
        var dot = self.add.graphics();
        dot.fillStyle(isLatest ? 0xffe14d : 0x8f7fa0, 1);
        dot.fillCircle(vx + 6, iy + 11, 4);
        self.content.add(dot);
        self.content.add(self.add.text(vx + 22, iy, it, {
          fontFamily: FONT, fontSize: '17px', color: '#efe6f7',
          wordWrap: { width: innerW - 60 }, lineSpacing: 3
        }));
      });

      y = cardTop + cardH + 18;
    }, this);

    if (!list.length) {
      this.content.add(this.add.text(W / 2, top + 60, '暂无更新记录', {
        fontFamily: FONT, fontSize: '22px', color: '#8f7fa0'
      }).setOrigin(0.5));
    }

    this.contentH = y + 10;
    // 内容从视口顶部开始（容器内部坐标 0 对应 top）
    this.content.y = top;
  };

  /* ---------------- 滚动（拖动 + 滚轮） ---------------- */
  Changelog.prototype.setupScroll = function (W, top) {
    var self = this;
    var startY = 0, startScroll = 0, dragging = false;
    var bottom = top + this.viewH;

    this.input.on('pointerdown', function (p) {
      if (p.y < top || p.y > bottom) return;
      dragging = true;
      startY = p.y;
      startScroll = self.scrollY;
    });

    this.input.on('pointermove', function (p) {
      if (!dragging || !p.isDown) return;
      self.applyScroll(startScroll + (p.y - startY));
    });

    var end = function () { dragging = false; };
    this.input.on('pointerup', end);
    this.input.on('pointerupoutside', end);

    // 鼠标滚轮（电脑上调试方便）
    this.input.on('wheel', function (p, over, dx, dy) {
      self.applyScroll(self.scrollY - dy * 0.6);
    });
  };

  Changelog.prototype.applyScroll = function (v) {
    var min = Math.min(0, this.viewH - this.contentH);
    this.scrollY = Phaser.Math.Clamp(v, min, 0);
    this.content.y = this.viewTop + this.scrollY;
    if (this.hint) this.hint.setAlpha(this.scrollY <= min + 4 ? 0 : 0.9);
  };

  R.SCENES.push(Changelog);
})(window.RogueGame = window.RogueGame || {});
