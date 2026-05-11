# YGO - 游戏王卡牌工具

## 简介

YGO 是一款用于生成和浏览游戏王卡牌的桌面应用程序，基于 Electron + React 构建。

本项目全部代码由AI赛博打工人生成，开发者负责监督和取餐。鼠鼠我呀，真的是一行代码都不想写了～ (￣ω￣)

### AI 开发工具

开发与迭代中主要使用下列工具（链接仅供参考，服务条款以各官网为准）：

- [Trae](https://www.trae.com.cn/) — 字节跳动 AI 原生 IDE（国内站）
- [Cursor](https://cursor.com/) — AI 代码编辑器
- [DeepSeek](https://www.deepseek.com/) — DeepSeek 大模型与对话

## 功能特性

- **卡牌生成器**：创建自定义游戏王卡牌
  - 名称、8 位密码、插图
  - 类型：怪兽 / 魔法 / 陷阱
  - 怪兽：属性、等级（★）、种族、类别（通常/效果/仪式等）、攻防
  - 魔法 / 陷阱：种类（通常、永续、反击等）
  - 效果文本与实时画布预览（分区对齐实体卡常见排版，可叠加 `src/assets/Mold` 素材）

- **卡牌浏览器**：
  - 列表缩略预览、搜索、删除
  - 详情侧栏与「载入编辑」跳转生成页

- **卡牌数据库**（默认 **在线 API**，无需把全库打进安装包）：
  - **在线查询**：通过 [YGOProDeck API](https://ygoprodeck.com/api-guide/) 按名称 / 类型 / 属性分页请求；卡图使用接口返回的 CDN 地址 **动态显示**，不占包体积。
  - **本地全库（可选）**：应用内「更新卡牌数据库」或 `npm run cards:fetch` 将全库 JSON 存到用户目录或 `src/assets/cards/data/`（用于离线筛选）；卡图仍可在线加载，只有执行 `cards:fetch:images` 才会批量落盘。
  - **组卡**：主卡组 ≤60、额外 ≤15、同名 ≤3；卡组与卡牌快照写入用户目录 `ygo-decks.json`，列表始终可显示卡名。

- **设置**：
  - 主题切换（浅色/深色/跟随系统）
  - 卡牌显示选项设置

## 技术栈

- **前端框架**：React 18
- **状态管理**：Zustand
- **UI 组件库**：lobe-ui + Ant Design
- **桌面框架**：Electron
- **构建工具**：Vite + electron-builder

## 开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 桌面开发模式（Windows / macOS / Linux）

本项目是 **Electron 桌面应用**，不是浏览器网站。开发时请：

```bash
npm run dev
```

该命令会并行启动：

1. **Vite**（`http://127.0.0.1:5173`）— 仅负责界面热更新；  
2. **Electron** — 弹出 **桌面窗口**，通过上述地址加载界面（与成品安装包同一套壳）。

请勿依赖「在浏览器打开 localhost」作为日常调试方式；若只想单独跑 Vite（一般不推荐），可执行 `npm run vite:dev` 或 `npm run renderer:dev`，此时**不会出现完整桌面壳**，部分依赖 `window.electronAPI` 的功能不可用。

打包生成 Windows 安装程序：

### 构建应用

```bash
npm run desktop:build
```

### 卡牌数据库（在线优先）

[KONAMI](https://www.yugioh-card.com/) **不提供**公开的全量卡牌下载 API。社区常用数据源包括：

- **[YuGiOh-Database](https://github.com/Wildric-Auric/YuGiOh-Database)**：SQLite + 按卡片 ID 命名的图片目录。
- **[YGOProDeck](https://ygoprodeck.com/)**：开放的 **[HTTP API](https://ygoprodeck.com/api-guide/)**（支持 `fname`、`type`、`attribute`、`num`、`offset` 等查询参数）与 **CDN 卡图**。本应用「在线查询」模式直接调用 API + 显示 CDN 图片，**安装包不必内置 JSON**。

**应用内更新（推荐）**：打开「卡牌数据库」页，点击 **「更新卡牌数据库」**，主进程会从 API 拉取全库 JSON 写入 **用户目录** `ygo-data/cards.json` 与 `summary.json`，便于切换到「本地全库」做离线筛选；卡图仍可走网络，除非你另行批量下载。

**命令行（开发者）**：在项目根目录执行：

```bash
npm run cards:fetch
```

将在 `src/assets/cards/data/` 生成 `cards.json`、`summary.json`（大文件已 `.gitignore`）。可选批量小图：

```bash
npm run cards:fetch:images
```

打包时若存在 `src/assets/cards`，会随 `copy-assets.js` 一并复制；无此目录时软件仅靠在线 API + 用户目录缓存即可运行。

## 项目结构

```
YGO/
├── electron/          # Electron 主进程
│   ├── main.cjs       # 主进程入口
│   └── preload.js     # 预加载脚本
├── src/               # React 渲染进程
│   ├── assets/        # 静态资源（卡牌素材、样式）
│   │   ├── css/       # 全局样式变量
│   │   ├── images/    # 图片资源
│   │   ├── Mold/      # 卡牌 DIY 素材
│   │   └── cards/     # 全库数据（cards.json 由脚本生成，默认 gitignore）
│   ├── components/    # React 组件
│   │   └── card-preview/  # 卡牌画布预览（绘制逻辑拆分）
│   ├── config/        # 配置常量、布局、Mold 路径解析
│   ├── pages/         # 页面视图
│   ├── store/         # Zustand 状态管理
│   ├── App.jsx        # 根组件
│   └── main.jsx       # 渲染进程入口
├── scripts/
│   ├── mold-check.mjs      # Mold 素材自检
│   └── fetch-ygoprodeck.mjs # 下载 YGOProDeck 全库 JSON（及可选卡图）
├── package.json
├── vite.config.js
├── copy-assets.js     # 资源复制脚本
└── index.html
```

## 资源说明

卡牌 Mold 素材位于 `src/assets/Mold/`，**请直接使用包内已有的 PNG/JPG/WebP**，不要在仓库里另建替代用 SVG。程序只会通过 Vite 打包这些栅格图。

- **占位图**：仓库内置 `Mold/placeholder.png`（极小空白 PNG）。仅当某一「右上角图标」路径在 Mold 中不存在时，预览会在该位置贴上此占位图；**卡框大图缺失时不叠整张占位图**，仍使用画布绘制底色。
- **路径解析（与常见 Mold 包一致）**：
  - 怪兽属性：`Attribute/cn|en|jp/<属性>.png`
  - 魔法 / 陷阱右上角：`Icon/spell.png`、`Icon/trap.png`，也会查找 **`Attribute/cn/spell.png`、`Attribute/cn/trap.png`**（许多套装把魔陷图标放在 Attribute 下）。
  - 边框：`Frame/spell.jpg`、`Frame/trap.jpg`，怪兽框支持 **`Frame/monster_tt.jpg`** 等 `monster*.jpg/png` 命名。

目录结构示例（按你的 Mold 包实际为准）：

- `Arrow/` — 箭头
- `Attribute/` — 属性（及 spell/trap 图标等）
- `Font/` — 字体
- `Frame/` — 边框（多种 monster_*、spell、trap 等）
- `Holo/` — 全息
- `Icon/` — 其它功能小图标
- `Star/` — 星级 / 阶级星

### 素材自检

```bash
npm run mold:check
```

脚本会对比 `src/config/moldExpectedPaths.js` 中的候选路径与磁盘文件；若某项缺失，终端会列出说明。**补齐时请下载 PNG/JPG 放到对应文件夹**，命名可参考脚本提示或与现有 Mold 文件保持一致。

### 缺失素材时可参考的来源（注意版权与使用条款）

- [GitHub — topic:yugioh card template](https://github.com/topics/yugioh) — 搜索 DIY / card generator / mold 相关开源资源  
- [DeviantArt — Yu-Gi-Oh card template](https://www.deviantart.com/search?q=yugioh%20card%20template) — 同人模板（使用前请确认作者授权）  
- [reddit — r/yugioh](https://www.reddit.com/r/yugioh/) — 社区讨论与资源索引  
- 中文社区：百度贴吧「游戏王diy」、NGA 游戏王区等 — 常有 Mold 整合包分享（下载后请自行校验内容与授权）

官方卡图与设计版权归 **KONAMI**，本项目仅用私有 Mold 做本地预览与生成练习，请勿将他人素材用于商业用途。

## 赞助

如果你觉得这个项目对你有帮助，欢迎扫描下方二维码进行赞助：

| 支付宝 | 微信 |
| :---: | :---: |
| <img src="src/assets/images/alipay_payment_code.jpg" width="200" height="231"> | <img src="src/assets/images/wechat_payment_code.jpg" width="200" height="219"> |

## 许可证

MIT
