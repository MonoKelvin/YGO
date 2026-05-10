# YGO - 游戏王卡牌工具

## 简介

YGO 是一款用于生成和浏览游戏王卡牌的桌面应用程序，基于 Electron + Vue 3 构建。

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

- **前端框架**：Vue 3
- **状态管理**：Pinia
- **UI 组件库**：Naive UI
- **桌面框架**：Electron
- **构建工具**：Vite + electron-builder

## 开发

### 环境要求

- Node.js >= 16
- npm >= 8

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
│   ├── main.js        # 主进程入口
│   └── preload.js     # 预加载脚本
├── src/               # Vue 渲染进程
│   ├── assets/        # 静态资源
│   ├── components/    # Vue 组件
│   ├── config/        # 配置
│   ├── router/        # 路由
│   ├── stores/        # Pinia 状态
│   ├── views/         # 页面视图
│   ├── App.vue        # 根组件
│   └── main.js        # 渲染进程入口
├── public/            # 公共资源
│   └── assets/        # 卡牌素材资源
├── package.json
├── vite.config.js
└── index.html
```

## 赞助

如果你觉得这个项目对你有帮助，欢迎扫描下方二维码进行赞助：

![支付宝](public/assets/images/alipay_payment_code.jpg)
![微信](public/assets/images/wechat_payment_code.jpg)

## 许可证

ISC
