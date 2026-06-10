---
layout: home
hero:
  name: 技术教程站
  tagline: 高质量中文技术教程
  actions:
    - theme: brand
      text: RAGFlow 教程
      link: /ragflow/
features:
  - title: RAGFlow 教程
    details: 从零掌握 RAGFlow 检索增强生成引擎的架构、部署和使用
    link: /ragflow/
    icon: 🔍
---

<div class="home-hero-extra">
  <div class="flow-visualization">
    <span class="flow-label">文档输入</span>
    <FlowLine :width="120" :height="4" color="rgba(0,255,170,0.5)" :speed="1.5" />
    <FlowDot color="#00ffaa" :size="6" :distance="120" :duration="2" direction="ltr" />
    <span class="flow-label">智能处理</span>
    <FlowLine :width="120" :height="4" color="rgba(0,255,170,0.5)" :speed="1.2" />
    <FlowDot color="#00ffaa" :size="6" :distance="120" :duration="1.8" direction="ltr" />
    <span class="flow-label">知识输出</span>
  </div>
  <p class="flow-caption">RAG 数据处理流程：从文档到知识的智能转换</p>
</div>

<div class="home-features-extra">
  <h2 class="section-title">教程模块</h2>
  <div class="card-grid">
    <ScrollReveal animation="fade-in-up" :delay="0">
      <AnimatedCard
        title="架构概览"
        description="了解 RAGFlow 核心组件与数据流设计"
        icon="🏗️"
        link="/ragflow/architecture"
        :delay="0"
      />
    </ScrollReveal>
    <ScrollReveal animation="fade-in-up" :delay="100">
      <AnimatedCard
        title="安装部署"
        description="Docker Compose 一键部署完整指南"
        icon="🚀"
        link="/ragflow/installation"
        :delay="100"
      />
    </ScrollReveal>
    <ScrollReveal animation="fade-in-up" :delay="200">
      <AnimatedCard
        title="快速上手"
        description="从上传文档到获得 AI 回答的端到端实践"
        icon="⚡"
        link="/ragflow/quickstart"
        :delay="200"
      />
    </ScrollReveal>
    <ScrollReveal animation="fade-in-up" :delay="300">
      <AnimatedCard
        title="进阶功能"
        description="Agentic 工作流、API 集成与分块策略详解"
        icon="🔧"
        link="/ragflow/advanced"
        :delay="300"
      />
    </ScrollReveal>
  </div>
</div>

<style>
.home-hero-extra {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem 1rem;
}

.flow-visualization {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

.flow-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #00ffaa;
  padding: 0.25rem 0.75rem;
  border: 1px solid rgba(0, 255, 170, 0.3);
  border-radius: 9999px;
  background: rgba(0, 255, 170, 0.05);
}

.flow-caption {
  margin-top: 1rem;
  font-size: 0.8rem;
  color: #9ca3af;
  text-align: center;
}

.home-features-extra {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1.5rem 3rem;
}

.section-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 2rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }

  .flow-visualization {
    gap: 0.5rem;
  }
}
</style>
