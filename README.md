# YGO - 游戏王卡牌工具

## 简介

YGO 是一款用于生成、浏览与管理游戏王卡牌数据的 **Electron + React** 桌面应用：卡牌 DIY、在线/本地卡库查询、卡组编辑与规则百科阅读。

本项目全部代码由 AI 辅助生成，开发者负责审核与集成。鼠鼠我呀，真的是一行代码都不想写了～ (￣ω￣)

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
  - 效果文本与实时画布预览（对齐常见实体卡排版，可叠加 `src/assets/Mold` 素材）

- **卡牌浏览器**：列表缩略预览、搜索、删除；详情侧栏与「载入编辑」跳转生成页。

- **卡牌数据库**（默认 **在线 API**，无需把全库打进安装包）：
  - **在线查询**：通过 [YGOProDeck API](https://ygoprodeck.com/api-guide/) 按名称 / 类型 / 属性分页请求；卡图使用 CDN **动态加载**。
  - **本地全库（可选）**：应用内「更新卡牌数据库」或 `npm run cards:fetch` 将全库 JSON 写入用户目录或开发目录（便于离线筛选）；卡图可在线加载，`cards:fetch:images` 可批量落盘小图。
  - **加入卡组**：从数据库多选/单卡加入卡组（需先在「我的卡组」创建或打开目标卡组上下文）。

- **我的卡组**：卡组列表（置顶、重命名、删除）、卡组详情编辑器（主卡组 / 额外 / 副卡组分区拖拽式整理），数据持久化在用户目录。

- **规则百科**：内置 Markdown 规则文档与百科式导航（懒加载分包）。

- **设置**：主题（浅 / 深 / 跟随系统）、卡牌数据库分页条数、自动保存、数据目录（Electron）、关于信息等。

## 技术栈

- **前端**：React 19、React Router、Zustand
- **UI**：[@lobehub/ui](https://github.com/lobehub/lobe-ui)（含 ThemeProvider、Toast/Modal/ContextMenu、`ConfigProvider` + `motion/react` 动画上下文）；antd 作为 `@lobehub/ui` 的对等依赖
- **桌面**：Electron（主进程 IPC、`preload` 注入 `window.electronAPI`）
- **构建**：Vite、`electron-builder`
- **文案**：Markdown（规则页，`react-markdown` + `remark-gfm`）

## 开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

本仓库克隆后请在本地执行 `npm install` 生成你自己的锁定文件；团队协作若需固定依赖版本，可自行约定是否私下共享 lock 或使用其它方式锁定。

### 桌面开发模式（Windows / macOS / Linux）

本项目是 **Electron 桌面应用**。日常调试请使用：

```bash
npm run dev
```

会并行启动：

1. **Vite**（`http://127.0.0.1:5173`）— 界面热更新
2. **Electron** — 桌面窗口加载上述地址（与成品同一套壳）

请勿依赖「仅在浏览器打开 localhost」作为主流程；单独跑界面壳可执行 `npm run vite:dev` / `npm run renderer:dev`，此时 **无完整 Electron 能力**，依赖 `window.electronAPI` 的功能不可用。

### 构建与打包

```bash
npm run build              # 生产构建：Vite（NODE_ENV=production）+ copy-assets
npm run desktop:build      # build + electron-builder（当前平台默认目标）
npm run package:release    # 推荐：一键发布包（见下）
```

**一键发布安装包**（与 `desktop:build` 相比会固定生产环境、准备图标、校验产物并列出 `dist_electron`）：

- 命令行：`npm run package:release` 或 `node scripts/package-release.mjs`
- Windows 双击：`scripts\\package-release.cmd`
- macOS / Linux：`chmod +x scripts/package-release.sh && ./scripts/package-release.sh`

可选参数：`--win` / `--mac` / `--linux` 指定目标；`--skip-build` 在已有 `dist` 时跳过前端构建。

Windows 生成 **NSIS 图形安装向导**（非静默一键）：默认安装到 **`Program Files` 等系统级应用程序目录**（`perMachine`），带**安装进度**与结束页 **「是否运行 YGO」** 勾选（`runAfterFinish`，默认勾选），并包含 MIT `LICENSE` 协议页。图标统一来自 **`src/assets/app/`**（`logo-16x16.png` … `logo-256x256.png`）；打包前执行 `npm run icons:prepare` 生成 `build/icon.ico`（应用、安装程序、卸载程序共用）。**`build/` 目录为动态生成内容，已写入 `.gitignore`，勿提交到 Git。**

> 说明：NSIS `.exe` 需在 **Windows** 环境打包；`.dmg` 需在 **macOS**；Linux 默认产出 **AppImage**。未配置代码签名时脚本会设置 `CSC_IDENTITY_AUTO_DISCOVERY=false` 以免 mac 打包卡住。

### 卡牌数据库脚本

```bash
npm run cards:fetch         # 下载 YGOProDeck 全库 JSON（输出路径见脚本说明）
npm run cards:fetch:images  # 可选：批量小图
```

应用内「更新卡牌数据库」会将全库 JSON 写入 **用户数据目录**，便于切换「本地全库」模式离线筛选。

### Mold 素材自检

```bash
npm run mold:check
```

## 项目结构（概要）

```
YGO/
├── .cursor/                 # Cursor 规则（可选，已纳入版本库）
├── electron/
│   ├── main.cjs             # 主进程入口
│   ├── preload.js
│   └── services/            # 数据目录、窗口状态、YGO 卡库/缓存等
├── src/
│   ├── App.jsx              # 根组件：主题、Toast/Modal、路由
│   ├── main.jsx
│   ├── assets/              # 全局样式、Mold、文档与静态资源
│   ├── components/          # layout、card-preview、deck、settings、common…
│   ├── config/              # 卡牌常量、Mold 路径、YGO API 筛选等
│   ├── pages/
│   │   ├── card-generator/  # 卡牌生成
│   │   ├── card-browser/    # 已保存 DIY 列表
│   │   ├── card-library/    # 在线/本地卡库、详情
│   │   ├── deck/            # 卡组列表与编辑
│   │   ├── rules/           # 规则百科
│   │   └── settings/
│   ├── services/            # 渲染进程侧 API 封装（如卡图缓存客户端）
│   ├── store/               # Zustand（卡牌、设置、路由 UI、YGO 数据库状态）
│   ├── theme/               # 明暗主题、Lobe antd token 构建
│   └── utils/
├── scripts/                 # mold-check、fetch-ygoprodeck、package-release 等
├── copy-assets.js
├── vite.config.js
├── package.json
└── index.html
```

## 资源说明（Mold）

卡牌 Mold 位于 `src/assets/Mold/`，请使用包内 **PNG / JPG / WebP** 栅格资源。预览与导出依赖 Vite 打包路径。

- **占位图**：`Mold/placeholder.png`。仅当某小图标路径缺失时在该槽位显示；卡框大图缺失时仍以画布底色绘制，不整张替换为占位图。
- **路径约定**（与常见 Mold 包一致）：属性 `Attribute/...`、边框 `Frame/...`、魔陷图标 `Icon/` 或 `Attribute/cn/spell.png` 等，详见 `src/config/moldExpectedPaths.js` 与 `npm run mold:check` 输出。

官方卡图与设计版权归 **KONAMI**，本项目仅用于本地 DIY 与学习交流，请勿将他人素材用于商业用途。

## 赞助

如果你觉得这个项目对你有帮助，欢迎扫描下方二维码进行赞助：

| 支付宝 | 微信 |
| :---: | :---: |
| <img src="src/assets/images/alipay_payment_code.jpg" width="200" height="231"> | <img src="src/assets/images/wechat_payment_code.jpg" width="200" height="219"> |

## 许可证

[MIT](LICENSE)（与 `package.json` 中 `license` 字段一致）
