# assets 资源目录说明

按类型分组存放，**每张图的文件名必须等于它的 id**（见 `美术资源清单.md`）。

```
assets/
├── characters/   主角皮肤     skin_default / skin_night / skin_ember / skin_frost / skin_royal / skin_angel
├── enemies/      小怪与 Boss   slime / bat / charger / spitter / skull / skull_gold / golem / king_pea
├── fx/           特效         bullet_pea / bullet_seed / blob / blob_soft / pet_ball
├── pickups/      拾取物       pickup_gem / pickup_heart / pickup_coin / pickup_shield / pickup_maxhp / chest
├── world/        场景         portal / portal_swirl / tile / tile_ch1 / tile_ch2 / tile_ch3
├── props/        道具         pet_nest / pet_egg / pet_buddy / altar_bless / altar_curse / fountain
├── obstacles/    建筑障碍     ob_house / ob_rock / ob_tree / ob_crate / ob_bush / ob_well / ob_tomb / ob_pillar
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
