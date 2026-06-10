# 进阶功能

本章介绍 RAGFlow 的高级能力，包括 Agentic 工作流编排、HTTP API 接口调用、分块策略详解以及 MCP（Model Context Protocol）支持。掌握这些进阶功能后，你可以将 RAGFlow 深度集成到自有系统和自动化流程中。

---

## Agentic 工作流

### 什么是 Agentic 工作流

RAGFlow 提供基于有向图的可视化工作流编排引擎，用户可以通过拖拽方式组合多种组件（检索、生成、判断、循环、HTTP 请求等），构建多步骤的智能任务流。与简单的单轮问答不同，Agentic 工作流允许 LLM 驱动自主决策——Agent 可以根据中间结果动态调整执行路径、调用外部工具或触发子流程。

典型应用场景包括：
- **深度研究**：多轮检索 + 反思 + 摘要生成
- **自动报告生成**：数据检索 → 分析 → 格式化输出
- **多轮推理问答**：根据用户追问动态扩展检索范围
- **SQL 助手**：自然语言 → SQL 生成 → 执行 → 结果返回

### 完整示例：构建"深度研究"工作流

以下以"深度研究（Deep Research）"场景为例，演示从创建到运行的完整流程。

#### 第一步：创建 Agent

1. 登录 RAGFlow 后，点击左侧导航栏的 **Agent** 页面
2. 点击 **Create Agent** 按钮
3. 选择从空白画布开始，或使用预置模板（推荐初学者使用 `Deep Research` 模板）
4. 输入 Agent 名称，例如"深度研究助手"

#### 第二步：选择并连接组件

在画布右侧面板中，拖拽以下组件到画布并按顺序连接：

| 序号 | 组件 | 职责 |
|------|------|------|
| 1 | **Begin** | 接收用户输入，定义起始节点 |
| 2 | **Retrieval** | 从指定知识库中检索相关文档分块 |
| 3 | **Generate** | 调用 LLM 对检索结果进行分析和生成 |
| 4 | **Answer** | 将最终结果返回给用户 |

连接顺序：`Begin → Retrieval → Generate → Answer`

> 💡 对于更复杂的场景，可以在 Retrieval 和 Generate 之间插入 **Relevant** 组件进行相关性判断，将不相关的查询路由到不同处理分支。

#### 第三步：配置组件参数

**Begin 组件配置：**
- Prologue（开场白）：设置 Agent 的欢迎语，如"您好，我是深度研究助手，请输入您想研究的主题。"

**Retrieval 组件配置：**
- Dataset（知识库）：选择已创建并完成解析的知识库
- Similarity threshold（相似度阈值）：建议设为 `0.2`
- Top N：返回最相关的分块数量，建议设为 `6`
- Keyword similarity weight（关键词相似度权重）：默认 `0.3`，混合检索场景可调至 `0.5`

**Generate 组件配置：**
- LLM：选择已配置的大语言模型（如 GPT-4、Qwen、DeepSeek 等）
- System prompt（系统提示词）：定义 LLM 的角色和输出要求
- Temperature：建议设为 `0.1`（研究场景需要更精确的输出）
- Max tokens：根据需要设置，推荐 `2048`

**Answer 组件配置：**
- 无需额外参数，自动将上游 Generate 的输出返回给用户

#### 第四步：运行与验证

1. 点击画布上方的 **Run** 按钮（或点击右上角的聊天图标进入对话模式）
2. 输入测试问题，例如"RAGFlow 的分块策略有哪些？"
3. 观察工作流执行过程：
   - Begin 接收用户输入 ✓
   - Retrieval 从知识库检索到相关分块 ✓
   - Generate 基于检索结果生成回答 ✓
   - Answer 返回最终结果给用户 ✓
4. 检查输出是否包含引用来源标注

如果某个组件执行失败，点击该组件节点可查看详细的错误日志和输入/输出数据。

---

## HTTP API 使用

RAGFlow 提供完整的 RESTful HTTP API，支持通过编程方式管理数据集、上传文档、发起对话等操作。

### 获取 API Key

1. 登录 RAGFlow Web UI
2. 点击右上角头像 → **API Key**（或进入系统设置页面）
3. 点击 **Create new key** 生成新的 API 密钥
4. 复制并妥善保管密钥（仅在创建时显示一次）

### 基本信息

- **Base URL：** `http://<host>:9380/api/v1`
- **认证方式：** 在请求头中携带 `Authorization: Bearer <YOUR_API_KEY>`
- **响应格式：** JSON

### 示例 1：创建数据集

创建一个新的知识库（Dataset）：

```bash
curl -X POST http://localhost:9380/api/v1/datasets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ragflow-xxxxx" \
  -d '{
    "name": "产品文档知识库",
    "description": "存放产品相关技术文档",
    "language": "Chinese",
    "embedding_model": "BAAI/bge-large-zh-v1.5",
    "chunk_method": "naive"
  }'
```

**请求参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 数据集名称 |
| description | string | 否 | 数据集描述 |
| language | string | 否 | 语言，如 `Chinese`、`English` |
| embedding_model | string | 否 | 向量嵌入模型名称 |
| chunk_method | string | 否 | 分块方法：`naive`(通用)、`resume`、`table`、`paper`、`laws` 等 |

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "id": "ds_1234567890abcdef",
    "name": "产品文档知识库",
    "description": "存放产品相关技术文档",
    "language": "Chinese",
    "embedding_model": "BAAI/bge-large-zh-v1.5",
    "chunk_method": "naive",
    "chunk_count": 0,
    "document_count": 0,
    "created_at": "2025-01-15T10:30:00Z"
  },
  "message": "success"
}
```

### 示例 2：上传文档到数据集

向指定数据集上传一个文件：

```bash
curl -X POST http://localhost:9380/api/v1/datasets/ds_1234567890abcdef/documents \
  -H "Authorization: Bearer ragflow-xxxxx" \
  -F "file=@./产品手册.pdf"
```

**请求说明：**
- 使用 `multipart/form-data` 格式上传文件
- URL 中的 `ds_1234567890abcdef` 替换为实际的数据集 ID
- 支持的文件格式：PDF、Word（.docx）、Excel（.xlsx）、PPT、TXT、Markdown、图片等

**响应示例：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "doc_abcdef1234567890",
      "name": "产品手册.pdf",
      "size": 2048576,
      "type": "application/pdf",
      "chunk_method": "naive",
      "status": "UNSTART",
      "created_at": "2025-01-15T10:35:00Z"
    }
  ],
  "message": "success"
}
```

> 上传成功后，文档状态为 `UNSTART`，需要触发解析操作后才会开始分块处理。文档解析完成后状态变为 `SUCCESS`。

### 示例 3：发起对话（Chat Completion）

基于已创建的聊天助手发起对话：

```bash
curl -X POST http://localhost:9380/api/v1/chats/chat_abc123def456/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ragflow-xxxxx" \
  -d '{
    "question": "RAGFlow 支持哪些文档格式？",
    "stream": false,
    "session_id": "session_xyz789"
  }'
```

**请求参数说明：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| question | string | 是 | 用户提问内容 |
| stream | boolean | 否 | 是否启用流式输出，默认 `true` |
| session_id | string | 否 | 会话 ID，用于多轮对话上下文关联 |

**响应示例：**

```json
{
  "code": 0,
  "data": {
    "answer": "RAGFlow 支持多种文档格式，包括 PDF、Word (.docx)、Excel (.xlsx/.csv)、PowerPoint (.pptx)、纯文本 (.txt)、Markdown (.md) 以及图片格式（PNG、JPG 等，通过 OCR 识别文字内容）。",
    "reference": {
      "chunks": [
        {
          "id": "chunk_001",
          "content": "RAGFlow supports various file formats including PDF, DOCX, XLSX...",
          "document_name": "产品手册.pdf",
          "dataset_id": "ds_1234567890abcdef",
          "similarity": 0.89
        }
      ],
      "total": 3
    },
    "session_id": "session_xyz789"
  },
  "message": "success"
}
```

响应中的 `reference.chunks` 字段包含了回答所引用的来源分块信息，支持引用溯源。

---

## 分块策略详解

RAGFlow 提供多种内置分块模板，针对不同文档类型和场景优化分块效果。选择合适的分块策略是确保检索质量的关键。

### 通用（General / Naive）

| 属性 | 说明 |
|------|------|
| **适用文档** | 通用文本文档：PDF、Word、TXT、Markdown 等 |
| **分块逻辑** | 自动检测段落边界，按语义段落切分；支持设置最大分块长度和重叠 token 数 |
| **典型用途** | 技术文档、产品手册、FAQ、博客文章等通用场景 |

**关键参数：**
- **Chunk token number**：每个分块的最大 token 数量（默认 128）
- **Layout recognize**：是否启用版面识别（开启后对 PDF 效果更好）
- **Task page size**：每次处理的页数（影响解析速度）

**选择建议：** 当你不确定使用哪种策略时，通用策略是最安全的默认选择。它适用于大多数标准文档，能自动检测段落边界并保持语义完整性。

---

### 简历（Resume）

| 属性 | 说明 |
|------|------|
| **适用文档** | 个人简历、CV 文件（PDF 或 Word 格式） |
| **分块逻辑** | 识别简历中的结构化字段（姓名、教育经历、工作经验、技能等），按字段进行结构化提取 |
| **典型用途** | HR 招聘系统、人才库知识库、简历筛选 Agent |

**关键参数：**
- 无需额外配置，系统自动识别简历结构
- 自动提取：个人信息、教育背景、工作经历、项目经验、技能标签等

**选择建议：** 仅用于简历类文档。系统会将简历解析为结构化 JSON 格式而非纯文本分块，特别适合需要按字段检索的场景（如"找出有 3 年以上 Python 经验的候选人"）。

---

### 表格（Table）

| 属性 | 说明 |
|------|------|
| **适用文档** | Excel（.xlsx / .csv）、包含大量表格的文档 |
| **分块逻辑** | 以行为单位进行分块，保留表头信息作为每个分块的上下文；确保表格数据在检索时不被割裂 |
| **典型用途** | 财务报表分析、数据统计查询、产品规格对比 |

**关键参数：**
- **Header row**：指定表头行数（默认 1）
- 系统自动将表头附加到每个行数据分块中，保证检索时上下文完整

**选择建议：** 当文档主体为表格数据时使用。与通用策略相比，表格策略能保证每个分块都包含列名上下文，避免检索到孤立的数值数据而缺少语义。

---

### 论文（Paper）

| 属性 | 说明 |
|------|------|
| **适用文档** | 学术论文（PDF 格式，通常为双栏排版） |
| **分块逻辑** | 识别论文结构（摘要、引言、方法、实验、结论等章节），按章节语义进行分块，正确处理双栏排版和图表引用 |
| **典型用途** | 学术研究助手、文献综述 Agent、论文问答系统 |

**选择建议：** 专为学术论文设计，能正确处理双栏 PDF 的阅读顺序、数学公式和参考文献。对于非论文类 PDF，应使用通用策略。

---

### 法律（Laws）

| 属性 | 说明 |
|------|------|
| **适用文档** | 法律法规、合同、法律文书 |
| **分块逻辑** | 识别法律文本的条款层级结构（章、节、条、款、项），按条款进行分块，保持法律引用的完整性 |
| **典型用途** | 法律咨询助手、合规检查系统、合同审查 Agent |

**选择建议：** 当文档具有明确条款编号和层级结构时使用。法律策略确保"第 X 条第 Y 款"这样的引用不会被错误切分，每个分块都是一个语义完整的法律条款。

---

### 策略选择速查表

| 文档类型 | 推荐策略 | 理由 |
|----------|----------|------|
| 通用技术文档 | General | 自动段落检测，适应性广 |
| 个人简历/CV | Resume | 结构化字段提取 |
| Excel/CSV 数据表 | Table | 保留表头上下文 |
| 学术论文 PDF | Paper | 正确处理双栏和章节 |
| 法律法规/合同 | Laws | 按条款层级切分 |
| 演示文稿 PPT | Presentation | 按幻灯片页切分 |
| 图书/长文档 | Book | 按章节层级切分 |
| 手动控制 | Manual | 用户自定义分隔符 |

---

## MCP 支持

### 什么是 MCP

MCP（Model Context Protocol）是由 Anthropic 提出的开放协议，旨在标准化 AI 模型与外部工具/数据源之间的通信方式。通过 MCP，AI 客户端（如 Claude Desktop、Cursor、Cline 等）可以统一调用各种外部服务，无需为每个工具编写专门的集成代码。

RAGFlow 从 v0.18.0 开始支持作为 MCP Server 运行，使任何兼容 MCP 协议的 AI 客户端都能直接调用 RAGFlow 的知识库检索能力。

### 应用场景：在 Cursor 中使用 RAGFlow 知识库

**场景描述：** 开发者在 Cursor IDE 中编码时，希望直接查询公司内部的技术文档库（已导入 RAGFlow），无需切换到 RAGFlow Web 界面即可获取相关技术资料。

**实现效果：** 在 Cursor 的 AI 对话中输入问题，AI 自动通过 MCP 协议调用 RAGFlow 检索相关文档分块，结合检索结果生成回答。

### 配置步骤

#### 1. 前置条件

- RAGFlow 已部署且版本 ≥ v0.18.0
- 已获取 RAGFlow API Key（在 Web UI 的头像 → API Key 中创建）
- MCP 客户端已安装（如 Cursor、Claude Desktop 等）

#### 2. 启动 RAGFlow MCP Server

**方式一：通过 Docker（推荐）**

编辑 `docker/docker-compose.yml`，取消注释 MCP 相关配置：

```yaml
services:
  ragflow:
    # ...
    command:
      - --enable-mcpserver
      - --mcp-host=0.0.0.0
      - --mcp-port=9382
      - --mcp-base-url=http://127.0.0.1:9380
      - --mcp-script-path=/ragflow/mcp/server/server.py
      - --mcp-mode=self-host
      - --mcp-host-api-key=ragflow-xxxxx  # 替换为你的 API Key
```

然后重启服务：

```bash
docker compose -f docker-compose.yml up -d
```

**方式二：从源码启动**

```bash
uv run mcp/server/server.py \
  --host=127.0.0.1 \
  --port=9382 \
  --base-url=http://127.0.0.1:9380 \
  --api-key=ragflow-xxxxx
```

启动成功后，终端会输出类似以下信息：

```
Starting MCP Server on 0.0.0.0:9382 with base URL http://127.0.0.1:9380
MCP launch mode: self-host
```

#### 3. 配置 MCP 客户端

**Cursor 配置示例：**

在 Cursor 的 MCP 设置文件（通常为项目根目录下的 `.cursor/mcp.json`）中添加：

```json
{
  "mcpServers": {
    "ragflow": {
      "url": "http://127.0.0.1:9382/mcp"
    }
  }
}
```

**Claude Desktop 配置示例：**

编辑 Claude Desktop 配置文件 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "ragflow": {
      "url": "http://127.0.0.1:9382/mcp"
    }
  }
}
```

#### 4. 验证连接

配置完成后，在 MCP 客户端中输入一个与知识库内容相关的问题，验证是否能成功调用 RAGFlow 进行检索并返回结果。

> ⚠️ **安全提示：** MCP 协议目前仍处于早期阶段，RAGFlow 使用 API Key 进行身份验证。在公共网络环境中，建议将 MCP Server 绑定到 `127.0.0.1`（本地回环地址）而非 `0.0.0.0`（所有网络接口），以避免潜在的安全风险。

### 工作模式说明

RAGFlow MCP Server 支持两种工作模式：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **self-host**（默认） | 启动时提供 API Key，MCP Server 代表单一租户访问 RAGFlow | 个人使用、单用户场景 |
| **host** | 每个客户端请求需携带各自的 API Key | 多用户共享 MCP Server |

---

## 小结

| 功能 | 核心价值 | 入门建议 |
|------|----------|----------|
| Agentic 工作流 | 将简单问答扩展为多步骤智能任务 | 从预置模板开始，逐步自定义 |
| HTTP API | 程序化集成 RAGFlow 到自有系统 | 先用 curl 测试，再接入代码 |
| 分块策略 | 针对不同文档类型优化检索效果 | 先用 General，再按文档类型细调 |
| MCP 支持 | 在 AI IDE 中直接调用知识库 | 确保版本 ≥ v0.18.0，从 Docker 方式开始 |
