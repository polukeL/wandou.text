/* =========================================================
 * ui/layoutdebug.js —— HUD 可视化布局调试（仅测试模式）
 * =========================================================
 * 入口：?dev=1 → 测试面板 →「UI 布局调试」
 * 用法：
 *   · 每个可调元素显示 黄色边框 + 名称 + 当前坐标
 *   · 手指/鼠标按住元素拖动 → 实时移动并存入布局草稿
 *   · 草稿存 localStorage，刷新游戏后依然生效
 *   · 「导出配置」把草稿 JSON 显示出来，复制粘贴回
 *     ui/layout.js 的 DEFAULTS 即为定稿
 *   · 「清除草稿」恢复默认布局
 * ========================================================= */
(function (R) {
  'use strict';
  var FONT = R.FONT;

  function LayoutDebug() { Phaser.Scene.call(this, { key: 'LayoutDebug', active: false }); }
  LayoutDebug.prototype = Object.create(Phaser.Scene.prototype);
  LayoutDebug.prototype.constructor = LayoutDebug;

  LayoutDebug.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    this.dragging = null;

    var dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.12).setOrigin(0).setDepth(1400);

    // 收集目标元素（HUD + Game 上的独立按钮）
    var game = R.game.scene.getScene('Game');
    var hud = game && game.hud;
    this.targets = [];
    if (hud && hud.elems) {
      Object.keys(hud.elems).forEach(function (k) {
        var o = hud.elems[k];
        if (o && o.active !== false) self.targets.push({ key: k, obj: o });
      });
    }

    // 边框层
    this.boxG = this.add.graphics().setDepth(1401);
    this.labelG = this.add.container(0, 0).setDepth(1402);

    // 顶部提示条
    var tip = this.add.container(W / 2, 46).setDepth(1403);
    var tg = this.add.graphics();
    tg.fillStyle(0x1a1020, 0.92); tg.fillRoundedRect(-300, -24, 600, 48, 24);
    tip.add(tg);
    tip.add(this.add.text(0, -1, '拖动元素调整位置 · 松手自动保存', {
      fontFamily: FONT, fontSize: '20px', color: '#ffe14d'
    }).setOrigin(0.5));
    this.tip = tip;

    // 底部按钮
    this.buildBottomBtns();

    // 拖拽交互（拦截所有指针，优先级最高）
    this.input.on('pointerdown', function (p) {
      if (self.hitBtn(p)) return;
      var t = self.pick(p.x, p.y);
      if (t) {
        self.dragging = { t: t, dx: p.x - t.obj.x, dy: p.y - t.obj.y };
        self.drawBoxes(t.key);
      }
    });
    this.input.on('pointermove', function (p) {
      if (!self.dragging || !p.isDown) return;
      var d = self.dragging;
      var nx = Phaser.Math.Clamp(p.x - d.dx, 10, W - 10);
      var ny = Phaser.Math.Clamp(p.y - d.dy, 10, H - 10);
      d.t.obj.x = nx; d.t.obj.y = ny;
      // 静态对象需要刷新物理体（一般不拖这类，防御一下）
      if (d.t.obj.body && d.t.obj.body.updateFromGameObject) d.t.obj.body.updateFromGameObject();
      R.UILayout.set(d.t.key, nx, ny);
      self.drawBoxes(d.t.key);
    });
    this.input.on('pointerup', function () {
      if (self.dragging) {
        R.UILayout.save();
        self.dragging = null;
        self.drawBoxes();
      }
    });

    this.drawBoxes();
    this.time.addEvent({ delay: 120, loop: true, callback: function () { self.drawBoxes(); } });
  };

  LayoutDebug.prototype.buildBottomBtns = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    var mk = function (x, y, label, col, onTap) {
      var c = self.add.container(x, y).setDepth(1403);
      var g = self.add.graphics();
      g.fillStyle(0x000000, 0.4); g.fillRoundedRect(-92, -22, 184, 46, 23);
      g.fillStyle(col, 1);        g.fillRoundedRect(-88, -19, 176, 40, 20);
      c.add(g);
      c.add(self.add.text(0, -1, label, {
        fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#1a1210'
      }).setOrigin(0.5));
      c.setSize(184, 46);
      c.btn = true;
      c.on('pointerdown', function () { c.setScale(0.94); });
      c.on('pointerup', function () { c.setScale(1); onTap(); });
      c.on('pointerout', function () { c.setScale(1); });
      return c;
    };

    this.btnExport = mk(W * 0.17, H - 70, '导出配置', 0xffd23f, function () { self.exportCfg(); });
    this.btnReset  = mk(W * 0.5,  H - 70, '清除草稿', 0x8d6bb8, function () {
      R.UILayout.clear();
      self.scene.restart();
    }, '#fff6e2');
    this.btnExit   = mk(W * 0.83, H - 70, '完 成', 0x6cc24a, function () {
      self.scene.stop();
      var g = R.game.scene.getScene('Game');
      if (g) g.resumeGame();
    });
    // 三个按钮单独设为可交互
    [this.btnExport, this.btnReset, this.btnExit].forEach(function (b) {
      b.setInteractive({ useHandCursor: true });
    });
  };

  LayoutDebug.prototype.hitBtn = function (p) {
    return [this.btnExport, this.btnReset, this.btnExit].some(function (b) {
      return b && Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) < 60;
    });
  };

  LayoutDebug.prototype.pick = function (x, y) {
    // 从最上层往下找（depth 相近时以后注册的优先）
    var best = null, bestD = 1e9;
    this.targets.forEach(function (t) {
      var o = t.obj;
      var w = o.width || 80, h = o.height || 40;
      var half = Math.max(w, h) * 0.6 + 14;   // 命中放宽，方便手指点
      var d = Phaser.Math.Distance.Between(x, y, o.x, o.y);
      if (d < half && d < bestD) { best = t; bestD = d; }
    });
    return best;
  };

  LayoutDebug.prototype.drawBoxes = function (activeKey) {
    var self = this;
    this.boxG.clear();
    this.labelG.removeAll(true);
    if (!this.scene || !this.scene.isActive()) return;

    this.targets.forEach(function (t) {
      var o = t.obj;
      if (!o || o.active === false) return;
      var w = o.width || 80, h = o.height || 40;
      var active = t.key === (activeKey || (self.dragging && self.dragging.t.key));
      self.boxG.lineStyle(active ? 4 : 2.5, active ? 0xffe14d : 0xff9ad5, active ? 1 : 0.75);
      self.boxG.strokeRect(o.x - w / 2, o.y - h / 2, w, h);
      if (active) {
        self.boxG.fillStyle(0xffe14d, 0.10);
        self.boxG.fillRect(o.x - w / 2, o.y - h / 2, w, h);
      }
      var lbl = t.key + ' (' + Math.round(o.x) + ',' + Math.round(o.y) + ')';
      var tx = self.add.text(o.x, o.y - h / 2 - 14, lbl, {
        fontFamily: FONT, fontSize: '14px', color: '#1a1210',
        backgroundColor: active ? '#ffe14d' : '#ff9ad5', padding: { x: 4, y: 2 }
      }).setOrigin(0.5, 1).setDepth(1402);
      self.labelG.add(tx);
    });
  };

  LayoutDebug.prototype.exportCfg = function () {
    var old = document.getElementById('layout-export');
    if (old) old.remove();
    var json = JSON.stringify(R.UILayout.load(), null, 2)
      .replace(/^/, '/* 粘贴回 js/ui/layout.js 的 DEFAULTS */\nvar DEFAULTS = ');
    var box = document.createElement('div');
    box.id = 'layout-export';
    box.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(16,10,22,.95);' +
      'padding:20px;font:13px monospace;color:#d8ffd8;overflow:auto;';
    var ta = document.createElement('textarea');
    ta.value = json;
    ta.style.cssText = 'width:100%;height:60vh;background:#0d1420;color:#b8f0b8;border:1px solid #345;' +
      'font:13px monospace;padding:10px;';
    var close = document.createElement('button');
    close.textContent = '关闭';
    close.style.cssText = 'margin-top:12px;padding:10px 40px;border:0;border-radius:20px;' +
      'background:#6cc24a;color:#12300a;font-weight:bold;font-size:15px;';
    close.onclick = function () { box.remove(); };
    box.appendChild(ta);
    box.appendChild(document.createElement('br'));
    box.appendChild(close);
    document.body.appendChild(box);
    ta.select();
  };

  R.SCENES.push(LayoutDebug);
})(window.RogueGame = window.RogueGame || {});
