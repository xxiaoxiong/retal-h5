# 项目部署指南

本项目是使用 uni-app 开发的跨平台应用，可以部署为 H5 网页、各种小程序和原生 App。以下是几种部署方式的详细说明。

## 1. 构建项目

首先需要构建项目为对应平台的代码：

### H5 版本

```bash
npm run build:h5
```

构建后的文件位于 `dist/build/h5` 目录。

### 微信小程序版本

```bash
npm run build:mp-weixin
```

构建后的文件位于 `dist/build/mp-weixin` 目录。

## 2. 部署 H5 版本

### 方式一：Vercel（推荐）

1. 注册 [Vercel 账号](https://vercel.com/signup)（可以直接使用 GitHub 账号登录）
2. 安装 Vercel CLI：`npm install -g vercel`
3. 进入 H5 构建目录：`cd dist/build/h5`
4. 部署：`vercel --prod`

### 方式二：Netlify

1. 注册 [Netlify 账号](https://app.netlify.com/signup)
2. 创建新站点：点击 "New site from Git"
3. 配置构建设置：
   - Build command: `npm run build:h5`
   - Publish directory: `dist/build/h5`

### 方式三：GitHub Pages

使用项目根目录下的部署脚本：

```bash
npm run deploy
```

该命令会自动构建 H5 版本并部署到 GitHub Pages。

### 方式四：uniCloud 前端网页托管（专为 uni-app 优化）

1. 在 [DCloud 开发者后台](https://unicloud.dcloud.net.cn/) 创建服务空间
2. 在 HBuilderX 中使用 uniCloud 插件一键部署

## 3. 部署微信小程序

1. 打开微信开发者工具
2. 导入项目目录：`dist/build/mp-weixin`
3. 点击上传按钮，填写版本信息
4. 在微信公众平台提交审核

## 4. 注意事项

- 确保 API 接口支持 HTTPS
- 设置正确的跨域配置
- 对于微信小程序，注意将服务器域名添加到安全域名列表
