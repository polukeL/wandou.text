/* =========================================================
 * core/boot.js —— 启动、缩放适配、资源（可选）加载
 * 设计目标：竖屏优先（微信里直接点开就能玩），横屏也能自适应。
 * ========================================================= */
(function (R) {
  'use strict';
  var BASE_W = 720, BASE_H = 1280;
  R.SCENES = R.SCENES || [];

  R.getSize = function () {
    var w = Math.min(window.innerWidth || 360, 900);
    var h = window.innerHeight || 720;
    return { w: w, h: h };
  };

  R.boot = function (parentId) {
    var size = R.getSize();
    var config = {
      type: Phaser.AUTO,
      parent: parentId || 'game',
      backgroundColor: '#2b1d2b',
      width: BASE_W,
      height: BASE_H,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: BASE_W,
        height: BASE_H
      },
      render: {
        antialias: true,
        roundPixels: false,
        powerPreference: 'high-performance'
      },
      fps: { target: 60, forceSetTimeOut: false },
      input: { activePointers: 2 },
      scene: R.SCENES || []
    };
    R.game = new Phaser.Game(config);
    return R.game;
  };

<<<<<<< HEAD
  /* =========================================================
   * 资源目录约定（v0.7.6 起支持分组）
   * =========================================================
   * 每个资源都有「首选路径」和「兼容路径」，加载时按顺序尝试，
   * 命中任意一个即可。也就是说：
   *   · 新用户：按分组放，如 assets/characters/skin_default.png
   *   · 老用户：仍放在 assets/ 根目录也能用（向后兼容，不会失效）
   * ------------------------------------------------------- */
  R.ASSET_DIRS = {
    characters: 'assets/characters/',   // 主角皮肤
    enemies:    'assets/enemies/',      // 小怪 / 精英 / Boss
    fx:         'assets/fx/',           // 子弹 / 粒子 / 投影
    pickups:    'assets/pickups/',      // 拾取物 / 宝箱
    world:      'assets/world/',        // 传送门 / 地面 tile
    props:      'assets/props/',        // 祭坛 / 泉水 / 宠物
    obstacles:  'assets/obstacles/',    // 建筑障碍
    avatars:    'assets/avatars/',      // 头像 / 头像框
    icons:      'assets/icons/',        // 升级卡图标
    ui:         'assets/ui/'            // UI 组件 / 加载界面
  };

  /* 每个 id 归属哪个分组（用于拼首选路径） */
  R.ASSET_GROUP = {
    // 角色
    player: 'characters',
    skin_default: 'characters', skin_night: 'characters', skin_ember: 'characters',
    skin_frost: 'characters', skin_royal: 'characters', skin_angel: 'characters',
    // 敌人
    slime: 'enemies', bat: 'enemies', charger: 'enemies', spitter: 'enemies',
    skull: 'enemies', skull_gold: 'enemies', golem: 'enemies', golem_hard: 'enemies',
    king_pea: 'enemies',
    // 特效
    bullet_pea: 'fx', bullet_seed: 'fx', blob: 'fx', blob_soft: 'fx', pet_ball: 'fx',
    // 拾取物
    pickup_gem: 'pickups', pickup_heart: 'pickups', pickup_maxhp: 'pickups',
    pickup_shield: 'pickups', pickup_coin: 'pickups', chest: 'pickups',
    // 世界
    portal: 'world', portal_swirl: 'world', tile: 'world',
    tile_ch1: 'world', tile_ch2: 'world', tile_ch3: 'world',
    // 道具/宠物
    pet_nest: 'props', pet_egg: 'props', pet_buddy: 'props',
    altar_bless: 'props', altar_curse: 'props', fountain: 'props',
    // 建筑
    ob_house: 'obstacles', ob_rock: 'obstacles', ob_tree: 'obstacles',
    ob_crate: 'obstacles', ob_bush: 'obstacles', ob_well: 'obstacles',
    ob_tomb: 'obstacles', ob_pillar: 'obstacles',
    // 头像
    av_pea: 'avatars', av_slime: 'avatars', av_bat: 'avatars',
    av_skull: 'avatars', av_king: 'avatars', av_golem: 'avatars',
    fr_basic: 'avatars', fr_leaf: 'avatars', fr_bone: 'avatars',
    fr_gold: 'avatars', fr_rainbow: 'avatars'
  };

  /* 某 id 的全部候选路径（首选分组 → 根目录兼容）
   * 特例：icon_xxx 属于升级卡图标，文件名去掉 icon_ 前缀放在 icons/ 下 */
  R.assetPaths = function (id) {
    if (id.indexOf('icon_') === 0) {
      var bare = id.slice(5);
      return [R.ASSET_DIRS.icons + bare + '.png',
              R.ASSET_DIRS.icons + id + '.png',
              'assets/' + id + '.png'];
    }
    var g = R.ASSET_GROUP[id];
    if (g) return [R.ASSET_DIRS[g] + id + '.png', 'assets/' + id + '.png'];
    return ['assets/' + id + '.png'];
  };

  /* 探测一个 URL 是否存在（HEAD 请求）。回调 done(exists) */
  R.probeUrl = function (url, done) {
    var finished = false;
    var xhr = new XMLHttpRequest();
    function fin(ok) { if (finished) return; finished = true; done(ok); }
    try {
      xhr.open('HEAD', url, true);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        // 200~299 或 304 → 存在；file:// 下 status 恒为 0，交给 load 兜底
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) fin(true);
        else fin(false);
      };
      xhr.onerror = function () { fin(false); };
      xhr.timeout = 4000;
      xhr.ontimeout = function () { fin(false); };
      xhr.send();
    } catch (e) { fin(false); }
  };

  /* 按候选顺序找出第一个真实存在的 URL，找不到返回 null */
  R.resolveAsset = function (paths, done) {
    var i = 0;
    function next() {
      if (i >= paths.length) { done(null); return; }
      var p = paths[i++];
      R.probeUrl(p, function (ok) {
        if (ok) done(p);
        else next();
      });
    }
    next();
  };

  /* ---------------------------------------------------------
   * 预解析资源路径（v0.7.6）
   * ---------------------------------------------------------
   * 每张可选图有两个候选地址（分组目录优先、根目录兼容），但 Phaser 的
   * load.image(key, [a, b]) 在 a 404 之后**不会**再试 b，所以必须先自己探测
   * 出真实存在的那个地址，再交给 loader 加载。
   *
   * 做法：启动前用 HEAD 请求把所有候选路径探测一遍，结果写进
   *       R.RESOLVED[目标key] = 真实url（不存在则不写 = 该图用占位图）
   * 加载阶段就是普通的单地址 load.image，永远不会 404。
   * ------------------------------------------------------- */
  R.RESOLVED = {};        // 目标纹理 key -> 真实 url
  R.MISSING = [];         // 探测失败（真的没有素材）的 id，仅用于日志

  /* 收集所有「可被覆盖」的目标纹理 key（去重，key 即文件名） */
  R.realArtKeys = function () {
    var ids = [], seen = {};
    function push(id) { if (id && !seen[id]) { seen[id] = 1; ids.push(id); } }
    (R.DATA.ART || []).forEach(function (a) { push(a.id); });
    (R.DATA.SKINS || []).forEach(function (s) { if (s && s.id) push(s.id); });
    (R.DATA.CHAPTERS || []).forEach(function (ch) { push('tile_ch' + ch.id); });
    push('tile');
    push('blob_soft');   // 脚下投影（D.ART 里本来就有，这里显式保证）
    // UI 组件（skin.js 的清单）：加载到 uiskin_file_<id>
    (R.UISkin_IDS || []).forEach(function (id) { push(id); });
    // 加载界面读条
    push('loadbar_bg'); push('loadbar_fill');
    // 升级卡图标：占位图 key 是 icon_<name>，真实图放 assets/icons/<name>.png
    (R.UI_ICONS || []).forEach(function (n) { push('icon_' + n); });
    return ids;
  };

  /* 并发探测所有候选路径。done() 保证只回调一次 */
  R.prepareAssets = function (done) {
    var ids = R.realArtKeys();
    var left = ids.length;
    var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    if (!left) { done(); return; }
    ids.forEach(function (id) {
      R.resolveAsset(R.assetPaths(id), function (url) {
        if (url) R.RESOLVED[id] = url;
        left--;
        if (left === 0) {
          var n = Object.keys(R.RESOLVED).length;
          var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
          console.info('[豌豆镇] 资源探测完成：命中 ' + n + '/' + ids.length +
                       ' 个可选素材（' + Math.round(t1 - t0) + 'ms）');
          done();
        }
      });
=======
  /* 可选的正式音频/贴图预加载：
   * 如果 assets/ 下放了同名文件会自动覆盖占位图；没有就用占位。 */
  R.loadOptionalAssets = function (scene) {
    var files = (R.DATA.ART || []).map(function (a) { return { key: a.id, path: 'assets/' + a.id + '.png' }; });
    // 皮肤贴图同样支持 assets/skin_xxx.png 覆盖（主角实际渲染用的是皮肤纹理）
    (R.DATA.SKINS || []).forEach(function (s) {
      if (s && s.id) files.push({ key: s.id, path: 'assets/' + s.id + '.png' });
    });
    var audio = ['bgm_main', 'shoot', 'hit', 'kill', 'hurt', 'pickup', 'level', 'coin', 'heal', 'reward', 'boss'];
    files.forEach(function (f) {
      if (!scene.textures.exists(f.key + '_real')) scene.load.image(f.key + '_real', f.path);
>>>>>>> 2ff3b08ccc2a4f9637f71f978faede96af490ac8
    });
  };

  /* 可选的正式音频/贴图预加载：
   * assets/ 分组目录下放了同名文件会自动覆盖占位图；没有就用占位。 */
  R.loadOptionalAssets = function (scene) {
    var keys = R.realArtKeys();
    var hit = [], miss = [];
    keys.forEach(function (id) {
      var url = R.RESOLVED[id];
      if (url) hit.push(id);
      else miss.push(id);
    });
    // 正式贴图 → <id>_real，create() 阶段再由 applyRealArt 覆盖 <id>
    hit.forEach(function (id) {
      if (!scene.textures.exists(id + '_real')) scene.load.image(id + '_real', R.RESOLVED[id]);
    });
    if (miss.length) console.info('[豌豆镇] 使用占位图（未找到素材）: ' + miss.join(', '));

    // 音效（可选，找不到就静音，不影响游戏）
    var audio = ['bgm_main', 'shoot', 'hit', 'kill', 'hurt', 'pickup', 'level', 'coin', 'heal', 'reward', 'boss'];
    audio.forEach(function (k) {
      scene.load.audio('a_' + k, ['assets/audio/' + k + '.mp3', 'assets/audio/' + k + '.ogg']);
    });
    var failedArt = [];
    scene.load.on('loaderror', function (file) {
      var src = (file && file.src ? file.src : '') + '';
<<<<<<< HEAD
      var key = (file && file.key) ? file.key : '';
      // 只提示正式贴图失败（音效、UI 属于可选资源，404 是正常情况）
      if (/_real$/.test(key)) failedArt.push(src || key);
    });
    scene.load.once('complete', function () {
      if (failedArt.length) {
        console.warn('[豌豆镇] 以下贴图文件存在但解码失败（未生效）：\n  ' + failedArt.join('\n  ') +
          '\n请确认：1) 文件是真正的 PNG 且未损坏；2) 通过 http:// 访问而不是 file:// 双击打开；3) 浏览器无缓存（Ctrl+F5 强刷）');
=======
      // 只提示角色/皮肤贴图失败（音效、UI 属于可选资源，404 是正常情况）
      var isArt = (R.DATA.ART || []).some(function (a) { return src.indexOf('assets/' + a.id + '.png') >= 0; }) ||
                  (R.DATA.SKINS || []).some(function (s) { return s && src.indexOf('assets/' + s.id + '.png') >= 0; });
      if (isArt) failedArt.push(src);
    });
    scene.load.once('complete', function () {
      if (failedArt.length) {
        console.warn('[豌豆镇] 以下角色/皮肤贴图加载失败（未生效）：\n  ' + failedArt.join('\n  ') +
          '\n请确认：1) 文件确实在 assets/ 目录且扩展名为 .png；2) 通过 http:// 访问而不是 file:// 双击打开；3) 浏览器无缓存（Ctrl+F5 强刷）');
>>>>>>> 2ff3b08ccc2a4f9637f71f978faede96af490ac8
      }
    });
  };

  /* 把 assets 下成功加载的真实贴图替换占位图 */
  R.applyRealArt = function (scene) {
    var defs = (R.DATA.ART || []).slice();
    (R.DATA.SKINS || []).forEach(function (s) { if (s && s.id) defs.push({ id: s.id }); });
<<<<<<< HEAD
    (R.UI_ICONS || []).forEach(function (n) { defs.push({ id: 'icon_' + n }); });
    // 场景图（固定 1600×1600）：tile / tile_ch1~3
    (R.realArtKeys() || []).forEach(function (id) {
      if (id === 'tile' || id.indexOf('tile_ch') === 0) defs.push({ id: id });
    });
=======
>>>>>>> 2ff3b08ccc2a4f9637f71f978faede96af490ac8
    var applied = [];
    defs.forEach(function (a) {
      var realKey = a.id + '_real';
      if (scene.textures.exists(realKey)) {
        var src = scene.textures.get(realKey).getSourceImage();
        if (scene.textures.exists(a.id)) scene.textures.remove(a.id);
        scene.textures.addImage(a.id, src);
        applied.push(a.id);
      }
    });
    if (applied.length) {
      console.info('[豌豆镇] 已替换的正式贴图: ' + applied.join(', '));
    } else {
      console.info('[豌豆镇] 未检测到任何正式贴图（assets/ 下没有可用的 <id>.png，或加载失败）');
    }
  };
})(window.RogueGame = window.RogueGame || {});
