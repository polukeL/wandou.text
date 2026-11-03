/* =========================================================
 * core/art.js —— 程序化占位美术
 * 所有贴图都用基础图形 + 色板绘制，正式资源放 assets/ 覆盖即可。
 * 键名 = DATA.ART 里的 id。
 * ========================================================= */
(function (R) {
  'use strict';

  // 欧美卡通色板：高饱和 + 粗描边
  var C = R.COLORS = {
    outline: 0x2b1d2b,
    pea:     0x6cc24a,
    peaDark: 0x3f8f2e,
    skin:    0xffd9a8,
    red:     0xe8433c,
    orange:  0xf59e30,
    yellow:  0xffd23f,
    blue:    0x4a9de0,
    purple:  0x9b5de5,
    pink:    0xf272b6,
    brown:   0x8d5a3b,
    stone:   0x9aa3ad,
    stoneD:  0x6d7681,
    white:   0xfffdf5,
    ink:     0x2b1d2b
  };

  function g(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;
    var gr = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(gr);
    gr.generateTexture(key, w, h);
    gr.destroy();
  }

  // 粗描边圆形（卡通手感）
  function blob(gr, x, y, r, fill, lw) {
    lw = lw === undefined ? 5 : lw;
    gr.fillStyle(C.outline, 1); gr.fillCircle(x, y, r + lw * 0.7);
    gr.fillStyle(fill, 1);      gr.fillCircle(x, y, r);
  }
  function eyes(gr, x, y, gap, r, look) {
    look = look || 1;
    var pts = [[x - gap, y], [x + gap, y]];
    pts.forEach(function (p) {
      gr.fillStyle(C.white, 1); gr.fillCircle(p[0], p[1], r);
      gr.fillStyle(C.ink, 1);   gr.fillCircle(p[0] + r * 0.32 * look, p[1] + r * 0.1, r * 0.52);
    });
  }

  R.Art = {
    /* 生成全部占位贴图 */
    generate: function (scene) {
      // ---------- 玩家：小冒险者（碗豆头 + 背心） ----------
      g(scene, 'player', 96, 96, function (gr) {
        // 影子
        gr.fillStyle(0x000000, 0.16); gr.fillEllipse(48, 84, 56, 16);
        // 身体
        gr.fillStyle(C.outline, 1); gr.fillEllipse(48, 62, 62, 44);
        gr.fillStyle(C.blue, 1);    gr.fillEllipse(48, 61, 52, 35);
        // 背心
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(30, 54, 36, 26, 10);
        gr.fillStyle(C.yellow, 1);  gr.fillRoundedRect(33, 57, 30, 20, 8);
        // 头
        blob(gr, 48, 38, 26, C.pea);
        // 豆荚帽
        gr.fillStyle(C.outline, 1); gr.fillEllipse(48, 20, 56, 26);
        gr.fillStyle(C.peaDark, 1); gr.fillEllipse(48, 19, 48, 20);
        // 眼睛 + 笑脸
        eyes(gr, 48, 36, 10, 8, 1);
        gr.lineStyle(3.5, C.ink, 1);
        gr.beginPath(); gr.arc(48, 46, 8, 0.25, Math.PI - 0.25); gr.strokePath();
        // 腮红
        gr.fillStyle(C.pink, 0.55); gr.fillCircle(30, 44, 5); gr.fillCircle(66, 44, 5);
        // 小枪
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(70, 52, 20, 10, 4);
        gr.fillStyle(C.brown, 1);   gr.fillRoundedRect(72, 54, 16, 6, 3);
      });

      // ---------- 果冻怪 ----------
      g(scene, 'slime', 64, 64, function (gr) {
        gr.fillStyle(0x000000, 0.15); gr.fillEllipse(32, 56, 40, 10);
        gr.fillStyle(C.outline, 1);
        gr.fillEllipse(32, 38, 50, 40);
        gr.fillStyle(C.purple, 1);
        gr.fillEllipse(32, 37, 42, 33);
        gr.fillStyle(0xffffff, 0.35);
        gr.fillEllipse(24, 27, 14, 9);
        eyes(gr, 32, 38, 8, 6, 1);
        gr.lineStyle(3, C.ink, 1);
        gr.beginPath(); gr.arc(32, 46, 6, 0.15, Math.PI - 0.15); gr.strokePath();
      });

      // ---------- 蝙蝠 ----------
      g(scene, 'bat', 64, 64, function (gr) {
        gr.fillStyle(C.outline, 1);
        gr.fillTriangle(32, 30, 2, 16, 8, 44);
        gr.fillTriangle(32, 30, 62, 16, 56, 44);
        gr.fillStyle(0x5b4b8a, 1);
        gr.fillTriangle(32, 30, 6, 20, 12, 40);
        gr.fillTriangle(32, 30, 58, 20, 52, 40);
        blob(gr, 32, 32, 15, 0x6c5aa8, 4);
        gr.fillStyle(C.outline, 1);
        gr.fillTriangle(22, 22, 26, 8, 32, 20);
        gr.fillTriangle(42, 22, 38, 8, 32, 20);
        eyes(gr, 32, 32, 6, 5, 0);
        gr.fillStyle(C.white, 1); gr.fillTriangle(29, 40, 32, 46, 35, 40);
      });

      // ---------- 冲锋猪 ----------
      g(scene, 'charger', 80, 80, function (gr) {
        gr.fillStyle(0x000000, 0.15); gr.fillEllipse(40, 70, 48, 12);
        blob(gr, 40, 44, 26, 0xe08a54, 5);
        // 耳朵
        gr.fillStyle(C.outline, 1);
        gr.fillTriangle(20, 26, 12, 10, 34, 20);
        gr.fillTriangle(60, 26, 68, 10, 46, 20);
        // 鼻子
        gr.fillStyle(C.outline, 1); gr.fillEllipse(40, 54, 26, 18);
        gr.fillStyle(0xf7b0a4, 1);  gr.fillEllipse(40, 53, 20, 13);
        gr.fillStyle(C.ink, 1); gr.fillCircle(35, 53, 2.6); gr.fillCircle(45, 53, 2.6);
        eyes(gr, 40, 38, 10, 6.5, 1);
        // 獠牙
        gr.fillStyle(C.white, 1);
        gr.fillTriangle(28, 60, 32, 60, 30, 68);
        gr.fillTriangle(48, 60, 52, 60, 50, 68);
      });

      // ---------- 吐籽怪 ----------
      g(scene, 'spitter', 72, 72, function (gr) {
        gr.fillStyle(0x000000, 0.15); gr.fillEllipse(36, 64, 42, 11);
        blob(gr, 36, 39, 24, 0xd45a7a, 5);
        // 嘴（喇叭口）
        gr.fillStyle(C.outline, 1); gr.fillEllipse(58, 42, 22, 22);
        gr.fillStyle(0x8c2f4a, 1);  gr.fillEllipse(58, 42, 15, 15);
        eyes(gr, 30, 32, 9, 7, 1);
        // 斑点
        gr.fillStyle(0xffffff, 0.3);
        gr.fillCircle(22, 48, 5); gr.fillCircle(34, 20, 4); gr.fillCircle(42, 50, 4);
      });

      // ---------- 骷髅 ----------
      g(scene, 'skull', 64, 64, function (gr) {
        gr.fillStyle(0x000000, 0.15); gr.fillEllipse(32, 58, 36, 10);
        blob(gr, 32, 32, 20, 0xf3ecdc, 5);
        gr.fillStyle(0xf3ecdc, 1); gr.fillRoundedRect(22, 44, 20, 14, 5);
        // 眼窝
        gr.fillStyle(C.ink, 1);
        gr.fillCircle(25, 30, 7); gr.fillCircle(39, 30, 7);
        gr.fillStyle(0xff4d4d, 1);
        gr.fillCircle(26, 31, 3.4); gr.fillCircle(40, 31, 3.4);
        // 牙
        gr.fillStyle(C.ink, 1);
        for (var i = 0; i < 4; i++) gr.fillRect(23 + i * 5, 46, 2.4, 10);
      });

      // 黄金骷髅（精英）
      g(scene, 'skull_gold', 80, 80, function (gr) {
        gr.fillStyle(0xffb300, 0.35); gr.fillCircle(40, 40, 38);
        blob(gr, 40, 38, 22, 0xffd75e, 5);
        gr.fillStyle(0xffd75e, 1); gr.fillRoundedRect(28, 54, 24, 12, 5);
        gr.fillStyle(C.ink, 1); gr.fillCircle(32, 36, 8); gr.fillCircle(48, 36, 8);
        gr.fillStyle(0xff3333, 1); gr.fillCircle(33, 37, 4); gr.fillCircle(49, 37, 4);
        gr.fillStyle(C.ink, 1);
        for (var i = 0; i < 4; i++) gr.fillRect(30 + i * 6, 56, 2.6, 9);
      });

      // ---------- 石头人 Boss ----------
      g(scene, 'golem', 176, 176, function (gr) {
        gr.fillStyle(0x000000, 0.18); gr.fillEllipse(88, 156, 120, 26);
        // 腿
        gr.fillStyle(C.outline, 1);
        gr.fillRoundedRect(40, 112, 34, 44, 12); gr.fillRoundedRect(102, 112, 34, 44, 12);
        gr.fillStyle(C.stoneD, 1);
        gr.fillRoundedRect(44, 114, 26, 38, 10); gr.fillRoundedRect(106, 114, 26, 38, 10);
        // 身体
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(30, 52, 116, 88, 26);
        gr.fillStyle(C.stone, 1);   gr.fillRoundedRect(36, 56, 104, 78, 22);
        // 手臂
        gr.fillStyle(C.outline, 1);
        gr.fillCircle(24, 92, 26); gr.fillCircle(152, 92, 26);
        gr.fillStyle(C.stoneD, 1);
        gr.fillCircle(24, 92, 19); gr.fillCircle(152, 92, 19);
        // 头
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(48, 22, 80, 56, 18);
        gr.fillStyle(0xb5bdC6, 1);  gr.fillRoundedRect(52, 26, 72, 48, 15);
        // 眼睛发光
        gr.fillStyle(0xffe14d, 1);
        gr.fillCircle(72, 50, 10); gr.fillCircle(106, 50, 10);
        gr.fillStyle(C.ink, 1);
        gr.fillCircle(74, 51, 4.5); gr.fillCircle(108, 51, 4.5);
        // 嘴 + 裂纹
        gr.lineStyle(5, C.outline, 1);
        gr.beginPath(); gr.moveTo(66, 63); gr.lineTo(110, 63); gr.strokePath();
        gr.lineStyle(3, C.stoneD, 1);
        gr.beginPath(); gr.moveTo(60, 74); gr.lineTo(74, 90); gr.lineTo(66, 104); gr.strokePath();
        gr.beginPath(); gr.moveTo(118, 76); gr.lineTo(108, 92); gr.strokePath();
        // 苔藓
        gr.fillStyle(C.pea, 1);
        gr.fillCircle(52, 30, 8); gr.fillCircle(122, 34, 7); gr.fillCircle(90, 26, 6);
      });

      // ---------- 终局 Boss：豌豆王 ----------
      g(scene, 'king_pea', 184, 184, function (gr) {
        gr.fillStyle(0x000000, 0.2); gr.fillEllipse(92, 166, 130, 26);
        // 披风
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(20, 74, 144, 92, 30);
        gr.fillStyle(0x9b5de5, 1);  gr.fillRoundedRect(26, 78, 132, 84, 26);
        gr.fillStyle(0x6f3fb0, 1);  gr.fillRoundedRect(26, 128, 132, 34, 20);
        // 身体（豆荚）
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(46, 56, 92, 96, 42);
        gr.fillStyle(C.pea, 1);     gr.fillRoundedRect(52, 62, 80, 84, 36);
        gr.fillStyle(0x8fd968, 1);  gr.fillRoundedRect(60, 68, 30, 40, 20);
        // 皇冠
        gr.fillStyle(C.outline, 1);
        gr.beginPath();
        gr.moveTo(52, 56); gr.lineTo(52, 20); gr.lineTo(70, 38); gr.lineTo(92, 12);
        gr.lineTo(114, 38); gr.lineTo(132, 20); gr.lineTo(132, 56); gr.closePath(); gr.fillPath();
        gr.fillStyle(0xffd23f, 1);
        gr.beginPath();
        gr.moveTo(58, 52); gr.lineTo(58, 28); gr.lineTo(72, 42); gr.lineTo(92, 20);
        gr.lineTo(112, 42); gr.lineTo(126, 28); gr.lineTo(126, 52); gr.closePath(); gr.fillPath();
        gr.fillStyle(0xff5c8a, 1); gr.fillCircle(92, 44, 7);
        gr.fillStyle(0x53d7ff, 1); gr.fillCircle(70, 46, 4.5); gr.fillCircle(114, 46, 4.5);
        // 眼睛
        gr.fillStyle(0xffffff, 1);
        gr.fillCircle(78, 86, 17); gr.fillCircle(110, 86, 17);
        gr.fillStyle(C.outline, 1);
        gr.fillCircle(81, 89, 9); gr.fillCircle(107, 89, 9);
        gr.fillStyle(0xffffff, 0.95); gr.fillCircle(78, 85, 3.5); gr.fillCircle(104, 85, 3.5);
        // 怒眉
        gr.lineStyle(7, C.outline, 1);
        gr.beginPath(); gr.moveTo(62, 66); gr.lineTo(88, 76); gr.strokePath();
        gr.beginPath(); gr.moveTo(122, 66); gr.lineTo(96, 76); gr.strokePath();
        // 嘴（獠牙）
        gr.fillStyle(C.outline, 1);
        gr.fillRoundedRect(78, 112, 34, 14, 7);
        gr.fillStyle(0xffffff, 1);
        gr.fillTriangle(82, 114, 90, 114, 86, 124);
        gr.fillTriangle(100, 114, 108, 114, 104, 124);
        // 手臂（举权杖）
        gr.fillStyle(C.outline, 1); gr.fillCircle(34, 108, 20);
        gr.fillStyle(C.pea, 1);     gr.fillCircle(34, 108, 15);
        gr.fillStyle(C.outline, 1); gr.fillCircle(152, 108, 20);
        gr.fillStyle(C.pea, 1);     gr.fillCircle(152, 108, 15);
        gr.fillStyle(0x8d5a3b, 1);  gr.fillRoundedRect(148, 40, 8, 62, 4);
        gr.fillStyle(0xffd23f, 1);  gr.fillCircle(152, 34, 13);
        gr.fillStyle(0xff5c8a, 1);  gr.fillCircle(152, 34, 6);
      });

      // ---------- 子弹 ----------
      g(scene, 'bullet_pea', 26, 26, function (gr) {
        gr.fillStyle(C.outline, 1); gr.fillCircle(13, 13, 11);
        gr.fillStyle(C.pea, 1);    gr.fillCircle(13, 13, 8);
        gr.fillStyle(0xffffff, 0.8); gr.fillCircle(10, 10, 3);
      });
      g(scene, 'bullet_seed', 26, 26, function (gr) {
        gr.fillStyle(C.outline, 1); gr.fillCircle(13, 13, 10);
        gr.fillStyle(0xff7a3d, 1);  gr.fillCircle(13, 13, 7);
        gr.fillStyle(0xffffff, 0.75); gr.fillCircle(10, 10, 2.5);
      });

      // ---------- 拾取 ----------
      g(scene, 'pickup_gem', 26, 26, function (gr) {
        gr.fillStyle(C.outline, 1);
        gr.fillTriangle(13, 1, 25, 13, 13, 25); gr.fillTriangle(13, 1, 1, 13, 13, 25);
        gr.fillStyle(0x53d9ff, 1);
        gr.fillTriangle(13, 5, 21, 13, 13, 21);
        gr.fillStyle(0xd5f7ff, 1);
        gr.fillTriangle(13, 7, 17, 12, 13, 17);
      });
      g(scene, 'pickup_heart', 34, 34, function (gr) {
        gr.fillStyle(C.outline, 1);
        gr.fillCircle(11, 12, 9); gr.fillCircle(23, 12, 9); gr.fillTriangle(2, 14, 32, 14, 17, 31);
        gr.fillStyle(C.red, 1);
        gr.fillCircle(11, 12, 6); gr.fillCircle(23, 12, 6); gr.fillTriangle(5, 14, 29, 14, 17, 28);
        gr.fillStyle(0xffffff, 0.7); gr.fillCircle(9, 10, 2.6);
      });
      g(scene, 'pickup_coin', 34, 34, function (gr) {
        gr.fillStyle(C.outline, 1); gr.fillCircle(17, 17, 14);
        gr.fillStyle(C.yellow, 1);  gr.fillCircle(17, 17, 11);
        gr.fillStyle(0xffffff, 0.85); gr.fillRect(15, 9, 4, 16);
        gr.fillStyle(0xffb300, 1); gr.fillRect(12, 13, 10, 3);
      });

      // ---------- 宝箱 ----------
      g(scene, 'chest', 72, 72, function (gr) {
        gr.fillStyle(0x000000, 0.16); gr.fillEllipse(36, 66, 52, 12);
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(8, 26, 56, 42, 8);
        gr.fillStyle(C.brown, 1);   gr.fillRoundedRect(12, 30, 48, 34, 6);
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(8, 16, 56, 18, 9);
        gr.fillStyle(0xa86a44, 1);  gr.fillRoundedRect(12, 19, 48, 12, 7);
        gr.fillStyle(0xffd23f, 1);
        gr.fillRect(8, 36, 56, 8); gr.fillRoundedRect(31, 32, 10, 16, 3);
        gr.fillStyle(C.outline, 1); gr.fillCircle(36, 40, 3);
      });

      // ---------- 传送门 ----------
      g(scene, 'portal', 140, 140, function (gr) {
        gr.fillStyle(0x9b5de5, 0.18); gr.fillCircle(70, 70, 68);
        gr.fillStyle(0x9b5de5, 0.28); gr.fillCircle(70, 70, 56);
        gr.lineStyle(9, C.outline, 1); gr.strokeCircle(70, 70, 46);
        gr.lineStyle(5, 0x8fe3ff, 1); gr.strokeCircle(70, 70, 46);
        gr.fillStyle(0x63c9ff, 0.55); gr.fillCircle(70, 70, 42);
        gr.fillStyle(0xffffff, 0.55); gr.fillCircle(58, 58, 12);
      });

      // ---------- 通用圆点（粒子） ----------
      g(scene, 'blob', 32, 32, function (gr) {
        gr.fillStyle(0xffffff, 1); gr.fillCircle(16, 16, 16);
      });
      g(scene, 'blob_soft', 64, 64, function (gr) {
        for (var i = 8; i > 0; i--) {
          gr.fillStyle(0xffffff, 0.08); gr.fillCircle(32, 32, i * 4);
        }
      });

      // ---------- 战场地面 tile ----------
      g(scene, 'tile', 128, 128, function (gr) {
        gr.fillStyle(0xffffff, 1); gr.fillRect(0, 0, 128, 128);
        gr.fillStyle(0x000000, 0.05);
        gr.fillCircle(24, 30, 10); gr.fillCircle(96, 92, 14); gr.fillCircle(72, 22, 6);
        gr.fillStyle(0x000000, 0.035);
        gr.fillCircle(44, 104, 8); gr.fillCircle(110, 40, 7);
        gr.lineStyle(3, 0x000000, 0.045);
        gr.strokeCircle(60, 64, 18);
      });

      R.Art.generateIcons(scene);
    },

    /* 升级卡片图标 */
    generateIcons: function (scene) {
      var icons = {
        pea: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillCircle(40, 40, 26);
          gr.fillStyle(C.pea, 1); gr.fillCircle(40, 40, 20);
          gr.fillStyle(0xffffff, 0.8); gr.fillCircle(33, 33, 7);
          gr.fillStyle(C.peaDark, 1); gr.fillCircle(48, 48, 5);
        },
        shot: function (gr) {
          for (var i = -1; i <= 1; i++) {
            gr.fillStyle(C.outline, 1); gr.fillCircle(40 + i * 16, 40 + Math.abs(i) * 12, 12);
            gr.fillStyle(C.orange, 1);  gr.fillCircle(40 + i * 16, 40 + Math.abs(i) * 12, 8);
          }
        },
        boomer: function (gr) {
          gr.lineStyle(12, C.outline, 1);
          gr.beginPath(); gr.arc(40, 40, 22, -Math.PI * 0.75, Math.PI * 0.7); gr.strokePath();
          gr.lineStyle(6, C.yellow, 1);
          gr.beginPath(); gr.arc(40, 40, 22, -Math.PI * 0.75, Math.PI * 0.7); gr.strokePath();
        },
        ball: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillCircle(40, 42, 22);
          gr.fillStyle(0xe8433c, 1);  gr.fillCircle(40, 42, 16);
          gr.lineStyle(4, C.orange, 1);
          gr.beginPath(); gr.moveTo(40, 20); gr.lineTo(44, 12); gr.strokePath();
          gr.fillStyle(0xffd23f, 1); gr.fillCircle(46, 12, 5);
        },
        bubble: function (gr) {
          gr.lineStyle(6, C.outline, 1); gr.strokeCircle(36, 38, 18);
          gr.fillStyle(0x8fe3ff, 0.9); gr.fillCircle(36, 38, 15);
          gr.fillStyle(0xffffff, 0.9); gr.fillCircle(30, 32, 5);
        },
        shield: function (gr) {
          gr.lineStyle(10, C.outline, 1); gr.strokeCircle(40, 40, 22);
          gr.fillStyle(C.blue, 1); gr.fillCircle(40, 40, 18);
          gr.fillStyle(C.yellow, 1); gr.fillCircle(40, 40, 8);
        },
        multi: function (gr) {
          for (var i = 0; i < 3; i++) {
            gr.fillStyle(C.outline, 1); gr.fillCircle(24 + i * 16, 26, 9);
            gr.fillStyle(0x53d9ff, 1);  gr.fillCircle(24 + i * 16, 26, 6);
            gr.fillStyle(C.outline, 1); gr.fillCircle(24 + i * 16, 54, 9);
            gr.fillStyle(0x53d9ff, 1);  gr.fillCircle(24 + i * 16, 54, 6);
          }
        },
        pierce: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillTriangle(14, 20, 52, 40, 14, 60);
          gr.fillStyle(C.yellow, 1);  gr.fillTriangle(20, 26, 44, 40, 20, 54);
          gr.fillStyle(C.red, 1); gr.fillCircle(58, 40, 7);
        },
        bounce: function (gr) {
          gr.lineStyle(5, C.ink, 1);
          gr.beginPath(); gr.moveTo(14, 54); gr.lineTo(30, 30); gr.lineTo(46, 54); gr.lineTo(62, 26); gr.strokePath();
          gr.fillStyle(C.red, 1); gr.fillCircle(62, 26, 7);
        },
        vamp: function (gr) {
          gr.fillStyle(C.outline, 1);
          gr.fillTriangle(18, 22, 30, 44, 40, 20); gr.fillTriangle(62, 26, 46, 44, 40, 54);
          gr.fillStyle(C.red, 1);
          gr.fillTriangle(21, 26, 31, 45, 38, 26); gr.fillTriangle(59, 30, 46, 45, 42, 52);
        },
        sword: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillTriangle(22, 58, 54, 16, 62, 24);
          gr.fillStyle(0xe9eef5, 1); gr.fillTriangle(25, 55, 53, 20, 58, 25);
          gr.lineStyle(7, C.outline, 1); gr.beginPath(); gr.moveTo(18, 60); gr.lineTo(30, 44); gr.strokePath();
          gr.fillStyle(C.brown, 1); gr.fillCircle(18, 60, 6);
        },
        speed: function (gr) {
          gr.fillStyle(C.yellow, 1);
          gr.fillTriangle(22, 16, 22, 50, 40, 33);
          gr.fillTriangle(42, 16, 42, 50, 60, 33);
          gr.fillStyle(C.outline, 1);
          gr.fillTriangle(44, 16, 44, 50, 62, 33);
        },
        feet: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillEllipse(28, 50, 26, 20); gr.fillEllipse(54, 42, 26, 20);
          gr.fillStyle(C.pink, 1);    gr.fillEllipse(28, 50, 18, 13); gr.fillEllipse(54, 42, 18, 13);
        },
        heart: function (gr) {
          gr.fillStyle(C.outline, 1);
          gr.fillCircle(30, 30, 14); gr.fillCircle(50, 30, 14); gr.fillTriangle(16, 33, 64, 33, 40, 62);
          gr.fillStyle(C.red, 1);
          gr.fillCircle(30, 30, 10); gr.fillCircle(50, 30, 10); gr.fillTriangle(21, 33, 59, 33, 40, 56);
        },
        leaf: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillEllipse(40, 38, 44, 54);
          gr.fillStyle(C.pea, 1); gr.fillEllipse(40, 38, 36, 46);
          gr.lineStyle(4, C.peaDark, 1);
          gr.beginPath(); gr.moveTo(40, 60); gr.lineTo(40, 18); gr.strokePath();
        },
        magnet: function (gr) {
          gr.lineStyle(12, C.outline, 1);
          gr.beginPath(); gr.arc(40, 38, 18, 0, Math.PI, false); gr.strokePath();
          gr.lineStyle(12, C.red, 1);
          gr.beginPath(); gr.arc(40, 38, 18, 0, Math.PI, false); gr.strokePath();
          gr.fillStyle(C.outline, 1); gr.fillRect(16, 38, 14, 18); gr.fillRect(50, 38, 14, 18);
          gr.fillStyle(0x9aa3ad, 1); gr.fillRect(19, 38, 8, 14); gr.fillRect(53, 38, 8, 14);
        },
        star: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillCircle(40, 40, 26);
          gr.fillStyle(C.yellow, 1);
          gr.fillPoints([
            { x: 40, y: 16 }, { x: 47, y: 33 }, { x: 64, y: 33 }, { x: 51, y: 44 },
            { x: 56, y: 62 }, { x: 40, y: 51 }, { x: 24, y: 62 }, { x: 29, y: 44 },
            { x: 16, y: 33 }, { x: 33, y: 33 }
          ], true);
        },
        arrow: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillTriangle(14, 32, 46, 32, 46, 20);
          gr.fillTriangle(46, 12, 46, 48, 66, 30);
          gr.fillStyle(C.blue, 1); gr.fillTriangle(18, 34, 44, 34, 44, 26);
          gr.fillTriangle(46, 17, 46, 43, 60, 30);
        },
        circle: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillCircle(40, 40, 24);
          gr.fillStyle(0x53d9ff, 1);  gr.fillCircle(40, 40, 18);
          gr.fillStyle(0xffffff, 0.8); gr.fillCircle(33, 33, 6);
        },
        heal: function (gr) {
          gr.fillStyle(C.outline, 1); gr.fillRoundedRect(16, 33, 48, 14, 6); gr.fillRoundedRect(33, 16, 14, 48, 6);
          gr.fillStyle(0x4ee07a, 1); gr.fillRoundedRect(20, 36, 40, 8, 4); gr.fillRoundedRect(36, 20, 8, 40, 4);
        }
      };
      Object.keys(icons).forEach(function (k) { g(scene, 'icon_' + k, 80, 80, icons[k]); });

      // 卡片背景
      g(scene, 'card', 300, 380, function (gr) {
        gr.fillStyle(0x000000, 0.25); gr.fillRoundedRect(6, 10, 288, 366, 26);
        gr.fillStyle(C.outline, 1);   gr.fillRoundedRect(0, 0, 288, 366, 26);
        gr.fillStyle(0xfff6e2, 1);    gr.fillRoundedRect(6, 6, 276, 354, 21);
        gr.fillStyle(0xffe9c2, 1);    gr.fillRoundedRect(6, 6, 276, 120, 21);
        gr.fillStyle(0xfff6e2, 1);    gr.fillRect(6, 100, 276, 26);
      });
    },

    /* -----------------------------------------------------
     * 障碍物 / 建筑占位图（ob_*）
     * 后期换成正式场景物品：放 assets/ob_house.png 等同名文件即可
     * --------------------------------------------------- */
    generateObstacles: function (scene) {
      // 通用：地面阴影 + 粗描边
      function shadow(gr, x, y, w, h) {
        gr.fillStyle(0x000000, 0.18); gr.fillEllipse(x, y, w, h);
      }
      function outlineRect(gr, x, y, w, h, r, fill, lw) {
        lw = lw || 6;
        gr.fillStyle(C.outline, 1);
        gr.fillRoundedRect(x - lw, y - lw, w + lw * 2, h + lw * 2, r + lw);
        gr.fillStyle(fill, 1);
        gr.fillRoundedRect(x, y, w, h, r);
      }

      // 小屋：木墙 + 蘑菇屋顶 + 门
      g(scene, 'ob_house', 150, 130, function (gr) {
        shadow(gr, 75, 118, 120, 24);
        outlineRect(gr, 22, 48, 106, 68, 10, 0xf0d7b8);
        // 屋顶（三角）
        gr.fillStyle(C.outline, 1);
        gr.beginPath();
        gr.moveTo(75, -2); gr.lineTo(138, 58); gr.lineTo(12, 58); gr.closePath(); gr.fillPath();
        gr.fillStyle(C.red, 1);
        gr.beginPath();
        gr.moveTo(75, 8); gr.lineTo(130, 54); gr.lineTo(20, 54); gr.closePath(); gr.fillPath();
        // 门 + 窗
        gr.fillStyle(C.brown, 1);  gr.fillRoundedRect(58, 78, 34, 38, 6);
        gr.fillStyle(C.yellow, 1); gr.fillRoundedRect(30, 66, 22, 20, 5);
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(30, 66, 22, 20, 5);
        gr.fillStyle(0x9fd8ff, 1); gr.fillRoundedRect(33, 69, 16, 14, 4);
      });

      // 岩石
      g(scene, 'ob_rock', 110, 110, function (gr) {
        shadow(gr, 55, 98, 92, 22);
        gr.fillStyle(C.outline, 1);
        gr.beginPath();
        gr.moveTo(14, 88); gr.lineTo(28, 34); gr.lineTo(58, 12);
        gr.lineTo(92, 32); gr.lineTo(100, 82); gr.closePath(); gr.fillPath();
        gr.fillStyle(C.stone, 1);
        gr.beginPath();
        gr.moveTo(22, 84); gr.lineTo(34, 38); gr.lineTo(58, 20);
        gr.lineTo(86, 38); gr.lineTo(92, 78); gr.closePath(); gr.fillPath();
        // 高光面
        gr.fillStyle(0xc3ccd6, 1);
        gr.beginPath();
        gr.moveTo(34, 38); gr.lineTo(58, 20); gr.lineTo(66, 52); gr.lineTo(42, 62); gr.closePath(); gr.fillPath();
        // 苔藓
        gr.fillStyle(0x7cb342, 0.85);
        gr.fillEllipse(50, 86, 34, 12);
      });

      // 树
      g(scene, 'ob_tree', 84, 96, function (gr) {
        shadow(gr, 42, 86, 54, 16);
        // 树干
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(34, 52, 16, 36, 6);
        gr.fillStyle(C.brown, 1);   gr.fillRoundedRect(37, 55, 10, 31, 5);
        // 树冠（三层）
        gr.fillStyle(C.outline, 1);
        gr.fillCircle(42, 34, 30); gr.fillCircle(24, 46, 20); gr.fillCircle(60, 46, 20);
        gr.fillStyle(0x3f8f2e, 1);
        gr.fillCircle(42, 34, 25); gr.fillCircle(25, 46, 16); gr.fillCircle(59, 46, 16);
        gr.fillStyle(0x6cc24a, 1);
        gr.fillCircle(38, 28, 16); gr.fillCircle(24, 42, 10);
      });

      // 木箱
      g(scene, 'ob_crate', 76, 76, function (gr) {
        shadow(gr, 38, 68, 62, 16);
        outlineRect(gr, 7, 7, 62, 62, 6, 0xc98a4b);
        gr.lineStyle(5, C.brown, 1);
        gr.strokeRect(7, 7, 62, 62);
        gr.lineStyle(5, C.outline, 1);
        gr.beginPath(); gr.moveTo(7, 7); gr.lineTo(69, 69); gr.strokePath();
        gr.beginPath(); gr.moveTo(69, 7); gr.lineTo(7, 69); gr.strokePath();
        gr.fillStyle(C.outline, 1);
        gr.fillRect(2, 32, 8, 10); gr.fillRect(66, 32, 8, 10);
      });

      // 灌木丛
      g(scene, 'ob_bush', 92, 80, function (gr) {
        shadow(gr, 46, 68, 74, 16);
        gr.fillStyle(C.outline, 1);
        gr.fillCircle(24, 50, 22); gr.fillCircle(48, 40, 26); gr.fillCircle(70, 52, 20);
        gr.fillStyle(0x4e9c33, 1);
        gr.fillCircle(24, 50, 17); gr.fillCircle(48, 40, 21); gr.fillCircle(70, 52, 15);
        gr.fillStyle(0x7ed957, 1);
        gr.fillCircle(44, 32, 12); gr.fillCircle(22, 44, 8);
        // 小果子
        gr.fillStyle(C.red, 1);
        gr.fillCircle(30, 56, 4); gr.fillCircle(62, 46, 4);
      });

      // 水井
      g(scene, 'ob_well', 96, 96, function (gr) {
        shadow(gr, 48, 84, 74, 18);
        // 井身
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(14, 46, 68, 36, 10);
        gr.fillStyle(C.stone, 1);   gr.fillRoundedRect(19, 51, 58, 26, 7);
        // 井口
        gr.fillStyle(C.outline, 1); gr.fillEllipse(48, 47, 66, 24);
        gr.fillStyle(0x3d5a7a, 1);  gr.fillEllipse(48, 47, 54, 16);
        // 木架
        gr.fillStyle(C.outline, 1);
        gr.fillRect(20, 12, 9, 34); gr.fillRect(67, 12, 9, 34); gr.fillRect(16, 8, 64, 9);
        gr.fillStyle(C.brown, 1);
        gr.fillRect(22, 14, 5, 30); gr.fillRect(69, 14, 5, 30); gr.fillRect(18, 10, 60, 5);
        // 桶
        gr.fillStyle(C.outline, 1); gr.fillRoundedRect(38, 24, 20, 18, 4);
        gr.fillStyle(0xc98a4b, 1);  gr.fillRoundedRect(40, 26, 16, 14, 3);
      });

      // 墓碑
      g(scene, 'ob_tomb', 72, 96, function (gr) {
        shadow(gr, 36, 86, 56, 16);
        gr.fillStyle(C.outline, 1);
        gr.fillRoundedRect(12, 20, 48, 64, 22);
        gr.fillRect(12, 54, 48, 30);
        gr.fillStyle(0xb8bcc4, 1);
        gr.fillRoundedRect(17, 25, 38, 56, 18);
        gr.fillRect(17, 56, 38, 25);
        // 十字刻痕
        gr.fillStyle(0x7f858f, 1);
        gr.fillRect(32, 36, 8, 30); gr.fillRect(24, 44, 24, 8);
        // 土堆
        gr.fillStyle(0x6b4a30, 1); gr.fillEllipse(36, 88, 54, 12);
      });

      // 石柱
      g(scene, 'ob_pillar', 76, 118, function (gr) {
        shadow(gr, 38, 108, 58, 16);
        // 柱身
        gr.fillStyle(C.outline, 1); gr.fillRect(22, 14, 32, 90);
        gr.fillStyle(0xd8d2c4, 1);  gr.fillRect(26, 18, 24, 82);
        // 柱头 / 柱础
        gr.fillStyle(C.outline, 1);
        gr.fillRoundedRect(12, 4, 52, 16, 5);
        gr.fillRoundedRect(12, 98, 52, 16, 5);
        gr.fillStyle(0xefe8d8, 1);
        gr.fillRoundedRect(16, 8, 44, 9, 3);
        gr.fillRoundedRect(16, 102, 44, 9, 3);
        // 裂纹
        gr.lineStyle(3, 0xb0a894, 1);
        gr.beginPath(); gr.moveTo(34, 30); gr.lineTo(42, 48); gr.lineTo(33, 62); gr.strokePath();
      });
    },

    /* -----------------------------------------------------
     * UI 皮肤占位图（uiskin_gen_<id>）
     * 优先级：前端上传 > assets/ui/<id>.png > 这里 > 代码绘制
     * --------------------------------------------------- */
    generateUI: function (scene) {
      // 通用圆角按钮底（橙 / 绿两种色调按 id 区分）
      function pill(id, w, h, top, bottom) {
        g(scene, 'uiskin_gen_' + id, w, h, function (gr) {
          gr.fillStyle(0x2b1d2b, 1);  gr.fillRoundedRect(0, 0, w, h, h * 0.42);
          gr.fillStyle(bottom, 1);    gr.fillRoundedRect(4, h * 0.16, w - 8, h * 0.72, h * 0.34);
          gr.fillStyle(top, 1);       gr.fillRoundedRect(4, h * 0.1, w - 8, h * 0.42, h * 0.2);
        });
      }
      pill('btn_start', 336, 80, 0xffc93c, 0xf9a825);
      pill('btn_resume', 336, 80, 0x8ada67, 0x6cc24a);
      pill('btn_quit', 336, 80, 0xf28a5f, 0xe8633c);
      pill('btn_replay', 256, 66, 0x8ada67, 0x6cc24a);

      // 圆形小按钮（暂停 / 静音）
      ['btn_pause', 'btn_mute'].forEach(function (id) {
        g(scene, 'uiskin_gen_' + id, 56, 56, function (gr) {
          gr.fillStyle(0x2b1d2b, 1);  gr.fillCircle(28, 28, 27);
          gr.fillStyle(0xfff6e2, 1);  gr.fillCircle(28, 28, 21);
          gr.fillStyle(0x2b1d2b, 0.9);
          if (id === 'btn_pause') {
            gr.fillRoundedRect(19, 17, 7, 22, 3);
            gr.fillRoundedRect(30, 17, 7, 22, 3);
          } else {
            gr.fillCircle(24, 28, 6);
            gr.fillTriangle(28, 28, 40, 18, 40, 38);
          }
        });
      });

      // 升级卡底板（648x210 米白圆角 + 描边）
      g(scene, 'uiskin_gen_card', 648, 210, function (gr) {
        gr.fillStyle(0x000000, 0.28); gr.fillRoundedRect(8, 12, 632, 190, 26);
        gr.fillStyle(0x2b1d2b, 1);    gr.fillRoundedRect(0, 0, 632, 190, 26);
        gr.fillStyle(0xfff6e2, 1);    gr.fillRoundedRect(7, 7, 618, 176, 21);
        gr.fillStyle(0xffe9c2, 1);    gr.fillRoundedRect(7, 7, 170, 176, 21);
        gr.fillStyle(0xfff6e2, 1);    gr.fillRect(7, 100, 170, 40);
      });

      // 结算面板（588x452 米白圆角 + 描边）
      g(scene, 'uiskin_gen_panel', 588, 452, function (gr) {
        gr.fillStyle(0x000000, 0.3);  gr.fillRoundedRect(10, 14, 568, 430, 32);
        gr.fillStyle(0x2b1d2b, 1);    gr.fillRoundedRect(0, 0, 588, 452, 32);
        gr.fillStyle(0xfff6e2, 1);    gr.fillRoundedRect(8, 8, 572, 436, 26);
      });

      // 特殊拾取物：血量上限道具（大爱心 + 加号）
      g(scene, 'pickup_maxhp', 36, 36, function (gr) {
        gr.fillStyle(0x2b1d2b, 1);
        gr.fillCircle(12, 13, 10); gr.fillCircle(24, 13, 10);
        gr.fillTriangle(4, 18, 32, 18, 18, 33);
        gr.fillStyle(0xff6b81, 1);
        gr.fillCircle(12, 13, 7.5); gr.fillCircle(24, 13, 7.5);
        gr.fillTriangle(6.5, 17, 29.5, 17, 18, 29);
        gr.fillStyle(0xffffff, 0.9);
        gr.fillRoundedRect(16, 10, 4, 10, 2);
        gr.fillRoundedRect(13, 13, 10, 4, 2);
      });

      // 特殊拾取物：护盾道具（蓝盾徽）
      g(scene, 'pickup_shield', 36, 36, function (gr) {
        gr.fillStyle(0x2b1d2b, 1);
        gr.fillRoundedRect(6, 4, 24, 20, 8);
        gr.fillTriangle(6, 18, 30, 18, 18, 34);
        gr.fillStyle(0x53d7ff, 1);
        gr.fillRoundedRect(9, 7, 18, 15, 6);
        gr.fillTriangle(9, 18, 27, 18, 18, 30);
        gr.fillStyle(0xffffff, 0.85);
        gr.fillRoundedRect(12, 10, 12, 5, 2.5);
        gr.fillStyle(0x2b9fd7, 1);
        gr.fillRoundedRect(16, 14, 4, 8, 2);
      });

      /* ---------------- 头像（128x128，圆内绘制） ---------------- */
      function faceCircle(gr, fill) {
        gr.fillStyle(0x2b1d2b, 1); gr.fillCircle(64, 64, 62);
        gr.fillStyle(fill, 1);     gr.fillCircle(64, 64, 56);
      }
      function eyes(gr, dx, r, iris) {
        gr.fillStyle(0xffffff, 1);
        gr.fillCircle(48 + (dx || 0), 62, r); gr.fillCircle(80 + (dx || 0), 62, r);
        gr.fillStyle(iris || 0x2b1d2b, 1);
        gr.fillCircle(50 + (dx || 0), 64, r * 0.55); gr.fillCircle(78 + (dx || 0), 64, r * 0.55);
        gr.fillStyle(0xffffff, 0.9);
        gr.fillCircle(47 + (dx || 0), 58, r * 0.24); gr.fillCircle(75 + (dx || 0), 58, r * 0.24);
      }

      // 小豌豆
      g(scene, 'av_pea', 128, 128, function (gr) {
        faceCircle(gr, C.pea);
        // 豆荚帽
        gr.fillStyle(0x3f8f2e, 1);
        gr.beginPath(); gr.arc(64, 52, 54, Math.PI * 1.06, Math.PI * 1.94); gr.fillPath();
        gr.fillStyle(0x8fd968, 1); gr.fillEllipse(64, 22, 70, 20);
        gr.fillStyle(0x3f8f2e, 1); gr.fillCircle(98, 16, 7);
        eyes(gr, 0, 14);
        // 笑嘴
        gr.lineStyle(5, 0x2b1d2b, 1);
        gr.beginPath(); gr.arc(64, 82, 18, 0.2, Math.PI - 0.2); gr.strokePath();
        gr.fillStyle(0xff9aa8, 0.5);
        gr.fillCircle(30, 82, 8); gr.fillCircle(98, 82, 8);
      });

      // 果冻怪
      g(scene, 'av_slime', 128, 128, function (gr) {
        faceCircle(gr, 0xb585f0);
        gr.fillStyle(0x9b5de5, 0.6);
        gr.fillEllipse(64, 96, 84, 34);
        eyes(gr, 0, 13, 0x2b1d2b);
        gr.lineStyle(4, 0x2b1d2b, 1);
        gr.beginPath(); gr.arc(64, 84, 12, 0.25, Math.PI - 0.25); gr.strokePath();
        gr.fillStyle(0xffffff, 0.4); gr.fillCircle(44, 34, 10);
      });

      // 小蝙蝠
      g(scene, 'av_bat', 128, 128, function (gr) {
        faceCircle(gr, 0x6f4a8a);
        // 耳朵
        gr.fillStyle(0x2b1d2b, 1);
        gr.fillTriangle(28, 40, 46, 6, 56, 40);
        gr.fillTriangle(100, 40, 82, 6, 72, 40);
        gr.fillStyle(0x9b5de5, 1);
        gr.fillTriangle(32, 36, 45, 14, 52, 36);
        gr.fillTriangle(96, 36, 83, 14, 76, 36);
        eyes(gr, 0, 12, 0xe8433c);
        gr.fillStyle(0xffffff, 1);
        gr.fillTriangle(56, 84, 62, 96, 68, 84);
      });

      // 骷髅兵
      g(scene, 'av_skull', 128, 128, function (gr) {
        faceCircle(gr, 0xf2ede2);
        gr.fillStyle(0xd8d0c0, 1);
        gr.fillEllipse(64, 96, 52, 40);
        gr.fillStyle(0x2b1d2b, 1);
        gr.fillCircle(48, 64, 16); gr.fillCircle(80, 64, 16);
        gr.fillStyle(0xe8433c, 1);
        gr.fillCircle(48, 64, 9); gr.fillCircle(80, 64, 9);
        gr.fillStyle(0x2b1d2b, 1);
        gr.fillTriangle(60, 84, 68, 84, 64, 94);
        for (var ti = 0; ti < 4; ti++) gr.fillRect(52 + ti * 7, 100, 4, 10);
      });

      // 豌豆王
      g(scene, 'av_king', 128, 128, function (gr) {
        faceCircle(gr, C.pea);
        gr.fillStyle(0xffd23f, 1);
        gr.beginPath();
        gr.moveTo(24, 56); gr.lineTo(24, 12); gr.lineTo(46, 34); gr.lineTo(64, 8);
        gr.lineTo(82, 34); gr.lineTo(104, 12); gr.lineTo(104, 56); gr.closePath(); gr.fillPath();
        gr.fillStyle(0x2b1d2b, 1);
        gr.beginPath();
        gr.moveTo(24, 56); gr.lineTo(24, 12); gr.lineTo(46, 34); gr.lineTo(64, 8);
        gr.lineTo(82, 34); gr.lineTo(104, 12); gr.lineTo(104, 56); gr.closePath();
        gr.lineStyle(5, 0x2b1d2b, 1); gr.strokePath();
        gr.fillStyle(0xff5c8a, 1); gr.fillCircle(64, 38, 6);
        eyes(gr, 0, 13);
        gr.lineStyle(5, 0x2b1d2b, 1);
        gr.beginPath(); gr.arc(64, 88, 20, 0.15, Math.PI - 0.15); gr.strokePath();
      });

      // 石头人
      g(scene, 'av_golem', 128, 128, function (gr) {
        faceCircle(gr, C.stone);
        gr.fillStyle(C.stoneD, 1);
        gr.fillRoundedRect(30, 24, 68, 20, 10);
        eyes(gr, 0, 13, 0xffe14d);
        gr.lineStyle(5, 0x2b1d2b, 1);
        gr.beginPath(); gr.moveTo(46, 90); gr.lineTo(82, 90); gr.strokePath();
        gr.lineStyle(3, C.stoneD, 1);
        gr.beginPath(); gr.moveTo(38, 100); gr.lineTo(50, 112); gr.strokePath();
      });

      /* ---------------- 头像框（144x144，中间镂空 112 直径） ---------------- */
      g(scene, 'fr_basic', 144, 144, function (gr) {
        gr.lineStyle(12, 0x2b1d2b, 1); gr.strokeCircle(72, 72, 62);
        gr.lineStyle(7, 0x8d5a3b, 1);  gr.strokeCircle(72, 72, 62);
        gr.lineStyle(2, 0xc79a6b, 0.8); gr.strokeCircle(72, 72, 58);
      });

      g(scene, 'fr_leaf', 144, 144, function (gr) {
        gr.lineStyle(12, 0x2b1d2b, 1); gr.strokeCircle(72, 72, 62);
        gr.lineStyle(8, 0x6cc24a, 1);  gr.strokeCircle(72, 72, 62);
        for (var i = 0; i < 8; i++) {
          var a = (i / 8) * Math.PI * 2;
          var lx = 72 + Math.cos(a) * 64, ly = 72 + Math.sin(a) * 64;
          gr.fillStyle(0x3f8f2e, 1);
          gr.fillEllipse(lx, ly, 20, 11);
          gr.fillStyle(0x8fd968, 1);
          gr.fillEllipse(lx, ly - 1.5, 14, 6);
        }
      });

      g(scene, 'fr_bone', 144, 144, function (gr) {
        gr.lineStyle(12, 0x2b1d2b, 1); gr.strokeCircle(72, 72, 62);
        gr.lineStyle(8, 0xf2ede2, 1);  gr.strokeCircle(72, 72, 62);
        for (var i = 0; i < 6; i++) {
          var a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          var bx = 72 + Math.cos(a) * 62, by = 72 + Math.sin(a) * 62;
          gr.fillStyle(0x2b1d2b, 1); gr.fillCircle(bx, by, 10);
          gr.fillStyle(0xf2ede2, 1); gr.fillCircle(bx, by, 7);
        }
      });

      g(scene, 'fr_gold', 144, 144, function (gr) {
        gr.lineStyle(14, 0x2b1d2b, 1); gr.strokeCircle(72, 72, 62);
        gr.lineStyle(9, 0xffd23f, 1);  gr.strokeCircle(72, 72, 62);
        gr.lineStyle(3, 0xfff3b0, 0.9); gr.strokeCircle(72, 72, 58);
        for (var i = 0; i < 4; i++) {
          var a = (i / 4) * Math.PI * 2 + 0.4;
          gr.fillStyle(0xfff3b0, 1);
          gr.fillCircle(72 + Math.cos(a) * 62, 72 + Math.sin(a) * 62, 6);
        }
      });

      g(scene, 'fr_rainbow', 144, 144, function (gr) {
        var cols = [0xe8433c, 0xf59e30, 0xffd23f, 0x6cc24a, 0x4a9de0, 0x9b5de5];
        for (var i = 0; i < cols.length; i++) {
          gr.lineStyle(5, cols[i], 1);
          var r0 = 56 + i * 4;
          gr.beginPath();
          gr.arc(72, 72, r0, (i / cols.length) * Math.PI * 2, ((i + 1) / cols.length) * Math.PI * 2 - 0.06);
          gr.strokePath();
        }
        gr.lineStyle(3, 0x2b1d2b, 0.8); gr.strokeCircle(72, 72, 66);
      });

      /* ---------------- 商店图标 ---------------- */
      g(scene, 'icon_shop', 80, 80, function (gr) {
        gr.fillStyle(0x2b1d2b, 1);  gr.fillRoundedRect(10, 30, 60, 42, 8);
        gr.fillStyle(0xff6b81, 1);  gr.fillRoundedRect(13, 33, 54, 36, 6);
        gr.fillStyle(0x2b1d2b, 1);
        gr.fillTriangle(6, 32, 74, 32, 40, 12);
        gr.fillStyle(0xffd23f, 1);
        gr.fillTriangle(9, 30, 71, 30, 40, 15);
        gr.fillStyle(0xfff6e2, 1);  gr.fillRoundedRect(34, 44, 12, 25, 4);
      });

      g(scene, 'icon_crown', 80, 80, function (gr) {
        gr.fillStyle(0x2b1d2b, 1);
        gr.beginPath();
        gr.moveTo(8, 58); gr.lineTo(12, 20); gr.lineTo(28, 38); gr.lineTo(40, 12);
        gr.lineTo(52, 38); gr.lineTo(68, 20); gr.lineTo(72, 58); gr.closePath(); gr.fillPath();
        gr.fillStyle(0xffd23f, 1);
        gr.beginPath();
        gr.moveTo(13, 54); gr.lineTo(16, 26); gr.lineTo(29, 41); gr.lineTo(40, 18);
        gr.lineTo(51, 41); gr.lineTo(64, 26); gr.lineTo(67, 54); gr.closePath(); gr.fillPath();
        gr.fillStyle(0xff5c8a, 1); gr.fillCircle(40, 42, 6);
      });
    }
  };
})(window.RogueGame = window.RogueGame || {});
