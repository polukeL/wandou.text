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

    /* 看门狗（v0.8.3）：部分环境在加载完成后偶发不触发场景切换
     * （渲染循环暂停/事件丢失/场景创建异常等），导致黑屏或卡在加载界面。
     * 12 秒后检查：只要没进入标题页且加载队列已完成，就自动恢复
     * （第一次刷新页面重试，带 recovered 标记防止循环刷新）。
     * v0.8.4：进入标题页即取消看门狗——之后任何正常的场景切换瞬间
     * （Title/Game 互相 start/stop）都可能让"当前无活跃场景"短暂成立，
     * 不能被误判为黑屏而刷新页面。 */
    var watchdogTimer = setTimeout(function check() {
      try {
        if (R.watchdogTitleSeen) return;   // 主界面出现过 → 永不干预
        var g = R.game;
        if (!g || !g.scene) return;
        var title = g.scene.getScene('Title');
        var gameS = g.scene.getScene('Game');
        var pre = g.scene.getScene('Preload');
        if ((title && title.scene.isActive()) || (gameS && gameS.scene.isActive())) return;
        // 还在正常加载中（进度未满）则再等等，不干预
        if (pre && pre.scene.isActive() && pre.load.progress < 1) {
          watchdogTimer = setTimeout(check, 4000);
          return;
        }
        if (location.search.indexOf('recovered=1') >= 0) {
          console.warn('[豌豆镇] 看门狗：第二次仍未进入主界面，强制重启标题页');
          if (pre) pre.scene.stop();
          g.scene.start('Title');
        } else {
          console.warn('[豌豆镇] 看门狗：加载后未进入主界面，自动刷新重试');
          location.replace(location.pathname + '?recovered=1' + location.hash);
        }
      } catch (e) { /* 静默 */ }
    }, 12000);
    R.WATCHDOG_CANCEL = function () { if (watchdogTimer) { clearTimeout(watchdogTimer); watchdogTimer = null; } };

    return R.game;
  };

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
    audio:      'assets/audio/',        // 音效（mp3 / ogg）
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
    slime_elite: 'enemies', bat_elite: 'enemies', charger_elite: 'enemies',
    spitter_elite: 'enemies', skull_elite: 'enemies',
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
    fr_gold: 'avatars', fr_rainbow: 'avatars',
    // 加载界面 / 主界面大图（v0.8.1）：全部放 assets/ui/
    boot_bg: 'ui', boot_logo: 'ui', title_bg: 'ui', title_plate: 'ui',
    loadbar_bg: 'ui', loadbar_fill: 'ui'
  };

  /* 某 id 的全部候选路径（首选分组 → 根目录兼容）
   * 特例：icon_xxx 属于升级卡图标，文件名去掉 icon_ 前缀放在 icons/ 下 */
  R.assetPaths = function (id) {
    // 建筑章节组合（v0.8.0）：ob_house_ch1 →
    //   ① assets/obstacles/ch1/ob_house.png     （章节子目录，推荐）
    //   ② assets/obstacles/ob_house_ch1.png     （平铺命名）
    //   ③ assets/obstacles/ob_house.png         （通用建筑，不分章）
    //   ④ assets/ob_house.png                   （旧路径兼容）
    var m = /^(ob_.+)_ch(\d+)$/.exec(id);
    if (m) {
      return [
        R.ASSET_DIRS.obstacles + 'ch' + m[2] + '/' + m[1] + '.png',
        R.ASSET_DIRS.obstacles + id + '.png',
        R.ASSET_DIRS.obstacles + m[1] + '.png',
        'assets/' + id + '.png'
      ];
    }
    if (id.indexOf('icon_') === 0) {
      var bare = id.slice(5);
      return [R.ASSET_DIRS.icons + bare + '.png',
              R.ASSET_DIRS.icons + id + '.png',
              'assets/' + id + '.png'];
    }
    // 音效（v0.8.2）：aud_bgm_main → assets/audio/bgm_main.mp3 / .ogg
    if (id.indexOf('aud_') === 0) {
      var name = id.slice(4);
      return [R.ASSET_DIRS.audio + name + '.mp3',
              R.ASSET_DIRS.audio + name + '.ogg'];
    }
    // 场景大图（v0.8.3）：JPG 优先（体积只有 PNG 的十分之一），
    // 也兼容线上残留的旧 PNG（即使没删掉也能被 JPG 抢先命中）
    if (id === 'tile' || id.indexOf('tile_ch') === 0) {
      return [R.ASSET_DIRS.world + id + '.jpg',
              R.ASSET_DIRS.world + id + '.png',
              'assets/' + id + '.jpg',
              'assets/' + id + '.png'];
    }
    // 启动图（v0.8.3）：boot_bg 为 JPG（不透明大图），其余 png 优先
    if ((R.SCREEN_BG_IDS || []).indexOf(id) >= 0) {
      return [R.ASSET_DIRS.ui + id + '.png',
              R.ASSET_DIRS.ui + id + '.jpg',
              'assets/' + id + '.png',
              'assets/' + id + '.jpg'];
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

  /* 精英怪变体清单（v0.8.0）：这些怪出精英时会换 <n>_elite 造型 */
  R.ELITE_ART = ['slime', 'bat', 'charger', 'spitter', 'skull'];

  /* 建筑贴图清单（v0.8.0）：与 D.OBSTACLES.types 的 art 字段保持一致，
   * 每个建筑可为每章单独出图：ob_xxx_ch1.png / ob_xxx_ch2.png / ob_xxx_ch3.png */
  R.OBSTACLE_ARTS = ['ob_house', 'ob_rock', 'ob_tree', 'ob_crate',
                     'ob_bush', 'ob_well', 'ob_tomb', 'ob_pillar'];

  /* 加载界面 / 主界面大图（v0.8.1）：均为 assets/ui/ 下的整张图，全屏铺满使用。
   *   boot_bg     启动屏 + 加载场景背景插画  建议 720×1280（竖屏全屏）
   *   boot_logo   启动屏正中标题 logo        建议宽 720 以内、透明底 PNG
   *   title_bg    主界面背景                 建议 720×1280
   *   title_plate 主界面标题牌底板           建议 500×140
   * 这四张不参与占位图替换，也不按 displaySize 缩放为小尺寸，单独处理。 */
  R.SCREEN_BG_IDS = ['boot_bg', 'boot_logo', 'title_bg', 'title_plate'];

  /* 场景大图（v0.8.2）：1600×1600 整图，体积大（数百 KB～数 MB/张）。
   * 不放进 Preload 阻塞队列（否则手机上读条卡住进不了主界面），
   * 由 Title 场景 R.loadTilesLater 后台加载，加载完成地面自动换新图。 */
  R.BIG_TILE_IDS = ['tile', 'tile_ch1', 'tile_ch2', 'tile_ch3'];

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
    // 加载界面 / 主界面大图（v0.8.1）：boot_bg / boot_logo / title_bg / title_plate
    (R.SCREEN_BG_IDS || []).forEach(function (id) { push(id); });
    // 音效（v0.8.2）：aud_<name>，探测 assets/audio/<name>.mp3 / .ogg
    ['bgm_main', 'shoot', 'hit', 'kill', 'hurt', 'pickup', 'level', 'coin', 'heal', 'reward', 'boss']
      .forEach(function (k) { push('aud_' + k); });
    // 场景大图（v0.8.2）：探测但不进 Preload 阻塞队列，见 R.BIG_TILE_IDS
    R.BIG_TILE_IDS.forEach(function (id) { push(id); });
    // 升级卡图标：占位图 key 是 icon_<name>，真实图放 assets/icons/<name>.png
    (R.UI_ICONS || []).forEach(function (n) { push('icon_' + n); });
    // 精英怪变体（v0.8.0）：<art>_elite
    (R.ELITE_ART || []).forEach(function (n) { push(n + '_elite'); });
    // 建筑章节组合（v0.8.0）：ob_xxx_ch<章节id>
    (R.DATA.CHAPTERS || []).forEach(function (ch) {
      (R.OBSTACLE_ARTS || []).forEach(function (a) { push(a + '_ch' + ch.id); });
    });
    // 加载界面 / 主界面大图（v0.8.1）
    (R.SCREEN_BG_IDS || []).forEach(function (id) { push(id); });
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
    });
  };

  /* 可选的正式音频/贴图预加载：
   * assets/ 分组目录下放了同名文件会自动覆盖占位图；没有就用占位。 */
  R.loadOptionalAssets = function (scene, skipBigTiles) {
    var keys = R.realArtKeys();
    var hit = [], miss = [];
    keys.forEach(function (id) {
      var url = R.RESOLVED[id];
      if (url) hit.push(id);
      else miss.push(id);
    });
    // 正式贴图 → <id>_real，create() 阶段再由 applyRealArt 覆盖 <id>
    // （aud_ 前缀是音效，由 load.audio 处理；skipBigTiles 时场景大图
    //   也不进队列——1600×1600 整图体积大，阻塞在 Preload 会让手机读条卡住）
    hit.forEach(function (id) {
      if (id.indexOf('aud_') === 0) return;
      if (skipBigTiles && R.BIG_TILE_IDS.indexOf(id) >= 0) return;
      if (!scene.textures.exists(id + '_real')) scene.load.image(id + '_real', R.RESOLVED[id]);
    });
    if (miss.length) console.info('[豌豆镇] 使用占位图（未找到素材）: ' + miss.join(', '));

    // 音效（可选，找不到就静音，不影响游戏）
    // v0.8.2 修复：不再盲加载 mp3/ogg 双候选——audio 目录为空时，404 返回的 HTML
    // 会被部分浏览器（微信 X5 等）当作音频长时间解码，load 队列挂起、
    // 读条 100% 也进不了主界面。现在音频也走启动前探测，只有真实存在才进队列。
    var audio = ['bgm_main', 'shoot', 'hit', 'kill', 'hurt', 'pickup', 'level', 'coin', 'heal', 'reward', 'boss'];
    audio.forEach(function (k) {
      var url = R.RESOLVED['aud_' + k];
      if (url) scene.load.audio('a_' + k, url);
    });
    var failedArt = [];
    scene.load.on('loaderror', function (file) {
      var src = (file && file.src ? file.src : '') + '';
      var key = (file && file.key) ? file.key : '';
      // 只提示正式贴图失败（音效、UI 属于可选资源，404 是正常情况）
      if (/_real$/.test(key)) failedArt.push(src || key);
    });
    scene.load.once('complete', function () {
      if (failedArt.length) {
        console.warn('[豌豆镇] 以下贴图文件存在但解码失败（未生效）：\n  ' + failedArt.join('\n  ') +
          '\n请确认：1) 文件是真正的 PNG 且未损坏；2) 通过 http:// 访问而不是 file:// 双击打开；3) 浏览器无缓存（Ctrl+F5 强刷）');
      }
    });
  };

  /* 场景大图后台加载（v0.8.2）：Title 场景创建后调用。
   * 1600×1600 整图体积大，不阻塞任何界面；下载完成后 applyRealArt
   * 用同名 key 覆盖纹理，正在显示/之后进入的对局地面自动换成正式图。
   * 没加载完之前 Game.attachFloor 会用占位色块兜底，不影响游玩。 */
  R.loadTilesLater = function (scene) {
    var pending = 0;
    R.BIG_TILE_IDS.forEach(function (id) {
      var url = R.RESOLVED[id];
      if (!url) return;
      var key = id + '_real';
      if (scene.textures.exists(key)) return;
      scene.load.image(key, url);
      pending++;
    });
    if (!pending) return;
    console.info('[豌豆镇] 场景大图后台加载中（' + pending + ' 张，不阻塞进入游戏）');
    scene.load.once('complete', function () {
      // v0.8.3 关键规则：游戏启动后，标题页/战斗页随时可能正在渲染
      // player、skin、怪物等纹理——任何时刻的 remove 都会让 WebGL 读到
      // 空 glTexture 而崩溃黑屏。因此这里【只做标记】，真正的替换放在
      // 场景切换的安全间隙（Title.create / Game.attachFloor 开头，
      // 此时上一场景已销毁、新场景还没渲染第一帧）。
      R.TILES_DIRTY = true;
    });
    scene.load.start();
  };

  /* 把 assets 下成功加载的真实贴图替换占位图 */
  R.applyRealArt = function (scene) {
    var defs = (R.DATA.ART || []).slice();
    (R.DATA.SKINS || []).forEach(function (s) { if (s && s.id) defs.push({ id: s.id }); });
    (R.UI_ICONS || []).forEach(function (n) { defs.push({ id: 'icon_' + n }); });
    // 场景图（固定 1600×1600）：tile / tile_ch1~3
    (R.realArtKeys() || []).forEach(function (id) {
      if (id === 'tile' || id.indexOf('tile_ch') === 0) defs.push({ id: id });
    });
    // 精英怪变体（v0.8.0）：<art>_elite
    (R.ELITE_ART || []).forEach(function (n) { defs.push({ id: n + '_elite' }); });
    // 建筑章节组合（v0.8.0）：ob_xxx_ch<章节id>
    (R.DATA.CHAPTERS || []).forEach(function (ch) {
      (R.OBSTACLE_ARTS || []).forEach(function (a) { defs.push({ id: a + '_ch' + ch.id }); });
    });
    var applied = [];
    defs.forEach(function (a) {
      // 加载界面 / 主界面大图（v0.8.1）：单独加载到 <id>_real，
      // 由各自的场景直接读取，不参与占位图覆盖（避免误删原 key）。
      if ((R.SCREEN_BG_IDS || []).indexOf(a.id) >= 0) return;
      var realKey = a.id + '_real';
      if (!scene.textures.exists(realKey)) return;
      var src = scene.textures.get(realKey).getSourceImage();
      // v0.8.3 修复：优先用 setSource 原地替换纹理源——textures.remove 会
      // 销毁 WebGL 纹理，如果某场景正在渲染这张图（如战斗中的地面），
      // 下一帧 batchSprite 读 glTexture 直接崩溃黑屏。setSource 平滑替换。
      if (scene.textures.exists(a.id)) {
        var tex = scene.textures.get(a.id);
        if (tex && tex.setSource) {
          try { tex.setSource(0, src); applied.push(a.id); return; } catch (e) { /* 回退到 remove */ }
        }
        scene.textures.remove(a.id);
      }
      scene.textures.addImage(a.id, src);
      applied.push(a.id);
    });
    if (applied.length) {
      console.info('[豌豆镇] 已替换的正式贴图: ' + applied.join(', '));
    } else {
      console.info('[豌豆镇] 未检测到任何正式贴图（assets/ 下没有可用的 <id>.png，或加载失败）');
    }
  };
})(window.RogueGame = window.RogueGame || {});
