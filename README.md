# YGO · 游戏王卡牌工具

<p align="center">
  <img src="src/assets/app/logo-256x256.png" alt="YGO 软件图标" width="144" height="144" />
</p>

YGO 是一款基于 **Electron + React** 的桌面应用，用于自制游戏王卡牌、在线/本地查卡、管理卡组与查阅规则。本项目代码以 AI 辅助编写为主，开发者负责审核与集成。

**源码仓库**：[https://github.com/MonoKelvin/YGO](https://github.com/MonoKelvin/YGO)

---

## 能做什么

| 模块 | 说明 |
|------|------|
| **卡牌生成器** | 自定义名称、密码、插图、类型（怪兽/魔法/陷阱）及攻防、种族、效果等；画布实时预览（Mold 素材）；保存 PNG；在线插图由主进程拉取。 |
| **卡牌浏览器** | 管理已保存 DIY：流式卡面网格、搜索；右键载入编辑、打开图片或删除；优先显示已导出本地 PNG 缩略图。 |
| **卡牌数据库** | 默认 [YGOProDeck](https://ygoprodeck.com/api-guide/) 在线分页；可选本地全库（应用内更新或 `npm run cards:fetch`）。列表中文类型/属性；双击详情；批量/单张**加入卡组**（校验同名 3 张、主/额外区容量，不可选时显示原因）；卡图另存为。 |
| **我的卡组** | 内置不可删「默认卡组」；列表仅展示有卡或默认卡组；主/额外/副区编辑；数据存于用户目录。 |
| **规则百科** | 内置 Markdown 规则文档，按需加载。 |
| **设置** | 明暗主题、主色、数据库分页、自动保存、数据目录、关于（含仓库链接）等。 |

---

## 技术栈

React 19、React Router、Zustand；界面 [@lobehub/ui](https://github.com/lobehub/lobe-ui) + antd；桌面端 Electron（`preload` → `window.electronAPI`）；构建 Vite + electron-builder。

---

## 软件图标与素材说明

- **主图标（概念图）**：[豆包 AI](https://www.doubao.com/) 生成。  
- **多尺寸图标**（`logo-16x16.png` … `logo-256x256.png`）：[TRAE SOLO](https://solo.trae.cn/) 从母图导出，位于 `src/assets/app/`。  
- 打包时 `scripts/ensure-app-icons.mjs` 生成 `build/icon.ico` 等；NSIS 侧栏见 `scripts/prepare-nsis-installer-ui.mjs`。

---

## AI 辅助开发

常用工具包括 [Cursor](https://cursor.com/)、[Trae](https://www.trae.com.cn/)、[TRAE SOLO](https://solo.trae.cn/)、[DeepSeek](https://www.deepseek.com/) 等（条款以各产品官网为准）。

---

## 环境要求

- **Node.js ≥ 20.17**（推荐 **≥ 22.12**）
- **npm ≥ 9**

```bash
npm install
```

---

## 本地开发

```bash
npm run dev
```

同时启动 Vite（`http://127.0.0.1:5173`）与 Electron。**完整功能请在 Electron 内测试**（无 `window.electronAPI` 时部分能力不可用）。仅调 UI 可 `npm run vite:dev`。

---

## 构建与发布安装包

| 命令 | 作用 |
|------|------|
| `npm run build` | 生产构建前端到 `dist/` |
| `npm run desktop:build` | `build` + electron-builder |
| **`npm run package:release`** | 准备图标 → 构建 → 打安装包（清空 `dist_electron`） |

等价：`node scripts/package-release.mjs`。Windows 可 `scripts\package-release.cmd`。

可选：`--win` / `--mac` / `--linux`；`--skip-build`。

- **Windows**：NSIS 安装包，默认 per-machine。  
- 未配置签名时设 `CSC_IDENTITY_AUTO_DISCOVERY=false`。  
- `extraResources` 仅带 `src/assets` 下 `app/`、`docs/`、`cards/`，避免体积重复膨胀。

---

## 其它脚本

```bash
npm run cards:fetch          # 下载 YGOProDeck 全库 JSON
npm run cards:fetch:images   # 可选：批量卡图小图
npm run mold:check           # Mold 素材路径自检
npm run icons:prepare        # 生成 build 图标与 NSIS 位图
```

---

## 目录结构

```
electron/          # 主进程、preload、数据与窗口
src/
  components/      # 通用 UI、卡组编辑、卡牌库表格/弹窗等
  config/          # 卡牌/卡组/Mold/展示标签等常量
  pages/           # 路由页面
  store/           # Zustand（设置、卡组、卡牌库）
  services/        # YGOProDeck API、卡图缓存
  assets/          # Mold、规则 Markdown、图标
scripts/           # 打包、卡库拉取、图标与 NSIS
dist/              # Vite 产出（构建生成，已 gitignore）
dist_electron/     # 安装包（构建生成，已 gitignore）
```

---

## 卡组加入规则（简化）

卡牌数据库「加入卡组」与 store 内 `canAddCardsToDeck` 一致：

- 主卡组 ≤ 60 张，额外 ≤ 15，副卡组 ≤ 15  
- 主 + 副：同名卡合计 ≤ 3；额外区单独计 ≤ 3  
- 弹窗内不可加入的卡组会禁用勾选，悬停感叹号可查看原因  

---

## Mold 卡框素材

卡框等放在 `src/assets/Mold/`。占位 `Mold/placeholder.png`；路径约定见 `src/config/moldExpectedPaths.js`、`npm run mold:check`。

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
