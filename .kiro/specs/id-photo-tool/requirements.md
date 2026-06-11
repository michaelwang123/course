# Requirements Document

## Introduction

证件照裁剪和更换底色工具是一个基于浏览器的在线工具应用，允许用户在本地完成证件照的裁剪（支持多种标准尺寸）和底色更换操作。所有图片处理均在用户浏览器本地完成，不会将任何图片数据上传到服务器，确保用户隐私安全。

该工具作为独立的 React 应用存放在 tools/id-photo 目录下，作为独立的 Vercel 项目部署（root directory 设为 tools/id-photo）。采用基于 TypeScript 代码级配置的可扩展插件化架构，支持后续工具的快速扩展。

## Glossary

- **Tool_App**: 证件照处理工具的前端 Web 应用程序
- **Image_Cropper**: 负责对上传的图片进行裁剪的功能模块
- **Background_Changer**: 负责对证件照底色进行检测和更换的功能模块
- **Photo_Uploader**: 负责接收用户上传图片的功能模块
- **Tool_Registry**: 基于 TypeScript 代码级配置（接口定义 + 工具数组注册）管理所有工具插件的可扩展架构模块
- **Photo_Exporter**: 负责将处理完成的图片导出为文件的功能模块
- **Standard_Size**: 证件照标准尺寸规格，包括一寸（25mm×35mm）、二寸（35mm×49mm）、小一寸（22mm×32mm）、大一寸（33mm×48mm）、小二寸（35mm×45mm）等
- **Canvas_Processor**: 基于 HTML5 Canvas API 的图片处理引擎，包含裁剪、旋转、亮度对比度调整等操作
- **Color_Engine**: 基于颜色距离算法的背景检测与替换引擎，属于 Canvas_Processor 的子模块
- **Privacy_Mode**: 纯浏览器本地处理模式，所有图片数据仅存在于用户浏览器内存中，不进行任何网络传输
- **Batch_Layout**: 批量排版功能，将多张相同尺寸的证件照按 A4 纸规格自动排列，用于打印输出

## Requirements

### Requirement 1: 图片上传

**User Story:** 作为用户，我希望能够上传我的照片，以便对其进行证件照处理。

#### Acceptance Criteria

1. WHEN 用户选择图片文件时, THE Photo_Uploader SHALL 接受 JPEG、PNG、WebP 格式的图片文件
2. WHEN 用户拖拽图片文件到上传区域时, THE Photo_Uploader SHALL 接受该图片并显示预览
3. WHEN 用户通过粘贴板粘贴图片（Ctrl+V / Cmd+V）时, THE Photo_Uploader SHALL 接受该图片并显示预览
4. IF 用户上传的文件格式不受支持, THEN THE Photo_Uploader SHALL 显示明确的错误提示信息，说明支持的文件格式
5. IF 用户上传的文件大小超过 10MB, THEN THE Photo_Uploader SHALL 显示文件过大的错误提示
6. WHEN 图片上传成功时, THE Photo_Uploader SHALL 在画布区域显示图片预览

### Requirement 2: 证件照裁剪

**User Story:** 作为用户，我希望能够按照标准证件照尺寸裁剪照片，以便满足不同场景的证件照需求。

#### Acceptance Criteria

1. THE Image_Cropper SHALL 提供以下 Standard_Size 选项：一寸（25mm×35mm, 295px×413px）、二寸（35mm×49mm, 413px×579px）、小一寸（22mm×32mm, 260px×378px）、大一寸（33mm×48mm, 390px×567px）、小二寸（35mm×45mm, 413px×531px）
2. WHEN 用户选择一种 Standard_Size 时, THE Image_Cropper SHALL 在图片上显示对应比例的裁剪框
3. WHILE 裁剪框处于激活状态, THE Image_Cropper SHALL 允许用户通过拖拽移动裁剪框位置
4. WHILE 裁剪框处于激活状态, THE Image_Cropper SHALL 允许用户通过拖拽边缘按比例缩放裁剪框
5. WHEN 用户确认裁剪操作时, THE Image_Cropper SHALL 按照选定的 Standard_Size 像素尺寸输出裁剪后的图片
6. THE Image_Cropper SHALL 支持用户输入自定义宽度和高度（单位为像素）进行裁剪
7. THE Image_Cropper SHALL 提供图片旋转功能，支持顺时针90度、逆时针90度旋转和水平翻转操作
8. THE Image_Cropper SHALL 在裁剪框内显示辅助线（三分线和中心十字线），帮助用户精准定位人脸在证件照中的位置
9. THE Image_Cropper SHALL 提供亮度和对比度微调功能（亮度范围 -50 至 +50，对比度范围 -50 至 +50），允许用户对裁剪区域进行基本调整

### Requirement 3: 底色更换

**User Story:** 作为用户，我希望能够更换证件照的背景颜色，以便满足不同证件的底色要求。

#### Acceptance Criteria

1. THE Background_Changer SHALL 提供以下预设底色选项：白色（#FFFFFF）、红色（#FF0000）、蓝色（#438EDB）
2. THE Background_Changer SHALL 支持用户通过颜色选择器自定义底色
3. WHEN 用户选择目标底色时, THE Background_Changer SHALL 使用 Color_Engine 检测并替换图片背景区域的颜色
4. WHEN 底色更换完成时, THE Background_Changer SHALL 在画布中实时显示更换后的效果
5. THE Background_Changer SHALL 提供背景容差调节滑块，允许用户调整颜色检测的灵敏度（范围 0-100，默认值为 30）
6. IF 图片背景区域无法被准确检测, THEN THE Background_Changer SHALL 提示用户手动调整容差值
7. THE Background_Changer SHALL 提供处理前后对比预览功能，用户可通过滑动分割线或切换按钮查看原图与处理后效果的对比
8. THE Tool_App SHALL 在底色更换界面显示技术提示：该功能对纯色或接近纯色的背景效果最佳，复杂背景（如户外场景）可能需要多次调整容差值

### Requirement 4: 图片导出

**User Story:** 作为用户，我希望能够将处理完成的证件照导出保存，以便后续使用。

#### Acceptance Criteria

1. WHEN 用户点击导出按钮时, THE Photo_Exporter SHALL 将当前最新处理结果以 JPEG 格式下载到用户本地（优先级：背景替换结果 > 裁剪结果 > 原始上传图片）
2. THE Photo_Exporter SHALL 支持用户选择导出格式（JPEG 或 PNG）
3. WHEN 导出格式为 JPEG 时, THE Photo_Exporter SHALL 允许用户设置图片质量（范围 60%-100%）
4. THE Photo_Exporter SHALL 在文件名中包含尺寸规格信息（如 "证件照_一寸_25x35mm"）
5. THE Photo_Exporter SHALL 提供批量排版导出功能，根据选定的 Standard_Size 自动生成 A4 纸（210mm×297mm）排版图片，排版规则为：一寸 3×3 共9张、二寸 2×3 共6张、小一寸 3×3 共9张、大一寸 2×3 共6张、小二寸 2×3 共6张
6. WHEN 用户选择批量排版导出时, THE Photo_Exporter SHALL 在排版预览中显示照片在 A4 纸上的实际排列效果
7. THE Photo_Exporter SHALL 支持排版导出为 PDF 格式（300dpi），以便用户直接打印

### Requirement 5: 可扩展工具架构

**User Story:** 作为开发者，我希望工具应用采用插件化架构，以便后续方便地添加新的工具功能。

#### Acceptance Criteria

1. THE Tool_Registry SHALL 使用 TypeScript 代码级配置注册和管理所有工具插件，通过定义 ToolPlugin 接口和工具注册数组实现
2. THE ToolPlugin 接口 SHALL 包含以下字段：id（唯一标识）、name（工具名称）、icon（图标组件）、description（简要说明）、route（路由路径）、component（React 懒加载组件引用）
3. THE Tool_App SHALL 在首页展示所有已注册工具的列表，包含工具名称、图标和简要说明
4. WHEN 新工具被注册到 Tool_Registry 时, THE Tool_App SHALL 自动在首页工具列表中显示该工具入口
5. THE Tool_App SHALL 为每个工具提供独立的路由页面
6. THE Tool_App SHALL 使用 React.lazy 和 Suspense 实现工具组件的懒加载，确保首页仅加载工具列表而不加载所有工具的完整代码

### Requirement 6: 部署配置

**User Story:** 作为开发者，我希望工具应用能够部署到 Vercel 平台，以便用户可以在线访问。

#### Acceptance Criteria

1. THE Tool_App SHALL 作为独立的 React 应用存放在项目的 tools/id-photo 目录下
2. THE Tool_App SHALL 作为独立的 Vercel 项目部署，root directory 配置为 tools/id-photo
3. THE Tool_App SHALL 包含 Vercel 部署配置文件（vercel.json），包含 SPA 重写规则
4. THE Tool_App SHALL 使用 Vite 作为构建工具，支持生产环境构建
5. WHEN 执行构建命令时, THE Tool_App SHALL 生成可部署的静态文件到 dist 目录
6. THE Tool_App SHALL 支持以下浏览器的最近 2 个主要版本：Chrome、Firefox、Safari、Edge

### Requirement 7: 用户界面

**User Story:** 作为用户，我希望工具界面简洁直观，以便我能快速完成证件照处理。

#### Acceptance Criteria

1. THE Tool_App SHALL 采用响应式布局，在桌面端（宽度 ≥ 1024px）和移动端（宽度 < 768px）均可正常使用
2. THE Tool_App SHALL 提供操作步骤引导，按"上传 → 裁剪 → 换底色 → 导出"的流程组织界面，但允许用户自由跳转到任意已解锁步骤
3. WHEN 用户完成上传步骤后, THE Tool_App SHALL 解锁裁剪、换底色和导出步骤，用户可按任意顺序操作
4. THE Tool_App SHALL 使用 Tailwind CSS 实现样式，保持简洁现代的视觉风格
5. WHILE 图片正在处理中, THE Tool_App SHALL 显示加载状态指示器
6. THE Tool_App SHALL 在每个处理步骤提供"重置"按钮，允许用户撤销当前步骤的所有操作恢复到上一状态
7. THE Tool_App SHALL 提供"重新开始"功能，允许用户清除所有处理结果并返回上传步骤
8. THE Tool_App SHALL 符合 WCAG 2.1 AA 级别的无障碍访问标准
9. THE Tool_App SHALL 支持浅色和深色两种主题模式，默认跟随系统设置，并提供手动切换开关

### Requirement 8: 隐私保护

**User Story:** 作为用户，我希望我的照片数据得到保护，不被上传到任何服务器。

#### Acceptance Criteria

1. THE Tool_App SHALL 在 Privacy_Mode 下运行，所有图片处理操作均在用户浏览器本地通过 Canvas_Processor 和 Color_Engine 完成
2. THE Tool_App SHALL 不发起任何包含用户图片数据的网络请求
3. THE Tool_App SHALL 在页面显著位置（如页脚或工具栏）展示隐私声明标识，说明"所有照片仅在本地处理，不会上传到服务器"
4. WHEN 用户关闭或刷新页面时, THE Tool_App SHALL 不在本地存储（localStorage/sessionStorage）中保留任何图片数据

### Requirement 9: 性能要求

**User Story:** 作为用户，我希望图片处理操作能在合理时间内完成，不会导致页面无响应。

#### Acceptance Criteria

1. WHEN 用户对不超过 10MB 的图片执行裁剪操作时, THE Canvas_Processor SHALL 在 3 秒内完成处理（基于中等配置设备：4核 CPU, 8GB RAM）
2. WHEN 用户对不超过 10MB 的图片执行底色更换操作时, THE Color_Engine SHALL 在 5 秒内完成处理
3. WHILE 图片处理操作正在执行时, THE Tool_App SHALL 保持 UI 响应（不出现浏览器"页面无响应"提示）
4. THE Tool_App SHALL 在预览阶段使用缩放后的图片进行实时处理，仅在导出时使用原始分辨率
5. WHEN Canvas 内存分配失败时, THE Tool_App SHALL 优雅降级并提示用户使用较小的图片
