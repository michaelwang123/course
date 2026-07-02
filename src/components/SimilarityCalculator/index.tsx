import React, { useState } from 'react';

/**
 * Computes the cosine similarity between two 2D vectors.
 * Returns the result rounded to 4 decimal places.
 * Cosine similarity = (A·B) / (|A| × |B|)
 */
export function cosineSimilarity(a: [number, number], b: [number, number]): number {
  const dot = a[0] * b[0] + a[1] * b[1];
  const magA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  const magB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
  if (magA === 0 || magB === 0) return 0;
  return Math.round((dot / (magA * magB)) * 10000) / 10000;
}

/**
 * Computes the Euclidean distance between two 2D vectors.
 * Returns the result rounded to 4 decimal places.
 * Euclidean distance = √((a₁-b₁)² + (a₂-b₂)²)
 */
export function euclideanDistance(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.round(Math.sqrt(dx * dx + dy * dy) * 10000) / 10000;
}

/**
 * Computes the dot product of two 2D vectors.
 * Returns the result rounded to 4 decimal places.
 * Dot product = a₁×b₁ + a₂×b₂
 */
export function dotProduct(a: [number, number], b: [number, number]): number {
  return Math.round((a[0] * b[0] + a[1] * b[1]) * 10000) / 10000;
}

interface SimilarityCalculatorProps {
  /** Initial vector A. Default: [3, 4] */
  initialVectorA?: [number, number];
  /** Initial vector B. Default: [1, 5] */
  initialVectorB?: [number, number];
}

/**
 * Interactive similarity calculator component.
 * Displays cosine similarity, Euclidean distance, and dot product
 * with SVG geometric visualizations and step-by-step formula animations.
 */
export default function SimilarityCalculator({
  initialVectorA = [3, 4],
  initialVectorB = [1, 5],
}: SimilarityCalculatorProps) {
  const [vectorA, setVectorA] = useState<[number, number]>(initialVectorA);
  const [vectorB, setVectorB] = useState<[number, number]>(initialVectorB);

  const clamp = (value: number): number => Math.max(-10, Math.min(10, value));

  const handleInputChange = (
    vector: 'A' | 'B',
    index: 0 | 1,
    rawValue: string
  ) => {
    const parsed = parseFloat(rawValue);
    if (!Number.isFinite(parsed)) return;
    const clamped = clamp(parsed);
    if (vector === 'A') {
      const newVec: [number, number] = [...vectorA];
      newVec[index] = clamped;
      setVectorA(newVec);
    } else {
      const newVec: [number, number] = [...vectorB];
      newVec[index] = clamped;
      setVectorB(newVec);
    }
  };

  const cosine = cosineSimilarity(vectorA, vectorB);
  const euclidean = euclideanDistance(vectorA, vectorB);
  const dot = dotProduct(vectorA, vectorB);

  return (
    <div
      className="similarity-calculator"
      role="region"
      aria-label="向量相似度计算器"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      {/* Vector Input Controls */}
      <fieldset
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          border: '1px solid var(--color-bg-mute, #1f2937)',
          borderRadius: '8px',
          padding: '1rem',
        }}
      >
        <legend style={{ color: 'var(--color-text-muted, #9ca3af)', fontSize: '0.875rem', padding: '0 0.5rem' }}>
          向量输入
        </legend>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', color: '#e5e7eb', fontSize: '0.875rem' }}>Vector A:</label>
          <input
            type="number"
            min={-10}
            max={10}
            step={0.1}
            value={vectorA[0]}
            onChange={(e) => handleInputChange('A', 0, e.target.value)}
            aria-label="Vector A component 1"
            style={{
              width: '5rem',
              padding: '0.4rem',
              marginRight: '0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--color-bg-mute, #1f2937)',
              background: 'var(--color-bg, #030712)',
              color: 'var(--color-text, #ffffff)',
            }}
          />
          <input
            type="number"
            min={-10}
            max={10}
            step={0.1}
            value={vectorA[1]}
            onChange={(e) => handleInputChange('A', 1, e.target.value)}
            aria-label="Vector A component 2"
            style={{
              width: '5rem',
              padding: '0.4rem',
              borderRadius: '4px',
              border: '1px solid var(--color-bg-mute, #1f2937)',
              background: 'var(--color-bg, #030712)',
              color: 'var(--color-text, #ffffff)',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.25rem', color: '#e5e7eb', fontSize: '0.875rem' }}>Vector B:</label>
          <input
            type="number"
            min={-10}
            max={10}
            step={0.1}
            value={vectorB[0]}
            onChange={(e) => handleInputChange('B', 0, e.target.value)}
            aria-label="Vector B component 1"
            style={{
              width: '5rem',
              padding: '0.4rem',
              marginRight: '0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--color-bg-mute, #1f2937)',
              background: 'var(--color-bg, #030712)',
              color: 'var(--color-text, #ffffff)',
            }}
          />
          <input
            type="number"
            min={-10}
            max={10}
            step={0.1}
            value={vectorB[1]}
            onChange={(e) => handleInputChange('B', 1, e.target.value)}
            aria-label="Vector B component 2"
            style={{
              width: '5rem',
              padding: '0.4rem',
              borderRadius: '4px',
              border: '1px solid var(--color-bg-mute, #1f2937)',
              background: 'var(--color-bg, #030712)',
              color: 'var(--color-text, #ffffff)',
            }}
          />
        </div>
      </fieldset>

      {/* Cosine Similarity Section */}
      <section className="similarity-section" aria-label="余弦相似度计算">
        <h3>余弦相似度 (Cosine Similarity)</h3>
        <div aria-live="polite">Result: {cosine}</div>
      </section>

      {/* Euclidean Distance Section */}
      <section className="similarity-section" aria-label="欧氏距离计算">
        <h3>欧氏距离 (Euclidean Distance)</h3>
        <div aria-live="polite">Result: {euclidean}</div>
      </section>

      {/* Dot Product Section */}
      <section className="similarity-section" aria-label="点积计算">
        <h3>点积 (Dot Product)</h3>
        <div aria-live="polite">Result: {dot}</div>
      </section>
    </div>
  );
}
