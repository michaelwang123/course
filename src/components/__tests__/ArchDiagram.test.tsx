import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArchDiagram from '../ArchDiagram';

describe('ArchDiagram', () => {
  it('renders all 6 node labels and all connections', () => {
    const { container } = render(<ArchDiagram />);

    // All 6 node labels should be visible
    expect(screen.getByText('Web UI')).toBeInTheDocument();
    expect(screen.getByText('API Server')).toBeInTheDocument();
    expect(screen.getByText('Elasticsearch')).toBeInTheDocument();
    expect(screen.getByText('MySQL')).toBeInTheDocument();
    expect(screen.getByText('MinIO')).toBeInTheDocument();
    expect(screen.getByText('Redis')).toBeInTheDocument();

    // All 5 connections should be present
    const connectionElements = container.querySelectorAll('.arch-diagram__connection');
    expect(connectionElements).toHaveLength(5);

    // Verify specific connections via data attributes
    expect(container.querySelector('[data-from="webui"][data-to="api"]')).toBeInTheDocument();
    expect(container.querySelector('[data-from="api"][data-to="es"]')).toBeInTheDocument();
    expect(container.querySelector('[data-from="api"][data-to="mysql"]')).toBeInTheDocument();
    expect(container.querySelector('[data-from="api"][data-to="minio"]')).toBeInTheDocument();
    expect(container.querySelector('[data-from="api"][data-to="redis"]')).toBeInTheDocument();
  });

  it('renders three layer labels', () => {
    const { container } = render(<ArchDiagram />);

    const labels = container.querySelectorAll('.arch-diagram__layer-label');
    expect(labels).toHaveLength(3);
    expect(labels[0].textContent).toBe('用户层');
    expect(labels[1].textContent).toBe('服务层');
    expect(labels[2].textContent).toBe('存储层');
  });

  it('sets role="img" and aria-label="RAGFlow 系统架构图" on container', () => {
    const { container } = render(<ArchDiagram />);

    const diagram = container.firstElementChild as HTMLElement;
    expect(diagram).toHaveAttribute('role', 'img');
    expect(diagram).toHaveAttribute('aria-label', 'RAGFlow 系统架构图');
  });

  it('dims non-connected nodes on hover when interactive (default)', () => {
    const { container } = render(<ArchDiagram />);

    const apiNode = container.querySelector('[data-node-id="api"]') as HTMLElement;
    fireEvent.mouseEnter(apiNode);

    // API Server connects to all others, so all should be opacity 1
    expect(apiNode.style.opacity).toBe('1');
    expect((container.querySelector('[data-node-id="webui"]') as HTMLElement).style.opacity).toBe('1');
    expect((container.querySelector('[data-node-id="es"]') as HTMLElement).style.opacity).toBe('1');
    expect((container.querySelector('[data-node-id="mysql"]') as HTMLElement).style.opacity).toBe('1');
    expect((container.querySelector('[data-node-id="minio"]') as HTMLElement).style.opacity).toBe('1');
    expect((container.querySelector('[data-node-id="redis"]') as HTMLElement).style.opacity).toBe('1');

    // When hovering webui, only webui and api should be highlighted
    fireEvent.mouseLeave(apiNode);
    fireEvent.mouseEnter(container.querySelector('[data-node-id="webui"]') as HTMLElement);

    expect((container.querySelector('[data-node-id="webui"]') as HTMLElement).style.opacity).toBe('1');
    expect((container.querySelector('[data-node-id="api"]') as HTMLElement).style.opacity).toBe('1');
    expect((container.querySelector('[data-node-id="es"]') as HTMLElement).style.opacity).toBe('0.3');
    expect((container.querySelector('[data-node-id="mysql"]') as HTMLElement).style.opacity).toBe('0.3');
    expect((container.querySelector('[data-node-id="minio"]') as HTMLElement).style.opacity).toBe('0.3');
    expect((container.querySelector('[data-node-id="redis"]') as HTMLElement).style.opacity).toBe('0.3');
  });

  it('does not change opacity on hover when interactive=false', () => {
    const { container } = render(<ArchDiagram interactive={false} />);

    const webuiNode = container.querySelector('[data-node-id="webui"]') as HTMLElement;
    fireEvent.mouseEnter(webuiNode);

    // All nodes should remain opacity 1
    const allNodes = container.querySelectorAll('.arch-diagram__node');
    allNodes.forEach((node) => {
      expect((node as HTMLElement).style.opacity).toBe('1');
    });

    // All connections should remain opacity 1
    const allConnections = container.querySelectorAll('.arch-diagram__connection');
    allConnections.forEach((conn) => {
      expect((conn as HTMLElement).style.opacity).toBe('1');
    });
  });

  it('restores all opacities when mouse leaves a node', () => {
    const { container } = render(<ArchDiagram />);

    const webuiNode = container.querySelector('[data-node-id="webui"]') as HTMLElement;
    fireEvent.mouseEnter(webuiNode);
    fireEvent.mouseLeave(webuiNode);

    // All nodes should be back to opacity 1
    const allNodes = container.querySelectorAll('.arch-diagram__node');
    allNodes.forEach((node) => {
      expect((node as HTMLElement).style.opacity).toBe('1');
    });
  });

  it('applies transition with duration ≤300ms on nodes', () => {
    const { container } = render(<ArchDiagram />);

    const node = container.querySelector('.arch-diagram__node') as HTMLElement;
    expect(node.style.transition).toContain('opacity');
    expect(node.style.transition).toContain('300ms');
  });
});
