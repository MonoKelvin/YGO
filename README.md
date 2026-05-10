# YGO - 游戏王卡牌工具

## 简介

YGO 是一款用于生成和浏览游戏王卡牌的桌面应用程序，基于 Electron + React 构建。

## 功能特性

- **卡牌生成器**：创建自定义游戏王卡牌，支持以下功能：
  - 设置卡牌名称、密码、卡包
  - 选择卡片类型（通常、效果、仪式、融合、同调、XYZ、灵摆、连接）
  - 选择属性（光、暗、炎、水、风、地、神）
  - 设置等级/阶级、LINK 标记
  - 设置种族、攻击力、防御力
  - 编写效果描述
  - 加载自定义图片
  - 启用/禁用全息效果
  - 实时预览卡牌效果

- **卡牌浏览器**：
  - 浏览已创建的卡牌列表
  - 搜索卡牌
  - 编辑/删除卡牌
  - 快速加载卡牌进行编辑

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

### 开发模式

```bash
npm run dev
```

### 构建应用

```bash
npm run desktop:build
```

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
│   │   └── Mold/      # 卡牌素材资源
│   ├── components/    # React 组件
│   ├── config/        # 配置常量
│   ├── pages/         # 页面视图
│   ├── store/         # Zustand 状态管理
│   ├── App.jsx        # 根组件
│   └── main.jsx       # 渲染进程入口
├── package.json
├── vite.config.js
├── copy-assets.js     # 资源复制脚本
└── index.html
```

## 资源说明

卡牌素材资源位于 `src/assets/Mold/` 目录下，包含：
- `Arrow/` - 箭头图标
- `Attribute/` - 属性图标（支持中、英、日三种语言）
- `Font/` - 卡牌字体文件
- `Frame/` - 卡牌边框模板
- `Holo/` - 全息效果素材
- `Icon/` - 类型图标
- `Star/` - 等级/阶级星星

## 赞助

如果你觉得这个项目对你有帮助，欢迎扫描下方二维码进行赞助：

| 支付宝 | 微信 |
| :---: | :---: |
| <img src="src/assets/images/alipay_payment_code.jpg" width="200" height="231"> | <img src="src/assets/images/wechat_payment_code.jpg" width="200" height="219"> |

## 许可证

MIT
