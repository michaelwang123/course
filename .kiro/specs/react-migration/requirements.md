# Requirements Document

## Introduction

将现有技术教程站点从 VitePress（基于 Vue）技术栈完整迁移到 React 技术栈。迁移后的站点需保留所有现有功能，包括 Markdown 内容渲染、自定义动画组件、响应式布局、暗色主题、本地搜索以及 GitHub Pages 自动部署。选用 Docusaurus 3 作为基于 React 的静态站点生成器替代 VitePress，并用 React 组件重写所有 Vue 自定义组件。迁移过程需处理 VitePress 专有语法的转换，包括 frontmatter 格式、组件引用方式和布局系统的适配。

## Glossary

- **Site_Generator**: Docusaurus 3 静态站点生成框架，用于替代 VitePress，负责 Markdown/MDX 渲染、路由和构建产物输出
- **React_Component**: 使用 React（JSX/TSX）编写的 UI 组件，替代现有 Vue SFC 组件
- **Content_Module**: 站点中的一个内容分区（如 ragflow、ai_tech、basketball_skill 等），包含若干 Markdown 文件
- **Theme_System**: 站点的视觉主题系统，包含全局样式变量、暗色模式、品牌色定义
- **Build_Pipeline**: 从源码到可部署静态资源的自动化构建流程
- **Deploy_Workflow**: GitHub Actions 自动化部署工作流，将构建产物发布到 GitHub Pages
- **Animation_Component**: 提供动画效果的 React 组件（如 AnimatedCard、ScrollReveal、FlowDot、FlowLine、GlowNode）
- **ArchDiagram_Component**: 用于展示 RAGFlow 系统架构的交互式图表 React 组件
- **MDX**: Markdown 扩展格式，允许在 Markdown 中使用 import 语句引入并渲染 React 组件

## Requirements

### Requirement 1: React 静态站点生成器集成

**User Story:** 作为开发者，我想要使用基于 React 的静态站点生成器替代 VitePress，以便在纯 React 技术栈下维护和扩展站点。

#### Acceptance Criteria

1. THE Site_Generator SHALL 使用 Docusaurus 3 作为构建基础框架
2. THE Site_Generator SHALL 支持将 Markdown 文件渲染为 HTML 页面，包括 GFM（GitHub Flavored Markdown）语法、YAML frontmatter 解析以及代码块语法高亮
3. THE Site_Generator SHALL 通过 MDX 格式支持在 Markdown 内容中嵌入自定义 React_Component，允许在 .mdx 文件中使用 import 语句引入并渲染 React_Component
4. THE Site_Generator SHALL 生成纯静态 HTML/CSS/JS 产物，构建产物不依赖 Node.js 服务端运行时，可直接通过静态文件服务器（如 GitHub Pages）托管访问
5. THE Site_Generator SHALL 支持配置 base path 为 `/course/`，确保所有生成的页面链接和静态资源引用路径均以 `/course/` 为前缀
6. WHEN 构建完成时, THE Site_Generator SHALL 输出包含所有源 Markdown 文件对应 HTML 页面及静态资源的构建输出目录（默认为 `build/`），输出页面数量不少于源 Markdown 文件数量
7. IF 构建过程中存在无法解析的 Markdown 文件或无法引入的 React_Component, THEN THE Site_Generator SHALL 终止构建并输出错误信息指明失败的文件路径及原因

### Requirement 2: Markdown 内容迁移

**User Story:** 作为内容作者，我想要所有现有 Markdown 内容在迁移后保持可访问且正确渲染，以便读者不受影响。

#### Acceptance Criteria

1. WHEN Site_Generator 执行构建时, THE Site_Generator SHALL 为所有现有 Content_Module（ragflow、ai_tech、basketball_skill、book_read、life_wish、site_build）中的每个 Markdown 文件生成对应的 HTML 页面，构建过程无错误终止
2. THE Site_Generator SHALL 保持现有的 URL 路径结构，每个 Markdown 文件的访问路径遵循 `/<base>/<模块名>/<文件名>` 的格式（如 `/course/ragflow/architecture`），模块目录下的 index.md 对应路径 `/<base>/<模块名>/`
3. WHEN Markdown 文件包含 frontmatter 元数据（如 title、description、sidebar_position 字段）时, THE Site_Generator SHALL 将 title 字段值渲染为页面的 `<title>` 标签内容，将 sidebar_position 字段值用于确定该页面在侧边栏中的排序位置
4. THE Site_Generator SHALL 为 Markdown 中的围栏代码块（fenced code block）生成带有语言标识 class 属性的 HTML 元素，并应用语法高亮样式，使不同语法 token 以不同颜色区分显示
5. WHEN Markdown 文件中包含指向站内其他页面的相对链接时, THE Site_Generator SHALL 确保这些链接在构建后指向有效的目标页面，构建过程中遇到无法解析的内部链接时报告错误并终止构建
6. WHEN Markdown 文件中引用本地图片或资源文件时, THE Site_Generator SHALL 将引用的资源文件包含在构建输出中，且生成的 HTML 中资源路径可正确访问

### Requirement 3: 自定义动画组件迁移

**User Story:** 作为开发者，我想要将所有 Vue 自定义动画组件重写为 React 组件，以便在 React 技术栈中保留相同的视觉效果。

#### Acceptance Criteria

1. THE Animation_Component（AnimatedCard）SHALL 接受 title（必需）、description（必需）、icon（可选）、link（可选）、delay（可选，默认 0ms）属性，渲染带有 fade-in-up 动画效果的卡片；当提供 link 属性时渲染为 `<a>` 标签，否则渲染为 `<div>` 标签；鼠标悬停时卡片向上位移 4px 并将边框颜色变为品牌色 #00ffaa
2. THE Animation_Component（ScrollReveal）SHALL 接受 animation（可选，默认 'fade-in-up'，可选值 'fade-in-up' | 'fade-in' | 'scale-in'）、delay（可选，默认 0ms）、threshold（可选，默认 0.1）属性，使用 IntersectionObserver 在元素进入视口时触发对应动画；动画为一次性触发（触发后不再重复）；若浏览器不支持 IntersectionObserver 则直接显示内容
3. THE Animation_Component（FlowDot）SHALL 接受 color（默认 '#00ffaa'）、size（默认 6px）、distance（默认 160px）、duration（默认 2s）、direction（默认 'ltr'，可选 'rtl'）属性，渲染一个圆形元素沿指定方向在 distance 范围内循环移动，移动过程中包含淡入和淡出效果
4. THE Animation_Component（FlowLine）SHALL 接受 width（默认 200）、height（默认 4）、color（默认 'rgba(0,255,170,0.4)'）、speed（默认 1.5s）属性，渲染一个 SVG 元素包含带有 stroke-dasharray 虚线样式的线条，并以 dash-flow 动画实现虚线流动效果
5. THE Animation_Component（GlowNode）SHALL 接受 label（必需）、icon（可选）、size（默认 'md'，可选 'sm' | 'md' | 'lg'）属性，渲染一个圆角胶囊形节点，带有品牌色发光边框（box-shadow）和脉冲发光动画
6. WHILE 用户设备启用 prefers-reduced-motion: reduce 媒体查询时, THE Animation_Component SHALL 将所有动画的 animation-duration 设置为接近 0（0.01ms），animation-iteration-count 设置为 1，transition-duration 设置为接近 0，确保元素直接显示最终状态

### Requirement 4: 架构图组件迁移

**User Story:** 作为读者，我想要在 React 站点中看到与原站相同的交互式架构图，以便直观了解系统架构。

#### Acceptance Criteria

1. THE ArchDiagram_Component SHALL 以分层布局展示三层架构节点：用户层包含 Web UI 节点，服务层包含 API Server 节点，存储层包含 Elasticsearch、MySQL、MinIO、Redis 节点，并为每层显示对应的层标签（用户层、服务层、存储层）
2. THE ArchDiagram_Component SHALL 展示以下连接关系：Web UI → API Server，API Server → Elasticsearch，API Server → MySQL，API Server → MinIO，API Server → Redis，连接以带方向箭头的流动线条呈现
3. WHEN 用户悬停某个节点时, THE ArchDiagram_Component SHALL 将该节点及其直接连接的节点和连线保持 opacity 为 1，其余节点和连线的 opacity 降低至 0.3，过渡时长不超过 300ms
4. IF ArchDiagram_Component 的 interactive 属性为 false，THEN THE ArchDiagram_Component SHALL 在用户悬停节点时不改变任何节点或连线的透明度，所有元素保持 opacity 为 1
5. THE ArchDiagram_Component SHALL 在桌面端（视口宽度 >=768px）以水平布局展示各层从左到右排列，在移动端（视口宽度 <768px）以垂直布局展示各层从上到下排列
6. THE ArchDiagram_Component SHALL 在根容器上设置 role="img" 和 aria-label="RAGFlow 系统架构图"，并通过 CSS 媒体查询 `@media (prefers-reduced-motion: reduce)` 将所有过渡和动画时长设置为接近 0

### Requirement 5: 导航与布局系统

**User Story:** 作为读者，我想要迁移后的站点保留清晰的导航结构和一致的页面布局，以便方便地浏览内容。

#### Acceptance Criteria

1. THE Site_Generator SHALL 提供顶部导航栏，包含首页链接和所有已配置的 Content_Module 入口链接，链接顺序与配置文件中 nav 数组的定义顺序一致
2. THE Site_Generator SHALL 为 ragflow 模块提供侧边栏导航，包含以下条目：介绍、架构概览、安装部署、快速上手、进阶功能，条目顺序与配置文件中 sidebar 配置的定义顺序一致
3. THE Site_Generator SHALL 在每个教程内容页面提供页内目录导航，显示 h2 和 h3 级别标题，用户点击目录条目后页面滚动至对应章节
4. THE Navigation_System SHALL 在每个教程章节页面底部提供上一篇/下一篇导航链接；IF 当前页为模块的第一篇章节，THEN THE Navigation_System SHALL 不显示上一篇链接；IF 当前页为模块的最后一篇章节，THEN THE Navigation_System SHALL 不显示下一篇链接
5. WHILE 视口宽度不大于 768px 时，THE Site_Generator SHALL 默认收起侧边栏，用户可通过交互操作展开侧边栏；WHILE 视口宽度大于 768px 时，THE Site_Generator SHALL 默认展开侧边栏

### Requirement 6: 主题与样式系统

**User Story:** 作为开发者，我想要迁移后的站点保持相同的视觉风格（暗色主题、品牌色、毛玻璃效果），以便用户体验一致。

#### Acceptance Criteria

1. THE Theme_System SHALL 使用暗色作为唯一主题（不提供浅色模式切换），定义以下 CSS 自定义属性：背景色（--color-bg）为 #030712，柔和背景色（--color-bg-soft）为 #111827，静音背景色（--color-bg-mute）为 #1f2937，品牌主色（--color-brand）为 #00ffaa；同时将这些值映射到 Docusaurus 内置 CSS 变量（--ifm-background-color 等）
2. THE Theme_System SHALL 使用 Tailwind CSS 作为样式工具库，通过 `darkMode: ['selector', '[data-theme="dark"]']` 策略与 Docusaurus 的暗色模式 `data-theme` 属性对齐，并在 Tailwind 配置中将品牌色注册为 primary 色值
3. THE Theme_System SHALL 在导航栏区域应用 backdrop-filter 毛玻璃效果，模糊半径为 12px，饱和度为 180%，背景色透明度为 0.8
4. THE Theme_System SHALL 在代码块区域应用微光（shimmer）动画效果，使用水平方向 linear-gradient 背景位移动画实现，动画周期为 3 秒，缓动函数为 ease-in-out，循环播放
5. WHILE 用户设备启用 prefers-reduced-motion: reduce 媒体查询时, THE Theme_System SHALL 将所有元素及其伪元素的 animation-duration 和 transition-duration 设置为不超过 0.01ms，并将 animation-iteration-count 设置为 1

### Requirement 7: 搜索功能

**User Story:** 作为读者，我想要在迁移后的站点中使用本地搜索功能快速查找内容，以便提高阅读效率。

#### Acceptance Criteria

1. THE Site_Generator SHALL 提供基于客户端的本地全文搜索功能，搜索索引在构建时生成，索引范围覆盖所有教程页面的标题和正文内容
2. WHEN 用户输入搜索关键词时, THE Site_Generator SHALL 在 2 秒内展示匹配的页面标题和内容片段（片段长度不超过 120 个字符），每次搜索结果不超过 20 条，结果按相关度排序
3. THE Site_Generator SHALL 支持中文内容的分词搜索，用户输入不少于 2 个字符的中文关键词时能匹配到包含该词语的页面内容
4. IF 搜索关键词无任何匹配结果，THEN THE Site_Generator SHALL 显示无结果提示信息

### Requirement 8: 构建与部署流程

**User Story:** 作为开发者，我想要迁移后的项目保留自动化构建和部署流程，以便推送代码后自动发布到 GitHub Pages。

#### Acceptance Criteria

1. THE Build_Pipeline SHALL 在 package.json 中提供名为 "build" 的脚本，执行成功（退出码为 0）后在项目 `build/` 目录中生成至少包含一个 index.html 文件的静态产物
2. THE Build_Pipeline SHALL 在 package.json 中提供名为 "dev" 的脚本（对应 `docusaurus start`），执行后在 localhost 上启动本地开发服务器并在终端输出可访问的地址
3. WHEN 代码推送到 main 分支时, THE Deploy_Workflow SHALL 通过 GitHub Actions 自动触发构建任务，并仅在构建任务成功完成后执行部署步骤
4. WHEN 构建任务成功完成后, THE Deploy_Workflow SHALL 将 `build/` 目录中的静态产物部署到 GitHub Pages，使站点可通过 GitHub Pages URL 访问
5. THE Build_Pipeline SHALL 在 package.json 的 dependencies 和 devDependencies 中不包含 vue、vitepress、@vue/* 相关包，仅保留 React、React DOM 及其构建工具链相关依赖
6. IF 构建任务执行失败（退出码非 0）, THEN THE Deploy_Workflow SHALL 跳过部署步骤并将该 workflow run 标记为失败状态

### Requirement 9: 测试基础设施

**User Story:** 作为开发者，我想要迁移后的项目具备组件测试能力，以便验证 React 组件的正确性。

#### Acceptance Criteria

1. THE Build_Pipeline SHALL 配置 Vitest 作为测试框架，并集成 React Testing Library 和 happy-dom 环境，使其能够挂载和渲染 React 组件进行单元测试
2. WHEN 开发者执行 `npm run test` 命令时，THE Build_Pipeline SHALL 运行所有匹配 `**/*.test.ts` 和 `**/*.test.tsx` 模式的测试文件，并在命令行输出测试通过数、失败数和总耗时
3. IF 任一测试用例执行失败，THEN THE Build_Pipeline SHALL 以非零退出码终止进程，并在命令行输出失败用例的文件路径和断言错误信息
4. THE Build_Pipeline SHALL 为每个 Animation_Component（包括 FlowLine、FlowDot、GlowNode、AnimatedCard、ScrollReveal、ArchDiagram）提供对应的 `.test.tsx` 测试文件，每个测试文件至少包含 2 个测试用例，覆盖组件的默认渲染和 props 传入行为
5. THE Build_Pipeline SHALL 在 vitest 配置中排除 node_modules、构建输出目录（build/）和 .docusaurus 缓存目录，避免对非源码文件执行测试
6. THE Build_Pipeline SHALL 在 vitest 配置中设置路径别名 `@site` 指向项目根目录，确保组件中使用 Docusaurus 路径约定的 import 语句在测试环境中可正确解析

### Requirement 10: 首页迁移

**User Story:** 作为读者，我想要迁移后的首页保留原有的视觉效果和交互体验，包括 hero 区域、流程可视化和卡片网格。

#### Acceptance Criteria

1. THE Site_Generator SHALL 在首页渲染 hero 区域，包含站点标题「技术教程站」、副标题「高质量中文技术教程」以及至少 1 个行动按钮（包含文本和目标链接）
2. THE Site_Generator SHALL 在首页展示 RAG 数据处理流程可视化（使用 FlowLine 和 FlowDot 组件），包含 3 个阶段标签（「文档输入」「智能处理」「知识输出」）并以动画连线串联
3. THE Site_Generator SHALL 在首页以 2 列网格展示教程模块卡片（使用 AnimatedCard 和 ScrollReveal 组件），每张卡片包含标题、描述文本、图标和跳转链接，卡片数量不少于 4 张
4. WHILE 视口宽度小于 768px, THE Site_Generator SHALL 将卡片网格切换为单列布局，流程可视化区域允许换行显示
5. WHILE 用户系统启用 prefers-reduced-motion 设置, THE Site_Generator SHALL 禁用 FlowLine、FlowDot、AnimatedCard 和 ScrollReveal 的过渡动画，直接显示最终状态

### Requirement 11: VitePress 内容格式转换

**User Story:** 作为开发者，我想要将所有 VitePress 专有语法和格式转换为 Docusaurus 兼容格式，以便迁移后构建不出错。

#### Acceptance Criteria

1. THE Build_Pipeline SHALL 将所有内容 Markdown 文件从当前根目录位置（ragflow/、ai_tech/ 等）迁移到 `docs/` 目录下对应子目录中，保持模块内部目录结构不变
2. WHEN 原始 Markdown 文件中内联使用 Vue 组件（如 `<AnimatedCard>`、`<FlowLine>` 等无需 import 即可使用的标签）时, THE Build_Pipeline SHALL 将这些文件转换为 .mdx 格式，并在文件头部添加对应 React 组件的 import 语句
3. WHEN 原始 index.md 使用 VitePress 专有 frontmatter（如 `layout: home`、`hero`、`features` 字段）时, THE Build_Pipeline SHALL 将首页实现为独立的 React 页面组件（`src/pages/index.tsx`），不依赖 frontmatter 驱动的布局系统
4. THE Build_Pipeline SHALL 将 `site_build/beta/` 目录下的非 Markdown 文件（如 .html 文件）作为静态资源复制到 `static/` 目录中，确保迁移后仍可通过原路径访问
5. THE Build_Pipeline SHALL 将原 VitePress 的 `assets/` 目录下的图片和资源文件迁移到 Docusaurus 的 `static/` 目录或对应 `docs/` 模块目录内，并更新 Markdown 中的引用路径
6. THE Build_Pipeline SHALL 删除 `.vitepress/` 目录（包含旧 Vue 组件源码及其对应的 `.test.ts` 测试文件），新 React 组件测试文件在 `src/components/__tests__/` 中重新编写

### Requirement 12: 语言与国际化配置

**User Story:** 作为读者，我想要站点正确标识为中文站点，以便浏览器和搜索引擎能正确识别内容语言。

#### Acceptance Criteria

1. THE Site_Generator SHALL 在生成的 HTML 页面 `<html>` 标签上设置 `lang="zh-Hans"` 属性
2. THE Site_Generator SHALL 在 Docusaurus 配置中设置 `i18n.defaultLocale` 为 `'zh-Hans'`，确保所有内置 UI 文本（如搜索提示、导航文字）使用中文
3. THE Site_Generator SHALL 在上一篇/下一篇导航链接处显示中文文本（"上一篇"和"下一篇"），搜索按钮显示"搜索"文本

### Requirement 13: SEO 与元数据

**User Story:** 作为开发者，我想要迁移后的站点保持良好的 SEO 配置，以便搜索引擎能正确索引内容。

#### Acceptance Criteria

1. THE Site_Generator SHALL 在所有页面的 `<head>` 中包含 `<meta name="theme-color" content="#030712">` 标签
2. WHEN Markdown 文件的 frontmatter 包含 `description` 字段时, THE Site_Generator SHALL 将其渲染为页面的 `<meta name="description">` 标签内容
3. THE Site_Generator SHALL 为每个页面生成包含站点名称和页面标题的 `<title>` 标签，格式为 `{页面标题} | 技术教程站`
