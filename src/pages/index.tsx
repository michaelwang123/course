import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import AnimatedCard from '../components/AnimatedCard';
import ScrollReveal from '../components/ScrollReveal';
import FlowLine from '../components/FlowLine';
import FlowDot from '../components/FlowDot';
import ErrorBoundary from '../components/ErrorBoundary';

const cardData = [
  {
    title: 'RAGFlow 教程',
    description: '从零开始搭建 RAGFlow 知识库系统，掌握检索增强生成技术',
    icon: '🤖',
    link: '/ragflow/',
  },
  {
    title: 'AI 技术',
    description: '探索前沿人工智能技术，理解大模型原理与应用',
    icon: '🧠',
    link: '/ai_tech/',
  },
  {
    title: '篮球技术',
    description: '篮球基础技术与进阶训练方法，提升球场表现',
    icon: '🏀',
    link: '/basketball_skill/',
  },
  {
    title: '读书笔记',
    description: '技术书籍精读笔记与心得分享，高效学习指南',
    icon: '📚',
    link: '/book_read/',
  },
];

const flowStages = ['文档输入', '智能处理', '知识输出'];

export default function Home(): React.ReactElement {
  // Call useBaseUrl at top level (hooks must not be called inside callbacks/loops)
  const baseUrl = useBaseUrl('/');
  const resolveUrl = (path: string): string =>
    path.startsWith('/') ? `${baseUrl}${path.slice(1)}` : path;

  const ctaLink = resolveUrl('/ragflow/');

  return (
    <Layout title="首页" description="高质量中文技术教程">
      <main className="home-page">
        {/* Hero Section */}
        <section className="home-hero">
          <h1 className="home-hero__title">技术教程站</h1>
          <p className="home-hero__subtitle">高质量中文技术教程</p>
          <a href={ctaLink} className="home-hero__cta">
            开始学习
          </a>
        </section>

        {/* Flow Visualization Section — isolated with ErrorBoundary */}
        <ErrorBoundary>
          <section className="home-flow">
            <div className="home-flow__container">
              {flowStages.map((stage, index) => (
                <React.Fragment key={stage}>
                  <div className="home-flow__stage">
                    <span className="home-flow__label">{stage}</span>
                  </div>
                  {index < flowStages.length - 1 && (
                    <div className="home-flow__connector">
                      <FlowLine width={100} height={4} />
                      <FlowDot size={6} distance={100} duration={2} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        </ErrorBoundary>

        {/* Card Grid Section — isolated with ErrorBoundary */}
        <ErrorBoundary>
          <section className="home-cards">
            <div className="home-cards__grid">
              {cardData.map((card, index) => (
                <ScrollReveal key={card.title} delay={index * 100}>
                  <AnimatedCard
                    title={card.title}
                    description={card.description}
                    icon={card.icon}
                    link={resolveUrl(card.link)}
                    delay={index * 100}
                  />
                </ScrollReveal>
              ))}
            </div>
          </section>
        </ErrorBoundary>
      </main>
    </Layout>
  );
}
