import React, { useState, useEffect, useRef } from 'react';
import AnimatedCard from '../AnimatedCard';
import FlowLine from '../FlowLine';
import FlowDot from '../FlowDot';
import { useAnimationSlot } from '../../hooks/useAnimationSlot';

// ─── Exported Scenario Data (for testability) ────────────────────────────────

export interface FlowStage {
  id: string;
  label: string;
}

export interface ScenarioData {
  id: string;
  title: string;
  icon: string;
  description: string;
  stages: FlowStage[];
}

/** Application scenarios for vector database use-cases */
export const SCENARIOS: ScenarioData[] = [
  {
    id: 'semantic-search',
    title: '语义搜索',
    icon: '🔍',
    description: '基于语义理解的智能搜索，找到真正相关的内容而非简单关键词匹配',
    stages: [
      { id: 'query', label: '用户查询' },
      { id: 'embedding', label: '向量化' },
      { id: 'ann-search', label: 'ANN 检索' },
      { id: 'results', label: '语义结果' },
    ],
  },
  {
    id: 'recommendation',
    title: '推荐系统',
    icon: '💡',
    description: '通过用户行为向量化实现个性化推荐，发现潜在兴趣',
    stages: [
      { id: 'behavior', label: '用户行为' },
      { id: 'embedding', label: '行为嵌入' },
      { id: 'similarity', label: '相似匹配' },
      { id: 'suggestions', label: '推荐结果' },
    ],
  },
  {
    id: 'rag',
    title: 'RAG 增强生成',
    icon: '🤖',
    description: '检索增强生成：结合向量检索与大语言模型，生成准确可靠的回答',
    stages: [
      { id: 'query', label: '用户问题' },
      { id: 'retrieval', label: '向量检索' },
      { id: 'context', label: '上下文组装' },
      { id: 'llm', label: 'LLM 生成' },
      { id: 'answer', label: '最终回答' },
    ],
  },
];

// ─── ScenarioFlowDiagram Sub-component ───────────────────────────────────────

interface ScenarioFlowDiagramProps {
  stages: FlowStage[];
  isPlaying: boolean;
  /** Total animation duration in ms (3000-8000) */
  totalDuration: number;
}

function ScenarioFlowDiagram({ stages, isPlaying, totalDuration }: ScenarioFlowDiagramProps) {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!isPlaying || hasPlayedRef.current) return;

    hasPlayedRef.current = true;
    const stageDelay = totalDuration / stages.length;

    const timers: ReturnType<typeof setTimeout>[] = [];

    stages.forEach((_, index) => {
      const timer = setTimeout(() => {
        setActiveStageIndex(index);
      }, index * stageDelay);
      timers.push(timer);
    });

    timerRef.current = timers;

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isPlaying, stages, totalDuration]);

  return (
    <div
      className="scenario-flow-diagram"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0',
        marginTop: '0.75rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          {/* Stage node */}
          <div
            className="scenario-flow-stage"
            data-stage-id={stage.id}
            style={{
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 500,
              color: activeStageIndex >= index ? '#00ffaa' : '#9ca3af',
              background:
                activeStageIndex >= index
                  ? 'rgba(0, 255, 170, 0.08)'
                  : 'var(--color-bg, #030712)',
              border: `1px solid ${
                activeStageIndex >= index
                  ? 'rgba(0, 255, 170, 0.3)'
                  : 'var(--color-bg-mute, #1f2937)'
              }`,
              transition: 'all 0.3s ease-in-out',
              whiteSpace: 'nowrap',
            }}
          >
            {stage.label}
          </div>

          {/* FlowLine + FlowDot connector between stages */}
          {index < stages.length - 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <FlowLine
                width={32}
                height={2}
                color={
                  activeStageIndex > index
                    ? 'rgba(0,255,170,0.5)'
                    : 'rgba(0,255,170,0.15)'
                }
                speed={1.5}
              />
              {activeStageIndex === index && (
                <div style={{ position: 'absolute', left: '4px', top: '-2px' }}>
                  <FlowDot size={4} distance={24} duration={0.8} />
                </div>
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── AppScenarios Main Component ─────────────────────────────────────────────

/**
 * AppScenarios component.
 * Renders 3+ application scenario cards (semantic search, recommendation, RAG)
 * with staggered fade-in-up animation and per-scenario flow diagrams.
 *
 * - Uses AnimatedCard for each scenario card
 * - Flow diagrams use FlowLine/FlowDot for inter-stage connections
 * - Auto-plays flow animation once on scroll into viewport
 * - Total flow duration: 4 seconds per scenario (within 3-8s requirement)
 */
export default function AppScenarios() {
  const { ref, isActive, isInViewport } = useAnimationSlot({
    threshold: 0.1,
    rootMargin: '200px',
  });

  const FLOW_DURATION = 4000; // 4s total per scenario (within 3-8s range)

  return (
    <div
      ref={ref}
      className="app-scenarios"
      role="region"
      aria-label="向量数据库应用场景"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.5rem',
        padding: '1rem 0',
      }}
    >
      {SCENARIOS.map((scenario, index) => (
        <div
          key={scenario.id}
          className="app-scenario-card-wrapper"
          data-scenario-id={scenario.id}
          style={{
            animationName: 'fade-in-up',
            animationDuration: '0.6s',
            animationDelay: `${index * 150}ms`,
            animationFillMode: 'both',
            animationTimingFunction: 'ease-out',
          }}
        >
          <AnimatedCard
            title={scenario.title}
            description={scenario.description}
            icon={scenario.icon}
            delay={index * 150}
          />

          {/* Per-scenario flow diagram */}
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'var(--color-bg-soft, #111827)',
              borderRadius: '0 0 8px 8px',
              borderTop: 'none',
              marginTop: '-4px',
            }}
          >
            <ScenarioFlowDiagram
              stages={scenario.stages}
              isPlaying={isInViewport}
              totalDuration={FLOW_DURATION}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
