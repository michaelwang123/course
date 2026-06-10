# RAGFlow 教程

## 检索增强生成引擎

RAGFlow 是一款基于深度文档理解的开源检索增强生成（RAG）引擎。它为用户提供了一套完整的解决方案，将非结构化数据转化为可靠的知识问答服务。无论你是希望构建企业知识库，还是搭建智能客服系统，RAGFlow 都能帮助你从海量文档中精准提取答案，并提供可追溯的引用来源。

本教程将带你从零开始，全面了解 RAGFlow 的架构设计、部署方式和使用技巧，帮助你快速掌握这一强大的 RAG 引擎。

---

## 学习目标

通过本教程的学习，你将能够：

- **理解 RAGFlow 架构** — 掌握系统各组件的职责与数据流向
- **独立完成部署** — 使用 Docker Compose 在本地环境成功运行 RAGFlow
- **完成端到端问答** — 从上传文档到获得基于文档的智能回答
- **配置本地 LLM** — 将 Ollama 等本地大模型与 RAGFlow 集成
- **使用进阶功能** — 掌握 Agentic 工作流、HTTP API 和多种分块策略

---

## 章节概览

<ScrollReveal animation="fade-in-up" :delay="0">

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1.5rem;">

<AnimatedCard
  title="架构概览"
  description="了解 RAGFlow 的系统组件、数据流向和核心能力"
  icon="🏗️"
  link="/ragflow/architecture"
  :delay="0"
/>

<AnimatedCard
  title="安装部署"
  description="Docker Compose 一键部署，快速搭建本地 RAGFlow 环境"
  icon="🚀"
  link="/ragflow/installation"
  :delay="100"
/>

<AnimatedCard
  title="快速上手"
  description="端到端实战：从上传文档到获得智能问答回复"
  icon="⚡"
  link="/ragflow/quickstart"
  :delay="200"
/>

<AnimatedCard
  title="进阶功能"
  description="Agentic 工作流、HTTP API、分块策略与 MCP 集成"
  icon="🔧"
  link="/ragflow/advanced"
  :delay="300"
/>

</div>

</ScrollReveal>

---

## 前置知识

在开始本教程之前，建议你具备以下基础：

| 领域 | 建议掌握的内容 |
|------|----------------|
| Docker | 了解容器基本概念，能运行 `docker compose` 命令 |
| 命令行 | 熟悉 Linux/macOS 终端或 Windows PowerShell 基本操作 |
| LLM 基础 | 了解大语言模型的基本原理（如 GPT、Llama 等） |
| RAG 概念 | 了解检索增强生成的基本思路（可选，教程中会介绍） |

::: tip 💡 提示
即使你对 RAG 概念不太熟悉也没关系，本教程的架构概览章节会为你建立必要的背景知识。
:::
