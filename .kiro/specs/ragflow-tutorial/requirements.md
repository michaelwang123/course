# 需求文档

## 简介

本项目旨在创建一个高质量的 RAGFlow 中文教程站点，部署到 GitHub Pages。教程帮助用户快速掌握 RAGFlow 的架构和使用方式，内容引人入胜。项目采用可扩展架构，支持多教程并存（如 Ollama 教程、RAGFlow 教程等），统一部署到 GitHub Pages。

## 术语表

- **Tutorial_Site**: 基于静态站点生成器构建的教程网站，部署在 GitHub Pages 上
- **Site_Generator**: 用于将 Markdown 内容编译为静态网站的工具（如 VitePress）
- **Tutorial_Module**: 站点中一个独立的教程单元，对应一个完整的技术主题（如 RAGFlow 教程、Ollama 教程）
- **RAGFlow_Tutorial**: 关于 RAGFlow 检索增强生成引擎的教程模块
- **Navigation_System**: 教程站点的导航结构，包括侧边栏、顶部导航和面包屑
- **Deployment_Pipeline**: 自动将源码编译并发布到 GitHub Pages 的 CI/CD 流水线
- **Content_Author**: 编写和维护教程内容的贡献者
- **Animation_System**: 基于 CSS @keyframes + Tailwind CSS + SVG 构建的视觉动效体系，用于增强用户交互体验
- **Theme_System**: 站点的视觉主题配置，包括颜色变量、暗色/浅色模式切换和科技感设计风格

## 需求

### 需求 1：静态站点基础架构

**用户故事：** 作为 Content_Author，我希望项目使用现代化静态站点生成器搭建，以便能高效编写 Markdown 教程并自动生成美观的网站。

#### 验收标准

1. THE Tutorial_Site SHALL 使用 VitePress 作为静态站点生成器
2. THE Tutorial_Site SHALL 集成 Tailwind CSS 作为样式框架，支持通过 PostCSS 编译自定义样式类
3. THE Tutorial_Site SHALL 支持在 Markdown 文件中使用 Vue 组件（包括动画组件），且构建后组件正确渲染为对应的 HTML 元素
4. WHILE Tutorial_Site 处于开发模式运行状态时，THE Tutorial_Site SHALL 在 Content_Author 保存 Markdown 文件后 5 秒内自动刷新浏览器中的页面内容
5. WHEN Content_Author 执行构建命令时，THE Site_Generator SHALL 将所有 Markdown 文件编译为静态 HTML 文件并输出至构建目录
6. THE Tutorial_Site SHALL 配置中文为默认语言，生成的 HTML 页面的 lang 属性值为 "zh-CN"
7. IF 构建过程中存在 Markdown 语法错误或文件引用缺失，THEN THE Site_Generator SHALL 终止构建并在命令行输出错误信息指明出错的文件及原因

### 需求 2：多教程可扩展项目结构

**用户故事：** 作为 Content_Author，我希望项目结构支持多个独立教程模块并存，以便后续扩展新教程时无需重构。

> 注：新增模块的具体操作步骤详见设计文档"模块扩展指南"章节。

#### 验收标准

1. THE Tutorial_Site SHALL 将每个 Tutorial_Module 组织在独立的顶层目录下，每个模块目录至少包含一个 index.md 文件和一个侧边栏导航配置
2. WHEN Content_Author 新增一个 Tutorial_Module 时，THE Content_Author SHALL 仅需在 config.mts 的 nav 数组中追加一行模块入口配置，并在 sidebar 对象中新增该模块的章节配置，即可完成导航集成，无需修改其他模块的文件或代码
3. THE Tutorial_Site SHALL 为每个 Tutorial_Module 提供独立的侧边栏导航配置，使各模块的章节目录互不影响
4. THE Tutorial_Site SHALL 提供统一的首页，以列表形式展示所有可用的 Tutorial_Module，每个模块至少展示名称、一句话简介（不超过 100 个字符）和跳转链接
5. THE Navigation_System SHALL 按照配置文件中定义的顺序排列顶部导航中的 Tutorial_Module 入口
6. IF Tutorial_Module 目录缺少 index.md 文件，THEN THE Site_Generator SHALL 在构建时输出警告信息并跳过该模块，不影响其他模块的正常构建

### 需求 3：RAGFlow 教程内容 — 架构概览

**用户故事：** 作为学习者，我希望快速了解 RAGFlow 的整体架构和核心组件，以便建立全局认知。

#### 验收标准

1. THE RAGFlow_Tutorial SHALL 包含一个"架构概览"章节，以文字描述 RAGFlow 各系统组件之间的数据流向和交互关系，覆盖所有在标准 3 中列出的组件
2. THE RAGFlow_Tutorial SHALL 使用交互式 SVG 图表配合 CSS 动画（虚线流动、脉冲发光）展示 RAGFlow 的系统架构及数据流动过程，图表中须包含标准 3 所列的全部组件及其连接关系
3. THE RAGFlow_Tutorial SHALL 对以下每个核心组件分别说明其职责（每个组件至少 2 句话，涵盖其用途和所存储/处理的数据类型）：前端 Web UI、后端 API 服务、Elasticsearch/Infinity 文档引擎、MySQL、MinIO、Redis
4. THE RAGFlow_Tutorial SHALL 对以下每项核心能力分别进行描述（每项至少 2 句话，涵盖其功能定义和用户可感知的价值）：DeepDoc 文档理解、模板化分块、引用溯源、多数据源支持、Agentic 工作流
5. THE RAGFlow_Tutorial SHALL 在架构概览章节中说明每项核心能力（标准 4 所列）主要由哪个或哪些组件（标准 3 所列）承载实现

### 需求 4：RAGFlow 教程内容 — 安装部署

**用户故事：** 作为学习者，我希望获得清晰的部署指南，以便在本地环境成功运行 RAGFlow。

#### 验收标准

1. THE RAGFlow_Tutorial SHALL 包含"安装部署"章节，提供 Docker Compose 部署的完整步骤，步骤至少包括：获取配置文件、配置环境变量、启动服务、确认服务运行状态
2. THE RAGFlow_Tutorial SHALL 明确列出硬件要求：CPU 不少于 4 核、RAM 不少于 16GB、磁盘不少于 50GB、Docker 版本不低于 24.0.0，并注明支持的操作系统（Linux、macOS 或 Windows）
3. THE RAGFlow_Tutorial SHALL 提供环境检查的命令示例，至少覆盖 CPU 核数、内存大小、磁盘空间、Docker 版本四项检查
4. IF 部署过程中出现常见错误，THEN THE RAGFlow_Tutorial SHALL 提供至少 3 种故障场景（包括端口冲突、资源不足、镜像拉取失败）的排查方案，每种方案包含错误现象描述和对应的解决步骤
5. THE RAGFlow_Tutorial SHALL 提供部署成功后的验证步骤，验证内容至少包括：服务进程运行状态检查和通过浏览器访问系统界面确认页面可正常加载

### 需求 5：RAGFlow 教程内容 — 快速上手

**用户故事：** 作为学习者，我希望通过一个端到端的示例快速体验 RAGFlow 的核心功能。

#### 验收标准

1. THE RAGFlow_Tutorial SHALL 包含"快速上手"章节，开头列出前置条件（RAGFlow 已部署且可访问、至少一个 LLM 已配置可用），并引导用户从上传文档到获得基于该文档的问答回复，完成一个端到端的 RAG 问答流程
2. THE RAGFlow_Tutorial SHALL 按顺序覆盖以下操作步骤：创建知识库、上传文档、配置分块策略、关联 LLM、发起对话，且每个步骤包含该步骤完成后的预期结果描述，使用户可自行验证操作是否成功
3. THE RAGFlow_Tutorial SHALL 在验收标准 2 所列的每个操作步骤中提供至少一张截图或带有界面元素标注的文字说明，标注用户需要点击或填写的关键界面元素
4. THE RAGFlow_Tutorial SHALL 说明如何配置本地 LLM（如 Ollama）与 RAGFlow 集成，内容至少覆盖：模型服务地址填写、模型名称选择、连接验证方法
5. IF 用户在快速上手流程的任一步骤遇到常见错误（如 LLM 连接失败、文档解析失败），THEN THE RAGFlow_Tutorial SHALL 提供该错误的可能原因与解决建议

### 需求 6：RAGFlow 教程内容 — 进阶功能

**用户故事：** 作为有一定基础的用户，我希望了解 RAGFlow 的高级功能，以便充分利用其能力。

#### 验收标准

1. THE RAGFlow_Tutorial SHALL 包含"进阶功能"章节，介绍 Agentic 工作流的配置和使用方式，包含至少 1 个完整的工作流搭建步骤示例（含组件选择、参数配置、运行验证）
2. THE RAGFlow_Tutorial SHALL 说明 HTTP API 的使用方法，包含至少 3 个接口的调用示例（含请求格式和响应格式），覆盖数据集管理、文档上传、对话调用中的至少两类操作
3. THE RAGFlow_Tutorial SHALL 介绍至少 3 种分块策略（如通用、简历、表格等），对每种策略说明其适用的文档类型、配置参数及选择建议
4. THE RAGFlow_Tutorial SHALL 介绍 MCP 支持功能，包含至少 1 个应用场景说明及对应的配置步骤

### 需求 7：GitHub Pages 自动化部署

**用户故事：** 作为 Content_Author，我希望教程站点能自动部署到 GitHub Pages，以便每次更新内容后读者能及时看到最新版本。

#### 验收标准

1. THE Deployment_Pipeline SHALL 使用 GitHub Actions 实现自动化构建和部署，并指定 Node.js 主版本号（如 18 或 20）以确保构建环境可复现
2. WHEN 代码推送到 main 分支时，THE Deployment_Pipeline SHALL 自动触发 VitePress 构建并将生成的静态文件部署到 GitHub Pages
3. IF 构建过程失败，THEN THE Deployment_Pipeline SHALL 通过 GitHub Actions 状态报告错误，且不更新当前已部署的站点内容
4. THE Tutorial_Site SHALL 将 VitePress 配置中的 base path 设置为 GitHub Pages 对应的仓库路径（格式为 `/<repository-name>/`）
5. THE Deployment_Pipeline SHALL 配置 GitHub Actions 工作流具备 GitHub Pages 部署所需的权限（pages: write, id-token: write）

### 需求 8：用户体验与导航

**用户故事：** 作为学习者，我希望教程站点具备良好的阅读体验和导航，以便高效地查找和学习内容。

#### 验收标准

1. THE Tutorial_Site SHALL 提供全文搜索功能，支持按关键词检索教程内容，并在2秒内返回结果，每页展示不超过20条匹配结果
2. IF 搜索无匹配结果，THEN THE Tutorial_Site SHALL 显示无结果提示信息
3. THE Tutorial_Site SHALL 采用响应式设计，在视口宽度不大于768px的移动端和大于768px的桌面端均可无需水平滚动地阅读所有内容，且所有可交互元素可正常点击
4. THE Navigation_System SHALL 为每个教程章节提供上一篇/下一篇导航链接；IF 当前页为第一篇章节，THEN THE Navigation_System SHALL 隐藏上一篇链接；IF 当前页为最后一篇章节，THEN THE Navigation_System SHALL 隐藏下一篇链接
5. THE Tutorial_Site SHALL 在每个页面展示目录大纲（Table of Contents），包含最多3级标题层级，用户点击目录条目后页面滚动至对应章节
6. THE Tutorial_Site SHALL 支持深色模式和浅色模式切换，默认跟随用户操作系统的主题偏好，用户手动切换后该偏好在同一浏览器的后续访问中保持
7. THE Navigation_System SHALL 使用 backdrop-filter 毛玻璃效果实现悬浮导航栏，导航栏在页面滚动时固定于视口顶部

### 需求 9：视觉设计与动效体验

**用户故事：** 作为学习者，我希望教程站点具有现代科技感的视觉设计和流畅的动效交互，以便获得沉浸式的学习体验并直观理解技术概念。

#### 验收标准

1. THE Tutorial_Site SHALL 采用科技感暗色主题作为视觉设计基调（dark-first design），背景色使用 gray-950（#030712），卡片背景使用 gray-900（#111827），主色调使用 emerald 绿（#00ffaa）作为强调色和发光效果色。主题默认跟随用户操作系统偏好（与需求 8.6 一致），但所有视觉元素均以暗色模式为优先设计
2. THE Tutorial_Site SHALL 在首页 Hero 区域使用 SVG 虚线流动动画和移动粒子动效展示 RAG 数据处理流程（文档输入 → 处理 → 知识输出），动画使用 stroke-dasharray + @keyframes 实现
3. THE Tutorial_Site SHALL 将核心功能展示为可交互的卡片组，卡片在鼠标悬停时呈现上浮（translateY）、边框高亮、渐变背景显现效果，过渡时长为 200-300ms
4. THE Tutorial_Site SHALL 使用 Intersection Observer 配合 CSS 动画实现页面元素的滚动触发淡入效果（fade-in-up），元素进入视口时从下方 20px 处淡入，动画时长 600-800ms
5. THE Tutorial_Site SHALL 将所有自定义动画封装为可复用的 Vue 组件（如 FlowLine、GlowNode、AnimatedCard），组件存放在独立的 components 目录下，可在任意 Markdown 文件中通过组件标签引用
6. THE Tutorial_Site SHALL 仅对 transform 和 opacity 属性执行动画以确保 GPU 加速渲染，不对 width、height、margin、padding 属性执行动画。例外：GlowNode 组件的 pulse-glow 效果使用 box-shadow 动画，因其为纯视觉装饰且不触发布局重排
7. THE Tutorial_Site SHALL 通过 CSS 媒体查询 `@media (prefers-reduced-motion: reduce)` 为偏好减少动画的用户禁用所有连续循环动画，将动画时长设置为接近 0
8. THE Tutorial_Site SHALL 在代码块区域使用光线扫过（shimmer）效果作为视觉修饰，通过 linear-gradient 背景位移动画实现
9. WHEN 用户在教程页面间导航时，THE Tutorial_Site SHALL 使用 View Transitions API（如浏览器支持）或 CSS 过渡实现页面内容的平滑切换效果

### 需求 10：性能与构建质量

**用户故事：** 作为学习者，我希望教程站点加载迅速、体验流畅，即使在网络条件一般的环境下也能快速访问内容。

#### 验收标准

1. THE Tutorial_Site SHALL 在首次加载时的总传输体积（HTML + CSS + JS，不含图片）不超过 500KB（gzip 后）
2. THE Tutorial_Site SHALL 在 Lighthouse Performance 评分中达到 90 分以上（桌面端模拟）
3. THE Tutorial_Site SHALL 对所有教程页面中使用的图片采用懒加载策略（loading="lazy"），首屏可见图片除外
4. THE Tutorial_Site SHALL 在 package.json 中通过 engines 字段指定 Node.js 版本约束（>=18），确保构建环境可复现
5. THE Tutorial_Site SHALL 在项目根目录包含 .gitignore 文件，排除 node_modules/、.vitepress/dist/、.vitepress/cache/ 目录
