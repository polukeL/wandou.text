# assets 资源目录说明

按类型分组存放，**每张图的文件名必须等于它的 id**（见 `美术资源清单.md`）。

```
assets/
├── characters/   主角皮肤     skin_default / skin_night / skin_ember / skin_frost / skin_royal / skin_angel
│                              （精英怪变体在 enemies/：<怪>_elite.png，如 slime_elite.png）
├── enemies/      小怪与 Boss   slime / bat / charger / spitter / skull / skull_gold / golem / king_pea
│                              精英变体   slime_elite / bat_elite / charger_elite / spitter_elite / skull_elite
├── fx/           特效         bullet_pea / bullet_seed / blob / blob_soft / pet_ball
├── pickups/      拾取物       pickup_gem / pickup_heart / pickup_coin / pickup_shield / pickup_maxhp / chest
├── world/        场景         portal / portal_swirl / tile / tile_ch1 / tile_ch2 / tile_ch3
├── props/        道具         pet_nest / pet_egg / pet_buddy / altar_bless / altar_curse / fountain
├── obstacles/    建筑障碍     ob_house / ob_rock / …（通用）
│   ├── ch1/      第一章专用建筑（同 id，分章出图时放这里）
│   ├── ch2/      第二章专用建筑
│   └── ch3/      第三章专用建筑
├── avatars/      头像与框     av_* / fr_*
├── icons/        升级卡图标   pea / shot / sword / heart …（可选，需代码接入）
├── ui/           界面         title_bg / title_plate / btn_* / card / panel / boot_logo / boot_bg / loading_bar_*
└── audio/        音效         bgm_main / shoot / hit / kill / hurt / pickup / coin / heal / level / reward / boss
```

## 三个要点

1. **文件名 = id，不要改**。`assets/characters/skin_default.png` 会被自动识别为默认主角皮肤。
2. **旧路径仍然有效**。把图直接丢在 `assets/` 根目录也认（向后兼容），但建议按分组放，方便管理。
3. **必须是真 PNG** 且通过 `http://` 打开（双击 index.html 无效，用 `启动游戏.bat`）。

## 加载顺序（v0.7.6）

游戏启动时会先对每条候选路径发一次 HEAD 探测，命中就用命中的地址加载：

建筑分章探测（v0.8.0）：

```
assets/obstacles/ch1/ob_house.png   ← 分章子目录（推荐）
assets/obstacles/ob_house_ch1.png   ← 平铺命名
assets/obstacles/ob_house.png       ← 通用
assets/ob_house.png                 ← 旧路径兼容
```

```
assets/characters/skin_default.png   ← 首选（分组目录）
assets/skin_default.png              ← 兜底（根目录旧路径）
```

两者都没有 → 使用代码绘制的占位图，不影响游戏运行。

## 验证是否生效

打开游戏按 F12，Console 里应出现：

```
[豌豆镇] 资源探测完成：命中 3/64 个可选素材（46ms）
[豌豆镇] 已替换的正式贴图: skin_default, slime, golem
```

第一行是探测汇总（`命中 3/64` = 64 个可替换位里你提供了 3 张），第二行是实际覆盖成功的 id。
如果显示 `未检测到任何正式贴图`，检查文件名和目录是否与上表一致；如果显示 `使用占位图（未找到素材）`，后面列出的就是还缺的 id。
