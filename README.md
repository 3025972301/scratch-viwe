# Scratch 作品展示平台

一个用于展示学生 Scratch 编程作品的在线平台，支持作品上传、在线运行、审核管理等功能。

## 技术栈

- **前端**: Vue 3 + Vuetify 3 + Vite
- **后端**: Cloudflare Workers + Hono
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2
- **运行时**: TurboWarp Scaffolding

## 功能特性

- 在线运行 Scratch (.sb3) 项目
- 学生作品展示与管理
- 多角色登录系统（管理员/学生）
- 作品审核流程
- 点赞、浏览量统计
- 数据备份与恢复
- 响应式设计，支持移动端

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 本地数据库初始化

```bash
# 初始化本地 D1 数据库
npm run cf:d1:init:local
```

## 一键部署到 Cloudflare

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/scratch-viwe)

> 请将上述链接中的 `YOUR_USERNAME` 替换为你的 GitHub 用户名

### 手动部署步骤

#### 1. 前置准备

- 注册 [Cloudflare 账号](https://dash.cloudflare.com/sign-up)
- 安装 Node.js 18+

#### 2. 登录 Cloudflare

```bash
npm run cf:login
```

#### 3. 创建 D1 数据库

```bash
npm run cf:d1:create
```

执行后会返回数据库 ID，需要更新 `wrangler.jsonc` 中的 `database_id`：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "scratch-viwe-db",
    "database_id": "你的数据库ID"  // 替换这里
  }
]
```

#### 4. 初始化数据库表结构

```bash
# 创建基础表
npx wrangler d1 execute scratch-viwe-db --remote --file=./migrations/schema.sql

# 添加用户系统表
npx wrangler d1 execute scratch-viwe-db --remote --file=./migrations/001_add_users.sql
```

#### 5. 创建 R2 存储桶

```bash
npm run cf:r2:create
```

#### 6. 配置环境变量

在 Cloudflare Dashboard 或通过命令行设置 JWT 密钥：

```bash
npx wrangler secret put JWT_SECRET
# 输入一个随机的安全字符串
```

#### 7. 部署应用

```bash
npm run deploy
```

## 配置说明

### wrangler.jsonc 配置

```jsonc
{
  "name": "scratch-viwe",           // 项目名称，也是部署后的子域名
  "compatibility_date": "2024-12-01",

  // 静态资源配置
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  },

  // Workers 入口
  "main": "workers/index.js",

  // D1 数据库
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "scratch-viwe-db",
      "database_id": "你的数据库ID"
    }
  ],

  // R2 存储
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "scratch-viwe-uploads"
    }
  ],

  // 环境变量（生产环境请使用 wrangler secret）
  "vars": {
    "JWT_SECRET": "your-jwt-secret-change-in-production"
  }
}
```

### 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| JWT_SECRET | JWT 签名密钥 | 是 |

## 默认账号

初始化数据库后，可使用以下默认管理员账号登录：

- 用户名: `admin`
- 密码: `admin123`

> 请在生产环境中及时修改默认密码！

## 项目结构

```
scratch-viwe/
├── src/                    # 前端源码
│   ├── components/         # 组件
│   ├── layouts/            # 布局组件
│   ├── pages/              # 页面（自动路由）
│   ├── stores/             # Pinia 状态管理
│   ├── utils/              # 工具函数
│   └── plugins/            # Vue 插件配置
├── workers/                # Cloudflare Workers 后端
│   └── index.js            # API 入口
├── migrations/             # 数据库迁移脚本
├── public/                 # 静态资源
│   └── lib/                # TurboWarp 运行库
└── wrangler.jsonc          # Cloudflare 配置
```

## 常用命令

```bash
# 开发
npm run dev              # 启动前端开发服务器
npm run cf:dev           # 启动 Workers 本地开发

# 构建与部署
npm run build            # 构建前端
npm run deploy           # 构建并部署到生产环境

# 数据库
npm run cf:d1:init:local # 初始化本地数据库
npm run cf:d1:init       # 初始化远程数据库
```

## 自定义域名

1. 在 Cloudflare Dashboard 中进入 Workers & Pages
2. 选择你的项目
3. 进入 Settings > Domains
4. 添加自定义域名

## 性能优化建议

1. **启用 Cloudflare CDN**: 自动为静态资源提供全球加速
2. **图片优化**: 上传时压缩缩略图
3. **懒加载**: 项目列表使用分页加载

## 故障排除

### 部署失败

- 确保已正确登录: `npm run cf:login`
- 检查 `wrangler.jsonc` 中的 `database_id` 是否正确
- 确保 R2 存储桶已创建

### 数据库错误

- 确保已执行数据库初始化脚本
- 检查 D1 数据库绑定名称是否为 `DB`

### 文件上传失败

- 确保 R2 存储桶已创建且绑定名称为 `BUCKET`
- 检查文件大小是否超过限制（Workers 免费版限制 100MB）

## 开源协议

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
