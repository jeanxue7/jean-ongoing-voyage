# Journey Interactions v1

Jean 个人网站的五屏静态可点击原型。它用于先验证主视觉、章节节奏和交互层级，再迁移到正式前端工程。

## 运行

在仓库根目录执行：

```bash
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/prototype/journey-interactions-v1/
```

## 当前流程

- Opening：主视觉与“开始这段旅程”。
- 01 / Life Experiments：走近分岔路，查看基础信息、职业路径与兴趣爱好。
- 02 / Creative Logbook：朋友 A → Jean → 朋友 B → Jean → 创作记录亮起 → 翻书 → 创作目录。
- 03 / My Bar, Our Postscript：邀请信 → 酒吧 H5 → 酒吧介绍、按心情选酒、后话卡、留下后话。
- 04 / Places That Changed Me：地点气球 → 世界地图 → 东非、广州、北京、大理内容层。

## 视频接入原则

五个场景均已预留 `.scene-media[data-video-slot]`。后续接入视频时：

1. 保留 PNG 作为 `poster`、首帧和弱网降级图。
2. 视频使用 `muted playsinline loop`，仅当前章节播放，下一章节临近时预加载。
3. 等待 `canplay` 后再以 opacity 交叉淡入，避免黑帧和图片突然消失。
4. `prefers-reduced-motion: reduce`、移动端或省流模式继续显示静态图。
5. 标题、按钮、路线和交互提示全部保持为 HTML/CSS，不烘焙进视频。

建议先用 04 热气球验证 6–7 秒的低幅度环境循环，再决定 02、03、Opening 与 01 的动态范围。
