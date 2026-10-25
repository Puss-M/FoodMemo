# FoodMemo

[![CI](https://github.com/Puss-M/FoodMemo/actions/workflows/ci.yml/badge.svg)](https://github.com/Puss-M/FoodMemo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg?logo=nextdotjs)](package.json)

食物记忆 PWA —— 记录每一餐，也记录和朋友共享的日常。

## 功能

- 🍱 **饮食记录**：按用户维度的饮食流水（`/user/[id]` 个人主页）
- 🔐 **账号体系**：Supabase SSR 认证（登录 / 个人资料 / 设置页）
- 📱 **PWA**：`@ducanh2912/next-pwa` 离线缓存，可添加到主屏幕
- 🎨 **动效与提示**：framer-motion 页面过渡，sonner 通知
- 🧭 **饮食指南**：内置 guidelines 页面

## 技术栈

Next.js 16 (App Router) · TypeScript · Supabase (SSR + Database) · Zustand · Tailwind CSS · next-pwa

## 快速开始

```bash
npm install
cp .env.local.example .env.local   # 填入 Supabase 项目地址与 Key
npm run dev
```

生产构建：`npm run build && npm start`；Cloudflare Pages 部署使用 `npm run pages:build`。

## License

[MIT](LICENSE)
