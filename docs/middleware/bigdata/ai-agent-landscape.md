---
title: 大数据与 AI Agent 技术地图
sidebar_position: 4
slug: /middleware/bigdata-ai-agent-landscape
---

# 大数据与 AI Agent 技术地图

面向大数据 + AI Agent 开发者的"不知道自己不知道"清单。每个条目只给出概念定位，具体学习自行深入。

---

## 一、LLM 核心机制（你调用的东西到底在做什么）

| 概念 | 一句话说明 |
|------|-----------|
| Transformer | 所有现代 LLM 的底层架构，Self-Attention 机制让模型能"关注"输入中任意位置的信息 |
| Token 化 | 文本被切分为 Token（子词），不同模型的 Tokenizer 切法不同，直接影响上下文窗口利用率 |
| 上下文窗口 | 模型单次能处理的 Token 总量（如 128K），超过就"遗忘"，这是 RAG 存在的根本原因 |
| Temperature / Top-P | 控制输出随机性的采样参数，Temperature=0 确定性最强，适合工具调用；>0.7 适合创意生成 |
| Logprobs | 模型输出每个 Token 的概率分布，可用于置信度评估和幻觉检测 |
| System Prompt vs User Prompt | System 设定角色和规则（持久），User 是具体指令（每轮变化），区分清楚才能稳定控制行为 |

---

## 二、Prompt Engineering 进阶模式

| 模式 | 一句话说明 |
|------|-----------|
| Chain-of-Thought (CoT) | "让我一步步思考" — 强制模型输出推理过程，提升复杂逻辑的准确率 |
| ReAct | Reasoning + Acting 交替循环 — Agent 先思考该做什么，再调用工具，再根据结果继续推理 |
| Self-Consistency | 对同一问题多次采样取多数票，牺牲速度换准确率 |
| Structured Output | 强制模型输出 JSON/YAML 等结构化格式（通过 JSON Schema 约束），工具调用的基础 |
| Few-Shot with Examples | 在 prompt 中给出输入→输出示例，让模型"模仿"而非"理解" |
| Meta-Prompting | 用 LLM 生成/优化 prompt 本身，自动化 prompt 迭代 |

---

## 三、Agent 架构核心概念

| 概念 | 一句话说明 |
|------|-----------|
| Function Calling | LLM 不直接执行操作，而是输出"我想调用 X 函数，参数是 Y"的结构化意图，由外部执行 |
| Tool Use Protocol | OpenAI Function Calling、Anthropic Tool Use、MCP — 不同厂商的工具调用协议 |
| Agent Loop | 感知→思考→行动→观察 的循环，直到任务完成或达到终止条件 |
| Planning | Agent 将复杂任务分解为子步骤的能力（如 Plan-and-Execute 模式） |
| Reflection | Agent 对自己的输出进行自我评估和纠错，提升可靠性 |
| Delegation | Agent 将子任务委托给其他专业 Agent（多 Agent 协作的基础） |
| Guardrails | 对 Agent 输入输出设置安全边界，防止越权操作或有害输出 |
| Human-in-the-Loop | 关键决策节点引入人工确认，平衡自主性与安全性 |

---

## 四、记忆系统（Agent 为什么会"忘事"以及怎么解决）

| 概念 | 一句话说明 |
|------|-----------|
| 短期记忆 | 当前对话的上下文窗口内容，窗口满了就丢失 |
| 对话摘要 | 将长对话压缩为摘要放回上下文，延长"有效记忆" |
| 长期记忆 | 持久化存储（向量数据库/KV 存储），跨会话保留用户偏好和历史知识 |
| 情景记忆 | 记录过去的成功/失败经验，Agent 做决策时可检索类似案例 |
| 工作记忆 | Agent 当前任务的中间状态（如已完成的子步骤、待执行的计划） |

---

## 五、RAG 管道关键环节

| 环节 | 你可能不知道的点 |
|------|-----------------|
| 文档解析 | PDF 表格、扫描件 OCR、代码文件的解析质量差异巨大，unstructured/docling 等库各有侧重 |
| 分块策略 | 固定大小 vs 语义分块 vs 递归分块 — 分块方式直接决定检索召回质量 |
| Embedding 模型选择 | 不同模型在不同语言/领域的效果差异大（BGE、GTE、Cohere embed），需 benchmark 评估 |
| 混合检索 | 纯向量检索对精确关键词（如错误码、产品型号）效果差，需结合 BM25 关键词检索 |
| Reranker | 初次召回 top-50 后用 Cross-Encoder 精排为 top-5，准确率提升 20-40% |
| 查询改写 | 用户原始查询可能模糊，通过 LLM 改写为多个检索查询提升召回（HyDE、Multi-Query） |
| 引用溯源 | 回答中标注来源片段的位置，让用户可验证，降低幻觉风险 |
| Chunk 元数据 | 为每个分块附带来源文件、章节标题、时间戳等元数据，过滤时可按条件筛选 |

---

## 六、向量数据库（不只是"存 Embedding"）

| 概念 | 一句话说明 |
|------|-----------|
| ANN 算法 | HNSW、IVF-PQ、ScaNN — 不同的近似最近邻算法，在速度/精度/内存间取舍 |
| 距离度量 | 余弦相似度、欧氏距离、内积 — 选错度量会导致检索结果完全错误 |
| 标量过滤 | 先按元数据（如 tenant_id、date）预筛选，再做向量搜索，多租户场景必备 |
| 量化压缩 | 将 float32 向量压缩为 int8，内存降 4x 但精度损失 <5%，大规模部署的关键 |
| 多向量索引 | ColBERT 风格的 Token 级向量，比单向量更精确但索引更大 |
| 主流选择 | Milvus（分布式重量级）、Qdrant（Rust 高性能）、Chroma（轻量本地开发）、Pinecone（全托管） |

---

## 七、模型服务与推理优化

| 概念 | 一句话说明 |
|------|-----------|
| vLLM | PagedAttention 算法实现的高吞吐推理引擎，KV Cache 内存管理效率最高 |
| TGI (Text Generation Inference) | HuggingFace 出品的推理服务，支持连续批处理和量化 |
| 量化 (GPTQ/AWQ/GGUF) | 将模型权重从 FP16 压缩到 INT4/INT8，显存需求降 4x，推理速度提升 2-3x |
| KV Cache | 推理过程中缓存已计算的 Key-Value，避免重复计算，但占用大量显存 |
| Speculative Decoding | 用小模型预测多个 Token，大模型一次性验证，加速 2-3x |
| 模型路由 | 简单问题走小模型，复杂问题走大模型，节省 70% 推理成本 |
| Streaming | 逐 Token 输出给用户，降低感知延迟（首 Token 时间 TTFT 是关键指标） |

---

## 八、评估体系（怎么知道你的 Agent/RAG 效果好不好）

| 概念 | 一句话说明 |
|------|-----------|
| Faithfulness | 回答是否忠实于检索到的上下文（而非模型自己编造） |
| Relevancy | 检索到的文档是否与问题相关 |
| Correctness | 最终答案是否正确（需要标注数据或 LLM-as-Judge） |
| LLM-as-Judge | 用另一个 LLM 评估输出质量，比人工标注快 100 倍，但需校准偏差 |
| Regression Testing | 修改 prompt/RAG 管道后自动回归测试，确保改进不引入退化 |
| A/B Testing for LLM | 线上双版本对比，但 LLM 输出的方差大，需要更大样本量 |
| 工具：RAGAS / DeepEval / Promptfoo | 主流的 RAG/Agent 评估框架 |

---

## 九、数据湖与特征工程（大数据 → AI 的桥梁）

| 概念 | 一句话说明 |
|------|-----------|
| Lakehouse 架构 | 数据湖 + 数据仓库统一，Iceberg/Hudi/Delta Lake 提供 ACID 事务 + 时间旅行 |
| Feature Store | 统一管理和服务 ML 特征，解决训练/推理特征不一致的问题（Feast、Tecton） |
| 数据版本控制 | DVC / LakeFS — 像 Git 管理代码一样管理训练数据集 |
| 数据血缘 | 追踪数据从源头到消费的完整链路，AI 模型出问题时溯源到数据 |
| 实时特征管道 | Flink/Kafka 计算实时特征（如"最近 5 分钟交易次数"），推送到在线 Feature Store |

---

## 十、安全与合规（容易忽略但生产必需）

| 概念 | 一句话说明 |
|------|-----------|
| Prompt Injection | 恶意用户通过输入覆盖 System Prompt 的指令，让 Agent 做非预期操作 |
| Jailbreaking | 绕过模型安全对齐的技术，你的 Agent 也可能被用户绕过 |
| PII 检测与脱敏 | 用户输入和 LLM 输出中的个人信息（姓名、身份证号）必须检测和处理 |
| Output Filtering | 对 Agent 输出做后处理过滤（有害内容、竞品信息、内部数据泄露） |
| 审计日志 | 记录每次 LLM 调用的输入输出、工具调用详情，合规审计和问题排查的依据 |
| 成本控制 | Token 计量、预算上限、缓存（Semantic Cache 相似问题复用历史回答） |

---

## 十一、多模态与前沿方向

| 概念 | 一句话说明 |
|------|-----------|
| Vision-Language Model | GPT-4V / Claude Vision — 能"看图"的模型，Agent 可处理截图、文档图片、UI 界面 |
| Voice Agent | 语音输入 → STT → LLM → TTS → 语音输出的完整链路 |
| Code Interpreter | Agent 在沙箱中动态执行代码完成计算任务（如数据分析、绘图） |
| Computer Use | Agent 直接操作浏览器/桌面（Claude Computer Use），模拟人类操作 GUI |
| Knowledge Graph + LLM | 将结构化知识图谱融入 LLM 推理，解决多跳关系推理和事实一致性问题 |
| Agentic RAG | 不只是简单的"检索→生成"，Agent 自主决定何时检索、检索什么、是否需要二次检索 |
| MCP (Model Context Protocol) | 标准化 Agent ↔ 工具的通信协议，让工具可被任意 Agent 框架复用 |

---

## 学习优先级建议

```
紧急且重要（立刻补）：
  → Function Calling 协议细节
  → RAG 分块策略 + Reranker
  → 向量数据库选型与 ANN 算法
  → Prompt Injection 防御

重要但不紧急（项目中逐步补）：
  → vLLM 部署 + 量化
  → 评估框架（RAGAS）
  → Agent 记忆系统设计
  → 数据湖 Lakehouse

锦上添花（有余力再看）：
  → Speculative Decoding
  → Multi-Agent 编排
  → Feature Store
  → Knowledge Graph RAG
```
