/* =========================================================
 * ui/layout.js —— HUD 布局表（可视化调整的数据源）
 * =========================================================
 * 所有 HUD 元素的位置/尺寸都集中在这张表里。
 * 默认值写在 DEFAULTS，改布局有三种方式（由简到繁）：
 *
 *  1) 直接改代码：改下面 DEFAULTS 里的数字（最可靠，适合定稿）
 *  2) 可视化拖拽：?dev=1 → 测试面板 →「UI 布局调试」→ 拖动元素
 *     （实时生效，存 localStorage 草稿，刷新后仍保留）
 *  3) 导出定稿：调试模式里点「导出配置」，把 JSON 粘贴回 DEFAULTS
 *
 * 坐标系：游戏基准 720×1280，(0,0) 在左上角。
 * key 对应 hud.js 里注册的元素，见 KEYS 注释。
 * ========================================================= */
(function (R) {
  'use strict';

  var LS_KEY = 'pearogue.uilayout.v1';

  /* 默认布局（定稿就改这里） */
  var DEFAULTS = {
    hp:        { x: 24,   y: 26  },   // 左上：血量心形容器
    hpText:    { x: 84,   y: 26  },   // 血量数字
    lvText:    { x: 26,   y: 86  },   // Lv 数字
    xp:        { x: 0,    y: 0, h: 12 }, // 顶部经验条（x 恒 0，h=高度）
    statText:  { x: 696,  y: 26  },   // 右上：计时/杀敌/金币（origin 右上）
    roomText:  { x: 360,  y: 26  },   // 顶部中：关卡进度
    banner:    { x: 360,  y: 435 },   // 中央大字（公告）
    bannerSub: { x: 360,  y: 501 },   // 公告副标题
    pauseBtn:  { x: 664,  y: 1140 },  // 暂停按钮（右下）
    muteBtn:   { x: 664,  y: 1220 },  // 音效开关（右下）
    shieldFx:  { x: 24,  y: 10  }    // 护盾格起始位置
  };

  var Layout = R.UILayout = {
    /* 生效值 = 草稿(localStorage) > 默认 */
    _draft: null,

    load: function () {
      if (Layout._draft) return Layout._draft;
      try {
        Layout._draft = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      } catch (e) { Layout._draft = {}; }
      return Layout._draft;
    },

    save: function () {
      try { localStorage.setItem(LS_KEY, JSON.stringify(Layout._draft)); } catch (e) {}
    },

    clear: function () {
      Layout._draft = {};
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
    },

    /* 取某元素的生效位置；def 是代码里的兜底默认值 */
    pos: function (key, defX, defY) {
      var d = Layout.load()[key] || {};
      return { x: d.x !== undefined ? d.x : defX, y: d.y !== undefined ? d.y : defY };
    },

    /* 取某元素的生效尺寸（如经验条高度） */
    size: function (key, defH) {
      var d = Layout.load()[key] || {};
      return { h: d.h !== undefined ? d.h : defH };
    },

    /* 调试模式设置位置（只写草稿，不影响 DEFAULTS） */
    set: function (key, x, y) {
      var d = Layout.load();
      d[key] = d[key] || {};
      d[key].x = Math.round(x);
      d[key].y = Math.round(y);
      Layout.save();
    },

    setH: function (key, h) {
      var d = Layout.load();
      d[key] = d[key] || {};
      d[key].h = Math.round(h);
      Layout.save();
    },

    hasDraft: function () { return Object.keys(Layout.load()).length > 0; }
  };
})(window.RogueGame = window.RogueGame || {});
