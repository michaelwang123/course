import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { tools } from '@/plugins/registry';
import { HomePage } from '@/pages/HomePage';

// Feature: id-photo-tool, Property 12: Tool registry rendering completeness

describe('Tool Registry Rendering - Property Tests', () => {
  // **Validates: Requirements 5.3, 5.4**

  describe('Property 12: Tool registry rendering completeness', () => {
    // For any set of tools registered in the Tool_Registry array, the home page
    // component SHALL render an entry (card) for every registered tool,
    // including its name and description.

    it('every registered tool has its name rendered on the home page', () => {
      render(
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <HomePage />
        </BrowserRouter>,
      );

      fc.assert(
        fc.property(fc.constantFrom(...tools), (tool) => {
          expect(screen.getByText(tool.name)).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });

    it('every registered tool has its description rendered on the home page', () => {
      render(
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <HomePage />
        </BrowserRouter>,
      );

      fc.assert(
        fc.property(fc.constantFrom(...tools), (tool) => {
          expect(screen.getByText(tool.description)).toBeDefined();
        }),
        { numRuns: 100 },
      );
    });

    it('the number of rendered tool cards matches the registry length', () => {
      render(
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <HomePage />
        </BrowserRouter>,
      );

      fc.assert(
        fc.property(fc.constant(tools), (registeredTools) => {
          // Each tool card has an aria-label containing the tool name
          const cards = registeredTools.map((tool) =>
            screen.getByLabelText(`打开${tool.name}工具`),
          );
          expect(cards.length).toBe(registeredTools.length);
        }),
        { numRuns: 100 },
      );
    });

    it('each tool card links to the correct route', () => {
      render(
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <HomePage />
        </BrowserRouter>,
      );

      fc.assert(
        fc.property(fc.constantFrom(...tools), (tool) => {
          const link = screen.getByLabelText(`打开${tool.name}工具`);
          expect(link.getAttribute('href')).toBe(tool.route);
        }),
        { numRuns: 100 },
      );
    });
  });
});
