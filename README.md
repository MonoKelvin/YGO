# YGO · 游戏王卡牌工具

<p align="center">
  <img src="src/assets/app/logo-256x256.png" alt="YGO 软件图标" width="144" height="144" />
</p>

YGO 是一款基于 **Electron + React** 的，主要用于生成自制游戏王卡牌的桌面应用程序，其他功能包括：在线/本地查卡、管理卡组、查阅游戏王规则等。本项目全部代码由 AI 辅助生成，开发者负责审核与集成。鼠鼠我呀，真的是一行代码都不想写了～ (￣ω￣)

---

## 能做什么

| 模块 | 说明 |
|------|------|
| **卡牌生成器** | 自定义名称、密码、插图、类型（怪兽/魔法/陷阱）及攻防、种族、效果等；画布实时预览（Mold 素材）；支持保存 PNG 到本机、在线插图由主进程拉取后预览。 |
| **卡牌浏览器** | 管理已保存的 DIY：流式卡面网格、搜索；右键载入编辑、打开图片或删除；优先显示已导出的本地 PNG 缩略图。 |
| **卡牌数据库** | 默认走 [YGOProDeck](https://ygoprodeck.com/api-guide/) 在线分页；可选本地全库（应用内更新或 `npm run cards:fetch`）。列表类型/属性显示中文；双击进详情（卡图右键另存为、效果区独立滚动、收录卡包 Form）；卡图下载走系统保存对话框。 |
| **我的卡组** | 列表与详情编辑（主卡组 / 额外 / 副卡组），数据保存在本机用户目录。 |
| **规则百科** | 内置 Markdown 规则文档，按需加载。 |
| **设置** | 明暗主题、数据库分页、自动保存、数据目录、关于等。 |

---

## 技术栈

React 19、React Router、Zustand；界面 [@lobehub/ui](https://github.com/lobehub/lobe-ui) + antd；桌面端 Electron（`preload` 暴露 `window.electronAPI`：文件读写、远程图片探测/拉取/另存为等）；构建用 Vite 与 electron-builder。

---

## 软件图标与素材说明

- **主图标（概念图 / 母图）**：由 **[豆包 AI](https://www.doubao.com/)** 生成。  
- **多尺寸图标**（如 `logo-16x16.png` … `logo-256x256.png`）：由 **[TRAE SOLO](https://solo.trae.cn/)** 从母图生成，放入 `src/assets/app/`。  
- 打包时脚本会**自动选取其中尺寸最大的一张方形 `logo-NxN.png`**，生成 `build/icon.ico`、`build/icon.png` 及 NSIS 侧栏位图（见 `scripts/ensure-app-icons.mjs`、`scripts/prepare-nsis-installer-ui.mjs`）。

---

## AI 辅助开发

项目代码以 AI 辅助编写为主，人工审核与集成。常用工具包括 [Cursor](https://cursor.com/)、[Trae](https://www.trae.com.cn/)、[TRAE SOLO](https://solo.trae.cn/)、[DeepSeek](https://www.deepseek.com/) 等（具体条款以各产品官网为准）。

---

## 环境要求

- **Node.js ≥ 20.17**（推荐 **≥ 22.12**，与 electron-builder 26、`rcedit` 等工具链一致，减少告警）
- **npm ≥ 9**

```bash
npm install
```

---

## 本地开发

```bash
npm run dev
```

同时启动 Vite（`http://127.0.0.1:5173`）与 Electron 窗口。**不要**只靠浏览器打开该地址做完整功能测试（无 `window.electronAPI`）。仅调界面时可 `npm run vite:dev`。

---

## 构建与发布安装包

| 命令 | 作用 |
|------|------|
| `npm run build` | 生产构建前端到 `dist/` |
| `npm run desktop:build` | `build` + electron-builder（当前系统默认目标） |
| **`npm run package:release`** | **推荐**：准备图标 → 生产构建 → 打安装包；**会先清空 `dist_electron`**，避免旧产物干扰 |

等价：`node scripts/package-release.mjs`。Windows 还可双击 `scripts\package-release.cmd`；macOS/Linux 见 `scripts/package-release.sh`。

可选参数：`--win` / `--mac` / `--linux`；`--skip-build`（已有 `dist` 时跳过前端构建）。

- **Windows**：NSIS 安装包（图形向导、扁平化侧栏/顶栏位图），默认 per-machine；图标由 `npm run icons:prepare`（或随 `package:release`）生成。  
- **未配置签名**时脚本会设 `CSC_IDENTITY_AUTO_DISCOVERY=false`，避免 macOS 打包在无证书时卡住。  
- **安装包体积**：大资源由 Vite 打进 `app.asar`；`extraResources` 仅带 `src/assets` 下的 `app/`、`docs/`、`cards/` 等子目录，勿整库重复拷贝以免体积暴涨。

---

## 其它脚本

```bash
npm run cards:fetch          # 下载 YGOProDeck 全库 JSON（路径见脚本说明）
npm run cards:fetch:images   # 可选：批量卡图小图
npm run mold:check           # Mold 素材路径自检
npm run icons:prepare        # 从 src/assets/app 生成 build 图标与 NSIS 位图
```

---

## 目录结构

```
electron/          # 主进程、preload、数据与窗口服务
src/               # 渲染进程：页面、组件、store、主题、资源（含 ygoDisplayLabels 等展示映射）
scripts/           # 打包、卡库拉取、NSIS 位图、Mold 检查等
dist/              # Vite 产出（构建生成）
dist_electron/     # 安装包与解包目录（构建生成）
```

---

## Mold 卡框素材

卡框等栅格图放在 `src/assets/Mold/`（PNG/JPG/WebP）。占位见 `Mold/placeholder.png`；路径约定与 `src/config/moldExpectedPaths.js`、`npm run mold:check` 一致。

游戏王官方卡图与设计版权归 **KONAMI**。本项目仅供本地学习与 DIY，请勿将第三方素材用于商业用途。

---

## 赞助

若本项目对你有帮助，欢迎赞助支持：

| 支付宝 | 微信 |
| :---: | :---: |
| <img src="src/assets/images/alipay_payment_code.jpg" width="200" height="231"> | <img src="src/assets/images/wechat_payment_code.jpg" width="200" height="219"> |

---

## 许可证

[MIT](LICENSE)
