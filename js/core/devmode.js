/* =========================================================
 * core/devmode.js —— 开发者测试模式（仅作者可用）
 * =========================================================
 * 三重锁，缺一不可：
 *   1) 地址带 ?dev=1（或 #dev）—— 普通玩家打开链接看不到任何入口
 *   2) 需要输入测试密码（改 AUTHOR_KEY 即可换成你自己的）
 *   3) 校验通过后写入 localStorage，且只在当前浏览器/当前域名有效
 *
 * 用法：
 *   打开  https://你的域名/?dev=1
 *   标题页右上角出现「测试」按钮 → 输入密码 → 进入测试面板
 *   想彻底关闭：把 DEV.ENABLED 改成 false 重新上传即可
 *
 * 也可以直接在地址栏用快捷口令（免进面板）：
 *   ?dev=1&key=你的密码&go=15        → 直接进第 15 关
 *   ?dev=1&key=你的密码&go=final     → 直接进终局 Boss
 * ========================================================= */
(function (R) {
  'use strict';

  var LS_KEY = 'pearogue.devtoken.v1';

  var DEV = R.Dev = {
    /* ---- 总开关：改成 false 则测试功能彻底不可用 ---- */
    ENABLED: true,

    /* ---- 测试密码：改成你自己的（建议改成别人猜不到的一串） ---- */
    AUTHOR_KEY: 'pea2024',

    /* 本次会话是否已解锁（内存态，每次刷新重算） */
    unlocked: false,

    /* 是否已通过校验 */
    isUnlocked: function () {
      if (!DEV.ENABLED) return false;
      if (DEV.unlocked) return true;
      try {
        if (localStorage.getItem(LS_KEY) === DEV._sig()) { DEV.unlocked = true; return true; }
      } catch (e) {}
      return false;
    },

    /* 校验密码 */
    unlock: function (key) {
      if (!DEV.ENABLED) return false;
      if (String(key).trim() !== DEV.AUTHOR_KEY) return false;
      DEV.unlocked = true;
      try { localStorage.setItem(LS_KEY, DEV._sig()); } catch (e) {}
      return true;
    },

    /* 退出测试模式（清掉本机授权） */
    lock: function () {
      DEV.unlocked = false;
      try { localStorage.removeItem(LS_KEY); } catch (e) {}
    },

    /* URL 里是否带了 ?dev=1（这是"入口是否存在"的开关） */
    hasUrlFlag: function () {
      try {
        var q = location.search + '&' + location.hash.replace(/^#/, '');
        return /[?&](dev=1|dev=true)/.test(q) || /[?&]dev(=|&|$)/.test(q + '&');
      } catch (e) { return false; }
    },

    /* 测试功能是否「可见」（地址带 flag 且总开关打开） */
    exposed: function () {
      return DEV.ENABLED && (DEV.hasUrlFlag() || DEV.isUnlocked());
    },

    /* URL 快捷参数：{ go, key, god, gold } */
    urlParams: function () {
      var out = {};
      try {
        var s = location.search.replace(/^\?/, '');
        s.split('&').forEach(function (kv) {
          if (!kv) return;
          var i = kv.indexOf('=');
          var k = decodeURIComponent(i < 0 ? kv : kv.slice(0, i));
          var v = i < 0 ? '1' : decodeURIComponent(kv.slice(i + 1));
          out[k] = v;
        });
      } catch (e) {}
      return out;
    },

    /* 启动时调用：把地址栏里的 key 换成正式授权（让后面所有判断都一致） */
    init: function () {
      if (!DEV.ENABLED || !DEV.hasUrlFlag()) return false;
      var p = DEV.urlParams();
      if (p.key) DEV.unlock(p.key);
      return DEV.isUnlocked();
    },

    /* 授权签名：绑定域名+密码，换域名/改密码自动失效 */
    _sig: function () {
      var s = DEV.AUTHOR_KEY + '|' + (location.host || 'local');
      var h = 0;
      for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
      return 'ok' + (h >>> 0).toString(36);
    }
  };
})(window.RogueGame = window.RogueGame || {});
