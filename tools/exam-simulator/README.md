# Exam Simulator（在线模拟考试系统）

面向小学/初中学生的在线模拟考试工具。家长可以管理题库，学生在正式的考试环境中答题练习。

## 技术栈

- React 18 + TypeScript 5
- Vite 5
- Tailwind CSS 3
- Supabase（数据库 + 后端服务）
- Vitest + fast-check（测试）

## 项目设置

### 1. 设置 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com) 并登录（或注册账户）
2. 点击 "New Project" 创建一个新项目
3. 填写项目名称（如 `exam-simulator`），设置数据库密码，选择就近的区域
4. 等待项目初始化完成（通常需要 1-2 分钟）
5. 进入项目后，在 "Settings" → "API" 页面获取：
   - **Project URL**：即 `VITE_SUPABASE_URL`
   - **anon public key**：即 `VITE_SUPABASE_ANON_KEY`

#### 本地开发（可选）

如果使用 Supabase CLI 进行本地开发：

```bash
# 安装 Supabase CLI
npm install -g supabase

# 初始化并启动本地 Supabase
supabase init
supabase start
```

启动后，本地 Supabase 默认地址为 `http://localhost:54321`，CLI 输出中会包含 `anon key`。

#### 创建数据库表

在 Supabase Dashboard 的 SQL Editor 中执行 `supabase/migrations/` 目录下的 SQL 文件来创建所需的数据表（questions、exam_sessions、exam_records）。

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 Supabase 项目信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

> ⚠️ `.env` 文件已在 `.gitignore` 中忽略，不会被提交到版本控制。请勿将真实密钥提交到代码仓库。

### 3. 安装依赖

```bash
npm install
```

### 4. 运行开发服务器

```bash
npm run dev
```

开发服务器默认在 `http://localhost:5173` 启动。

### 5. 运行测试

```bash
# 运行所有测试
npm test

# 以监听模式运行测试
npm run test:watch

# 运行单次测试（CI 模式）
npx vitest run

# 运行特定目录的测试
npx vitest run tests/lib/
```

### 6. 构建项目

```bash
npm run build
```

构建命令会先执行 TypeScript 类型检查（`tsc`），再执行 Vite 构建。构建产物输出到 `dist/` 目录。

## 项目结构

```
tools/exam-simulator/
├── src/
│   ├── components/     # 共享 UI 组件
│   ├── hooks/          # 自定义 React Hooks
│   ├── lib/            # 纯业务逻辑（无副作用）
│   ├── pages/          # 页面组件
│   ├── services/       # Supabase 数据访问层
│   ├── styles/         # 全局样式
│   └── types/          # TypeScript 类型定义
├── tests/              # 测试文件
├── supabase/           # 数据库迁移脚本
├── .env.example        # 环境变量模板
├── vercel.json         # Vercel 部署配置
└── vite.config.ts      # Vite 配置
```

## 部署

项目配置了 `vercel.json`，支持直接部署到 Vercel。部署前需在 Vercel 项目设置中配置环境变量：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
