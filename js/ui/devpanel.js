/* =========================================================
 * ui/devpanel.js —— 开发者测试面板（仅作者可用）
 * =========================================================
 * 打开方式：地址加 ?dev=1 → 标题页右上角「测试」按钮 → 输入密码
 * 权限校验见 core/devmode.js（可改 AUTHOR_KEY 换成自己的密码）
 *
 * 功能：
 *   · 跳关：1~15 关任意直达（含终局 Boss / 指定章节 Boss）
 *   · 刷怪：任何小怪 / 精英 / Boss 一键召唤
 *   · 秒杀全场 / 无敌 / 满血 / 加钱 / 加经验 / 快速升级
 *   · 难度：敌人血量、伤害、移速倍率
 *   · 波次：立即结束当前波 / 立刻出传送门
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var FONT = R.FONT;

  /* ---------------- 密码输入（DOM，避免手机键盘麻烦） ---------------- */
  function askKey(cb) {
    var old = document.getElementById('dev-unlock');
    if (old) old.remove();
    var box = document.createElement('div');
    box.id = 'dev-unlock';
    box.style.cssText = 'position:fixed;inset:0;z-index:80;background:rgba(16,10,22,.94);' +
      'display:flex;align-items:center;justify-content:center;padding:24px;' +
      'font:15px system-ui,sans-serif;color:#fff6e2;';
    box.innerHTML =
      '<div style="max-width:340px;width:100%;text-align:center">' +
        '<div style="font-size:20px;font-weight:800;color:#ffe14d;margin-bottom:6px">🔧 测试模式</div>' +
        '<div style="opacity:.7;font-size:13px;margin-bottom:16px">仅作者可用·输入测试密码</div>' +
        '<input id="dev-key" type="password" inputmode="text" autocomplete="off" ' +
          'style="width:100%;padding:12px 14px;border-radius:12px;border:2px solid #6b5a74;' +
          'background:#241a2e;color:#fff6e2;font-size:16px;outline:none;text-align:center">' +
        '<div id="dev-err" style="height:20px;color:#ff8a80;font-size:13px;margin-top:8px"></div>' +
        '<div style="display:flex;gap:10px;margin-top:6px">' +
          '<button id="dev-cancel" style="flex:1;padding:11px;border:0;border-radius:22px;' +
            'background:#4a3a52;color:#e0d6ea;font-size:15px;font-weight:700">取消</button>' +
          '<button id="dev-ok" style="flex:1;padding:11px;border:0;border-radius:22px;' +
            'background:#6cc24a;color:#12300a;font-size:15px;font-weight:700">确定</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);
    var inp = document.getElementById('dev-key');
    setTimeout(function () { inp.focus(); }, 60);

    function submit() {
      if (R.Dev.unlock(inp.value)) {
        box.remove();
        if (cb) cb(true);
      } else {
        var e = document.getElementById('dev-err');
        if (e) e.textContent = '密码不对';
        inp.value = '';
        inp.focus();
      }
    }
    document.getElementById('dev-ok').addEventListener('click', submit);
    document.getElementById('dev-cancel').addEventListener('click', function () {
      box.remove();
      if (cb) cb(false);
    });
    inp.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submit(); });
  }

  /* ---------------- 面板按钮小工具 ---------------- */
  function btn(scene, x, y, w, h, label, color, onTap, textColor) {
    var c = scene.add.container(x, y);
    var g = scene.add.graphics();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(-w / 2 + 2, -h / 2 + 3, w, h, 10);
    g.fillStyle(0x1f1628, 1);    g.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
    g.fillStyle(color, 1);       g.fillRoundedRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4, 9);
    c.add(g);
    c.add(scene.add.text(0, 0, label, {
      fontFamily: FONT, fontSize: '19px', fontStyle: 'bold',
      color: textColor || '#1a1210'
    }).setOrigin(0.5));
    c.setSize(w, h).setInteractive({ useHandCursor: true });
    c.on('pointerdown', function () {
      c.setScale(0.94);
      R.Sfx.play('click');
      onTap();
    });
    c.on('pointerup', function () { c.setScale(1); });
    return c;
  }

  /* ---------------- 测试面板场景 ---------------- */
  function DevPanel() { Phaser.Scene.call(this, { key: 'DevPanel', active: false }); }
  DevPanel.prototype = Object.create(Phaser.Scene.prototype);
  DevPanel.prototype.constructor = DevPanel;

  DevPanel.prototype.init = function (data) {
    this.gameScene = (data && data.gameScene) || null;
    this.page = (data && data.page) || 'main';   // main | jump | spawn | tune
  };

  DevPanel.prototype.create = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    this.dim = this.add.rectangle(0, 0, W, H, 0x0d0812, 0.88).setOrigin(0).setInteractive();

    this.bgG = this.add.graphics();
    this.bgG.fillStyle(0x1b1424, 1); this.bgG.fillRoundedRect(20, 40, W - 40, H - 120, 20);
    this.bgG.lineStyle(3, 0x6b5a74, 1); this.bgG.strokeRoundedRect(20, 40, W - 40, H - 120, 20);

    this.add.text(W / 2, 78, '🔧 测试面板', {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#ffe14d',
      stroke: '#2b1d2b', strokeThickness: 8
    }).setOrigin(0.5);

    // 状态摘要
    this.statText = this.add.text(W / 2, 118, '', {
      fontFamily: FONT, fontSize: '17px', color: '#b7a6c9', align: 'center'
    }).setOrigin(0.5);

    // 内容容器（切页时清空）
    this.body = this.add.container(0, 0);
    this.renderPage();

    // 关闭
    btn(this, W / 2, H - 106, 200, 54, '关闭面板', 0x8d6bb8, function () {
      self.scene.stop('DevPanel');
      if (self.gameScene) self.gameScene.resumeGame();
    }, '#fff6e2');

    this.refreshStat();
    this.time.addEvent({ delay: 300, loop: true, callback: function () { self.refreshStat(); } });
  };

  DevPanel.prototype.refreshStat = function () {
    var g = this.gameScene;
    if (!g || !g.run) { this.statText.setText('（未在对局中）'); return; }
    var r = g.run;
    var sh = r.shield && r.shield.hp ? ' ⛨' + r.shield.hp : '';
    this.statText.setText(
      '第' + r.room + '关 · ' + (g.chapterDef ? g.chapterDef.name : '') +
      '  |  HP ' + r.hp + '/' + r.maxHp + sh +
      '  |  Lv.' + r.level + '  |  ⛃' + r.gold +
      '  |  敌 ' + (g.enemies ? g.enemies.countActive(true) : 0) +
      (g.phase === 'boss' ? '  |  BOSS' : '')
    );
  };

  DevPanel.prototype.clearBody = function () {
    this.body.removeAll(true);
  };

  DevPanel.prototype.addBody = function (obj) { this.body.add(obj); return obj; };

  DevPanel.prototype.renderPage = function () {
    this.clearBody();
    if (this.page === 'jump') return this.renderJump();
    if (this.page === 'spawn') return this.renderSpawn();
    if (this.page === 'tune') return this.renderTune();
    return this.renderMain();
  };

  /* ---------------- 主页 ---------------- */
  DevPanel.prototype.renderMain = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    var y0 = 190, rowH = 74, w = (W - 40 - 20 - 24) / 2;

    var items = [
      ['跳 关', 0x9b5de5, function () { self.page = 'jump'; self.renderPage(); }],
      ['刷 怪', 0x53b3e8, function () { self.page = 'spawn'; self.renderPage(); }],
      ['难度/数值', 0xe8a33c, function () { self.page = 'tune'; self.renderPage(); }],
      ['UI 布局调试', 0xf272b6, function () { self.openLayoutDebug(); }],
      ['秒杀全场', 0xe05555, function () { self.killAll(); }],
      ['无敌开关', 0x6cc24a, function () { self.toggleGod(); }],
      ['满血', 0x4ec27a, function () { self.healFull(); }],
      ['+1000 金币', 0xffc93c, function () { self.addGold(1000); }],
      ['+1 等级', 0x8ada67, function () { self.addLevel(); }],
      ['立即出传送门', 0xb585f0, function () { self.forcePortal(); }],
      ['清空小怪', 0x8d7a99, function () { self.clearMobs(); }]
    ];

    items.forEach(function (it, i) {
      var cx = 40 + (i % 2) * (w + 24) + w / 2 - 12;
      var cy = y0 + Math.floor(i / 2) * (rowH + 10);
      self.addBody(btn(self, cx, cy, w, rowH - 8, it[0], it[1], it[2]));
    });

    // 底部：装备全满 / 重置局内
    var by = y0 + 5 * (rowH + 10) + 10;
    this.addBody(btn(this, W * 0.28, by, (W - 120) / 2, 52, '技能全满级', 0xff9aa8,
      function () { self.maxAllWeapons(); }));
    this.addBody(btn(this, W * 0.72, by, (W - 120) / 2, 52, '重开本局', 0x6b5a74,
      function () { self.restartRun(); }, '#fff6e2'));

    this.addBody(this.add.text(W / 2, H - 158, '提示：地址加 ?dev=1&key=密码&go=15 可直接跳关', {
      fontFamily: FONT, fontSize: '15px', color: '#7a6a88'
    }).setOrigin(0.5));
  };

  /* ---------------- 跳关 ---------------- */
  DevPanel.prototype.renderJump = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    var cols = 5, w = (W - 40 - 20 - 8 * (cols - 1)) / cols;
    var startY = 200;

    this.addBody(this.add.text(W / 2, 160, '点数字直达该关（每 5 关是 Boss）', {
      fontFamily: FONT, fontSize: '17px', color: '#b7a6c9'
    }).setOrigin(0.5));

    for (var i = 1; i <= 15; i++) {
      (function (n) {
        var cx = 30 + (n - 1) % cols * (w + 8) + w / 2;
        var cy = startY + Math.floor((n - 1) / cols) * (w + 10) + w / 2;
        var isBoss = n % 5 === 0;
        var isFinal = n === 15;
        var col = isFinal ? 0xff5c8a : (isBoss ? 0xff8a80 : 0x53b3e8);
        var c = self.addBody(btn(self, cx, cy, w, w, String(n), col, function () {
          self.jumpTo(n);
        }));
        if (isFinal) c.setScale(1);
      })(i);
    }

    var by = startY + 3 * (w + 10) + 20;
    this.addBody(btn(this, W * 0.27, by, (W - 110) / 2, 54, '第1章 Boss', 0xff8a80,
      function () { self.jumpTo(5); }));
    this.addBody(btn(this, W * 0.73, by, (W - 110) / 2, 54, '终局 Boss', 0xff5c8a,
      function () { self.jumpTo(15); }));

    this.addBody(this.add.text(W / 2, H - 158, '跳关会把当前关重置为新建状态（不结算金币）', {
      fontFamily: FONT, fontSize: '15px', color: '#7a6a88'
    }).setOrigin(0.5));

    this.addBody(btn(this, W / 2, H - 196, 150, 46, '‹ 返回', 0x6b5a74, function () {
      self.page = 'main'; self.renderPage();
    }, '#fff6e2'));
  };

  /* ---------------- 刷怪 ---------------- */
  DevPanel.prototype.renderSpawn = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    var w = (W - 40 - 20 - 24) / 2;

    this.addBody(this.add.text(W / 2, 158, '召唤到玩家附近', {
      fontFamily: FONT, fontSize: '17px', color: '#b7a6c9'
    }).setOrigin(0.5));

    var list = Object.keys(R.DATA.ENEMIES);
    var y0 = 192, rowH = 62;
    list.forEach(function (k, i) {
      var def = R.DATA.ENEMIES[k];
      var cx = 40 + (i % 2) * (w + 24) + w / 2 - 12;
      var cy = y0 + Math.floor(i / 2) * (rowH + 8);
      self.addBody(btn(self, cx, cy, w, rowH - 8, def.name, 0x53b3e8, function () {
        self.spawnMob(k, false);
      }));
    });

    var by = y0 + Math.ceil(list.length / 2) * (rowH + 8) + 8;
    this.addBody(btn(this, W * 0.28, by, (W - 120) / 2, 52, '精英怪 ×1', 0xffd75e,
      function () { self.spawnMob('skull', true); }));
    this.addBody(btn(this, W * 0.72, by, (W - 120) / 2, 52, '小怪 ×10', 0x8ada67,
      function () { self.spawnBatch(10, false); }));

    var by2 = by + 62;
    this.addBody(btn(this, W * 0.28, by2, (W - 120) / 2, 52, '精英 ×5', 0xe8a33c,
      function () { self.spawnBatch(5, true); }));
    this.addBody(btn(this, W * 0.72, by2, (W - 120) / 2, 52, '召唤石头人', 0xff8a80,
      function () { self.spawnBossNow('golem'); }));

    var by3 = by2 + 62;
    this.addBody(btn(this, W * 0.28, by3, (W - 120) / 2, 52, '豌豆王', 0xff5c8a,
      function () { self.spawnBossNow('king_pea'); }));
    this.addBody(btn(this, W * 0.72, by3, (W - 120) / 2, 52, '‹ 返回', 0x6b5a74,
      function () { self.page = 'main'; self.renderPage(); }, '#fff6e2'));
  };

  /* ---------------- 难度 / 数值 ---------------- */
  DevPanel.prototype.renderTune = function () {
    var self = this, W = this.scale.width, H = this.scale.height;
    var tune = R.DATA.debugTune = R.DATA.debugTune || { hpMul: 1, dmgMul: 1, speedMul: 1 };

    this.addBody(this.add.text(W / 2, 156, '难度倍率（对当前关之后新刷的怪生效）', {
      fontFamily: FONT, fontSize: '16px', color: '#b7a6c9'
    }).setOrigin(0.5));

    var rows = [
      ['敌人血量', 'hpMul', [0.5, 1, 2, 5, 10]],
      ['敌人伤害', 'dmgMul', [0.5, 1, 2, 3]],
      ['敌人移速', 'speedMul', [0.5, 1, 1.5, 2]]
    ];
    var y = 196;
    rows.forEach(function (r) {
      self.addBody(self.add.text(46, y - 24, r[0], {
        fontFamily: FONT, fontSize: '18px', color: '#fff6e2'
      }).setOrigin(0, 0.5));
      var n = r[2].length;
      var bw = (W - 92 - 8 * (n - 1)) / n;
      r[2].forEach(function (v, i) {
        var cx = 46 + i * (bw + 8) + bw / 2;
        var on = Math.abs((tune[r[1]] || 1) - v) < 0.001;
        self.addBody(btn(self, cx, y + 22, bw, 52, '×' + v, on ? 0x6cc24a : 0x4a3a52, function () {
          tune[r[1]] = v;
          R.Sfx.play('select');
          self.page = 'tune'; self.renderPage();
        }, on ? '#12300a' : '#e0d6ea'));
      });
      y += 88;
    });

    // 玩家侧快捷
    this.addBody(this.add.text(W / 2, y + 4, '玩家', {
      fontFamily: FONT, fontSize: '18px', color: '#fff6e2'
    }).setOrigin(0.5));
    var by = y + 52;
    this.addBody(btn(this, W * 0.28, by, (W - 120) / 2, 52, '攻速 ×2', 0x8ada67, function () {
      self.gameScene.run.buffs.atkSpeed += 1; R.Sfx.play('reward');
    }));
    this.addBody(btn(this, W * 0.72, by, (W - 120) / 2, 52, '移速 ×2', 0x8ada67, function () {
      self.gameScene.run.buffs.speed += 1; R.Sfx.play('reward');
    }));

    this.addBody(btn(this, W * 0.28, by + 62, (W - 120) / 2, 52, '护盾 Lv5', 0x53b3e8, function () {
      self.gameScene.equipShield && self.gameScene.equipShield(5, self.gameScene.player.x, self.gameScene.player.y);
      R.Sfx.play('reward');
    }));
    this.addBody(btn(this, W * 0.72, by + 62, (W - 120) / 2, 52, '重置倍率', 0x6b5a74, function () {
      R.DATA.debugTune = { hpMul: 1, dmgMul: 1, speedMul: 1 };
      self.page = 'tune'; self.renderPage();
    }, '#fff6e2'));

    this.addBody(btn(this, W / 2, by + 128, 150, 46, '‹ 返回', 0x6b5a74, function () {
      self.page = 'main'; self.renderPage();
    }, '#fff6e2'));
  };

  /* ---------------- 具体动作 ---------------- */
  DevPanel.prototype.openLayoutDebug = function () {
    var g = this.gameScene;
    this.scene.stop('DevPanel');
    if (!g) return;
    // 布局调试需要游戏画面做背景，但不暂停物理也可以；先暂停防干扰
    g.pauseGame ? g.pauseGame() : null;
    // HUD 调试必须先让 HUD 元素可见（暂停时 HUD 仍在渲染，没问题）
    this.scene.launch('LayoutDebug');
  };

  DevPanel.prototype.jumpTo = function (n) {
    var g = this.gameScene;
    this.scene.stop('DevPanel');
    if (!g) return;

    // 彻底解除暂停/升级弹窗等叠加态，避免跳关后卡住
    g.paused = false;
    if (g._upgrading) {
      g._upgrading = false;
      try { var up = g.scene.get('Upgrade'); if (up && up.sys.isActive()) up.scene.stop(); } catch (e) {}
    }
    g.physics.resume();
    g.tweens.resumeAll();
    g.scene.resume();

    // 清掉当前场上的实体与波次状态，再走正常 nextRoom
    g.clearEntities && g.clearEntities();
    g.waveBreak = false;
    g.waveBreakTimer = 0;
    g.wave = 0;
    g.run.room = Math.max(0, n - 1);
    g.run.time = 0;
    g.run.roomShown = {};
    g.nextRoom();
    R.Sfx.play('reward');
  };

  DevPanel.prototype.spawnMob = function (key, elite) {
    var g = this.gameScene;
    if (!g) return;
    var p = g.player;
    var a = Math.random() * Math.PI * 2, r = 180 + Math.random() * 60;
    g.spawnEnemy(key, { elite: elite, pos: { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r } });
    R.Sfx.play('spawn');
  };

  DevPanel.prototype.spawnBatch = function (n, elite) {
    var g = this.gameScene;
    if (!g) return;
    var keys = Object.keys(R.DATA.ENEMIES);
    for (var i = 0; i < n; i++) {
      var k = keys[i % keys.length];
      var a = Math.random() * Math.PI * 2, r = 160 + Math.random() * 120;
      g.spawnEnemy(k, {
        elite: elite,
        pos: { x: g.player.x + Math.cos(a) * r, y: g.player.y + Math.sin(a) * r }
      });
    }
    R.Sfx.play('spawn');
  };

  DevPanel.prototype.spawnBossNow = function (key) {
    var g = this.gameScene;
    if (!g) return;
    if (g.boss && g.boss.active) g.killEnemySilent(g.boss);
    g.bossKey = key;
    g.spawnBoss();
    R.Sfx.play('boss');
  };

  DevPanel.prototype.killAll = function () {
    var g = this.gameScene;
    if (!g) return;
    var self = this;
    g.enemies.getChildren().slice().forEach(function (e) {
      if (e.active && !e.isBoss) g.killEnemySilent(e);
    });
    R.Sfx.play('explode');
    this.toast('已清空全场小怪');
  };

  DevPanel.prototype.clearMobs = function () {
    var g = this.gameScene;
    if (!g) return;
    g.enemies.getChildren().slice().forEach(function (e) {
      if (e.active && !e.isBoss) g.killEnemySilent(e);
    });
    this.toast('清空小怪（不结算）');
  };

  DevPanel.prototype.toggleGod = function () {
    var g = this.gameScene;
    if (!g) return;
    g.devGod = !g.devGod;
    this.toast(g.devGod ? '无敌：开' : '无敌：关');
  };

  DevPanel.prototype.healFull = function () {
    var g = this.gameScene;
    if (!g) return;
    g.run.hp = g.run.maxHp;
    g.hud.refresh(g.run);
    this.toast('血量已回满');
  };

  DevPanel.prototype.addGold = function (n) {
    var g = this.gameScene;
    if (!g) return;
    g.run.gold += n;
    if (R.Meta) R.Meta.addGold(n);
    g.hud.refresh(g.run);
    this.toast('+' + n + ' 金币');
  };

  DevPanel.prototype.addLevel = function () {
    var g = this.gameScene;
    if (!g) return;
    g.run.level += 1;
    g.run.xp = 0;
    g.run.pendingLevels = (g.run.pendingLevels || 0) + 1;
    g.hud.refresh(g.run);
    this.toast('等级 +1');
  };

  DevPanel.prototype.maxAllWeapons = function () {
    var g = this.gameScene;
    if (!g) return;
    var keys = Object.keys(R.DATA.WEAPONS);
    keys.forEach(function (k) {
      if (!g.run.hasWeapon(k) && g.run.weapons.length < 6) g.run.addWeapon(k);
    });
    g.run.weapons.forEach(function (w) { w.level = R.Run.WEAPON_MAX; });
    g.hud.refresh(g.run);
    this.toast('技能已全部满级');
  };

  DevPanel.prototype.forcePortal = function () {
    var g = this.gameScene;
    if (!g) return;
    this.scene.stop('DevPanel');
    g.paused = false;
    g.physics.resume(); g.tweens.resumeAll(); g.scene.resume();
    if (g.onRoomClear) g.onRoomClear();
    else if (g.spawnPortal) g.spawnPortal();
  };

  DevPanel.prototype.restartRun = function () {
    this.scene.stop('DevPanel');
    if (this.gameScene) {
      this.gameScene.scene.stop();
      this.gameScene.scene.start('Game');
    }
  };

  DevPanel.prototype.toast = function (msg) {
    var t = this.add.text(this.scale.width / 2, this.scale.height - 170, msg, {
      fontFamily: FONT, fontSize: '20px', color: '#ffffff', stroke: '#2b1d2b', strokeThickness: 5
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 1000,
      onComplete: function () { t.destroy(); } });
  };

  /* ---------------- 打开入口（供标题页 / 游戏内调用） ---------------- */
  DevPanel.open = function (scene, gameScene) {
    if (!R.Dev || !R.Dev.isUnlocked()) {
      askKey(function (ok) {
        if (ok) DevPanel.open(scene, gameScene);
      });
      return;
    }
    if (gameScene) {
      gameScene.pauseGame ? gameScene.pauseGame() : null;
      scene.scene.launch('DevPanel', { gameScene: gameScene });
    } else {
      scene.scene.launch('DevPanel', {});
    }
  };

  R.DevPanel = DevPanel;
  R.SCENES.push(DevPanel);
})(window.RogueGame = window.RogueGame || {});
