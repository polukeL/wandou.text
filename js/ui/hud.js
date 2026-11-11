/* =========================================================
 * ui/hud.js —— 战斗界面 HUD（v0.8.15，全部组件可编辑）
 *
 * 布局（720×1280，严格按参考图网格实测）：
 *   左上：玩家信息区（与主城同款：名字底条 + 头像 + 镂空头像框 + 昵称 + Lv + 经验条）
 *   顶中：通关时间底框（时钟图标 + 时间）
 *   顶右：获得金币底框（金币图标 + 数量）
 *   第二行：暂停按钮（左）· 关卡波数横幅（中）· 声音开关（右）
 *   第三行：波数进度条（绿勾=已通过 / 发光剑=当前 / 锁=未到 / 红恶魔=Boss）
 *   中上：玩家头顶血条（跟随角色，血条底/满 + 数值）
 *   底部：当前 buff 大面板（武器装备 + 已获强化 + 诅咒 + 护盾 + 宠物）
 *
 * v0.8.15：战斗专属 18 个组件全部接入 R.BattleLayout 布局系统
 *   （优先级：本机草稿 > assets/ui/battle-layout.json > 代码默认），
 *   ?uiedit=1 进入战斗界面拖拽编辑模式，拖动即保存，
 *   与主城 city-layout.json 同款定稿流程。
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;
  var FONT = '"Baloo 2","Fredoka","PingFang SC","Microsoft YaHei",system-ui,sans-serif';

  /* 参考图实测坐标（720×1280）——仅保留程序内部引用的常量
   * （组件坐标已迁入 BATTLE_DEFAULTS，可被布局文件/草稿覆盖） */
  var BP = {
    nodeX0: 137, nodeX1: 460,     // 进度节点起止
    nodeY:  212,
    progW:  375,                  // 进度条显示宽度
    progX:  302, progY: 212,      // 进度条中心（prog_fill 宽度计算的锚点）
    buffX:  360, buffY: 1000,     // buff 面板内容排版锚点
    hpW:    110                   // 头顶血条显示宽度
  };

  /* =====================================================
   * 战斗布局表（v0.8.15）：战斗专属 UI 全部独立可编辑
   * 手动调整方式（推荐）：进入战斗后地址栏 ?uiedit=1，
   *   直接拖动任意组件 → 松手自动保存（localStorage 草稿），
   *   点「下载布局」得到 battle-layout.json → 放进 assets/ui/ 定稿。
   * ===================================================== */
  var BATTLE_LS = 'pearogue.battlelayout.v1';
  var BATTLE_FILE = 'assets/ui/battle-layout.json';
  var BATTLE_DEFAULTS = {
    /* 通关时间（底框/时钟/标签/数字四个独立组件） */
    time_bg:    { x: 348, y: 52 },
    time_icon:  { x: 293, y: 50 },
    time_label: { x: 358, y: 39 },
    time_text:  { x: 358, y: 65 },
    /* 获得金币（底框/图标/标签/数字四个独立组件） */
    gold_bg:    { x: 537, y: 52 },
    gold_icon:  { x: 482, y: 50 },
    gold_label: { x: 547, y: 39 },
    gold_text:  { x: 547, y: 65 },
    /* 第二行 */
    pause:       { x: 36,  y: 140 },
    banner:      { x: 305, y: 145, scale: 0.82 },
    banner_text: { x: 317, y: 146 },
    mute:        { x: 572, y: 140 },
    /* 波数进度条：prog_bg / prog_fill 只调上下（水平自动适配节点）；
     * 节点为独立组件 node_0~node_3（进入战斗后逐个拖动，拖过才写入布局） */
    prog_bg:   { x: 302, y: 212 },
    prog_fill: { x: 118, y: 212 },
    nodes:     { x: 0,   y: 0 },
    /* 底部 buff 面板（底板/标题/内容组三个独立组件） */
    buff_bg:    { x: 360, y: 1000 },
    buff_title: { x: 360, y: 941 },
    buff_items: { x: 0,   y: 0 }
  };

  /* 布局来源优先级（从低到高）：代码默认 > 项目文件 > 本机草稿
   * 与 R.CityLayout 同款机制（v0.8.12 定稿流程）。 */
  R.BattleLayout = {
    _draft: null,
    _server: null,
    _serverLoaded: false,
    _src: 'default',
    /* 启动时拉取项目里的布局文件（加时间戳避免 CDN 缓存） */
    fetchServer: function (cb) {
      var self = this;
      if (this._serverLoaded) { if (cb) cb(); return; }
      var url = BATTLE_FILE + '?t=' + Date.now();
      var done = function (j) {
        self._server = (j && typeof j === 'object') ? j : {};
        self._serverLoaded = true;
        self._src = Object.keys(self._server).length ? 'file' : 'default';
        if (cb) cb();
      };
      try {
        fetch(url, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(done)
          .catch(function () { done(null); });
      } catch (e) { done(null); }
    },
    load: function () {
      if (this._draft) return this._draft;
      try { this._draft = JSON.parse(localStorage.getItem(BATTLE_LS) || '{}'); }
      catch (e) { this._draft = {}; }
      return this._draft;
    },
    /* 生效位置 = 本机草稿 > 项目文件 > 代码默认 */
    pos: function (key, defX, defY) {
      var d = this.load()[key];
      if (d && d.x !== undefined) return { x: d.x, y: d.y };
      var sv = (this._server || {})[key];
      if (sv && sv.x !== undefined) return { x: sv.x, y: sv.y };
      var def = BATTLE_DEFAULTS[key] || {};
      return { x: (def.x !== undefined ? def.x : defX), y: (def.y !== undefined ? def.y : defY) };
    },
    scale: function (key, defScale) {
      var d = this.load()[key];
      if (d && d.scale !== undefined) return d.scale;
      var sv = (this._server || {})[key];
      if (sv && sv.scale !== undefined) return sv.scale;
      var def = BATTLE_DEFAULTS[key] || {};
      return def.scale !== undefined ? def.scale : (defScale || 1);
    },
    current: function () {
      var self = this, out = {};
      Object.keys(BATTLE_DEFAULTS).forEach(function (k) {
        var p = self.pos(k);
        out[k] = { x: Math.round(p.x), y: Math.round(p.y) };
        if (BATTLE_DEFAULTS[k].scale !== undefined) out[k].scale = self.scale(k);
      });
      /* 逐节点布局键（node_0~node_3，v0.8.19）：拖过才导出 */
      ['node_0', 'node_1', 'node_2', 'node_3'].forEach(function (k) {
        var d = self.load()[k] || (self._server || {})[k];
        if (d && d.x !== undefined) out[k] = { x: Math.round(d.x), y: Math.round(d.y) };
      });
      return out;
    },
    set: function (key, x, y) {
      var d = this.load();
      d[key] = d[key] || {};
      d[key].x = Math.round(x); d[key].y = Math.round(y);
      try { localStorage.setItem(BATTLE_LS, JSON.stringify(d)); } catch (e) {}
    },
    export: function () { return JSON.stringify(this.current(), null, 1); },
    /* 下载定稿文件：放进 assets/ui/battle-layout.json 即全设备生效 */
    download: function () {
      var txt = this.export();
      try {
        var blob = new Blob([txt], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'battle-layout.json';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        return true;
      } catch (e) { return false; }
    },
    reset: function () {
      this._draft = null;
      try { localStorage.removeItem(BATTLE_LS); } catch (e) {}
    },
    isEdited: function () { return Object.keys(this.load()).length > 0; },
    source: function () {
      return this.isEdited() ? 'local' : this._src;
    }
  };

  function HUD(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    this.build();
    var self = this;
    this._tick = function () { self.tick(); };
    scene.events.on('update', this._tick);
    scene.events.once('shutdown', function () {
      scene.events.off('update', self._tick);
    });
  }

  /* ---------- 顶部左：玩家信息区（位置与主城一致，共用 city-layout） ---------- */
  HUD.prototype.buildInfo = function () {
    var s = this.scene;
    var L = R.CityLayout || { pos: function (k, x, y) { return { x: x, y: y }; }, scale: function () { return 1; } };
    var iP = L.pos('info', 168, 49);
    this.infoImg = s.add.image(iP.x, iP.y, 'title2_info').setScale(L.scale('info'));
    this.root.add(this.infoImg);

    var avP = L.pos('avatar', 57, 50);
    this.avImg = s.add.image(avP.x, avP.y, 'title2_avatar').setDisplaySize(96, 96);
    this.root.add(this.avImg);

    var frP = L.pos('avatar_frame', 57, 50);
    this.frameImg = s.add.image(frP.x, frP.y, 'title2_frame');
    this.root.add(this.frameImg);

    var nP = L.pos('name', 105, 36);
    var nameDef = R.Meta.avatarDef();
    this.nameText = s.add.text(nP.x, nP.y, (nameDef && nameDef.name) || '豌豆仔', {
      fontFamily: FONT, fontSize: '21px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#33224a', strokeThickness: 4
    }).setOrigin(0, 0.5);
    this.root.add(this.nameText);

    var lP = L.pos('lv', 110, 60);
    this.lvText = s.add.text(lP.x, lP.y, 'Lv.1', {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold',
      color: '#ffe14d', stroke: '#33224a', strokeThickness: 3
    }).setOrigin(0, 0.5);
    this.root.add(this.lvText);

    var eP = L.pos('exp', 194, 62);
    this.expG = s.add.container(eP.x, eP.y);
    this.expG.add(s.add.image(0, 0, 'title2_expbg').setDisplaySize(94, 17));
    this.expFill = s.add.image(-45, 0, 'title2_expfill').setOrigin(0, 0.5);
    this.expG.add(this.expFill);
    this.root.add(this.expG);
  };

  /* ---------- 顶中/顶右：通关时间 · 获得金币（四件套各自独立） ---------- */
  HUD.prototype.buildStat = function () {
    var s = this.scene;
    var BL = R.BattleLayout;

    // 通关时间
    var t = BL.pos('time_bg', 348, 52);
    this.timeBg = s.add.image(t.x, t.y, 'battle_timebg');
    this.root.add(this.timeBg);
    var tc = BL.pos('time_icon', t.x - 55, t.y - 2);
    this.clockIc = s.add.image(tc.x, tc.y, 'battle_clock');
    this.root.add(this.clockIc);
    var tl = BL.pos('time_label', t.x + 10, t.y - 13);
    this.timeLabel = s.add.text(tl.x, tl.y, '通关时间', {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe9c9', stroke: '#2b1d2b', strokeThickness: 3
    }).setOrigin(0.5);
    this.root.add(this.timeLabel);
    var tt = BL.pos('time_text', t.x + 10, t.y + 13);
    this.timeText = s.add.text(tt.x, tt.y, '00:00', {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b1d2b', strokeThickness: 4
    }).setOrigin(0.5);
    this.root.add(this.timeText);

    // 获得金币
    var g = BL.pos('gold_bg', 537, 52);
    this.goldBg = s.add.image(g.x, g.y, 'battle_goldbg');
    this.root.add(this.goldBg);
    var gc = BL.pos('gold_icon', g.x - 55, g.y - 2);
    this.coinIc = s.add.image(gc.x, gc.y, 'battle_coin');
    this.root.add(this.coinIc);
    var gl = BL.pos('gold_label', g.x + 10, g.y - 13);
    this.goldLabel = s.add.text(gl.x, gl.y, '获得金币', {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe9c9', stroke: '#2b1d2b', strokeThickness: 3
    }).setOrigin(0.5);
    this.root.add(this.goldLabel);
    var gt = BL.pos('gold_text', g.x + 10, g.y + 13);
    this.goldText = s.add.text(gt.x, gt.y, '0', {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffdd55', stroke: '#5a3a10', strokeThickness: 4
    }).setOrigin(0.5);
    this.root.add(this.goldText);
  };

  /* ---------- 第二行：暂停 / 横幅 / 声音 ---------- */
  HUD.prototype.buildRow2 = function () {
    var s = this.scene;
    var BL = R.BattleLayout;
    var hud = this;

    // 暂停按钮（交互对象必须直接挂场景 + setScrollFactor(0)）
    var pP = BL.pos('pause', 36, 140);
    var pz = s.add.image(pP.x, pP.y, 'battle_pause').setDepth(1000).setScrollFactor(0);
    pz.setInteractive({ useHandCursor: true });
    pz.on('pointerdown', function () {
      if (hud.editMode) return;   // 编辑模式：拖拽优先，不打开暂停菜单
      if (s.pauseGame) s.pauseGame();
    });
    this.pauseBtn = pz;

    // 关卡波数横幅（底图与文字独立组件）
    var bP = BL.pos('banner', 305, 145);
    this.bannerImg = s.add.image(bP.x, bP.y, 'battle_banner').setScale(BL.scale('banner', 0.82));
    this.root.add(this.bannerImg);
    var bT = BL.pos('banner_text', bP.x + 12, bP.y + 1);
    this.bannerText = s.add.text(bT.x, bT.y, '', {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#22335c', strokeThickness: 4
    }).setOrigin(0.5);
    this.root.add(this.bannerText);

    // 声音开关（沿用主城素材风格）
    var mP = BL.pos('mute', 572, 140);
    var mute = s.add.container(mP.x, mP.y).setDepth(1000).setScrollFactor(0);
    mute.add(s.add.image(0, 0, 'title2_sndbg'));
    var sndIcon = s.add.image(2, 0, R.Sfx.muted ? 'title2_snd_off' : 'title2_snd_on');
    mute.add(sndIcon);
    mute.setSize(60, 60).setInteractive({ useHandCursor: true });
    mute.on('pointerdown', function () {
      if (hud.editMode) return;   // 编辑模式：拖拽优先，不触发开关
      var on = R.Sfx.toggle();
      sndIcon.setTexture(on ? 'title2_snd_on' : 'title2_snd_off');
      R.Sfx.play('click');
    });
    this.muteBtn = mute;
  };

  /* ---------- 第三行：波数进度条 ---------- */
  HUD.prototype.buildProgress = function () {
    var s = this.scene;
    var BL = R.BattleLayout;
    var pB = BL.pos('prog_bg', BP.progX, BP.progY);
    this.progBg = s.add.image(pB.x, pB.y, 'battle_progbg').setDisplaySize(BP.progW, 14);
    this.root.add(this.progBg);
    var pF = BL.pos('prog_fill', pB.x - BP.progW / 2 + 3, pB.y);
    this.progFill = s.add.image(pF.x, pF.y, 'battle_progfill')
      .setOrigin(0, 0.5).setDisplaySize(0, 10);
    this.root.add(this.progFill);
    var nC = BL.pos('nodes', 0, 0);
    this.nodesC = s.add.container(nC.x, nC.y);
    this.root.add(this.nodesC);
  };

  /* ---------- 底部：当前 buff 面板 ---------- */
  HUD.prototype.buildBuffBar = function () {
    var s = this.scene;
    var BL = R.BattleLayout;
    var bB = BL.pos('buff_bg', BP.buffX, BP.buffY);
    this.buffBg = s.add.image(bB.x, bB.y, 'battle_buffbg');
    this.root.add(this.buffBg);
    var bT = BL.pos('buff_title', bB.x, bB.y - 59);
    this.buffTitle = s.add.text(bT.x, bT.y, '当前 buff', {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffe14d', stroke: '#5a3a10', strokeThickness: 3
    }).setOrigin(0.5);
    this.root.add(this.buffTitle);
    var bI = BL.pos('buff_items', 0, 0);
    this.buffC = s.add.container(bI.x, bI.y);
    this.root.add(this.buffC);
  };

  /* ---------- 玩家头顶血条（跟随角色，非编辑组件） ---------- */
  HUD.prototype.buildHpFloat = function () {
    var s = this.scene;
    this.hpFloat = s.add.container(0, 0).setDepth(950);   // 世界坐标，跟随镜头滚动
    this.hpFloatBg = s.add.image(0, 0, 'battle_hpbg').setDisplaySize(BP.hpW, 15);
    this.hpFloat.add(this.hpFloatBg);
    this.hpFloatFill = s.add.image(-BP.hpW / 2 + 2, 0, 'battle_hpfill').setOrigin(0, 0.5);
    this.hpFloat.add(this.hpFloatFill);
    this.hpFloatText = s.add.text(0, -16, '', {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#ffffff', stroke: '#2b1d2b', strokeThickness: 4
    }).setOrigin(0.5);
    this.hpFloat.add(this.hpFloatText);
    this.shieldTag = s.add.text(0, -34, '', {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#53d7ff', stroke: '#2b1d2b', strokeThickness: 4
    }).setOrigin(0.5).setVisible(false);
    this.hpFloat.add(this.shieldTag);
  };

  HUD.prototype.build = function () {
    this.buildInfo();
    this.buildStat();
    this.buildRow2();
    this.buildProgress();
    this.buildBuffBar();
    this.buildHpFloat();

    // 关卡提示大字（保留原机制）
    var s = this.scene;
    this.banner = s.add.text(s.scale.width / 2, s.scale.height * 0.34, '', {
      fontFamily: FONT, fontSize: '64px', fontStyle: 'bold', color: '#fff6e2',
      stroke: '#2b1d2b', strokeThickness: 12, align: 'center'
    }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(1100);
    this.bannerSub = s.add.text(s.scale.width / 2, s.scale.height * 0.34 + 66, '', {
      fontFamily: FONT, fontSize: '26px', color: '#ffe9a8', stroke: '#2b1d2b', strokeThickness: 6, align: 'center'
    }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(1100);
  };

  /* ---------- 每帧：头顶血条跟随玩家 ---------- */
  HUD.prototype.tick = function () {
    var s = this.scene, run = s.run;
    if (!run || !s.player || !s.player.active) { this.hpFloat.setVisible(false); return; }
    this.hpFloat.setVisible(true);
    this.hpFloat.setPosition(s.player.x, s.player.y - (s.player.hitR || 40) - 14);
  };

  /* ---------- 波数进度节点重建 ---------- */
  HUD.prototype.refreshProgress = function (run) {
    var s = this.scene, BL = R.BattleLayout;
    var waveTotal = s.waveTotal || 3;
    var bossRoom = !!s.isBossRoom;
    var bossDead = !!s.bossKilled;            // v0.8.18：Boss 击杀后节点变绿
    var cleared = s.phase === 'clear';        // 清空后全部波视为已通过
    var cur = bossRoom ? waveTotal : Math.min((s.wave || 0) + (cleared ? 1 : 0), waveTotal);
    // v0.8.18：Boss 节点只在 BOSS 关显示——普通关进度条只有波节点，
    // 避免出现「还有个 Boss 没打」的误导（Boss 只在每章第 5 关出现）
    var n = bossRoom ? waveTotal + 1 : waveTotal;
    var x0 = BP.nodeX0, x1 = BP.nodeX1, y = BP.nodeY;
    // v0.8.19：每个节点都是独立组件——布局键 node_0~node_3（绝对坐标），
    // 没拖过的节点回退到「base + 旧版整组偏移 nodes」（兼容旧定稿文件）
    var grp = BL.pos('nodes', 0, 0);
    var drag = this._nodeDrag;
    var pos = [];
    for (var i = 0; i < n; i++) {
      var p;
      if (drag && drag.idx === i) {
        p = { x: drag.x, y: drag.y };          // 拖拽中的实时位置
      } else {
        var lp = BL.pos('node_' + i, NaN, NaN);
        if (isFinite(lp.x)) p = { x: lp.x, y: lp.y };
        else p = { x: x0 + i * (x1 - x0) / (n - 1) + grp.x, y: y + grp.y };
      }
      pos.push(p);
    }
    this.nodesC.setPosition(0, 0);
    this.nodesC.removeAll(true);
    for (i = 0; i < n; i++) {
      var key, sc = 1;
      if (bossRoom && i === n - 1) { key = bossDead ? 'battle_node_done' : 'battle_node_boss'; }
      else if (i < cur) { key = 'battle_node_done'; }
      else if (i === cur && !cleared && !bossRoom) { key = 'battle_node_cur'; sc = 0.55; }  // 发光剑素材 115px，缩到与 58px 节点同大
      else { key = 'battle_node_lock'; }
      if (drag && drag.idx === i) sc *= 1.12;  // 拖拽中的节点微微放大提示
      this.nodesC.add(s.add.image(pos[i].x, pos[i].y, key).setScale(sc));
    }
    this._nodePos = pos;

    // 底条自动适配：中心 = 首末节点中点，宽度到节点外缘为止——无论节点怎么拖，
    // 底条都不会从左右露出来（v0.8.19）；垂直位置仍走 prog_bg 布局键
    var first = pos[0], last = pos[n - 1];
    this.progBg.setPosition((first.x + last.x) / 2, BL.pos('prog_bg', BP.progX, BP.progY).y);
    this.progBg.setDisplaySize(Math.max(40, last.x - first.x + 58), 14);
    // 填充：左端锚定首节点圆心 → 右端到当前节点圆心，绝不越过两端（v0.8.19）
    this.progFill.setPosition(first.x + 1, BL.pos('prog_fill', first.x, y).y);
    var w = Math.max(0, pos[Math.min(cur, n - 1)].x - first.x - 2);
    this.progFill.setDisplaySize(w, 10);
  };

  /* ---------- buff 面板内容重建 ---------- */
  HUD.prototype.refreshBuffBar = function (run) {
    var s = this.scene;
    var D = R.DATA;
    this.buffC.removeAll(true);
    var items = [];
    // 1) 武器装备（图标 + 等级）
    (run.weapons || []).forEach(function (w) {
      items.push({ icon: 'icon_' + w.key, badge: w.level > 1 ? String(w.level) : null });
    });
    // 2) 已获强化（升级项 × 次数）
    Object.keys(run.upgrades || {}).forEach(function (id) {
      var cnt = run.upgrades[id];
      if (!cnt) return;
      var def = null;
      (D.UPGRADES || []).forEach(function (u) { if (u.id === id) def = u; });
      if (!def) return;
      items.push({ icon: 'icon_' + (def.icon || 'star'), text: (def.name || def.text || def.id) + (cnt > 1 ? ' ×' + cnt : '') });
    });
    // 3) 诅咒（紫色）
    Object.keys(run.curses || {}).forEach(function (cid) {
      if (!run.curses[cid]) return;
      var def = null;
      (D.CURSES || []).forEach(function (cu) { if (cu.id === cid) def = cu; });
      items.push({ text: def ? def.name : cid, color: '#c9a8ff' });
    });
    // 4) 护盾 / 宠物
    if (run.shield && run.shield.level > 0) items.push({ text: '🛡 护盾 Lv.' + run.shield.level, color: '#53d7ff' });
    if (run.pet && run.pet.stage === 'egg') items.push({ text: '🥚 宠物蛋 ' + run.pet.hatch + '/' + run.pet.need });
    if (run.pet && run.pet.stage === 'pet') items.push({ text: '🐾 宠物同行' });

    // 排版：面板内两行流式排布
    var startX = BP.buffX - 320, endX = BP.buffX + 320;
    var rowY = [BP.buffY - 26, BP.buffY + 22];
    var x = startX, row = 0;
    var self = this;
    items.forEach(function (it) {
      var w = 0;
      var c = s.add.container(0, 0);
      if (it.icon && s.textures.exists(it.icon)) {
        var ic = s.add.image(0, 0, it.icon).setDisplaySize(38, 38);
        c.add(ic);
        w += 46;
        if (it.badge) {
          var bd = s.add.text(14, -14, it.badge, {
            fontFamily: FONT, fontSize: '14px', fontStyle: 'bold',
            color: '#ffe14d', stroke: '#2b1d2b', strokeThickness: 3
          }).setOrigin(0.5);
          c.add(bd);
        }
      }
      if (it.text) {
        var tx = s.add.text(w - 4, 0, it.text, {
          fontFamily: FONT, fontSize: '17px', fontStyle: 'bold',
          color: it.color || '#ffffff', stroke: '#2b1d2b', strokeThickness: 4
        }).setOrigin(0, 0.5);
        c.add(tx);
        w += tx.width + 14;
      }
      if (row < rowY.length && x + w > endX) { row++; x = startX; }
      if (row >= rowY.length) return;   // 超出两行不再显示
      c.setPosition(x + w / 2 - 8, rowY[row]);
      self.buffC.add(c);
      x += w;
    });
    if (!items.length) {
      this.buffC.add(s.add.text(BP.buffX, BP.buffY - 2, '暂无 buff · 升级后获得强化', {
        fontFamily: FONT, fontSize: '18px', color: '#bdb4d8'
      }).setOrigin(0.5));
    }
  };

  HUD.prototype.refresh = function (run) {
    var s = this.scene;

    // ---- 信息区：名字 / 等级 / 经验 ----
    this.nameText.setText((R.Meta.avatarDef() || {}).name || '豌豆仔');
    this.lvText.setText('Lv.' + (run.level || 1));
    var pct = Phaser.Math.Clamp((run.xp || 0) / Math.max(1, run.xpNeed || 1), 0, 1);
    this.expFill.setDisplaySize(Math.max(2, 90 * pct), 12);

    // ---- 时间 / 金币 ----
    var t = Math.floor(run.time || 0);
    var mm = ('0' + Math.floor(t / 60)).slice(-2), ss = ('0' + (t % 60)).slice(-2);
    this.timeText.setText(mm + ':' + ss);
    this.goldText.setText(String(run.gold | 0));

    // ---- 关卡波数横幅 ----
    var shown = run.roomShown || {};
    this.bannerText.setText(shown.label || '');

    // ---- 进度条 ----
    this.refreshProgress(run);

    // ---- buff 面板 ----
    this.refreshBuffBar(run);

    // ---- 头顶血条数值 ----
    var hp = Math.max(0, run.hp), mhp = Math.max(1, run.maxHp);
    var ratio = Phaser.Math.Clamp(hp / mhp, 0, 1);
    this.hpFloatFill.setDisplaySize(Math.max(2, (BP.hpW - 4) * ratio), 9);
    this.hpFloatFill.setTint(ratio > 0.3 ? 0xffffff : 0xff8a6a);
    this.hpFloatText.setText(hp + '/' + mhp);
    if (run.shield && run.shield.hp > 0) {
      this.shieldTag.setVisible(true).setText('🛡 ' + Math.ceil(run.shield.hp));
    } else {
      this.shieldTag.setVisible(false);
    }
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

  /* =========================================================
   * ?uiedit=1：战斗 UI 拖拽编辑（v0.8.15）
   * 所有战斗专属组件 + 信息区组件（与主城共用 city-layout）均可拖动。
   * 拖动即保存：战斗组件 → BattleLayout（本机草稿），
   *            信息区组件 → CityLayout（与主界面联动）。
   * 工具按钮：下载布局 / 导出坐标 / 重置默认 / 完成退出。
   * 关键实现：手动指针拖拽（用屏幕坐标 p.x/p.y），不依赖 Phaser 的
   * drag 事件——HUD 组件挂 scrollFactor(0) 容器内，相机滚动时
   * drag 事件的 dx/dy 带镜头偏移会导致拖动漂移，屏幕坐标则恒准。
   * ========================================================= */
  HUD.prototype.enableEdit = function () {
    var s = this.scene;
    var self = this;
    this.editMode = true;
    var W = s.scale.width, H = s.scale.height;
    var BL = R.BattleLayout, CL = R.CityLayout;

    // 组件清单：battle 组件存 battle-layout；info 区存 city-layout（与主界面联动）。
    // 数组顺序 = 命中优先级（后面的先命中）：
    //   主件在前（底框，空白区可点）→ 成员在后（文字/图标，缩到实际内容尺寸优先命中）。
    // 主件带 follow 联动表：拖底框时组内成员保持相对偏移整体平移；
    // 拖成员时只动成员，可独立微调。
    var comps = [
      /* 信息区（与主城共用布局） */
      { key: 'info',         obj: this.infoImg,   store: 'city', w: 240, h: 84 },
      { key: 'avatar_frame', obj: this.frameImg,  store: 'city', w: 110, h: 110 },
      { key: 'avatar',       obj: this.avImg,     store: 'city', w: 110, h: 110 },
      { key: 'name',         obj: this.nameText,  store: 'city', w: 140, h: 30 },
      { key: 'lv',           obj: this.lvText,    store: 'city', w: 70,  h: 28 },
      { key: 'exp',          obj: this.expG,      store: 'city', w: 110, h: 30 },
      /* 主件（拖底框 = 整组平移） */
      { key: 'time_bg', obj: this.timeBg,
        follow: [['time_icon', this.clockIc], ['time_label', this.timeLabel], ['time_text', this.timeText]] },
      { key: 'gold_bg', obj: this.goldBg,
        follow: [['gold_icon', this.coinIc], ['gold_label', this.goldLabel], ['gold_text', this.goldText]] },
      { key: 'pause',   obj: this.pauseBtn, w: 96, h: 96 },
      { key: 'banner',  obj: this.bannerImg, follow: [['banner_text', this.bannerText]] },
      { key: 'mute',    obj: this.muteBtn,  w: 96, h: 96 },
      { key: 'prog_bg', obj: this.progBg, w: 410, h: 46 },   // 底条水平位置自动适配首末节点，拖拽只调上下
      { key: 'buff_bg', obj: this.buffBg,
        follow: [['buff_title', this.buffTitle], ['buff_items', this.buffC]] },
      /* 成员（可单独微调；命中区=实际内容尺寸，底框空白让给主件） */
      { key: 'time_icon',  obj: this.clockIc },
      { key: 'time_label', obj: this.timeLabel },
      { key: 'time_text',  obj: this.timeText },
      { key: 'gold_icon',  obj: this.coinIc },
      { key: 'gold_label', obj: this.goldLabel },
      { key: 'gold_text',  obj: this.goldText },
      { key: 'banner_text', obj: this.bannerText },
      { key: 'buff_title',  obj: this.buffTitle },
      { key: 'prog_fill', obj: this.progFill, rect: [0, -20, 60, 40] }   // 填充左端自动锚定首节点，拖拽只调上下
      /* 进度条每个节点（node_0~node_3）单独可拖——节点对象每帧重建，
       * 不能放进 comps（对象引用会失效），走 _nodeDrag 独立拖拽通道 */
    ];

    /* 命中判定：手动屏幕坐标包围盒。
     * 关键坑（v0.8.15）：HUD 组件都挂在 scrollFactor(0) 的 root 容器内，
     * 战斗相机跟随玩家滚动后，Phaser 对「容器子对象 + 滚动相机」的
     * hitTest 会失效（实测 28 个注册对象命中 0 个），
     * 所以编辑拖拽必须自己做屏幕坐标命中，不能依赖 setInteractive。 */
    function hitRect(cp) {
      if (cp.rect) return cp.rect;
      var rw = cp.w, rh = cp.h;
      if (rw === undefined) {
        // 实际内容尺寸 + 少量余量：文字/图标不再整片盖住底框，
        // 底框空白区可点中主件（v0.8.15 修复「底框拖不动」）
        rw = Math.max((cp.obj.displayWidth || cp.obj.width || 40) + 16, 44);
        rh = Math.max((cp.obj.displayHeight || cp.obj.height || 30) + 12, 32);
      }
      return [-rw / 2, -rh / 2, rw, rh];
    }

    function hitTest(p) {
      // 顶部标题条 / 底部工具条安全区，不参与拖拽
      if (p.y < 48 || p.y > H - 45) return null;
      for (var i = comps.length - 1; i >= 0; i--) {   // 数组靠后的（成员）优先命中
        var cp = comps[i], o = cp.obj;
        if (!o) continue;
        var r = hitRect(cp);
        var lx = p.x - o.x, ly = p.y - o.y;
        if (lx >= r[0] && ly >= r[1] && lx <= r[0] + r[2] && ly <= r[1] + r[3]) return cp;
      }
      return null;
    }

    var dragCp = null, dragFollow = [], dragOff = { x: 0, y: 0 };

    s.input.on('pointerdown', function (p) {
      // 先试进度条节点（node_0~node_3，每帧重建、独立布局键）
      var np = self._nodePos || [];
      for (var i = np.length - 1; i >= 0; i--) {
        if (Math.abs(p.x - np[i].x) <= 36 && Math.abs(p.y - np[i].y) <= 36) {
          self._nodeDrag = { idx: i, x: np[i].x, y: np[i].y, offX: np[i].x - p.x, offY: np[i].y - p.y };
          return;
        }
      }
      var cp = hitTest(p);
      if (!cp) return;
      var o = cp.obj;
      dragCp = cp;
      dragOff.x = o.x - p.x; dragOff.y = o.y - p.y;
      // 联动成员：记录相对主件的偏移，拖动时整体平移（follow 项格式 [key, obj]）
      dragFollow = (cp.follow || []).map(function (f) {
        return { key: f[0], obj: f[1], dx: f[1].x - o.x, dy: f[1].y - o.y };
      });
      o.setAlpha(0.9);   // 高亮（不提层：底框要在成员之下保持组内层次）
    });

    s.input.on('pointermove', function (p) {
      if (self._nodeDrag && p.isDown) {
        var d = self._nodeDrag;
        d.x = Math.round(Phaser.Math.Clamp(p.x + d.offX, 0, W));
        d.y = Math.round(Phaser.Math.Clamp(p.y + d.offY, 0, H));
        return;
      }
      if (!dragCp || !p.isDown) return;
      var o = dragCp.obj;
      o.x = Math.round(Phaser.Math.Clamp(p.x + dragOff.x, 0, W));
      o.y = Math.round(Phaser.Math.Clamp(p.y + dragOff.y, 0, H));
      dragFollow.forEach(function (f) {
        f.obj.x = o.x + f.dx; f.obj.y = o.y + f.dy;
      });
    });

    s.input.on('pointerup', function () {
      if (self._nodeDrag) {
        var d = self._nodeDrag;
        BL.set('node_' + d.idx, d.x, d.y);
        self.toast('节点 ' + (d.idx + 1) + ' → ' + d.x + ',' + d.y + '（已保存，底条自动跟随）', H * 0.3);
        self._nodeDrag = null;
        return;
      }
      if (!dragCp) return;
      var cp = dragCp, o = cp.obj;
      dragCp = null;
      o.setAlpha(1);
      var save = cp.store === 'city' && CL && CL.set
        ? function (k, x, y) { CL.set(k, x, y); }
        : function (k, x, y) { BL.set(k, x, y); };   // 必须包装：直接引用 BL.set 会丢 this
      save(cp.key, o.x, o.y);
      dragFollow.forEach(function (f) { save(f.key, f.obj.x, f.obj.y); });   // 联动成员一并保存
      self.toast(cp.key + ' → ' + o.x + ',' + o.y + '（已保存' + (dragFollow.length ? '，联动 ' + dragFollow.length + ' 项' : '') + '）', H * 0.3);
      dragFollow = [];
    });

    /* ---------- 顶部标题条 + 底部工具按钮 ---------- */
    var g = s.add.graphics().setDepth(1500).setScrollFactor(0);
    g.fillStyle(0x000000, 0.55); g.fillRect(0, 0, W, 44);
    g.fillStyle(0x000000, 0.55); g.fillRect(0, H - 40, W, 40);
    var srcName = { local: '本机草稿', file: '项目文件 battle-layout.json', 'default': '代码默认' }[BL.source()] || '默认';
    s.add.text(W / 2, 22, '战斗 UI 编辑模式（来源：' + srcName + '）拖动即保存', {
      fontFamily: 'system-ui,sans-serif', fontSize: '18px', color: '#ffe14d'
    }).setOrigin(0.5).setDepth(1501).setScrollFactor(0);

    function toolBtn(x, label, fn) {
      var c = s.add.container(x, H - 20).setDepth(1501).setScrollFactor(0);
      var bg = s.add.graphics();
      bg.fillStyle(0x2b1d2b, 0.9); bg.fillRoundedRect(-64, -15, 128, 30, 15);
      c.add(bg);
      c.add(s.add.text(0, 0, label, { fontSize: '15px', color: '#ffe9c9' }).setOrigin(0.5));
      c.setSize(128, 32).setInteractive({ useHandCursor: true });
      c.on('pointerdown', fn);
      return c;
    }

    /* 下载 battle-layout.json —— 放进 assets/ui/ 提交后全设备生效 */
    toolBtn(80, '下载布局', function () {
      var ok = BL.download();
      self.toast(ok
        ? '已下载 battle-layout.json → 放进 assets/ui/ 后提交上线'
        : '下载失败，请用「导出坐标」复制内容', H * 0.3);
    });
    toolBtn(260, '导出坐标', function () {
      var json = BL.export();
      console.log('[豌豆镇][战斗布局]\n' + json);
      var lines = json.split('\n');
      if (lines.length > 36) lines = lines.slice(0, 36).concat(['……（其余 ' + (lines.length - 36) + ' 行见控制台）']);
      var t = s.add.text(W / 2, H / 2, lines.join('\n'), {
        fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#000000cc', color: '#8fff8f',
        padding: { x: 12, y: 10 }
      }).setOrigin(0.5).setDepth(1600).setScrollFactor(0).setInteractive({ useHandCursor: true });
      self.toast('坐标已显示，也可在控制台查看（点文字关闭）', H * 0.3);
      t.on('pointerdown', function () { t.destroy(); });
    });
    toolBtn(440, '重置默认', function () {
      BL.reset();
      location.replace(location.pathname + '?uiedit=1');
    });
    toolBtn(620, '完成退出', function () {
      location.replace(location.pathname);
    });
  };

  R.HUD = HUD;
  R.FONT = FONT;
})(window.RogueGame = window.RogueGame || {});
