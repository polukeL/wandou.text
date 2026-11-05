/* =========================================================
 * scenes/Preload.js —— 生成占位图 + 可选覆盖正式资源
 * ========================================================= */
(function (R) {
  'use strict';

  R.SCENES = R.SCENES || [];

  function Preload() { Phaser.Scene.call(this, { key: 'Preload' }); }
  Preload.prototype = Object.create(Phaser.Scene.prototype);
  Preload.prototype.constructor = Preload;

  Preload.prototype.preload = function () {
    var self = this;
    var w = this.scale.width, h = this.scale.height;
    this._bootStart = Date.now();   // 最短显示时长计时起点（v0.8.3）

    /* ---------- 加载界面（v0.8.1：按效果图布局） ----------
     * 层级（depth 由小到大）：铺底纯色 < 背景插画 < 进度条 < 文字
     * 注意：所有 draw 调用都必须在 load.start() 之前完成，
     *       因为 load.start() 会在同一帧立刻开始传输，draw 会被跳过。 */
    // 1) 纯色铺底：等背景图加载期间不至于露出空白
    this.add.rectangle(w / 2, h / 2, w, h, 0x2b1d2b).setDepth(-3);

    // 2) 背景插画 + 标题 logo（v0.8.3）：优先直接复用 HTML 启动屏已加载的
    //    <img> 元素（浏览器缓存命中，零等待），第一帧就完整显示。
    //    注意：不能把 img 元素直接喂给 textures.addImage——它会读 CSS 布局尺寸
    //    （而非原图 naturalWidth），导致背景被 cover 放大变形；先画到 canvas。
    function takeDomImage(key, domId) {
      var el = document.getElementById(domId);
      if (el && el.complete && el.naturalWidth > 0 && !self.textures.exists(key)) {
        try {
          var c = document.createElement('canvas');
          c.width = el.naturalWidth;
          c.height = el.naturalHeight;
          c.getContext('2d').drawImage(el, 0, 0);
          self.textures.addCanvas(key, c);
          return true;
        } catch (e) { return false; }
      }
      return false;
    }
    function showBg(key) { self._addScreenBg(key); }
    function showLogo() {
      var src = self.textures.get('boot_logo_img').getSourceImage();
      var lw = w * 0.511;
      var lh = src && src.height ? lw * src.height / src.width : lw * 0.6;
      self.add.image(w / 2, h * 0.14 + lh / 2, 'boot_logo_img')
        .setDisplaySize(lw, lh).setDepth(2);
    }
    if (takeDomImage('boot_bg_img', 'boot-bg')) showBg('boot_bg_img');
    if (takeDomImage('boot_logo_img', 'boot-logo')) showLogo();

    // DOM 图还没就绪（慢网 HTML 阶段没下完）：加载期间持续轮询，
    // 一旦 HTML 的 <img> 完成就立即显示（通常比 loader 队列更快）
    var needBg = !this.textures.exists('boot_bg_img');
    var needLogo = !this.textures.exists('boot_logo_img');
    if (needBg || needLogo) {
      var polls = 0;
      var poll = this.time.addEvent({
        delay: 120, repeat: 30,
        callback: function () {
          polls++;
          if (needBg && takeDomImage('boot_bg_img', 'boot-bg')) { needBg = false; showBg('boot_bg_img'); }
          if (needLogo && takeDomImage('boot_logo_img', 'boot-logo')) { needLogo = false; showLogo(); }
          if ((!needBg && !needLogo) || polls > 30) poll.remove();
        }
      });
    }

    // 队列兜底：DOM 一直没就绪才走 loader（logo 放最前，最先下载）
    if (needLogo) {
      var logoUrl = R.RESOLVED && R.RESOLVED['boot_logo'];
      if (logoUrl) {
        this.load.image('boot_logo_img', logoUrl);
        this.load.once('filecomplete-image-boot_logo_img', showLogo);
      }
    }
    if (needBg) {
      var bgUrl = (R.RESOLVED && R.RESOLVED['boot_bg']) || 'assets/ui/boot_bg.png';
      this.load.image('boot_bg_img', bgUrl);
      this.load.once('filecomplete-image-boot_bg_img', function () { showBg('boot_bg_img'); });
    }

    // 3) 读条（368×40，位于屏幕 81.5% 高度处）
    var barW = 368, barH = 40, barY = h * 0.815;
    var barBg = this.add.rectangle(w / 2, barY, barW + 12, barH + 8, 0x1d1428)
      .setStrokeStyle(4, 0xfff6e2).setDepth(1);
    var bar = this.add.rectangle(w / 2 - barW / 2, barY, 0, barH - 8, 0x6cc24a)
      .setOrigin(0, 0.5).setDepth(2);
    var pctText = this.add.text(w / 2, barY, '0%', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#2b1d2b', strokeThickness: 3
    }).setOrigin(0.5).setDepth(3);
    var txt = this.add.text(w / 2, barY + 42, '资源加载中...', {
      fontFamily: '"Baloo 2","Fredoka",system-ui,sans-serif', fontSize: '22px', color: '#fff6e2'
    }).setOrigin(0.5).setDepth(3);

    /* 读条图片自定义（放图即生效，无需改代码）：
     *   assets/ui/loading_bar_bg.png   读条底图
     *   assets/ui/loading_bar_fill.png 读条填充图（按进度从左往右裁切显示）
     * 存在时替换默认矩形读条；图片按读条区域等比适配。
     * 候选路径已在启动前由 R.prepareAssets 探测，这里只加载确定存在的地址。 */
    var uiRes = R.RESOLVED || {};
    if (uiRes['loadbar_bg']) this.load.image('loadbar_bg', uiRes['loadbar_bg']);
    if (uiRes['loadbar_fill']) this.load.image('loadbar_fill', uiRes['loadbar_fill']);
    var imgs = { bg: null, fill: null };

    function texUsable(key) {
      var t = self.textures.get(key);
      return !!(t && t.key !== '__MISSING' && t.source && t.source[0] && t.source[0].width > 0);
    }

    function tryShowImages() {
      if (!imgs.bg && texUsable('loadbar_bg')) {
        imgs.bg = self.add.image(w / 2 - barW / 2, barY, 'loadbar_bg')
          .setOrigin(0, 0.5).setDisplaySize(barW + 12, barH + 8).setDepth(1);
        barBg.setVisible(false);
      }
      if (!imgs.fill && texUsable('loadbar_fill')) {
        imgs.fill = self.add.image(w / 2 - barW / 2, barY, 'loadbar_fill')
          .setOrigin(0, 0.5).setDisplaySize(barW - 8, barH - 8).setDepth(2);
        imgs.fill.setCrop(0, 0, 0, imgs.fill.height);
        bar.setVisible(false);
      }
    }
    this.load.on('filecomplete', function (key) {
      if (key === 'loadbar_bg' || key === 'loadbar_fill') tryShowImages();
    });
    this.load.on('progress', function (v) {
      pctText.setText(Math.round(v * 100) + '%');
      if (imgs.fill) {
        // 按进度裁切填充图（只显示左侧 v 比例）
        imgs.fill.setCrop(0, 0, imgs.fill.width * v, imgs.fill.height);
      } else {
        bar.width = (barW - 8) * v;
      }
    });

    // skipBigTiles=true：1600×1600 场景大图不进阻塞队列（v0.8.2），
    // 由 Title 场景后台加载，避免手机网络下读条卡住进不了游戏
    R.loadOptionalAssets(this, true);
    R.UISkin.loadStored(this);   // UI 皮肤：assets/ui/*.png + 前端上传的自定义图
  };

  Preload.prototype.create = function () {
    var self = this;
    // 背景插画兜底：加载事件没赶上也在这补（此阶段纹理一定已就绪）
    if (!this._bgShown) this._addScreenBg('boot_bg_img');
    R.Art.generate(this);
    R.Art.generateUI(this);      // UI 占位图
    R.Art.generateObstacles(this); // 建筑/障碍物占位图（ob_*）
    R.Art.generateSkins(this);     // 角色皮肤占位图（skin_*）
    R.Art.generatePet(this);       // 宠物系统贴图（蛋巢/蛋/宠物）
    R.Art.generateProps(this);     // 祭坛与泉水贴图
    R.applyRealArt(this);
    // 等待 localStorage 自定义皮肤纹理写入完成再进标题页；
    // 同时保证加载画面（背景插画 + logo + 读条）至少完整显示 1.2 秒，
    // 网络快时也不会一闪而过看不见 logo（v0.8.3）。
    var MIN_SHOW = 1200;
    R.UISkin.waitReady(function () {
      var left = MIN_SHOW - (Date.now() - (self._bootStart || 0));
      self.time.delayedCall(Math.max(0, left), function () { self.scene.start('Title'); });
    });
  };

  /* 铺一张全屏背景图（cover 方式：等比放大到铺满，超出部分裁掉，不拉伸变形） */
  Preload.prototype._addScreenBg = function (key) {
    if (this._bgShown || !this.textures.exists(key)) return null;
    var w = this.scale.width, h = this.scale.height;
    var img = this.add.image(w / 2, h / 2, key).setDepth(-2);
    var src = this.textures.get(key).getSourceImage();
    if (src && src.width && src.height) {
      img.setScale(Math.max(w / src.width, h / src.height));
      // 避免高图超出屏幕时把读条/文字挤出可见区以外的观感问题：居中即可
      img.setPosition(w / 2, h / 2);
    } else {
      img.setDisplaySize(w, h);
    }
    this._bgShown = true;
    return img;
  };

  R.SCENES.push(Preload);
})(window.RogueGame = window.RogueGame || {});
