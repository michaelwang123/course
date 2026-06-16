import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Disclaimer } from '@/components/Disclaimer';

describe('Disclaimer', () => {
  it('renders the disclaimer text content', () => {
    const { container } = render(<Disclaimer />);
    expect(container.textContent).toContain(
      '本测评结果仅供参考，不构成专业心理诊断。如有心理健康困扰，请咨询专业心理咨询师。'
    );
  });

  it('renders as a paragraph element', () => {
    const { container } = render(<Disclaimer />);
    const paragraph = container.querySelector('p');
    expect(paragraph).not.toBeNull();
  });
});
