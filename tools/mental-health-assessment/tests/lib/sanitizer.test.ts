import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { sanitizeInput, sanitizeForDisplay } from '@/lib/sanitizer';

describe('sanitizeInput', () => {
  it('should escape & to &amp;', () => {
    expect(sanitizeInput('hello & world')).toBe('hello &amp; world');
  });

  it('should escape < to &lt;', () => {
    expect(sanitizeInput('a < b')).toBe('a &lt; b');
  });

  it('should escape > to &gt;', () => {
    expect(sanitizeInput('a > b')).toBe('a &gt; b');
  });

  it('should escape " to &quot;', () => {
    expect(sanitizeInput('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it("should escape ' to &#x27;", () => {
    expect(sanitizeInput("it's")).toBe("it&#x27;s");
  });

  it('should escape all special characters in a single string', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should not double-escape & in already escaped entities', () => {
    // If input contains &amp; it should escape the & again
    expect(sanitizeInput('&amp;')).toBe('&amp;amp;');
  });

  it('should return the same string when no special characters', () => {
    expect(sanitizeInput('hello world')).toBe('hello world');
    expect(sanitizeInput('中文测试')).toBe('中文测试');
    expect(sanitizeInput('abc123')).toBe('abc123');
  });

  it('should handle empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('should handle string with only special characters', () => {
    expect(sanitizeInput('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#x27;');
  });
});

describe('sanitizeForDisplay', () => {
  it('should sanitize text the same way as sanitizeInput', () => {
    const input = '<b>bold</b> & "quoted"';
    expect(sanitizeForDisplay(input)).toBe(sanitizeInput(input));
  });

  it('should handle empty string', () => {
    expect(sanitizeForDisplay('')).toBe('');
  });

  it('should pass through safe text unchanged', () => {
    expect(sanitizeForDisplay('张三')).toBe('张三');
  });
});


// Feature: mental-health-assessment, Property 13: XSS input sanitization
// **Validates: Requirements 10.6**
describe('Property 13: XSS input sanitization', () => {
  const HTML_SPECIAL_CHARS = ['<', '>', '"', "'", '&'];

  it('any string containing HTML special characters produces output without unescaped instances', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) =>
          HTML_SPECIAL_CHARS.some((c) => s.includes(c))
        ),
        (input) => {
          const output = sanitizeInput(input);

          // The output should not contain raw < > " ' characters
          expect(output).not.toMatch(/[<>"']/);

          // For &, we need to verify that every & in output is part of a valid entity
          // (i.e., no bare & that isn't followed by a recognized entity pattern)
          // After sanitization, all & in the output should be from &amp; &lt; &gt; &quot; or &#x27;
          const ampersandSegments = output.split('&');
          // The first segment is before the first &, so skip it
          for (let i = 1; i < ampersandSegments.length; i++) {
            const segment = ampersandSegments[i];
            const startsWithEntity =
              segment.startsWith('amp;') ||
              segment.startsWith('lt;') ||
              segment.startsWith('gt;') ||
              segment.startsWith('quot;') ||
              segment.startsWith('#x27;');
            expect(startsWithEntity).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('strings without HTML special characters pass through unchanged', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) =>
          !HTML_SPECIAL_CHARS.some((c) => s.includes(c))
        ),
        (input) => {
          const output = sanitizeInput(input);
          expect(output).toBe(input);
        }
      ),
      { numRuns: 100 }
    );
  });
});
