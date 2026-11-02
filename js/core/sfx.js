/* =========================================================
 * core/sfx.js —— 极简合成音效（无外部音频文件）
 * 同时保留接口：若 assets/audio/<name>.mp3 存在则优先播放
 * ========================================================= */
(function (R) {
  'use strict';

  var ctx = null;
  var muted = false;
  try { muted = localStorage.getItem('pearogue.muted') === '1'; } catch (e) {}

  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(o) {
    var c = ac(); if (!c) return;
    var t0 = c.currentTime + (o.delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + o.dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(o.vol || 0.1, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t0); osc.stop(t0 + o.dur + 0.02);
  }

  function noise(dur, vol, filterFreq) {
    var c = ac(); if (!c) return;
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(); src.buffer = buf;
    var flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = filterFreq || 1200;
    var g = c.createGain(); g.gain.value = vol || 0.15;
    src.connect(flt); flt.connect(g); g.connect(c.destination);
    src.start();
  }

  var LIB = {
    shoot:   function () { tone({ f0: 720, f1: 420, dur: 0.07, type: 'square', vol: 0.05 }); },
    shot:    function () { noise(0.1, 0.1, 2600); },
    boomer:  function () { tone({ f0: 300, f1: 900, dur: 0.18, type: 'triangle', vol: 0.06 }); },
    ball:    function () { tone({ f0: 180, f1: 90, dur: 0.18, type: 'sawtooth', vol: 0.06 }); },
    bubble:  function () { tone({ f0: 900, f1: 1400, dur: 0.08, type: 'sine', vol: 0.04 }); },
    ring:    function () { tone({ f0: 520, f1: 760, dur: 0.14, type: 'sine', vol: 0.05 }); },
    hit:     function () { tone({ f0: 220, f1: 120, dur: 0.05, type: 'square', vol: 0.03 }); },
    kill:    function () { tone({ f0: 300, f1: 80, dur: 0.16, type: 'triangle', vol: 0.07 }); noise(0.12, 0.08, 900); },
    hurt:    function () { tone({ f0: 200, f1: 60, dur: 0.28, type: 'sawtooth', vol: 0.12 }); },
    pickup:  function () { tone({ f0: 980, f1: 1320, dur: 0.06, type: 'sine', vol: 0.035 }); },
    coin:    function () { tone({ f0: 1100, dur: 0.06, type: 'square', vol: 0.05 }); tone({ f0: 1500, dur: 0.08, type: 'square', vol: 0.05, delay: 0.06 }); },
    heal:    function () { tone({ f0: 600, f1: 1100, dur: 0.18, type: 'sine', vol: 0.08 }); },
    level:   function () { [523, 659, 784, 1047].forEach(function (f, i) { tone({ f0: f, dur: 0.14, type: 'triangle', vol: 0.07, delay: i * 0.07 }); }); },
    reward:  function () { [440, 554, 659, 880].forEach(function (f, i) { tone({ f0: f, dur: 0.16, type: 'square', vol: 0.05, delay: i * 0.08 }); }); },
    select:  function () { tone({ f0: 660, f1: 880, dur: 0.07, type: 'triangle', vol: 0.06 }); },
    dash:    function () { noise(0.14, 0.08, 1600); },
    boss:    function () { [196, 165, 131].forEach(function (f, i) { tone({ f0: f, dur: 0.3, type: 'sawtooth', vol: 0.09, delay: i * 0.12 }); }); },
    explode: function () { noise(0.3, 0.2, 700); tone({ f0: 120, f1: 40, dur: 0.3, type: 'sawtooth', vol: 0.1 }); },
    click:   function () { tone({ f0: 520, dur: 0.05, type: 'square', vol: 0.05 }); }
  };

  R.Sfx = {
    play: function (name, throttleMs) {
      if (muted) return;
      var fn = LIB[name]; if (!fn) return;
      var now = performance.now();
      this._last = this._last || {};
      if (throttleMs && this._last[name] && now - this._last[name] < throttleMs) return;
      this._last[name] = now;
      try { fn(); } catch (e) {}
    },
    unlock: function () { ac(); },
    toggle: function () {
      muted = !muted;
      try { localStorage.setItem('pearogue.muted', muted ? '1' : '0'); } catch (e) {}
      return !muted;
    },
    get muted() { return muted; }
  };
})(window.RogueGame = window.RogueGame || {});
