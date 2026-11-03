/* =========================================================
 * ui/avatar.js —— 头像组件（头像图 + 头像框叠加）
 * 用法：R.Avatar.add(scene, x, y, size, opts)
 *   opts = { avatar:'av_pea', frame:'fr_basic', depth, mask:true }
 * 返回 container，可继续操作。
 * ========================================================= */
(function (R) {
  'use strict';

  var Avatar = R.Avatar = {};

  Avatar.SIZE = { avatar: 128, frame: 144 };

  /* 建立一个头像容器（头像素材本身是圆形，无需遮罩） */
  Avatar.add = function (scene, x, y, size, opts) {
    opts = opts || {};
    var meta = R.Meta;
    var avId = opts.avatar || (meta ? meta.avatar : 'av_pea');
    var frId = opts.frame || (meta ? meta.frame : 'fr_basic');
    var c = scene.add.container(x, y);
    if (opts.depth !== undefined) c.setDepth(opts.depth);

    // 头像底
    var bg = scene.add.graphics();
    bg.fillStyle(0x1d1428, 1);
    bg.fillCircle(0, 0, size / 2);
    c.add(bg);

    // 头像图
    var avKey = avId;
    if (!scene.textures.exists(avKey)) avKey = 'av_pea';
    var img = scene.add.image(0, 0, avKey).setDisplaySize(size, size);
    c.add(img);

    // 头像框
    var frKey = frId;
    if (scene.textures.exists(frKey)) {
      var fr = scene.add.image(0, 0, frKey).setDisplaySize(size * 1.24, size * 1.24);
      c.add(fr);
    }
    c.avatarImg = img;
    c.frameImg = c.list[c.list.length - 1];
    return c;
  };

  /* 更换头像/框（不重建容器） */
  Avatar.update = function (scene, c, size, opts) {
    opts = opts || {};
    var avId = opts.avatar || R.Meta.avatar;
    var frId = opts.frame || R.Meta.frame;
    if (c.avatarImg && scene.textures.exists(avId)) c.avatarImg.setTexture(avId);
    if (c.frameImg && c.frameImg.setTexture && scene.textures.exists(frId)) c.frameImg.setTexture(frId);
    return c;
  };

  /* 头像边缘轻微旋转（彩虹框等动效） */
  Avatar.spinFrame = function (scene, c, duration) {
    if (!c.frameImg) return;
    scene.tweens.add({ targets: c.frameImg, angle: 360, duration: duration || 8000, repeat: -1 });
  };
})(window.RogueGame = window.RogueGame || {});
