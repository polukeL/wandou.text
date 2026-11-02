/* =========================================================
 * scenes/Game.js —— 主战斗场景
 * 结构：
 *   create() -> startRoom() 循环 -> 清场 -> 宝箱 -> 传送门 -> 下一关
 * 所有"实体"用 Arcade 的 group + 纯数据（挂体上的属性）实现，
 * 新增武器/敌人只要在 systems/registry.js 里登记即可。
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var D = R.DATA;
  var ARENA = 1600; // 战场边长

  function Game() {
    Phaser.Scene.call(this, {
      key: 'Game',
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
      }
    });
  }
  Game.prototype = Object.create(Phaser.Scene.prototype);
  Game.prototype.constructor = Game;

  /* ---------------- 创建 ---------------- */
  Game.prototype.create = function () {
    var self = this;
    this.run = new R.Run();
    this.run.roomShown = {};
    this.phase = 'fight';
    this.paused = false;
    this.regenTimer = 0;
    this.hitStopUntil = 0;

    // ---- 世界 ----
    this.physics.world.setBounds(0, 0, ARENA, ARENA);
    this.buildArena();

    // ---- 分组 ----
    this.bulletsP = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 300, runChildUpdate: false });
    this.bulletsE = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 200, runChildUpdate: false });
    this.enemies  = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 260, runChildUpdate: false });
    this.pickups  = this.physics.add.group({ classType: Phaser.Physics.Arcade.Image, maxSize: 400, runChildUpdate: false });
    this.orbs     = [];
    this.dmgTexts = [];

    // ---- 玩家 ----
    this.player = this.physics.add.sprite(ARENA / 2, ARENA / 2, 'player');
    this.player.setDepth(20).setCircle(26, 22, 22).setCollideWorldBounds(true);
    this.player.setScale(1.0);
    this.data.set('invuln', 0);
    this.aim = new Phaser.Math.Vector2(1, 0);

    // 玩家阴影
    this.playerShadow = this.add.image(this.player.x, this.player.y + 30, 'blob_soft')
      .setTint(0x000000).setAlpha(0.22).setScale(0.5).setDepth(9);

    // 护盾光环
    this.shieldFx = this.add.graphics().setDepth(21);

    // 环绕盾
    this.orbGroup = this.add.group();

    // ---- 相机 ----
    var cam = this.cameras.main;
    cam.setBounds(0, 0, ARENA, ARENA);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setZoom(1);
    this.cameras.main.fadeIn(240, 26, 16, 32);

    // ---- 输入 ----
    this.cursors = this.input.keyboard ? this.input.keyboard.createCursorKeys() : null;
    this.keys = this.input.keyboard ? this.input.keyboard.addKeys('W,A,S,D') : null;
    this.stick = { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0, baseX: 0, baseY: 0 };
    this.buildStick();
    this.setupInput();

    // ---- HUD ----
    this.hud = new R.HUD(this);
    this.hud.refresh(this.run);

    // ---- 粒子/特效层 ----
    this.fxLayer = this.add.container(0, 0).setDepth(30);

    // ---- 开始第一关 ----
    this.time.delayedCall(260, function () { self.nextRoom(); });

    // 数据上报钩子（接后端时用）
    R.emit('run:start', { seed: this.run.seed });
  };

  /* ---------------- 战场绘制 ---------------- */
  Game.prototype.buildArena = function () {
    var ch = this.run.chapterDef();
    this.arenaG = this.add.graphics().setDepth(-10);
    this.drawArena(ch);

    // 网格/草地纹理
    this.gridTex = this.add.tileSprite(0, 0, ARENA, ARENA, 'tile').setOrigin(0).setDepth(-9)
      .setAlpha(0.5).setTint(0xffffff);

    // 边界围栏
    this.fence = this.add.graphics().setDepth(5);
    this.fence.lineStyle(14, 0x2b1d2b, 1);
    this.fence.strokeRect(8, 8, ARENA - 16, ARENA - 16);
    this.fence.lineStyle(8, 0xf3e3c3, 1);
    this.fence.strokeRect(14, 14, ARENA - 28, ARENA - 28);
  };

  Game.prototype.drawArena = function (ch) {
    var g = this.arenaG;
    g.clear();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(ch.floor[0]).color, 1);
    g.fillRect(0, 0, ARENA, ARENA);
    // 大色斑
    g.fillStyle(Phaser.Display.Color.HexStringToColor(ch.floor[1]).color, 1);
    for (var i = 0; i < 26; i++) {
      var x = ((i * 353) % ARENA), y = ((i * 977) % ARENA);
      g.fillCircle(x, y, 90 + (i % 5) * 30);
    }
  };

  /* ---------------- 虚拟摇杆 ---------------- */
  Game.prototype.buildStick = function () {
    this.stickBase = this.add.circle(0, 0, 74, 0xffffff, 0.16).setDepth(900)
      .setStrokeStyle(5, 0xffffff, 0.5).setVisible(false);
    this.stickKnob = this.add.circle(0, 0, 34, 0xffffff, 0.55).setDepth(901).setVisible(false);
  };

  Game.prototype.setupInput = function () {
    var self = this;
    var cam = this.cameras.main;

    this.input.on('pointerdown', function (p) {
      if (self.paused) return;
      R.Sfx.unlock();
      if (self.stick.active) return;
      self.stick.active = true;
      self.stick.id = p.id;
      // 摇杆固定在按下的位置（手机更好用），且不超出相机边界
      self.stick.baseX = p.x; self.stick.baseY = p.y;
      self.stick.ox = p.x; self.stick.oy = p.y;
      self.stickBase.setPosition(p.x, p.y).setVisible(true);
      self.stickKnob.setPosition(p.x, p.y).setVisible(true);
    });

    this.input.on('pointermove', function (p) {
      if (!self.stick.active || p.id !== self.stick.id) return;
      var dx = p.x - self.stick.ox, dy = p.y - self.stick.oy;
      var len = Math.sqrt(dx * dx + dy * dy);
      var max = 70;
      if (len > max) {
        // 拖动过远时摇杆跟随，避免手指越界
        self.stick.ox += dx * (1 - max / len);
        self.stick.oy += dy * (1 - max / len);
        dx = p.x - self.stick.ox; dy = p.y - self.stick.oy;
        len = max;
        self.stickBase.setPosition(self.stick.ox, self.stick.oy);
      }
      self.stick.x = dx / max;
      self.stick.y = dy / max;
      self.stickKnob.setPosition(self.stick.ox + dx, self.stick.oy + dy);
    });

    var endHandler = function (p) {
      if (!self.stick.active || p.id !== self.stick.id) return;
      self.stick.active = false;
      self.stick.x = 0; self.stick.y = 0;
      self.stickBase.setVisible(false);
      self.stickKnob.setVisible(false);
    };
    this.input.on('pointerup', endHandler);
    this.input.on('pointerupoutside', endHandler);
    this.input.on('gameout', function () { endHandler({ id: self.stick.id }); });
  };

  /* ---------------- 关卡流程 ---------------- */
  Game.prototype.nextRoom = function () {
    var run = this.run;
    run.room += 1;
    var chIdx = Math.floor((run.room - 1) / 5) % D.CHAPTERS.length;
    run.chapter = chIdx + 1;
    var inChapter = ((run.room - 1) % 5) + 1;

    // 难度刻度：每 5 关一个 Boss
    var roomInCh = inChapter;
    this.isBossRoom = (roomInCh === 5);
    this.roomIndexInChapter = roomInCh;

    var ch = D.CHAPTERS[chIdx];
    this.chapterDef = ch;
    this.drawArena(ch);
    this.gridTex.setTint(ch.id === 1 ? 0xffffff : 0xf0d7b8);

    // 重置容器
    this.clearEntities();
    this.phase = 'fight';
    this.roomTimer = 0;
    this.spawnTimer = 0;
    this.aliveThisRoom = 0;
    this.spawnedThisRoom = 0;
    this.killedThisRoom = 0;
    this.waveBreak = false;
    this.waveBreakTimer = 0;
    this.wave = 0;

    // 玩家归位
    this.player.setPosition(ARENA / 2, ARENA / 2);
    this.player.setAlpha(1);
    this.data.set('invuln', 0.8);

    var self = this;
    var label = '第 ' + run.room + ' 关 · ' + ch.name;
    run.roomShown = { label: this.isBossRoom ? '⚠ BOSS 关卡' : label };

    if (this.isBossRoom) {
      this.hud.showBanner('BOSS !', ch.sub + '  ·  ' + D.BOSSES[ch.boss].name, '#ff8a80');
      R.Sfx.play('boss');
      this.time.delayedCall(900, function () { self.spawnBoss(); });
      // 兜底：1 秒内没刷出 Boss（例如出场被打断）就重试，避免空场卡关
      this.time.delayedCall(1400, function () {
        if (self.isBossRoom && self.phase === 'fight' && (!self.boss || !self.boss.active)) self.spawnBoss();
      });
    } else {
      // ---- 波次制：每关分 3 波，难度逐波上升，打完最后一波出传送门 ----
      this.waveTotal = 3;
      this.waveShare = [0.25, 0.35, 0.40];
      this.waveBaseTarget = 8 + run.room * 3;
      this.waveBaseInterval = D.scaling.spawnInterval(run.room);
      this.startWave(0, true);
    }
    this.hud.refresh(run);
  };

  /* 开启某波：重置本波刷怪/击杀计数，逐波提高难度 */
  Game.prototype.startWave = function (i, silent) {
    var run = this.run;
    this.wave = i;
    this.waveTarget = Math.max(4, Math.ceil(this.waveBaseTarget * this.waveShare[i]));
    this.waveInterval = this.waveBaseInterval * Math.pow(0.88, i);   // 刷得越来越快
    this.spawnPerTick = D.scaling.spawnCount(run.room) + Math.floor(i / 2);
    this.eliteChance = this.chapterDef.eliteChance * (1 + i * 0.6);  // 精英越来越多
    this.killedThisRoom = 0;
    this.spawnedThisRoom = 0;
    this.waveBreak = false;
    this.waveBreakTimer = 0;

    run.roomShown = { label: '第 ' + run.room + ' 关 · 第 ' + (i + 1) + '/' + this.waveTotal + ' 波' };
    if (!silent && !this.isBossRoom) {
      this.hud.showBanner('第 ' + (i + 1) + ' 波', i >= this.waveTotal - 1 ? '最后一波，撑住！' : '敌人变多了', '#ffd7a8');
      R.Sfx.play('level', 100);
    }
    this.hud.refresh(run);
  };

  Game.prototype.clearEntities = function () {
    var self = this;
    [this.bulletsP, this.bulletsE, this.enemies, this.pickups].forEach(function (g) {
      g.getChildren().slice().forEach(function (o) { self.resetObj(o, g); o.destroy(); });
    });
    this.orbs.forEach(function (o) { o.destroy(); });
    this.orbs = [];
    this.dmgTexts.forEach(function (t) { if (t && t.active) t.destroy(); });
    this.dmgTexts = [];
    this.boss = null;
    // 【修复】传送门对象本身也要销毁，否则下一关仍漂浮在场地上
    if (this.portal) { this.portal.destroy(); this.portal = null; }
    this.portalActive = false;
    this.chest = null;
    this.spawnedThisRoom = 0;
    // 清掉残留宝箱（含其碰撞器），避免跨关重复触发
    (this.chestList || []).forEach(function (c) {
      if (c && c.active) {
        if (c.collider) { self.physics.world.removeCollider(c.collider); c.collider = null; }
        c.destroy();
      }
    });
    this.chestList = [];
    // Boss 血条 & 存档点直接清掉，避免跨关残留
    if (this.bossBarBg) { this.bossBarBg.destroy(); this.bossBarBg = null; }
    if (this.bossBar) { this.bossBar.destroy(); this.bossBar = null; }
    if (this.bossName) { this.bossName.destroy(); this.bossName = null; }
  };

  /* ---------------- 刷新对象（对象池） ---------------- */
  Game.prototype.spawnImage = function (group, key, x, y) {
    var img = group.getFirstDead && group.getFirstDead(false);
    if (img) img.setActive(true).setVisible(true);
    else img = group.create(x, y, key);
    img.setTexture(key);
    img.setPosition(x, y);
    img.setActive(true).setVisible(true);
    img.setAlpha(1);
    img.setAngle(0);
    if (img.body) { img.body.enable = true; img.body.reset(x, y); }
    img.speedMul = 1;
    img.rotSpeed = 0;
    return img;
  };

  Game.prototype.resetObj = function (o, group) {
    o.setActive(false).setVisible(false);
    if (o.body) { o.body.stop(); o.body.enable = false; }
    if (group) group.remove(o, false, false);
  };

  /* ---------------- 玩家更新 ---------------- */
  Game.prototype.updatePlayer = function (dt) {
    var run = this.run;
    var vx = 0, vy = 0;

    if (this.stick.active) { vx = this.stick.x; vy = this.stick.y; }

    if (this.cursors) {
      var kx = 0, ky = 0;
      if (this.cursors.left.isDown || (this.keys && this.keys.A.isDown)) kx -= 1;
      if (this.cursors.right.isDown || (this.keys && this.keys.D.isDown)) kx += 1;
      if (this.cursors.up.isDown || (this.keys && this.keys.W.isDown)) ky -= 1;
      if (this.cursors.down.isDown || (this.keys && this.keys.S.isDown)) ky += 1;
      if (kx || ky) { vx = kx; vy = ky; }
    }

    var len = Math.sqrt(vx * vx + vy * vy);
    if (len > 1) { vx /= len; vy /= len; }

    var baseSpeed = 300 * run.speedMul();
    this.player.setVelocity(vx * baseSpeed, vy * baseSpeed);

    // 护盾光环（剩余格数越多越亮）
    if (this.shieldFx) {
      this.shieldFx.clear();
      var sh = run.shield;
      if (sh && sh.hp > 0) {
        var alpha = 0.25 + 0.5 * (sh.hp / Math.max(1, sh.level));
        this.shieldFx.lineStyle(3.5, 0x53d7ff, alpha);
        this.shieldFx.strokeCircle(this.player.x, this.player.y, 36 + Math.sin(this.time.now / 200) * 2);
        this.shieldFx.lineStyle(1.5, 0xffffff, alpha * 0.6);
        this.shieldFx.strokeCircle(this.player.x, this.player.y, 41);
      }
    }

    // 朝向（原地不动时保持上次朝向）
    if (len > 0.12) this.player.setFlipX(vx < -0.05);

    // 呼吸 + 走路弹跳
    var moving = len > 0.12;
    var t = this.time.now / 1000;
    var sq = Math.sin(t * (moving ? 18 : 4.5)) * (moving ? 0.045 : 0.022);
    this.player.setScale(1, 1 + sq);

    this.playerShadow.setPosition(this.player.x, this.player.y + 30);
    this.playerShadow.setScale(0.5 + sq * 3);

    // 无敌闪烁
    var inv = this.data.get('invuln') || 0;
    if (inv > 0) {
      this.data.set('invuln', Math.max(0, inv - dt));
      this.player.setAlpha(0.45 + Math.abs(Math.sin(this.time.now / 60)) * 0.55);
    } else {
      this.player.setAlpha(1);
    }

    // 朝向最近敌人（用于瞄准）
    var target = this.nearestEnemy(this.player.x, this.player.y, 99999);
    if (target) {
      this.aim.set(target.x - this.player.x, target.y - this.player.y).normalize();
    } else if (len > 0.12) {
      this.aim.set(vx, vy).normalize();
    }

    // 回血
    if (run.buffs.regen > 0) {
      this.regenTimer += dt;
      if (this.regenTimer >= 10) {
        this.regenTimer = 0;
        if (run.heal(run.buffs.regen) > 0) {
          R.Sfx.play('heal');
          this.popText(this.player.x, this.player.y - 44, '+HP', '#4ee07a');
        }
      }
    }
  };

  /* ---------------- 射击 ---------------- */
  Game.prototype.updateWeapons = function (dt) {
    var run = this.run;
    var self = this;
    this.wTimers = this.wTimers || {};
    this.orbState = this.orbState || { a: 0 };

    run.weapons.forEach(function (w) {
      var st = run.weaponStats(w.key);
      if (st.orbit) {
        // 环绕类单独处理
        return;
      }
      self.wTimers[w.key] = (self.wTimers[w.key] || 0) - dt;
      if (self.wTimers[w.key] <= 0) {
        self.wTimers[w.key] = st.cd;
        self.fireWeapon(w.key, st);
      }
    });

    // 环绕武器
    var shieldW = run.weapons.filter(function (w) { return w.key === 'shield'; })[0];
    var count = shieldW ? run.weaponStats('shield').count : 0;
    var need = count;
    var st2 = shieldW ? run.weaponStats('shield') : null;

    // 同步球体数量
    while (this.orbs.length > need) { var o = this.orbs.pop(); o.destroy(); }
    while (this.orbs.length < need) {
      var orb = this.add.image(this.player.x, this.player.y, 'bullet_pea')
        .setScale((st2 ? st2.radius : 15) / 9 * 1.5).setTint(0x53b7ff).setDepth(19);
      orb.gfx = this.add.graphics().setDepth(18);
      orb.hitCd = 0;
      this.orbs.push(orb);
    }
    if (need > 0) {
      this.orbState.a += dt * st2.orbit.speed;
      var R0 = st2.orbit.radius;
      for (var i = 0; i < this.orbs.length; i++) {
        var ang = this.orbState.a + (i * Math.PI * 2) / this.orbs.length;
        var ox = this.player.x + Math.cos(ang) * R0;
        var oy = this.player.y + Math.sin(ang) * R0 * 0.78;
        var orb = this.orbs[i];
        orb.setPosition(ox, oy);
        orb.rotSpeed = 6;
        orb.angle += 6;
        orb.hitCd -= dt;
        if (orb.hitCd <= 0) {
          var victims = this.enemies.getChildren().filter(function (e) {
            if (!e.active) return false;
            var d = Phaser.Math.Distance.Between(e.x, e.y, ox, oy);
            return d < 30 + (e.hitR || 20);
          });
          if (victims.length) {
            orb.hitCd = st2.orbit.hitCd;
            victims.forEach(function (e) {
              self.damageEnemy(e, st2.dmg, {
                knock: 200, fromX: this.player.x, fromY: this.player.y, color: 0x53b7ff, crit: self.rollCrit()
              });
            }, this);
          }
        }
      }
    }
  };

  Game.prototype.rollCrit = function () {
    return Math.random() < this.run.buffs.crit;
  };

  Game.prototype.fireWeapon = function (key, st) {
    var p = this.player;
    var baseAng = Math.atan2(this.aim.y, this.aim.x);
    var n = Math.max(1, st.count);
    var spread = st.spread || 0;
    var offsetX = Math.cos(baseAng) * 34, offsetY = Math.sin(baseAng) * 34;

    for (var i = 0; i < n; i++) {
      // 扇形展开：n=1 打正中，n>1 左右均分
      var t = n === 1 ? 0 : (i / (n - 1) - 0.5);
      var ang = baseAng + t * spread * Math.max(1, n - 1);
      if (n === 1) ang += (Math.random() - 0.5) * 0.02;
      var speed = st.speed;
      var b = this.spawnImage(this.bulletsP, key === 'shot' ? 'bullet_pea' : (key === 'ball' ? 'bullet_seed' : 'bullet_pea'),
        p.x + offsetX, p.y + offsetY);

      var tint = { pea: 0xffffff, shot: 0xffc46b, boomer: 0xffd23f, ball: 0xff7a3d, bubble: 0x8fe3ff }[key] || 0xffffff;
      b.setTint(tint).setScale(st.radius / 9);
      if (key === 'ball') b.setScale(st.radius / 9 * 1.2);
      b.setDepth(15);
      b.body.setCircle(11, 2, 2);
      b.body.setAllowGravity(false);

      var isBoomer = !!st.boomerang;
      b.body.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
      b.wkey = key;
      b.uid = Game._uid = (Game._uid || 0) + 1;
      b.dmg = st.dmg;
      b.pierceLeft = st.pierce;
      b.hitSet = {};
      b.life = st.life;
      b.maxLife = st.life;
      b.knock = st.knock;
      b.boomer = isBoomer;
      b.explode = st.explode;
      b.homing = st.homing;
      b.baseSpeed = speed;
      b.rotSpeed = key === 'ball' ? 8 : (key === 'boomer' ? 18 : 0);
      b.spawnX = p.x; b.spawnY = p.y;
      b.setAngle(Phaser.Math.RadToDeg(ang));
    }
    R.Sfx.play(st.sfx, 60);
  };

  /* ---------------- 子弹更新 ---------------- */
  Game.prototype.updateBullets = function (dt) {
    var self = this;
    this.bulletsP.getChildren().forEach(function (b) {
      if (!b.active) return;
      b.life -= dt;
      if (b.life <= 0) {
        if (b.explode) self.explode(b.x, b.y, b.explode, b.dmg);
        self.killBullet(b);
        return;
      }
      if (b.rotSpeed) b.angle += b.rotSpeed * dt * 60;

      // 回旋镖：飞到一半返航
      if (b.boomer) {
        var age = b.maxLife - b.life;
        if (age > b.maxLife * 0.45) {
          var dx = self.player.x - b.x, dy = self.player.y - b.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          b.body.setVelocity(dx / d * b.baseSpeed * 1.25, dy / d * b.baseSpeed * 1.25);
          if (d < 40) { self.killBullet(b); return; }
        }
      }

      // 追踪
      if (b.homing) {
        var tgt = self.nearestEnemy(b.x, b.y, 520);
        if (tgt) {
          var ax = tgt.x - b.x, ay = tgt.y - b.y;
          var al = Math.sqrt(ax * ax + ay * ay) || 1;
          var v = b.body.velocity;
          var dvx = (ax / al) * b.baseSpeed - v.x;
          var dvy = (ay / al) * b.baseSpeed - v.y;
          var vl = Math.sqrt(dvx * dvx + dvy * dvy) || 1;
          var accel = b.homing * 60;
          v.x += (dvx / vl) * accel;
          v.y += (dvy / vl) * accel;
          var sp = Math.sqrt(v.x * v.x + v.y * v.y) || 1;
          if (sp > b.baseSpeed * 1.5) { v.x = v.x / sp * b.baseSpeed * 1.5; v.y = v.y / sp * b.baseSpeed * 1.5; }
          b.angle = Phaser.Math.RadToDeg(Math.atan2(v.y, v.x));
        }
      }

      // ---- 子弹 vs 敌人命中判定 ----
      var hitAny = false;
      var eList = self.enemies.getChildren();
      for (var ei = 0; ei < eList.length; ei++) {
        var e = eList[ei];
        if (!e.active || e.dead) continue;
        if (b.hitSet[e.uid]) continue;
        var rr = 11 * (b.scale || 1) + (e.hitR || 18);
        var bdx = b.x - e.x, bdy = b.y - e.y;
        if (bdx * bdx + bdy * bdy > rr * rr) continue;

        // 命中！
        var crit = self.rollCrit();
        self.damageEnemy(e, b.dmg, {
          knock: b.knock, fromX: b.x - bdx, fromY: b.y - bdy,
          color: 0xffffff, crit: crit
        });
        b.hitSet[e.uid] = true;
        hitAny = true;

        if (b.explode) {
          self.explode(b.x, b.y, b.explode, b.dmg);
          self.killBullet(b);
          return;
        }

        // 弹射：跳向附近另一个敌人
        if (self.run.buffs.bounce) {
          var next = null, nd = 260;
          for (var ej = 0; ej < eList.length; ej++) {
            var e2 = eList[ej];
            if (!e2.active || e2 === e || b.hitSet[e2.uid]) continue;
            var d2 = Phaser.Math.Distance.Between(b.x, b.y, e2.x, e2.y);
            if (d2 < nd) { nd = d2; next = e2; }
          }
          if (next) {
            var na = Math.atan2(next.y - b.y, next.x - b.x);
            b.body.setVelocity(Math.cos(na) * b.baseSpeed, Math.sin(na) * b.baseSpeed);
            b.life = Math.max(b.life, 0.6);
            break; // 本帧处理完毕
          }
        }

        if (b.pierceLeft > 0) {
          b.pierceLeft--;
          continue;
        }
        self.killBullet(b);
        return;
      }
      if (hitAny && !b.active) return;

      // 越界销毁
      if (b.x < -40 || b.y < -40 || b.x > ARENA + 40 || b.y > ARENA + 40) self.killBullet(b);
    });
  };

  Game.prototype.killBullet = function (b) {
    this.resetObj(b, this.bulletsP);
  };

  /* ---------------- 敌人 ---------------- */
  Game.prototype.spawnEnemy = function (type, opts) {
    opts = opts || {};
    var def = D.ENEMIES[type];
    if (!def) return null;
    var run = this.run;
    var pos = opts.pos || this.ringPosition();

    var elite = !!opts.elite;
    var img = this.spawnImage(this.enemies, def.art, pos.x, pos.y);
    img.setDepth(16);
    img.body.setAllowGravity(false);
    img.setScale(1).setAlpha(1);

    var hpMul = D.scaling.enemyHp(run.room, run.chapter);
    var scaleMul = 1;
    if (elite) { hpMul *= D.ELITE.hp; scaleMul = D.ELITE.size; }

    img.etype = type;
    img.def = def;
    img.maxHp = Math.round(def.hp * hpMul);
    img.hp = img.maxHp;
    img.dmg = Math.max(1, Math.round(def.dmg * D.scaling.enemyDmg(run.room, run.chapter)));
    img.xp = def.xp * (elite ? D.ELITE.xp : 1);
    img.gold = def.gold * (elite ? D.ELITE.gold : 1);
    img.speed = def.speed;
    img.size = def.size * scaleMul;
    img.hitR = def.size * 0.45 * scaleMul;
    img.elite = elite;
    img.aiState = 'idle';
    img.aiTimer = 0;
    img.hurtT = 0;
    img.shootCd = (def.shootCd || 2) * (0.6 + Math.random() * 0.7);
    img.stun = 0;
    img.flip = false;
    img.uid = Game._uid = (Game._uid || 0) + 1;
    img.setTint(elite ? 0xffd75e : 0xffffff);

    var baseScale = (def.size / 64) * scaleMul;
    img.baseScale = baseScale;
    img.setScale(baseScale);

    // 圆形碰撞
    var bw = img.width, bh = img.height;
    img.body.setCircle(img.hitR, bw / 2 - img.hitR, bh / 2 - img.hitR);

    // 阴影
    img.shadow = this.add.image(img.x, img.y + img.hitR * 0.8, 'blob_soft')
      .setTint(0x000000).setAlpha(0.2).setDepth(8).setScale(baseScale * 0.7);

    this.aliveThisRoom = (this.aliveThisRoom || 0) + 1;
    return img;
  };

  Game.prototype.ringPosition = function () {
    // 在镜头视野外侧一圈生成，避免"脸上刷怪"
    var cam = this.cameras.main;
    var vw = cam.width / cam.zoom, vh = cam.height / cam.zoom;
    var cx = this.player.x, cy = this.player.y;
    for (var i = 0; i < 12; i++) {
      var ang = Math.random() * Math.PI * 2;
      var rx = (vw / 2 + 80 + Math.random() * 160);
      var ry = (vh / 2 + 80 + Math.random() * 160);
      var x = Phaser.Math.Clamp(cx + Math.cos(ang) * rx, 60, ARENA - 60);
      var y = Phaser.Math.Clamp(cy + Math.sin(ang) * ry, 60, ARENA - 60);
      // 确保离玩家不太近
      if (Phaser.Math.Distance.Between(x, y, cx, cy) > Math.min(vw, vh) * 0.5) return { x: x, y: y };
    }
    return { x: 100, y: 100 };
  };

  Game.prototype.updateEnemies = function (dt) {
    var self = this;
    var p = this.player;

    this.enemies.getChildren().forEach(function (e) {
      if (!e.active) return;
      var def = e.def;

      // 受击闪白
      if (e.hurtT > 0) {
        e.hurtT -= dt;
        if (e.hurtT <= 0) e.setTint(e.elite ? 0xffd75e : 0xffffff);
      }

      // Boss 走专用 AI
      if (e.isBoss) { return; }

      var dx = p.x - e.x, dy = p.y - e.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // 浮动感
      var bob = Math.sin(self.time.now / 220 + e.x * 0.01) * (def.float ? 10 : 0);

      // 击退/硬直
      var v = e.body.velocity;

      if (e.stun > 0) {
        e.stun -= dt;
        v.x *= 0.9; v.y *= 0.9;
      } else if (e.aiState === 'windup') {
        // 冲锋前摇：停住抖动
        v.x *= 0.82; v.y *= 0.82;
        e.aiTimer -= dt;
        e.x += Math.sin(self.time.now / 30) * 0.9;
        if (e.aiTimer <= 0) {
          e.aiState = 'dash';
          e.aiTimer = 0.42;
          e.dashX = dx / dist; e.dashY = dy / dist;
          R.Sfx.play('dash', 120);
        }
      } else if (e.aiState === 'dash') {
        e.aiTimer -= dt;
        v.x = e.dashX * (def.dash || 500);
        v.y = e.dashY * (def.dash || 500);
        if (e.aiTimer <= 0) { e.aiState = 'idle'; e.aiTimer = 1.2 + Math.random(); }
      } else {
        // 常规追击
        var sp = e.speed;
        if (def.kind === 'spitter') {
          // 保持距离
          if (dist > def.range) { v.x = dx / dist * sp; v.y = dy / dist * sp; }
          else if (dist < def.range * 0.55) { v.x = -dx / dist * sp * 0.9; v.y = -dy / dist * sp * 0.9; }
          else { v.x *= 0.85; v.y *= 0.85;
            var perp = Math.atan2(dy, dx) + Math.PI / 2;
            v.x += Math.cos(perp) * sp * 0.5; v.y += Math.sin(perp) * sp * 0.5;
          }
          e.shootCd -= dt;
          if (e.shootCd <= 0 && dist < def.range * 1.15) {
            e.shootCd = def.shootCd * (0.8 + Math.random() * 0.5);
            self.enemyShoot(e);
          }
        } else if (def.kind === 'charger') {
          if (dist < 380 && e.aiTimer <= 0) {
            e.aiState = 'windup'; e.aiTimer = def.windup;
            self.tweens.add({ targets: e, scaleX: e.baseScale * 1.18, scaleY: e.baseScale * 0.85, duration: 120, yoyo: true, repeat: 2 });
          } else {
            e.aiTimer -= dt;
            v.x = dx / dist * sp; v.y = dy / dist * sp;
          }
        } else {
          v.x = dx / dist * sp; v.y = dy / dist * sp;
        }
      }

      e.body.setVelocity(v.x, v.y);

      // 朝向
      if (Math.abs(v.x) > 8) {
        var f = v.x < 0;
        if (f !== e.flip) { e.flip = f; e.setFlipX(f); }
      }
      // 抖动/挤压
      var squash = def.squash ? 1 + Math.sin(self.time.now / 160 + e.x) * 0.06 : 1;
      e.setScale(e.baseScale, e.baseScale * squash);

      // 阴影
      if (e.shadow) e.shadow.setPosition(e.x, e.y + e.hitR * 0.75);

      // 越界钳制
      if (e.x < 40) e.x = 40;
      if (e.y < 40) e.y = 40;
      if (e.x > ARENA - 40) e.x = ARENA - 40;
      if (e.y > ARENA - 40) e.y = ARENA - 40;
    });
  };

  Game.prototype.enemyShoot = function (e) {
    var p = this.player;
    var ang = Math.atan2(p.y - e.y, p.x - e.x);
    var b = this.spawnImage(this.bulletsE, 'bullet_seed', e.x, e.y);
    b.setDepth(15).setScale(1).setTint(0xff9a5c);
    b.body.setAllowGravity(false);
    b.body.setCircle(9, 4, 4);
    var sp = e.def.bullet.speed;
    b.body.setVelocity(Math.cos(ang) * sp, Math.sin(ang) * sp);
    b.dmg = e.elite ? 2 : 1;   // 伤害规则：小怪子弹 1 格，精英子弹 2 格
    b.life = 3.2;
    R.Sfx.play('shot', 150);
  };

  Game.prototype.updateEnemyBullets = function (dt) {
    var self = this;
    var p = this.player;
    this.bulletsE.getChildren().forEach(function (b) {
      if (!b.active) return;
      b.life -= dt;
      b.angle += 4;
      if (b.life <= 0) { self.resetObj(b, self.bulletsE); return; }
      var d = Phaser.Math.Distance.Between(b.x, b.y, p.x, p.y);
      if (d < 30) {
        self.hurtPlayer(b.dmg);
        self.resetObj(b, self.bulletsE);
        return;
      }
      if (b.x < -40 || b.y < -40 || b.x > ARENA + 40 || b.y > ARENA + 40) self.resetObj(b, self.bulletsE);
    });
  };

  /* ---------------- 伤害 ---------------- */
  Game.prototype.damageEnemy = function (e, dmg, opts) {
    if (!e.active || e.dead) return;
    opts = opts || {};
    var finalDmg = dmg * (opts.crit ? 2 : 1);
    e.hp -= finalDmg;
    e.hurtT = 0.09;
    e.setTint(0xffffff);

    // 击退
    if (opts.knock) {
      var dx = e.x - (opts.fromX !== undefined ? opts.fromX : this.player.x);
      var dy = e.y - (opts.fromY !== undefined ? opts.fromY : this.player.y);
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      e.body.velocity.x += dx / l * opts.knock;
      e.body.velocity.y += dy / l * opts.knock;
    }

    this.popText(e.x + (Math.random() - 0.5) * 16, e.y - e.hitR - 6,
      Math.round(finalDmg) + '', opts.crit ? '#ffe14d' : '#ffffff', opts.crit ? 26 : 20);
    this.spark(e.x, e.y, opts.color || 0xffffff);

    if (finalDmg >= 0) R.Sfx.play('hit', 70);

    if (this.run.buffs.vamp && opts.crit) {
      if (this.run.heal(1) > 0) this.popText(this.player.x, this.player.y - 50, '+1', '#4ee07a');
    }

    if (e.hp <= 0) this.killEnemy(e);
  };

  Game.prototype.killEnemy = function (e) {
    if (e.dead) return;
    e.dead = true;
    var run = this.run;
    run.kills++;
    this.killedThisRoom = (this.killedThisRoom || 0) + 1;
    R.Sfx.play('kill', 80);

    // 碎片
    this.burst(e.x, e.y, e.elite ? 0xffd75e : 0xffffff, e.elite ? 14 : 8);

    // 掉经验
    var n = Math.min(4, 1 + Math.floor(e.xp / 4));
    for (var i = 0; i < n; i++) {
      var ang = Math.random() * Math.PI * 2, r = Math.random() * 26;
      this.dropPickup('pickup_gem', e.x + Math.cos(ang) * r, e.y + Math.sin(ang) * r, { xp: Math.ceil(e.xp / n) });
    }
    // 金币
    if (Math.random() < (e.elite ? 1 : 0.35)) {
      this.dropPickup('pickup_coin', e.x, e.y, { gold: e.gold });
    }
    // 红心
    if (Math.random() < (e.elite ? 0.35 : 0.022)) {
      this.dropPickup('pickup_heart', e.x, e.y, { heal: 1 });
    }

    // 特殊掉落：护盾（精英 20% / 小怪 2%）、血量上限（精英 10% / 小怪 1.2%）
    if (!e.isBoss) {
      var tier = Math.max(1, Math.min(5, 1 + Math.floor(run.room / 3) + (Math.random() < 0.4 ? 1 : 0)));
      if (Math.random() < (e.elite ? 0.20 : 0.02)) {
        this.dropPickup('pickup_shield', e.x + 14, e.y, { shield: e.elite ? Math.min(5, tier + 1) : tier });
      } else if (Math.random() < (e.elite ? 0.10 : 0.012)) {
        this.dropPickup('pickup_maxhp', e.x - 14, e.y, { maxhp: 1 });
      }
    }

    // 精英怪必掉宝箱（当场掉落，碰到即开）
    if (e.elite) {
      this.popText(e.x, e.y - e.hitR - 30, '精英宝箱！', '#ffd75e', 22);
      this.spawnChest(e.x, e.y);
    }

    if (e.isBoss) {
      this.onBossKilled(e);
      return;
    }

    if (e.shadow) e.shadow.destroy();
    this.resetObj(e, this.enemies);

    if (this.phase === 'fight') this.checkRoomClear();
  };

  /* Boss 死亡：大爆炸 + 清场 + 掉一堆宝 + 收掉血条 + 走通关流程 */
  Game.prototype.onBossKilled = function (e) {
    var self = this;
    this.boss = null;
    e.dead = true;
    this.explode(e.x, e.y, { r: 220, dmg: 0 }, 0);
    this.burst(e.x, e.y, 0xffd23f, 30);
    this.cameras.main.shake(420, 0.022);
    this.cameras.main.flash(260, 255, 220, 140);
    R.Sfx.play('explode');
    this.time.delayedCall(120, function () { R.Sfx.play('boss', 200); });

    // 掉落：金币 + 红心
    for (var i = 0; i < 8; i++) {
      var a = Math.random() * Math.PI * 2, r = 40 + Math.random() * 90;
      this.dropPickup('pickup_coin', e.x + Math.cos(a) * r, e.y + Math.sin(a) * r, { gold: Math.ceil(e.gold / 8) });
    }
    for (var k = 0; k < 2; k++) {
      var a2 = Math.random() * Math.PI * 2;
      this.dropPickup('pickup_heart', e.x + Math.cos(a2) * 70, e.y + Math.sin(a2) * 70, { heal: 1 });
    }

    if (e.shadow) e.shadow.destroy();
    this.resetObj(e, this.enemies);

    // 收掉 Boss 血条
    if (this.bossBarBg) { this.bossBarBg.destroy(); this.bossBarBg = null; }
    if (this.bossBar) { this.bossBar.destroy(); this.bossBar = null; }
    if (this.bossName) { this.bossName.destroy(); this.bossName = null; }

    // 场上小怪一起清掉
    this.enemies.getChildren().slice().forEach(function (m) {
      if (m.active && !m.isBoss) self.killEnemySilent(m);
    });

    this.time.delayedCall(600, function () {
      if (self.phase === 'upgrade') return;
      self.onBossClear();
    });
  };

  Game.prototype.onBossClear = function () {
    var self = this;
    if (this.phase === 'clear') return;
    this.phase = 'clear';
    this.run.roomShown = { label: 'BOSS 击破！' };
    this.hud.showBanner('BOSS 击破 !', '战利品掉了一地', '#ffe14d');
    R.Sfx.play('reward');
    this.time.delayedCall(700, function () {
      for (var i = 0; i < 2; i++) {
        var ang = Math.random() * Math.PI * 2;
        var x = Phaser.Math.Clamp(self.player.x + Math.cos(ang) * 150, 120, ARENA - 120);
        var y = Phaser.Math.Clamp(self.player.y + Math.sin(ang) * 150, 120, ARENA - 120);
        self.spawnChest(x, y);
      }
      self.spawnPortal();
    });
  };

  Game.prototype.killEnemySilent = function (e) {
    if (e.shadow) e.shadow.destroy();
    this.resetObj(e, this.enemies);
  };

  /* ---------------- 掉落 ---------------- */
  Game.prototype.dropPickup = function (key, x, y, data) {
    var img = this.spawnImage(this.pickups, key, x, y);
    img.setDepth(12).setScale(1);
    img.body.setAllowGravity(false);
    img.body.setCircle(12, img.width / 2 - 12, img.height / 2 - 12);
    img.pdata = data || {};
    img.magnet = false;
    // 弹出
    var ang = Math.random() * Math.PI * 2;
    img.body.setVelocity(Math.cos(ang) * 90, Math.sin(ang) * 90);
    img.life = 26;
    return img;
  };

  Game.prototype.updatePickups = function (dt) {
    var self = this, p = this.player, run = this.run;
    var magnetR = run.magnetR();
    this.pickups.getChildren().forEach(function (it) {
      if (!it.active) return;
      it.life -= dt;
      var d = Phaser.Math.Distance.Between(it.x, it.y, p.x, p.y);
      if (d < magnetR) {
        // 吸附
        var dx = p.x - it.x, dy = p.y - it.y, l = Math.sqrt(dx * dx + dy * dy) || 1;
        var sp = 240 + (magnetR - d) * 3;
        it.body.setVelocity(dx / l * sp, dy / l * sp);
      } else {
        it.body.velocity.x *= 0.94;
        it.body.velocity.y *= 0.94;
      }
      it.angle += 2;
      // 呼吸
      it.setScale(1 + Math.sin(self.time.now / 260 + it.x) * 0.06);

      if (d < 34) {
        self.collect(it);
      } else if (it.life <= 0) {
        self.resetObj(it, self.pickups);
      }
    });
  };

  Game.prototype.collect = function (it) {
    var run = this.run;
    var d = it.pdata || {};
    if (d.xp) {
      var ups = run.addXp(d.xp);
      R.Sfx.play('pickup', 60);
      if (ups > 0) R.Sfx.play('level');
    }
    if (d.gold) {
      var n = Math.max(1, Math.round(d.gold * (run.metaGoldMul || 1)));
      run.gold += n;
      R.Meta.addGold(n);   // 金币同时累计到研究所（永久货币）
      R.Sfx.play('coin', 80);
      this.popText(it.x, it.y - 20, '+' + n, '#ffd23f');
    }
    if (d.heal) { run.heal(d.heal); R.Sfx.play('heal'); this.popText(it.x, it.y - 20, '+1', '#4ee07a'); }
    // 血量上限 +1（同时回 1 格）
    if (d.maxhp) {
      run.maxHp += 1; run.hp += 1;
      R.Sfx.play('heal'); R.Sfx.play('reward', 120);
      this.popText(it.x, it.y - 22, '生命上限 +1！', '#ff8a9a', 24);
      this.burst(it.x, it.y, 0xff8a9a, 12);
      this.hud.refresh(run);
    }
    // 护盾：高等级直接换装，同级及以下则充满
    if (d.shield) this.equipShield(d.shield, it.x, it.y);
    this.resetObj(it, this.pickups);
    if (this.pickupFlash !== undefined) this.pickupFlash = 0;
  };

  Game.prototype.nearestEnemy = function (x, y, maxDist) {
    var best = null, bd = maxDist || 999999;
    var list = this.enemies.getChildren();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e.active) continue;
      var d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };

  /* ---------------- Boss ---------------- */
  Game.prototype.spawnBoss = function () {
    var self = this;
    var ch = this.chapterDef;
    var bossKey = ch.boss;
    var def = D.BOSSES[bossKey];
    var pos = this.ringPosition();

    var img = this.spawnImage(this.enemies, def.art, pos.x, pos.y);
    img.setDepth(17);
    img.body.setAllowGravity(false);
    img.etype = 'boss';
    img.isBoss = true;
    img.bossDef = def;
    img.def = { speed: 60, kind: 'boss', float: false, size: def.size };
    img.maxHp = def.hp;
    img.hp = def.hp;
    img.dmg = def.dmg;
    img.xp = def.xp;
    img.gold = def.gold;
    img.hitR = def.size * 0.42;
    img.elite = false;
    img.aiState = 'idle';
    img.aiTimer = 2;
    img.hurtT = 0;
    img.stun = 0;
    img.flip = false;
    img.size = def.size;
    img.baseScale = 1;
    img.setScale(1);
    img.body.setCircle(img.hitR, img.width / 2 - img.hitR, img.height / 2 - img.hitR);
    img.shadow = this.add.image(img.x, img.y + img.hitR * 0.85, 'blob_soft')
      .setTint(0x000000).setAlpha(0.28).setDepth(8).setScale(1.6);

    this.boss = img;
    this.aliveThisRoom = (this.aliveThisRoom || 0) + 1;

    // Boss 血条（屏幕顶部）
    this.bossBarBg = this.add.graphics().setDepth(1100).setScrollFactor(0);
    this.bossBar = this.add.graphics().setDepth(1101).setScrollFactor(0);
    this.bossName = this.add.text(this.scale.width / 2, 108, def.name, {
      fontFamily: R.FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffd7d2',
      stroke: '#2b1d2b', strokeThickness: 5
    }).setOrigin(0.5).setDepth(1102).setScrollFactor(0);
    this.drawBossBar();
    return img;
  };

  Game.prototype.drawBossBar = function () {
    if (!this.bossBar) return;
    var W = this.scale.width;
    var w = W - 120, x = 60, y = 132, h = 20;
    var p = this.boss ? Phaser.Math.Clamp(this.boss.hp / this.boss.maxHp, 0, 1) : 0;
    this.bossBarBg.clear();
    this.bossBarBg.fillStyle(0x2b1d2b, 0.8); this.bossBarBg.fillRoundedRect(x - 4, y - 4, w + 8, h + 8, 12);
    this.bossBarBg.fillStyle(0x4a3a4a, 1);   this.bossBarBg.fillRoundedRect(x, y, w, h, 8);
    this.bossBar.clear();
    if (p > 0.001) {
      this.bossBar.fillStyle(p > 0.35 ? 0xe8433c : 0xff8a00, 1);
      this.bossBar.fillRoundedRect(x, y, w * p, h, 8);
      this.bossBar.fillStyle(0xffffff, 0.28);
      this.bossBar.fillRoundedRect(x + 2, y + 2, Math.max(4, w * p - 4), 5, 3);
    }
  };

  Game.prototype.updateBoss = function (e, dt) {
    var self = this, p = this.player, def = e.bossDef;
    var dx = p.x - e.x, dy = p.y - e.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var v = e.body.velocity;

    if (e.aiState === 'idle') {
      // 缓慢逼近
      v.x = dx / dist * def.step;
      v.y = dy / dist * def.step;
      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        // 跳砸
        e.aiState = 'jump';
        e.aiTimer = 0.55;
        e.jumpTarget = { x: p.x, y: p.y };
        this.tweens.add({ targets: e, scaleY: 0.8, scaleX: 1.18, duration: 160, yoyo: true, repeat: 1 });
      }
    } else if (e.aiState === 'jump') {
      e.aiTimer -= dt;
      v.x *= 0.8; v.y *= 0.8;
      if (e.aiTimer <= 0) {
        e.aiState = 'air';
        e.aiTimer = 0.5;
        e.airFrom = { x: e.x, y: e.y };
        this.tweens.add({ targets: e, y: e.jumpTarget.y - 140, duration: 250, ease: 'Quad.out' });
        this.tweens.add({ targets: e, x: e.jumpTarget.x, duration: 500, ease: 'Sine.inOut' });
        this.tweens.add({ targets: e, y: e.jumpTarget.y, duration: 250, delay: 250, ease: 'Quad.in' });
      }
    } else if (e.aiState === 'air') {
      v.x = 0; v.y = 0;
      e.aiTimer -= dt;
      if (e.aiTimer <= 0) {
        e.aiState = 'idle';
        e.aiTimer = def.jumpCd * (0.8 + Math.random() * 0.4);
        // 落地冲击波
        this.ringWave(e.x, e.y, def.shockwaveDmg);
        this.cameras.main.shake(220, 0.012);
        R.Sfx.play('explode');
        // 半血后狂暴：环形弹幕更频繁
        var rage = e.hp / e.maxHp < 0.5;
        if (Math.random() < (rage ? 0.9 : 0.6)) this.bossRingAttack(e, def.ringCount + (rage ? 8 : 0));
      }
    }

    // 受击闪
    if (e.hurtT > 0) { e.hurtT -= dt; if (e.hurtT <= 0) e.clearTint(); }

    e.body.setVelocity(v.x, v.y);
    if (e.shadow) e.shadow.setPosition(e.x, e.y + e.hitR * 0.75);
    this.drawBossBar();
  };

  Game.prototype.ringWave = function (x, y, dmg) {
    var self = this;
    var g = this.add.circle(x, y, 20, 0xffb300, 0.45).setDepth(14);
    g.setStrokeStyle(8, 0xff7a3d, 0.9);
    this.tweens.add({
      targets: g, radius: 210, alpha: 0, duration: 480, ease: 'Quad.out',
      onUpdate: function () {
        g.setScale(g.radius / 20);
        var r = g.radius;
        var p = self.player;
        var d = Phaser.Math.Distance.Between(x, y, p.x, p.y);
        if (Math.abs(d - r) < 34 && !g.hit) {
          g.hit = true;
          self.hurtPlayer(dmg);
        }
      },
      onComplete: function () { g.destroy(); }
    });
  };

  Game.prototype.bossRingAttack = function (e, count) {
    var n = count || 16;
    for (var i = 0; i < n; i++) {
      var ang = (i / n) * Math.PI * 2;
      var b = this.spawnImage(this.bulletsE, 'bullet_seed', e.x, e.y);
      b.setDepth(15).setTint(0xffd75e).setScale(1.3);
      b.body.setAllowGravity(false);
      b.body.setCircle(10, 3, 3);
      b.body.setVelocity(Math.cos(ang) * 230, Math.sin(ang) * 230);
      b.dmg = 2;   // Boss 弹幕每发 2 格
      b.life = 4;
    }
    R.Sfx.play('boss', 300);
  };

  /* ---------------- 护盾系统 ----------------
   * 5 个等级：初级挡 1 格 → 顶级挡 5 格。
   * 拾取更高等级 → 直接换装（满格）；同级或更低 → 充满当前护盾。
   * 每被击中一次消耗 1 格，破盾后需重新拾取。 */
  Game.prototype.equipShield = function (tier, x, y) {
    var run = this.run;
    tier = Phaser.Math.Clamp(tier | 0, 1, 5);
    var s = run.shield = run.shield || { level: 0, hp: 0 };
    if (tier > s.level) {
      s.level = tier; s.hp = tier;
      this.popText(x !== undefined ? x : this.player.x, (y !== undefined ? y : this.player.y) - 24,
        '护盾 Lv.' + tier + '！', '#53d7ff', 24);
    } else {
      s.hp = s.level;
      this.popText(x !== undefined ? x : this.player.x, (y !== undefined ? y : this.player.y) - 24,
        '护盾已充满', '#53d7ff', 20);
    }
    R.Sfx.play('ring'); R.Sfx.play('pickup', 100);
    this.burst(this.player.x, this.player.y, 0x53d7ff, 10);
    this.hud.refresh(run);
  };

  /* ---------------- 玩家受伤 ---------------- */
  Game.prototype.hurtPlayer = function (dmg) {    var run = this.run;
    if (this.data.get('invuln') > 0) return;
    if (!run.alive) return;

    // 护盾优先抵挡：每被击中一次消耗 1 格
    var sh = run.shield;
    if (sh && sh.hp > 0) {
      sh.hp -= 1;
      this.data.set('invuln', 0.9);
      R.Sfx.play('ring');
      this.popText(this.player.x, this.player.y - 64,
        sh.hp > 0 ? '护盾抵挡！' : '护盾破碎！', '#53d7ff', 22);
      this.cameras.main.flash(120, 80, 200, 255);
      this.hud.refresh(run);
      R.emit('player:hurt', { hp: run.hp, shield: true });
      return;
    }

    run.takeDamage(dmg);
    this.data.set('invuln', 0.9);
    this.hud.hurtFlash();
    this.hud.refresh(run);
    R.Sfx.play('hurt');
    this.cameras.main.shake(180, 0.01);
    this.cameras.main.flash(120, 255, 90, 90);
    R.emit('player:hurt', { hp: run.hp });
    if (!run.alive) this.gameOver();
  };

  /* ---------------- 场地清空 / 波次推进 / 过场 ---------------- */
  Game.prototype.checkRoomClear = function () {
    if (this.phase !== 'fight' || this.isBossRoom || this.waveBreak) return;
    if (this.killedThisRoom >= this.waveTarget) {
      if (this.wave < this.waveTotal - 1) {
        // 还有下一波：短暂休整后继续
        this.waveBreak = true;
        this.waveBreakTimer = 1.1;
        this.hud.showBanner('休整一下', '下一波马上就来…', '#8fe3ff');
        this.hud.refresh(this.run);
      } else {
        this.onRoomClear();
      }
    }
  };

  Game.prototype.onRoomClear = function () {
    var self = this;
    this.phase = 'clear';
    this.run.roomShown = { label: '清空！' };
    this.hud.showBanner('清空 !', '收下战利品', '#8fe3ff');
    R.Sfx.play('reward');

    // 吸掉剩余经验
    this.pickups.getChildren().forEach(function (it) {
      if (it.active) it.magnet = true;
    });

    this.time.delayedCall(700, function () {
      // 掉落宝箱
      var n = 1 + (Math.random() < 0.35 ? 1 : 0);
      for (var i = 0; i < n; i++) {
        var ang = Math.random() * Math.PI * 2;
        var x = Phaser.Math.Clamp(self.player.x + Math.cos(ang) * 140, 120, ARENA - 120);
        var y = Phaser.Math.Clamp(self.player.y + Math.sin(ang) * 140, 120, ARENA - 120);
        self.spawnChest(x, y);
      }
      self.spawnPortal();
    });
  };

  Game.prototype.spawnChest = function (x, y) {
    var self = this;
    var c = this.physics.add.image(x, y, 'chest').setDepth(13);
    c.body.setAllowGravity(false);
    c.body.setSize(56, 44);
    c.opened = false;
    c.setScale(0.2);
    this.tweens.add({ targets: c, scale: 1, duration: 320, ease: 'Back.out' });
    this.tweens.add({ targets: c, y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.chestList = this.chestList || [];
    this.chestList.push(c);

    // 【修复】每个宝箱独立碰撞器。
    // 旧写法 `this.chestOverlap = this.chestOverlap || overlap(...)` 会因短路
    // 导致第二个宝箱（35% 概率双宝箱）没有碰撞器而永远打不开。
    c.collider = this.physics.add.overlap(this.player, c, function () {
      if (c.opened || !c.active) return;
      c.opened = true;
      R.Sfx.play('reward');
      if (c.collider) { self.physics.world.removeCollider(c.collider); c.collider = null; }
      self.burst(c.x, c.y, 0xffd23f, 18);
      // 宝箱给一次升级
      self.run.pendingLevels += 1;
      self.popText(c.x, c.y - 40, '强化！', '#ffe14d');
      self.tweens.add({ targets: c, y: c.y - 30, alpha: 0, scale: 1.4, duration: 500, onComplete: function () { c.destroy(); } });
      self.maybeOpenUpgrade();
    });
    return c;
  };

  Game.prototype.portalActive = false;

  Game.prototype.spawnPortal = function () {
    var self = this;
    var ch = this.chapterDef;
    var isChapterEnd = this.roomIndexInChapter === 5;
    // 传送门放在玩家附近（保证能看见、走几步就到）
    var ang = Math.random() * Math.PI * 2;
    var x = Phaser.Math.Clamp(this.player.x + Math.cos(ang) * 260, 140, ARENA - 140);
    var y = Phaser.Math.Clamp(this.player.y + Math.sin(ang) * 260, 140, ARENA - 140);
    var portal = this.physics.add.image(x, y, 'portal').setDepth(10).setScale(0.2).setAlpha(0);
    portal.body.setAllowGravity(false);
    portal.body.setCircle(52, 12, 12);
    this.portal = portal;
    this.portalActive = true;
    this.tweens.add({ targets: portal, scale: 1, alpha: 1, duration: 420, ease: 'Back.out' });
    this.tweens.add({ targets: portal, angle: 360, duration: 6000, repeat: -1 });
    this.tweens.add({ targets: portal, scale: { from: 1, to: 1.08 }, duration: 800, yoyo: true, repeat: -1 });

    this.physics.add.overlap(this.player, portal, function () {
      if (!self.portalActive) return;
      self.portalActive = false;
      R.Sfx.play('select');
      self.cameras.main.fadeOut(300, 26, 16, 32);
      self.time.delayedCall(320, function () {
        self.cameras.main.fadeIn(240, 26, 16, 32);
        self.nextRoom();
      });
    });

    // 提示箭头
    this.hud.toast(isChapterEnd ? '进入下一章 →' : '走进传送门继续 →', this.scale.height * 0.24);
  };

  Game.prototype.maybeOpenUpgrade = function () {
    var run = this.run;
    if (run.pendingLevels <= 0 && run.level <= 0) return;
    if (this.phase === 'clear' || this.phase === 'fight') {
      if (run.pendingLevels > 0) this.openUpgrade();
    }
  };

  Game.prototype.openUpgrade = function () {
    var self = this;
    if (this._upgrading) return;
    this._upgrading = true;
    this.physics.pause();
    this.phase = 'upgrade';
    this.tweens.pauseAll();
    this.scene.launch('Upgrade', {
      run: this.run,
      onDone: function () {
        self.physics.resume();
        self.tweens.resumeAll();
        self.phase = self.portalActive ? 'clear' : 'fight';
        self._upgrading = false;
        self.hud.refresh(self.run);
        // 兜底：升级期间本该推进的波次
        if (self.phase === 'fight' && !self.isBossRoom && self.waveBreak && self.waveBreakTimer <= 0) {
          self.startWave(self.wave + 1);
        }
        // 连环升级
        if (self.run.pendingLevels > 0) self.time.delayedCall(120, function () { self.openUpgrade(); });
      }
    });
  };

  /* ---------------- 特效 ---------------- */
  Game.prototype.popText = function (x, y, str, color, size) {
    var t = this.add.text(x, y, str, {
      fontFamily: R.FONT, fontSize: (size || 20) + 'px', fontStyle: 'bold',
      color: color || '#ffffff', stroke: '#2b1d2b', strokeThickness: 4
    }).setOrigin(0.5).setDepth(60);
    this.tweens.add({
      targets: t, y: y - 42, alpha: 0, scale: 1.25, duration: 520,
      onComplete: function () { t.destroy(); }
    });
    this.dmgTexts.push(t);
    if (this.dmgTexts.length > 60) { var old = this.dmgTexts.shift(); if (old && old.active) old.destroy(); }
  };

  Game.prototype.spark = function (x, y, color) {
    for (var i = 0; i < 2; i++) {
      var s = this.add.image(x, y, 'blob').setTint(color).setScale(0.16).setDepth(50);
      var a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 18;
      this.tweens.add({
        targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.05,
        duration: 200 + Math.random() * 120, onComplete: function () { s.destroy(); }
      });
    }
  };

  Game.prototype.burst = function (x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var s = this.add.image(x, y, 'blob').setTint(color).setScale(0.2 + Math.random() * 0.18).setDepth(50);
      var a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 60;
      this.tweens.add({
        targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.02,
        duration: 320 + Math.random() * 280, ease: 'Quad.out', onComplete: function () { s.destroy(); }
      });
    }
  };

  Game.prototype.explode = function (x, y, cfg, dmg) {
    var self = this;
    var ring = this.add.circle(x, y, 12, 0xffb300, 0.55).setDepth(40);
    ring.setStrokeStyle(5, 0xffffff, 0.9);
    this.tweens.add({
      targets: ring, radius: cfg.r, alpha: 0, duration: 260, ease: 'Quad.out',
      onComplete: function () { ring.destroy(); }
    });
    this.burst(x, y, 0xff9a3d, 10);
    this.cameras.main.shake(90, 0.005);
    R.Sfx.play('explode', 120);
    this.enemies.getChildren().forEach(function (e) {
      if (!e.active) return;
      if (Phaser.Math.Distance.Between(x, y, e.x, e.y) < cfg.r + e.hitR * 0.5) {
        self.damageEnemy(e, cfg.dmg || dmg, { knock: 220, fromX: x, fromY: y, color: 0xff9a3d });
      }
    });
  };

  /* ---------------- 主循环 ---------------- */
  Game.prototype.update = function (time, delta) {
    if (this.paused || this._upgrading) return;
    var dt = Math.min(delta / 1000, 0.05);
    var run = this.run;

    // 波次休整计时：放在最前面，即使升级弹窗插进来也不会漏掉
    // （旧实现用 time.delayedCall + 检查 phase==='fight'，升级期间 phase 是 'upgrade'
    //  导致下一波永远不开，游戏卡死不刷怪）
    if (this.waveBreak && !this._upgrading && this.phase === 'fight') {
      this.waveBreakTimer -= dt;
      if (this.waveBreakTimer <= 0) this.startWave(this.wave + 1);
    }

    // 计时（只在战斗阶段）
    if (this.phase === 'fight') {
      run.time += dt;
    }

    this.updatePlayer(dt);
    this.updateWeapons(dt);
    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updateEnemyBullets(dt);
    this.updatePickups(dt);

    // Boss 未接管时的常规 AI
    if (this.boss && this.boss.active) {
      this.boss.def.kind = 'boss';
      // 已在 updateEnemies 中按 chaser 处理，这里覆盖为 Boss 行为
      this.updateBoss(this.boss, dt);
    }

    // 玩家撞怪
    this.enemies.getChildren().forEach(function (e) {
      if (!e.active) return;
      var d = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
      if (d < e.hitR + 24) {
        this.hurtPlayer(e.isBoss ? 3 : (e.elite ? 2 : 1));   // 小怪1 / 精英2 / Boss3
      }
    }, this);

    // 刷怪（波次休整期暂停刷怪）
    if (this.phase === 'fight' && !this.isBossRoom && !this.waveBreak) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.waveInterval && this.spawnedThisRoom < this.waveTarget) {
        this.spawnTimer = 0;
        for (var i = 0; i < this.spawnPerTick && this.spawnedThisRoom < this.waveTarget; i++) {
          var type = this.run.pick(this.chapterDef.pool);
          var elite = Math.random() < this.eliteChance && this.run.room > 1;
          this.spawnEnemy(type, { elite: elite });
          this.spawnedThisRoom++;
        }
      }
      // 防止玩家挂机：场上怪太少时补
      if (this.enemies.countActive(true) === 0 && this.spawnedThisRoom < this.waveTarget) {
        this.spawnTimer = 99;
      }
    }

    // 升级弹窗
    if (run.pendingLevels > 0 && !this._upgrading && this.phase !== 'upgrade') {
      this.openUpgrade();
    }

    this.hud.refresh(run);
  };

  /* ---------------- 暂停 / 恢复 / 退出 ---------------- */
  Game.prototype.pauseGame = function () {
    if (this.paused || this._upgrading || this.phase === 'dead') return;
    this.paused = true;
    this.physics.pause();
    this.tweens.pauseAll();
    R.Sfx.play('click');
    this.scene.launch('Pause', { game: this });
  };

  Game.prototype.resumeGame = function () {
    if (!this.paused) return;
    this.paused = false;
    this.physics.resume();
    this.tweens.resumeAll();
    this.data.set('invuln', 0.6);   // 恢复后给短暂无敌，防连点吃亏
  };

  Game.prototype.quitToTitle = function () {
    R.emit('run:end', { win: false, room: this.run.room, quit: true, kills: this.run.kills });
    this.paused = false;
    this.scene.stop('Game');
    this.scene.start('Title');
  };

  /* ---------------- 结束 ---------------- */
  Game.prototype.gameOver = function () {
    var self = this;
    this.phase = 'dead';
    this.run.alive = false;
    R.emit('run:end', { win: false, room: this.run.room, kills: this.run.kills });
    this.physics.pause();
    this.cameras.main.shake(300, 0.02);
    this.burst(this.player.x, this.player.y, 0xff8a80, 24);
    this.tweens.add({ targets: this.player, angle: 180, scaleY: 0.6, alpha: 0.5, duration: 400 });
    this.time.delayedCall(700, function () {
      self.showResult(false);
    });
  };

  Game.prototype.showResult = function (win) {
    var self = this;
    this.scene.pause();
    this.scene.launch('Result', { run: this.run, win: win });
  };

  R.SCENES.push(Game);
})(window.RogueGame = window.RogueGame || {});
