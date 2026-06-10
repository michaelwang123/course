# Implementation Plan: React Migration

## Overview

将现有 VitePress（Vue）技术教程站点迁移至 Docusaurus 3（React）。实施按阶段推进：先初始化项目骨架和依赖，再迁移内容并验证构建，然后实现 React 组件（含测试），最后配置 CI/CD 并清理旧文件。所有动画组件使用 TypeScript + React 重写，每个组件实现后立即编写对应测试，使用 Vitest + React Testing Library + fast-check。

## Tasks

- [x] 1. 初始化 Docusaurus 3 项目骨架
  - [x] 1.1 创建 Docusaurus 项目配置
    - 创建 `docusaurus.config.ts`，配置 title、url、baseUrl (`/course/`)、i18n (`zh-Hans`)、presets (classic with `routeBasePath: '/'`)、colorMode (dark only)、navbar、headTags、onBrokenLinks: 'throw'
    - 创建 `sidebars.ts`，配置 ragflow 模块的侧边栏条目（介绍、架构概览、安装部署、快速上手、进阶功能）
    - _Requirements: 1.1, 1.5, 1.7, 5.1, 5.2, 8.1, 12.1, 12.2_

  - [x] 1.2 配置项目依赖与 TypeScript
    - 更新 `package.json`：添加 React、Docusaurus、Tailwind、测试框架（vitest、@testing-library/react、@testing-library/jest-dom、happy-dom、fast-check、@fast-check/vitest）所有依赖，配置 build/dev/test scripts
    - 创建 `tsconfig.json`：配置 jsx、module resolution、路径别名 `@site`
    - 更新 `.gitignore`：添加 `build/`、`.docusaurus/`、`node_modules/`
    - 执行 `npm install` 并验证依赖安装成功
    - _Requirements: 8.1, 8.2, 8.5, 9.1_

  - [x] 1.3 配置 Tailwind CSS 与 PostCSS 集成
    - 更新 `tailwind.config.js`：设置 `content` 路径、`darkMode: ['selector', '[data-theme="dark"]']`、`corePlugins.preflight: false`、品牌色扩展
    - 更新 `postcss.config.js`：配置 tailwindcss 和 autoprefixer 插件
    - _Requirements: 6.2_

  - [x] 1.4 配置搜索插件
    - 在 `docusaurus.config.ts` 的 themes 中添加 `@easyops-cn/docusaurus-search-local` 配置
    - 设置中文分词 (`language: ['zh', 'en']`)、结果限制 (20 条)、搜索提示翻译
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 12.3_

  - [x] 1.5 配置测试基础设施
    - 创建 `vitest.config.ts`：配置 react plugin、happy-dom 环境、路径别名 `@site`、文件模式和排除规则
    - 创建 `vitest.setup.ts`：引入 `@testing-library/jest-dom/vitest`
    - 注意：测试依赖（vitest、@testing-library/react、@testing-library/jest-dom、happy-dom、fast-check、@fast-check/vitest）已在 task 1.2 的 package.json 中声明并安装
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_

- [x] 2. Checkpoint - 验证项目初始化
  - 执行 `npm run build`（预期通过，docs/ 可为空目录或含占位文件）
  - 确认无依赖错误，TypeScript 编译正常
  - Ensure all configurations are valid, ask the user if questions arise.

- [x] 3. 内容迁移与格式转换
  - [x] 3.1 迁移 Markdown 内容到 docs/ 目录
    - 将 `ragflow/`、`ai_tech/`、`basketball_skill/`、`book_read/`、`life_wish/`、`site_build/` 目录移动到 `docs/` 下
    - 保持模块内部目录结构不变
    - _Requirements: 2.1, 2.2, 11.1_

  - [x] 3.2 迁移静态资源文件
    - 将各模块 `assets/` 目录内容移动到 `static/img/` 并更新 Markdown 中的引用路径
    - 将 `site_build/beta/demo-animation.html` 移动到 `static/site_build/beta/`
    - _Requirements: 2.6, 11.4, 11.5_

  - [x] 3.3 转换 VitePress 专有格式为 Docusaurus 格式
    - 将包含 Vue 组件标签的 .md 文件转换为 .mdx 格式，添加 React 组件 import 语句
    - 移除 VitePress 专有 frontmatter（`layout: home`、`hero`、`features`），添加 Docusaurus 兼容字段（`sidebar_position`、`slug`）
    - 确保所有内部链接在新目录结构下有效
    - _Requirements: 1.3, 2.3, 2.5, 11.2, 11.3_

  - [x] 3.4 创建组件占位文件（Stub）
    - 在 `src/components/` 下创建所有 6 个组件的空导出文件（AnimatedCard.tsx、ScrollReveal.tsx、FlowDot.tsx、FlowLine.tsx、GlowNode.tsx、ArchDiagram.tsx）
    - 每个文件仅导出一个接受 any props 并返回 `<div/>` 的占位组件
    - 目的：使 MDX 中的 import 语句在构建时可解析，避免 Checkpoint 4 构建失败
    - _Requirements: 1.7（构建不因未解析组件而终止）_

- [x] 4. Checkpoint - 验证内容迁移构建
  - 执行 `npm run build`，确认所有 Markdown/MDX 文件成功渲染为 HTML
  - 确认无断链错误（onBrokenLinks: 'throw' 会在构建时报错）
  - 确认 `build/` 目录包含所有模块对应页面
  - Ask the user if questions arise.

- [x] 5. 实现 React 动画组件（含测试）
  - [x] 5.1 实现 AnimatedCard 组件与测试
    - 在 `src/components/AnimatedCard.tsx` 中实现，接受 title、description、icon、link、delay 属性
    - 有 link 时渲染 `<a>`，否则渲染 `<div>`；fade-in-up 动画；悬停 translateY(-4px) + border-color 变化
    - 在 `src/components/__tests__/AnimatedCard.test.tsx` 中编写单元测试：默认渲染、带 link 渲染、delay 属性验证
    - _Requirements: 3.1, 9.4_

  - [x] 5.2 编写 AnimatedCard 属性测试
    - **Property 1: AnimatedCard 渲染正确性**
    - 使用 fast-check 生成任意 props 组合，验证 link 存在时渲染 `<a>`、否则渲染 `<div>`，验证 animationDelay 匹配 delay 值
    - **Validates: Requirements 3.1**

  - [x] 5.3 实现 ScrollReveal 组件与测试
    - 在 `src/components/ScrollReveal.tsx` 中实现，使用 IntersectionObserver 监听可见性
    - 支持 animation、delay、threshold 属性，一次性触发动画；IntersectionObserver 不可用时降级显示
    - 在 `src/components/__tests__/ScrollReveal.test.tsx` 中编写单元测试：默认渲染、自定义 animation、降级行为
    - _Requirements: 3.2, 9.4_

  - [x] 5.4 编写 ScrollReveal 属性测试
    - **Property 2: ScrollReveal 动画类型映射**
    - 使用 fast-check 生成任意 animation 和 delay 值，验证 CSS class 和 transitionDelay 正确应用
    - **Validates: Requirements 3.2**

  - [x] 5.5 实现 FlowDot 组件与测试
    - 在 `src/components/FlowDot.tsx` 中实现，渲染圆形 span 元素
    - 支持 color、size、distance、duration、direction 属性，设置 aria-hidden="true"，通过 CSS 变量控制动画
    - 在 `src/components/__tests__/FlowDot.test.tsx` 中编写单元测试：默认渲染、自定义 props、aria 属性
    - _Requirements: 3.3, 9.4_

  - [x] 5.6 编写 FlowDot 属性测试
    - **Property 3: FlowDot 尺寸与方向属性**
    - 使用 fast-check 验证 width/height 等于 size，backgroundColor 等于 color，CSS 变量正确设置
    - **Validates: Requirements 3.3**

  - [x] 5.7 实现 FlowLine 组件与测试
    - 在 `src/components/FlowLine.tsx` 中实现，渲染 SVG + line 元素
    - 支持 width、height、color、speed 属性，设置 aria-hidden="true"，stroke-dasharray="8 6"，dash-flow 动画
    - 在 `src/components/__tests__/FlowLine.test.tsx` 中编写单元测试：默认渲染、SVG 属性验证、自定义 props
    - _Requirements: 3.4, 9.4_

  - [x] 5.8 编写 FlowLine 属性测试
    - **Property 4: FlowLine SVG 属性正确性**
    - 使用 fast-check 验证 SVG width/height、line stroke、dasharray 和 animation duration 正确
    - **Validates: Requirements 3.4**

  - [x] 5.9 实现 GlowNode 组件与测试
    - 在 `src/components/GlowNode.tsx` 中实现，圆角胶囊形 + 发光边框 + 脉冲动画
    - 支持 label、icon、size 属性，尺寸映射 sm/md/lg 对应不同 CSS classes
    - 在 `src/components/__tests__/GlowNode.test.tsx` 中编写单元测试：默认渲染、size 映射、icon 条件渲染
    - _Requirements: 3.5, 9.4_

  - [x] 5.10 编写 GlowNode 属性测试
    - **Property 5: GlowNode 尺寸映射**
    - 使用 fast-check 验证 label 文本渲染、size 对应正确 CSS classes、icon 条件渲染
    - **Validates: Requirements 3.5**

- [x] 6. Checkpoint - 验证动画组件
  - 执行 `npm run test`，确认所有组件测试通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. 实现 ArchDiagram 与主题样式
  - [x] 7.1 创建全局自定义样式
    - 创建 `src/css/custom.css`：定义 CSS 自定义属性（--color-bg、--color-brand 等）
    - 映射到 Docusaurus Infima 变量（--ifm-background-color、--ifm-color-primary 等）
    - 定义动画关键帧（fade-in-up、fade-in、scale-in、dash-flow、pulse-glow、shimmer、dot-move）
    - _Requirements: 6.1, 6.5_

  - [x] 7.2 实现导航栏毛玻璃效果和代码块微光效果
    - 在 `src/css/custom.css` 中添加 navbar backdrop-filter 样式（blur 12px、saturate 180%）
    - 添加代码块 shimmer 动画样式（3s ease-in-out infinite）
    - 添加 `@media (prefers-reduced-motion: reduce)` 全局规则
    - _Requirements: 6.3, 6.4, 6.5, 3.6_

  - [x] 7.3 实现 ArchDiagram 组件与测试
    - 在 `src/components/ArchDiagram.tsx` 中实现，包含硬编码的 nodes 和 connections 数据
    - 三层分布布局（用户层、服务层、存储层），带层标签
    - 悬停高亮交互（opacity 切换，≤300ms 过渡）；interactive=false 时禁用 opacity 变化
    - 响应式：桌面水平排列，移动端垂直排列；设置 role="img" + aria-label="RAGFlow 系统架构图"
    - 在 `src/components/__tests__/ArchDiagram.test.tsx` 中编写单元测试：默认渲染（所有节点和连线可见）、interactive=false 测试、aria 属性验证
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.4_

- [x] 8. 实现首页
  - [x] 8.1 创建首页 React 组件
    - 在 `src/pages/index.tsx` 中实现首页组件
    - Hero 区域：站点标题「技术教程站」、副标题「高质量中文技术教程」、行动按钮
    - 流程可视化：使用 FlowLine + FlowDot 展示 3 阶段（文档输入→智能处理→知识输出）
    - 卡片网格：使用 AnimatedCard + ScrollReveal，2 列网格（移动端单列），至少 4 张卡片
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8.2 编写首页渲染冒烟测试
    - 在 `src/pages/__tests__/index.test.tsx` 中编写首页 smoke render test
    - 验证 Hero 区域标题「技术教程站」存在
    - 验证至少 4 张 AnimatedCard 渲染
    - 验证流程可视化区域（FlowLine + FlowDot）存在
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 9. Checkpoint - 验证页面渲染与主题
  - 执行 `npm run build`，确认构建成功
  - 执行 `npm run test`，确认所有测试通过
  - Ask the user if questions arise.

- [x] 10. 更新 CI/CD 部署流程
  - [x] 10.1 更新 GitHub Actions 部署工作流
    - 修改 `.github/workflows/deploy.yml`：使用 Node.js 18+，执行 `npm run build`，部署 `build/` 目录
    - 配置构建失败时跳过部署，触发条件为 push to main
    - _Requirements: 8.3, 8.4, 8.6_

- [x] 11. 编写构建产物集成测试
  - [x] 11.1 编写构建完整性和 URL 路径验证测试
    - **Property 6: Markdown 渲染语义保持** — 验证 frontmatter title 对应 `<title>` 标签，代码块有语言 class
    - **Property 7: Base Path 一致性** — 验证所有内部链接和资源引用以 `/course/` 为前缀
    - 创建 `scripts/validate-build.ts`，使用 jsdom 解析 HTML 产物
    - **Validates: Requirements 1.2, 1.5, 2.3, 2.4**

  - [x] 11.2 编写构建完整性验证测试
    - **Property 8: 构建完整性** — 验证每个 docs/ 下的 Markdown 文件有对应 HTML 产物
    - **Property 9: URL 路径结构映射** — 验证生成页面 URL 遵循正确路径结构
    - **Validates: Requirements 1.6, 2.1, 2.2**

  - [x] 11.3 编写 SEO 元数据验证测试
    - **Property 10: Meta Description** — 验证 frontmatter description 字段正确渲染为 `<meta name="description">` 标签
    - 验证 `<title>` 格式为 `{页面标题} | 技术教程站`
    - **Validates: Requirements 13.2, 13.3**

  - [x] 11.4 编写导航属性验证测试
    - **Property 11: TOC 标题提取** — 验证页面 TOC 包含 h2/h3 标题并链接到锚点
    - **Property 12: Prev/Next 导航边界正确性** — 验证首页无 prev、末页无 next
    - **Validates: Requirements 5.3, 5.4**

  - [x] 11.5 编写搜索索引集成测试
    - **Property 13: 搜索结果约束** — 验证结果 ≤20 条，snippet ≤120 字符
    - **Property 14: 中文分词搜索匹配** — 验证中文关键词可匹配对应页面
    - ⚠️ 注意：`@easyops-cn/docusaurus-search-local` 索引格式为内部实现，建议使用 Playwright E2E 测试或降级为手动验证
    - **Validates: Requirements 7.2, 7.3**

- [x] 12. Checkpoint - 验证所有测试
  - 执行 `npm run test`，确认所有测试通过
  - 执行 `node scripts/validate-build.js`，确认构建产物验证通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. 清理旧 VitePress 文件
  - [x] 13.1 删除 VitePress 相关文件和目录
    - 删除 `.vitepress/` 目录（包含旧 Vue 组件和测试文件）
    - 删除根目录下已迁移的内容模块目录（ragflow/、ai_tech/ 等）
    - 从 `package.json` 移除 vue、vitepress、@vue/* 相关依赖
    - 执行 `npm install` 清理 node_modules
    - _Requirements: 8.5, 11.6_

  - [x] 13.2 验证最终构建
    - 执行 `npm run build` 确认构建成功（退出码 0）
    - 确认 `build/` 目录包含所有预期页面
    - 确认 HTML `lang` 属性为 `zh-Hans`
    - 确认 `<meta name="theme-color" content="#030712">` 标签存在
    - 确认 `<title>` 格式正确
    - _Requirements: 8.1, 12.1, 13.1, 13.3_

- [x] 14. Final checkpoint - 确认迁移完成
  - 执行 `npm run build && npm run test`
  - 确认无 vue/vitepress 相关依赖残留
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests, can be skipped for faster MVP
- **测试策略分层**：
  - 单元测试（随组件实现同步编写）：覆盖默认渲染、具体 props 行为、edge cases
  - 属性测试（可选，fast-check）：覆盖任意 props 组合的通用正确性不变量
  - 构建集成测试（11.1-11.3 必须，11.4-11.5 可选）：验证最终产物的结构正确性
- Checkpoints 包含显式构建验证，确保问题尽早暴露
- Property tests (Properties 1-5) validate component-level correctness using fast-check
- Build-output integration tests (Properties 6-14) validate post-build HTML structure
- Implementation language: TypeScript + React (as specified in the design document)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.5"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["5.1", "5.3", "5.5", "5.7", "5.9", "7.1"] },
    { "id": 5, "tasks": ["5.2", "5.4", "5.6", "5.8", "5.10", "7.2", "7.3"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "10.1", "11.1", "11.2", "11.3"] },
    { "id": 8, "tasks": ["11.4", "11.5"] },
    { "id": 9, "tasks": ["13.1"] },
    { "id": 10, "tasks": ["13.2"] }
  ]
}
```
