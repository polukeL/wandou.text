/* =========================================================
 * scenes/Title.js —— 标题页
 * v0.8.4：按「主界面效果图」重制为小镇主城布局
 *   顶部：玩家信息（头像/昵称/等级/经验条）+ 金币 + 声音开关
 *   中部：科研所 / 资源商店 / 两座建设中建筑（可点击）
 *   底部：公告 / 出战 / 排行榜
 * 素材缺失时自动回退到旧版布局（createLegacy）。
 * ========================================================= */
(function (R) {
  'use strict';
  var C = R.COLORS;

  /* =====================================================
   * 主城布局表（v0.8.6）
   * 坐标为 720×1280 设计稿基准，key 见 createCity。
   * 手动调整方式（推荐）：地址栏加 ?uiedit=1 进入编辑模式，
   *   直接拖动任意组件 → 松手自动保存（localStorage），
   *   点「导出」把 JSON 发给开发/粘贴回 CITY_DEFAULTS 即可定稿。
   * 也可以直接改下面 CITY_DEFAULTS 的数字。
   * ===================================================== */
  var CITY_LS = 'pearogue.citylayout.v2';   // v2：场景底换新图，旧草稿作废
  var CITY_DEFAULTS = {
    avatar:      { x: 57,  y: 50   },  // 头像（对准信息底圆形开口中心）
    coin:        { x: 441, y: 46   },  // 金币组（底框+图标+数字整体）
    snd:         { x: 668, y: 46   },  // 声音开关
    bld_lab:     { x: 184, y: 273  },  // 科研所（按参考图模板匹配）
    bld_build_a: { x: 559, y: 230  },  // 建设中·右上（按参考图模板匹配）
    bld_shop:    { x: 534, y: 519  },  // 资源商店（按参考图模板匹配）
    bld_build_b: { x: 178, y: 607, scale: 1.1 },  // 建设中·左中（参考图匹配，放大 1.1）
    bottom:      { x: 360, y: 1173 },  // 底部栏底板
    btn_notice:  { x: 140, y: 1178 },  // 公告按钮
    btn_battle:  { x: 360, y: 1170 },  // 出战按钮
    btn_rank:    { x: 580, y: 1181 }   // 排行榜按钮
  };
  /* 名字标签相对建筑中心的偏移（不单独拖动，跟随建筑） */
  var LABEL_OFFSET = {
    bld_lab:     { x: -5,  y: 104 },
    bld_build_a: { x: 3,   y: 10  },
    bld_shop:    { x: 0,   y: 61  },
    bld_build_b: { x: 4,   y: -62 }
  };

  R.CityLayout = {
    _draft: null,
    load: function () {
      if (this._draft) return this._draft;
      try { this._draft = JSON.parse(localStorage.getItem(CITY_LS) || '{}'); }
      catch (e) { this._draft = {}; }
      return this._draft;
    },
    /* 生效位置 = 草稿 > 默认 */
    pos: function (key) {
      var d = this.load()[key] || {};
      var def = CITY_DEFAULTS[key] || { x: 0, y: 0 };
      return { x: d.x !== undefined ? d.x : def.x, y: d.y !== undefined ? d.y : def.y };
    },
    scale: function (key) {
      var d = this.load()[key] || {};
      var def = CITY_DEFAULTS[key] || {};
      return d.scale !== undefined ? d.scale : (def.scale || 1);
    },
    set: function (key, x, y) {
      var d = this.load();
      d[key] = d[key] || {};
      d[key].x = Math.round(x); d[key].y = Math.round(y);
      try { localStorage.setItem(CITY_LS, JSON.stringify(d)); } catch (e) {}
    },
    export: function () {
      var d = this.load(), out = {};
      Object.keys(CITY_DEFAULTS).forEach(function (k) {
        var v = d[k] || {};
        var def = CITY_DEFAULTS[k];
        out[k] = {
          x: v.x !== undefined ? v.x : def.x,
          y: v.y !== undefined ? v.y : def.y
        };
        if (def.scale) out[k].scale = v.scale !== undefined ? v.scale : def.scale;
      });
      return JSON.stringify(out, null, 1);
    },
    reset: function () {
      this._draft = null;
      try { localStorage.removeItem(CITY_LS); } catch (e) {}
    },
    isEdited: function () { return Object.keys(this.load()).length > 0; }
  };

  function Title() { Phaser.Scene.call(this, { key: 'Title' }); }
  Title.prototype = Object.create(Phaser.Scene.prototype);
  Title.prototype.constructor = Title;

  Title.prototype.create = function () {
    // 主界面已出现：取消启动看门狗（v0.8.4），之后场景切换不再被误判为黑屏
    R.watchdogTitleSeen = true;
    if (R.WATCHDOG_CANCEL) R.WATCHDOG_CANCEL();

    // 后台贴图挂起替换（v0.8.3）：此刻本场景刚创建、上一场景已销毁、
    // 还没渲染第一帧，替换纹理是安全的，主角/怪物图从这里生效
    if (R.TILES_DIRTY) {
      R.TILES_DIRTY = false;
      try { R.applyRealArt(this); } catch (e) { console.warn('[豌豆镇] 贴图替换失败', e); }
    }

    // 场景大图后台加载（v0.8.2）：1600×1600 整图不阻塞任何界面
    if (R.loadTilesLater) {
      var self = this;
      this.time.delayedCall(100, function () { R.loadTilesLater(self); });
    }

    // 测试模式快捷开局：?dev=1&key=xxx&go=15 直接进关，不用手点
    if (R.Dev && R.Dev.ENABLED && R.Dev.isUnlocked()) {
      var p = R.Dev.urlParams();
      if (p.go || p.god || p.gold) {
        var selfDev = this;
        this.time.delayedCall(300, function () { selfDev.scene.start('Game'); });
        return;
      }
    }

    // v0.8.4：主界面重制版素材齐备 → 小镇主城布局；否则回退旧布局
    if (this.textures.exists('title2_bg') && this.textures.exists('title2_bottom')) {
      this.createCity();
    } else {
      this.createLegacy();
    }
  };

  /* =======================================================
   * 主城布局（v0.8.6，按主界面场景底效果图模板匹配定位）
   * 所有组件位置从 R.CityLayout 读取（草稿 > CITY_DEFAULTS）
   * ?uiedit=1 进入拖拽编辑模式，松手自动保存
   * ======================================================= */
  Title.prototype.createCity = function () {
    var self = this;
    var W = this.scale.width, H = this.scale.height;
    var D = R.DATA;
    var L = R.CityLayout;
    var edit = /uiedit=1/.test(location.search);

    // ---------- 背景：小镇场景图 ----------
    this.add.image(W / 2, H / 2, 'title2_bg').setDisplaySize(W, H).setDepth(-10);

    // ---------- 顶部：玩家信息底（固定贴图，不参与拖动） ----------
    this.add.image(158, 60, 'title2_info').setDepth(5);

    // 头像（效果图素材，点击进商店更换）
    var avP = L.pos('avatar');
    var av = this.add.image(avP.x, avP.y, 'title2_avatar').setDisplaySize(96, 96).setDepth(6);
    this.hit(av, 96, 96);
    av.on('pointerdown', function () {
      if (edit) return;   // 编辑模式：拖拽优先，不跳转商店
      R.Sfx.play('click');
      self.scene.start('Shop', { tab: 'avatar' });
    });

    // 昵称 + 等级 + 经验条（随信息底固定）
    var nameDef = R.Meta.avatarDef();
    this.add.text(112, 42, (nameDef && nameDef.name) || '豌豆仔', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '21px', fontStyle: 'bold',
      color: '#ffffff', stroke: '#33224a', strokeThickness: 4
    }).setOrigin(0, 0.5).setDepth(6);

    var best = 0;
    try { best = parseInt(localStorage.getItem('pearogue.best') || '0', 10) || 0; } catch (e) {}
    var lv = 1 + best;
    var expPct = best > 0 ? (best % 15) / 15 : 0;
    if (best >= 15) expPct = 1;
    this.add.text(112, 80, 'Lv.' + lv, {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '16px', fontStyle: 'bold',
      color: '#ffe14d', stroke: '#33224a', strokeThickness: 3
    }).setOrigin(0, 0.5).setDepth(6);
    this.add.image(214, 80, 'title2_expbg').setDisplaySize(94, 17).setDepth(6);
    if (expPct > 0) {
      this.add.image(214 - 47 + 2, 80, 'title2_expfill').setOrigin(0, 0.5)
        .setDisplaySize(90 * expPct, 12).setDepth(7);
    }

    // ---------- 顶部：金币组（底框 + 图标 + 数字，整体拖动） ----------
    var coinP = L.pos('coin');
    var coinG = this.add.container(coinP.x, coinP.y).setDepth(5);
    coinG.add(this.add.image(0, 0, 'title2_coinbg'));
    coinG.add(this.add.image(-53, -1, 'title2_coin'));
    var coinText = this.add.text(27, -1, String(R.Meta.gold | 0), {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '24px', fontStyle: 'bold',
      color: '#ffdd55', stroke: '#5a3a10', strokeThickness: 4
    }).setOrigin(0.5);
    coinG.add(coinText);

    // ---------- 顶部：声音开关 ----------
    var sndP = L.pos('snd');
    var snd = this.add.container(sndP.x, sndP.y).setDepth(6);
    snd.add(this.add.image(0, 0, 'title2_sndbg'));
    var sndIcon = this.add.image(2, 0, R.Sfx.muted ? 'title2_snd_off' : 'title2_snd_on');
    snd.add(sndIcon);
    this.hit(snd, 64, 64);
    snd.on('pointerdown', function () {
      if (edit) return;   // 编辑模式下拖动优先，不触发开关
      var on = R.Sfx.toggle();
      sndIcon.setTexture(on ? 'title2_snd_on' : 'title2_snd_off');
      R.Sfx.play('click');
    });

    // ---------- 中部：建筑（建筑+名字标签合为一个容器，整体拖动） ----------
    function building(key, artKey, label, iconKey, onTap, labelOff) {
      var p = L.pos(key);
      var sc = L.scale(key);
      var c = self.add.container(p.x, p.y).setDepth(3);
      var img = self.add.image(0, 0, artKey).setScale(sc);
      c.add(img);
      var lb = self.add.container(labelOff.x, labelOff.y).setDepth(4);
      lb.add(self.add.image(0, 0, 'title2_label'));
      var txt = self.add.text(0, 0, label, {
        fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '23px', fontStyle: 'bold',
        color: '#ffffff', stroke: '#22335c', strokeThickness: 4
      }).setOrigin(0.5);
      var hasIcon = iconKey && self.textures.exists(iconKey);
      if (hasIcon) {
        var gap = 8, icHalf = 17, tw = txt.width;
        var total = icHalf * 2 + gap + tw;
        var left = -total / 2;
        lb.add(self.add.image(left + icHalf, 0, iconKey));
        txt.setX(left + icHalf * 2 + gap + tw / 2);
      }
      lb.add(txt);
      c.add(lb);
      if (onTap) {
        self.hit(c, img.displayWidth + 20, img.displayHeight + 20);
        c.on('pointerdown', function () {
          if (edit) return;
          R.Sfx.unlock(); R.Sfx.play('click');
          c.setScale(0.96);
          self.time.delayedCall(80, function () {
            c.setScale(sc);
            onTap();
          });
        });
        c.on('pointerup', function () { if (!edit) c.setScale(sc); });
        c.on('pointerout', function () { if (!edit) c.setScale(sc); });
      }
      return c;
    }

    function underConstruction() {
      self.toast('该建筑建设中，敬请期待');
    }

    var bld_lab     = building('bld_lab', 'title2_bld_lab', '科研所', 'title2_ic_lab',
      function () { self.scene.start('Lab'); }, LABEL_OFFSET.bld_lab);
    var bld_build_a = building('bld_build_a', 'title2_bld_build', '建设中', null, underConstruction, LABEL_OFFSET.bld_build_a);
    var bld_shop    = building('bld_shop', 'title2_bld_shop', '资源商店', 'title2_ic_shop',
      function () { self.scene.start('Shop'); }, LABEL_OFFSET.bld_shop);
    var bld_build_b = building('bld_build_b', 'title2_bld_build', '建设中', null, underConstruction, LABEL_OFFSET.bld_build_b);

    // ---------- 底部：功能栏（底板与三按钮均为独立组件，可分别拖动） ----------
    var botP = L.pos('bottom');
    var bottomImg = this.add.image(botP.x, botP.y, 'title2_bottom').setDepth(6);

    function bottomBtn(key, artKey, onTap, redDot) {
      var p = L.pos(key);
      var b = self.add.container(p.x, p.y).setDepth(7);
      b.add(self.add.image(0, 0, artKey));
      if (redDot) {
        var seen = null;
        try { seen = localStorage.getItem('pearogue.notice.seen'); } catch (e) {}
        if (seen !== D.VERSION) {
          var dot = self.add.image(34, -46, 'title2_dot');
          b.add(dot);
          self.tweens.add({ targets: dot, scale: 1.15, duration: 700, yoyo: true, repeat: -1 });
        }
      }
      self.hit(b, 150, 130);
      b.on('pointerdown', function () {
        if (edit) return;
        R.Sfx.unlock(); R.Sfx.play('click');
        b.setScale(0.92);
        self.time.delayedCall(90, function () { b.setScale(1); onTap(); });
      });
      b.on('pointerup', function () { if (!edit) b.setScale(1); });
      return b;
    }

    var btnNotice = bottomBtn('btn_notice', 'title2_btn_notice', function () {
      try { localStorage.setItem('pearogue.notice.seen', D.VERSION); } catch (e) {}
      self.scene.start('Changelog');
    }, true);
    var btnBattle = bottomBtn('btn_battle', 'title2_btn_battle', function () { self.startGame(); });
    var btnRank = bottomBtn('btn_rank', 'title2_btn_rank', function () { self.scene.start('Board'); });

    // 底栏上方小字：版本 + 最远记录
    var foot = 'v' + D.VERSION;
    if (best > 0) foot += '  ·  最远到达：第 ' + best + ' 关';
    this.add.text(W / 2, H - 232, foot, {
      fontFamily: 'system-ui,sans-serif', fontSize: '17px', color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0.8).setShadow(0, 2, '#00000088', 3).setDepth(5);

    // 测试模式入口（仅 ?dev=1 可见）
    if (R.Dev && R.Dev.exposed()) this.buildDevEntry(40, H - 250);

    // 入场动画（编辑模式关闭动效便于对位）
    if (!edit) {
      var y0 = bottomImg.y;
      bottomImg.y = H + 40;
      this.tweens.add({ targets: bottomImg, y: y0, duration: 420, ease: 'Back.out' });
      this.cameras.main.fadeIn(260, 43, 29, 43);
    }

    // ---------- 拖拽编辑模式（?uiedit=1） ----------
    if (edit) this.enableCityEdit([
      { key: 'avatar', obj: av, w: 110, h: 110 }, { key: 'coin', obj: coinG, w: 224, h: 76 }, { key: 'snd', obj: snd },
      { key: 'bld_lab', obj: bld_lab }, { key: 'bld_build_a', obj: bld_build_a },
      { key: 'bld_shop', obj: bld_shop }, { key: 'bld_build_b', obj: bld_build_b },
      { key: 'bottom', obj: bottomImg }, { key: 'btn_notice', obj: btnNotice },
      { key: 'btn_battle', obj: btnBattle }, { key: 'btn_rank', obj: btnRank }
    ]);
  };

  /* ---------- ?uiedit=1：主城 UI 拖拽编辑 ----------
   * 拖动组件 → 松手即存 localStorage 草稿（刷新后仍生效）
   * 「导出」打印 JSON（粘贴回 CITY_DEFAULTS 定稿）
   * 「重置」清空草稿恢复默认；「完成」退出编辑模式 */
  Title.prototype.enableCityEdit = function (items) {
    var self = this;
    var W = this.scale.width, H = this.scale.height;
    var g = this.add.graphics().setDepth(90);
    g.fillStyle(0x000000, 0.55); g.fillRect(0, 0, W, 44);
    g.fillStyle(0x000000, 0.55); g.fillRect(0, H - 40, W, 40);
    this.add.text(W / 2, 22, 'UI 编辑模式：拖动组件调整位置（松手自动保存）', {
      fontFamily: 'system-ui,sans-serif', fontSize: '19px', color: '#ffe14d'
    }).setOrigin(0.5).setDepth(91);

    items.forEach(function (it) {
      var o = it.obj;
      // Container 若从未 setInteractive（如金币组）没有 input，先补一个居中命中区；
      // 否则拖拽时 hitAreaCallback 为 undefined 直接报错
      if (!o.input || !o.input.hitArea) {
        var iw = it.w || o.displayWidth || o.width || 100;
        var ih = it.h || o.displayHeight || o.height || 100;
        o.setSize(iw, ih);
        o.setInteractive({ useHandCursor: true });
      }
      /* 关键：对已有 input 的对象（建筑/按钮等），再次 setInteractive
       * 并不会注册拖拽。必须显式调用 input.setDraggable 才能拖动。 */
      self.input.setDraggable(o, true);
      o.input.cursor = 'move';

      var baseDepth = o.depth;
      o.on('dragstart', function () {
        o.setDepth(99).setAlpha(0.92);   // 提到最上层并高亮，方便对位
      });
      o.on('drag', function (pointer, dx, dy) {
        o.x = Math.round(Phaser.Math.Clamp(dx, 0, W));
        o.y = Math.round(Phaser.Math.Clamp(dy, 0, H));
      });
      o.on('dragend', function () {
        o.setDepth(baseDepth).setAlpha(1);
        R.CityLayout.set(it.key, o.x, o.y);
        self.toastLocal(it.key + ' → ' + o.x + ',' + o.y + '（已保存）');
      });
    });

    function toolBtn(x, label, fn) {
      var c = self.add.container(x, H - 20).setDepth(91);
      var bg = self.add.graphics();
      bg.fillStyle(0x2b1d2b, 0.9); bg.fillRoundedRect(-64, -15, 128, 30, 15);
      c.add(bg);
      c.add(self.add.text(0, 0, label, { fontSize: '15px', color: '#ffe9c9' }).setOrigin(0.5));
      self.hit(c, 128, 32);
      c.on('pointerdown', fn);
      return c;
    }
    toolBtn(90, '导出坐标', function () {
      var json = R.CityLayout.export();
      console.log('[豌豆镇][主城布局]\n' + json);
      var t = self.add.text(W / 2, H / 2, json, {
        fontFamily: 'monospace', fontSize: '13px', backgroundColor: '#000000cc', color: '#8fff8f',
        padding: { x: 12, y: 10 }
      }).setOrigin(0.5).setDepth(95).setInteractive({ useHandCursor: true });
      self.toastLocal('坐标已复制到弹窗，也可在控制台查看（点文字关闭）');
      t.on('pointerdown', function () { t.destroy(); });
    });
    toolBtn(360, '重置默认', function () {
      R.CityLayout.reset();
      location.replace(location.pathname + '?uiedit=1');
    });
    toolBtn(630, '完成退出', function () {
      location.replace(location.pathname);
    });
  };

  /* 编辑模式下的轻提示（不自动消失，2 秒后淡出） */
  Title.prototype.toastLocal = function (msg) {
    if (this._toastL) this._toastL.destroy();
    var c = this.add.container(360, 640).setDepth(96);
    var g = this.add.graphics();
    g.fillStyle(0x1d1428, 0.85); g.fillRoundedRect(-140, -22, 280, 44, 22);
    c.add(g);
    c.add(this.add.text(0, 0, msg, { fontSize: '17px', color: '#ffe9c9' }).setOrigin(0.5));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 120 });
    this.tweens.add({ targets: c, alpha: 0, delay: 1600, duration: 300, onComplete: function () { c.destroy(); } });
    this._toastL = c;
  };

  /* Container 交互区（居中）：Phaser Container setSize 后默认 origin=0.5
   * （displayOrigin=w/2,h/2），默认 hitArea (0,0,w,h) 即以容器中心为轴，
   * 直接 setSize + setInteractive 即可，不要手动偏移矩形。 */
  Title.prototype.hit = function (c, w, h) {
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    return c;
  };

  /* 轻量提示条（点击"建设中"建筑时） */
  Title.prototype.toast = function (msg) {
    if (this._toast) this._toast.destroy();
    var c = this.add.container(360, 700).setDepth(50);
    var g = this.add.graphics();
    g.fillStyle(0x1d1428, 0.85); g.fillRoundedRect(-150, -26, 300, 52, 26);
    c.add(g);
    c.add(this.add.text(0, 0, msg, {
      fontFamily: 'system-ui,sans-serif', fontSize: '20px', color: '#ffe9c9'
    }).setOrigin(0.5));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, y: 680, duration: 180, ease: 'Sine.out' });
    this.tweens.add({
      targets: c, alpha: 0, delay: 1400, duration: 260,
      onComplete: function () { c.destroy(); }
    });
    this._toast = c;
  };

  /* =======================================================
   * 旧版布局（素材缺失时的回退）
   * ======================================================= */
  Title.prototype.createLegacy = function () {
    var self = this;
    var W = this.scale.width, H = this.scale.height;
    var T = R.DATA.TEXT;

    // 背景：优先 assets/ui/title_bg.png，否则用代码绘制的渐变草地
    var bgSkin = this.add.image(W / 2, H / 2, 'uiskin_file_title_bg')
      .setDisplaySize(W, H).setDepth(-10);
    var hasBg = this.textures.exists('uiskin_file_title_bg');
    if (!hasBg) bgSkin.setVisible(false);

    var bg = this.add.graphics();
    if (!hasBg) {
      bg.fillGradientStyle(0xbfe36b, 0xbfe36b, 0x7ec850, 0x7ec850, 1);
      bg.fillRect(0, 0, W, H);
      // 装饰云朵
      for (var i = 0; i < 5; i++) {
        var cx = (i * 173 + 60) % W, cy = 90 + (i % 3) * 70;
        var cloud = this.add.image(cx, cy, 'blob_soft').setScale(1.6).setAlpha(0.5);
        cloud.setTint(0xffffff);
        this.tweens.add({ targets: cloud, x: cx + 30, duration: 3000 + i * 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }

    // 地面（有背景图时不画，避免盖住自定义背景）
    if (!hasBg) {
      var ground = this.add.graphics();
      ground.fillStyle(0x6cae3e, 1);
      ground.fillEllipse(W / 2, H + 60, W * 1.6, 460);
      ground.fillStyle(0x8ecc5a, 1);
      ground.fillEllipse(W / 2, H + 110, W * 1.6, 420);
    }

    // 主角大图（使用已装备的皮肤纹理，找不到才回退 player）
    var titleSkin = (R.Meta && R.Meta.skin) || 'skin_default';
    if (!this.textures.exists(titleSkin)) titleSkin = 'player';
    var hero = this.add.image(W / 2, H * 0.40, titleSkin).setScale(2.6);
    this.tweens.add({ targets: hero, y: hero.y - 16, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // 周围小怪
    var mobs = [['slime', 0.18, 0.55], ['bat', 0.84, 0.36], ['charger', 0.12, 0.72], ['spitter', 0.88, 0.66]];
    mobs.forEach(function (m, i) {
      var o = this.add.image(W * m[1], H * m[2], m[0]).setScale(1.5).setAlpha(0.95);
      this.tweens.add({ targets: o, y: o.y + 12, angle: i % 2 ? 8 : -8, duration: 900 + i * 220, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }, this);

    // 标题牌
    var plate = this.add.container(W / 2, H * 0.60);
    var plateSkin = R.UISkin.apply(this, 'title_plate', 0, 0, 500, 140);
    if (plateSkin) {
      plate.add(plateSkin);
    } else {
      var g = this.add.graphics();
      g.fillStyle(0x000000, 0.18); g.fillRoundedRect(-248, -66, 500, 140, 34);
      g.fillStyle(C.outline, 1);   g.fillRoundedRect(-254, -72, 500, 140, 34);
      g.fillStyle(0xfff6e2, 1);    g.fillRoundedRect(-246, -64, 484, 124, 28);
      plate.add(g);
    }
    var t1 = this.add.text(0, -26, T.title, {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '52px', fontStyle: 'bold', color: '#2b1d2b'
    }).setOrigin(0.5);
    var t2 = this.add.text(0, 26, T.titleEn, {
      fontFamily: 'system-ui,sans-serif', fontSize: '20px', color: '#7a6a68', letterSpacing: 2
    }).setOrigin(0.5);
    plate.add([t1, t2]);

    // 版本号 + 更新简介入口（点了打开更新日志）
    this.buildVersionBtn(W / 2, H * 0.60 + 100);

    // 开始按钮：优先用 UI 皮肤图（btn_start），否则代码绘制
    var btnY = H * 0.76;
    var btn = this.add.container(W / 2, btnY);
    var bskin = R.UISkin.apply(this, 'btn_start', 0, 0, 352, 96);
    var btnChildren = [];
    if (bskin) {
      btn.add(bskin);
    } else {
      var bg1 = this.add.graphics();
      bg1.fillStyle(0x000000, 0.25); bg1.fillRoundedRect(-172, -40, 352, 96, 48);
      bg1.fillStyle(C.outline, 1);   bg1.fillRoundedRect(-180, -48, 352, 96, 48);
      bg1.fillStyle(0xf9a825, 1);    bg1.fillRoundedRect(-172, -40, 336, 80, 40);
      bg1.fillStyle(0xffc93c, 1);    bg1.fillRoundedRect(-172, -40, 336, 52, 26);
      btnChildren.push(bg1);
    }
    var bt = this.add.text(-4, -2, '开始冒险', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#4a2c00'
    }).setOrigin(0.5);
    btnChildren.push(bt);
    btn.add(btnChildren);
    this.hit(btn, 352, 96);
    btn.input.cursor = 'pointer';
    btn.on('pointerdown', function () {
      R.Sfx.unlock(); R.Sfx.play('click');
      btn.setScale(0.94);
      this.time.delayedCall(90, function () { this.startGame(); }, [], this);
    }, this);
    btn.on('pointerup', function () { btn.setScale(1); });

    // 研究所入口（显示当前金币）
    var lab = this.buildSideBtn(W - 92, btnY, '研究所', '⛃ ' + R.Meta.gold, 0x9b5de5, 0xb585f0, 'Lab');
    // 商店入口
    this.buildSideBtn(92, btnY, '商 店', '金币购买装扮', 0xf9a825, 0xffc93c, 'Shop');

    // 头像 + 头像框（可替换；点击进商店）
    var avY = btnY + 108;
    var av = R.Avatar.add(this, W / 2, avY, 84, { depth: 5 });
    this.hit(av, 140, 140);
    av.input.cursor = 'pointer';
    av.on('pointerdown', function () {
      R.Sfx.play('click');
      self.scene.start('Shop', { tab: 'avatar' });
    });
    // 彩虹框缓慢旋转
    if (R.Meta.frame === 'fr_rainbow') R.Avatar.spinFrame(this, av, 9000);
    // 昵称条
    var nameDef = R.Meta.avatarDef();
    var avName = this.add.text(W / 2, avY + 60, nameDef ? nameDef.name : '豌豆仔', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '18px', fontStyle: 'bold',
      color: '#2b1d2b'
    }).setOrigin(0.5).setAlpha(0.85);

    // 通关时间榜入口
    var bestT = R.Meta.bestClear();
    var lbBtn = this.add.container(W / 2, avY + 104);
    var lbg = this.add.graphics();
    lbg.fillStyle(C.outline, 0.9); lbg.fillRoundedRect(-108, -19, 216, 38, 19);
    lbg.fillStyle(0x5a4a68, 1);    lbg.fillRoundedRect(-103, -15, 206, 30, 15);
    lbBtn.add(lbg);
    lbBtn.add(this.add.text(-92, 0, '🏆', { fontSize: '17px' }).setOrigin(0, 0.5));
    lbBtn.add(this.add.text(-64, -1, bestT ? '最佳 ' + R.Meta.fmtTime(bestT.time) : '通关时间榜', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#ffe14d'
    }).setOrigin(0, 0.5));
    this.hit(lbBtn, 216, 38);
    lbBtn.input.cursor = 'pointer';
    lbBtn.on('pointerdown', function () {
      R.Sfx.play('click');
      self.scene.start('Board');
    });

    // 提示（在通关榜入口 avY+104+19 ≈ btnY+231 之下，避免重叠）
    this.add.text(W / 2, H - 52, R.DATA.TEXT.hint, {
      fontFamily: 'system-ui,sans-serif', fontSize: '19px', color: '#3d5a20'
    }).setOrigin(0.5).setAlpha(0.9);

    // 音效开关
    this.buildSoundToggle(W - 56, 56);

    // 测试模式入口：只有地址带 ?dev=1 且密码校验通过才出现（详见 core/devmode.js）
    if (R.Dev && R.Dev.exposed()) this.buildDevEntry(56, 56);

    // 最佳记录
    var best = 0;
    try { best = parseInt(localStorage.getItem('pearogue.best') || '0', 10) || 0; } catch (e) {}
    if (best > 0) {
      this.add.text(W / 2, H - 76, '最远到达：第 ' + best + ' 关', {
        fontFamily: 'system-ui,sans-serif', fontSize: '18px', color: '#3d5a20'
      }).setOrigin(0.5).setAlpha(0.8);
    }

    // 动画入场
    plate.setScale(0.8).setAlpha(0);
    this.tweens.add({ targets: plate, scale: 1, alpha: 1, duration: 420, ease: 'Back.out' });
    hero.setAlpha(0);
    this.tweens.add({ targets: hero, alpha: 1, duration: 300 });
  };

  /* 版本号 + 更新简介按钮（旧布局用）
   * 内容来自 data.js 的 D.VERSION / D.CHANGELOG，点击进入 Changelog 场景
   */
  Title.prototype.buildVersionBtn = function (x, y) {
    var self = this;
    var D = R.DATA;
    var latest = (D.CHANGELOG && D.CHANGELOG[0]) || {};
    var c = this.add.container(x, y).setDepth(8);

    var label = 'v' + D.VERSION + '  ·  ' + (latest.title || '更新内容') + '  ›';

    // 宽度按文字估算，保证不溢出
    var estW = Math.max(240, label.length * 15 + 52);
    var g = this.add.graphics();
    g.fillStyle(0x2b1d2b, 0.28); g.fillRoundedRect(-estW / 2 + 2, -20, estW, 42, 21);
    g.fillStyle(0xfff6e2, 0.92); g.fillRoundedRect(-estW / 2, -22, estW, 42, 21);
    g.lineStyle(2.5, 0xc9b8a0, 0.9);
    g.strokeRoundedRect(-estW / 2, -22, estW, 42, 21);
    c.add(g);

    // 小圆点（提示有新内容）
    c.add(this.add.text(-estW / 2 + 18, -1, '🎉', { fontSize: '17px' }).setOrigin(0.5));

    c.add(this.add.text(6, -1, label, {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif',
      fontSize: '17px', fontStyle: 'bold', color: '#4a3a52'
    }).setOrigin(0.5));

    this.hit(c, estW, 42);
    c.input.cursor = 'pointer';
    c.on('pointerdown', function () {
      c.setScale(0.95);
      R.Sfx.play('click');
      self.time.delayedCall(70, function () { self.scene.start('Changelog'); });
    });
    c.on('pointerup', function () { c.setScale(1); });
    c.on('pointerout', function () { c.setScale(1); });
    return c;
  };

  /* 测试模式入口按钮（仅作者可见：?dev=1 + 密码） */
  Title.prototype.buildDevEntry = function (x, y) {
    var self = this;
    var c = this.add.container(x, y);
    var g = this.add.graphics();
    g.fillStyle(0xff5c8a, 0.9); g.fillCircle(0, 0, 30);
    g.fillStyle(0x2b1d2b, 1);   g.fillCircle(0, 0, 24);
    c.add(g);
    c.add(this.add.text(0, 0, '🔧', { fontSize: '24px' }).setOrigin(0.5));
    this.hit(c, 60, 60);
    c.input.cursor = 'pointer';
    c.on('pointerdown', function () {
      R.Sfx.play('click');
      R.DevPanel.open(self);
    });
    // 已解锁时角标提示
    if (R.Dev.isUnlocked()) {
      c.add(this.add.text(22, -22, '✓', {
        fontSize: '16px', color: '#6cc24a', fontStyle: 'bold'
      }).setOrigin(0.5));
    }
    return c;
  };

  /* 两侧功能按钮（研究所 / 商店，旧布局用） */
  Title.prototype.buildSideBtn = function (x, y, label, sub, colA, colB, sceneKey) {
    var self = this;
    var c = this.add.container(x, y);
    var g = this.add.graphics();
    g.fillStyle(C.outline, 1); g.fillRoundedRect(-84, -40, 168, 80, 40);
    g.fillStyle(colA, 1);      g.fillRoundedRect(-78, -34, 156, 68, 34);
    g.fillStyle(colB, 1);      g.fillRoundedRect(-78, -34, 156, 36, 18);
    c.add(g);
    c.add(this.add.text(0, -17, label, {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#3a2410'
    }).setOrigin(0.5));
    c.add(this.add.text(0, 14, sub, {
      fontFamily: 'system-ui,sans-serif', fontSize: '15px', color: '#fff3d0'
    }).setOrigin(0.5).setShadow(0, 1, '#00000066', 2));
    this.hit(c, 168, 80);
    c.input.cursor = 'pointer';
    c.on('pointerdown', function () {
      R.Sfx.unlock(); R.Sfx.play('click');
      c.setScale(0.94);
      self.time.delayedCall(90, function () { self.scene.start(sceneKey); });
    });
    c.on('pointerup', function () { c.setScale(1); });
    return c;
  };

  Title.prototype.buildSoundToggle = function (x, y) {
    var c = this.add.container(x, y);
    var g = this.add.graphics();
    g.fillStyle(C.outline, 0.85); g.fillCircle(0, 0, 30);
    g.fillStyle(0xfff6e2, 1); g.fillCircle(0, 0, 24);
    c.add(g);
    var label = this.add.text(0, 0, R.Sfx.muted ? '🔇' : '🔊', { fontSize: '26px' }).setOrigin(0.5);
    c.add(label);
    this.hit(c, 60, 60);
    c.input.cursor = 'pointer';
    c.on('pointerdown', function () {
      var on = R.Sfx.toggle(); label.setText(on ? '🔊' : '🔇');
      R.Sfx.play('click');
    });
  };

  Title.prototype.startGame = function () {
    this.cameras.main.fadeOut(160, 43, 29, 43);
    this.time.delayedCall(170, function () { this.scene.start('Game'); }, [], this);
  };

  R.SCENES.push(Title);
})(window.RogueGame = window.RogueGame || {});
