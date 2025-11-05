import { describe, it, expect } from 'vitest';
import { stripThoughts, stripEvidenceJson } from './llm';

describe('stripThoughts', () => {
  it('removes think tags from text', () => {
    const input = 'Hello <think>internal thought</think> world';
    const expected = 'Hello  world';
    expect(stripThoughts(input)).toBe(expected);
  });

  it('returns text unchanged when there are no think tags', () => {
    const input = 'Hello world';
    expect(stripThoughts(input)).toBe(input);
  });

  it('removes multiple think tags from text', () => {
    const input = '<think>first</think> middle <think>second</think> end';
    const expected = ' middle  end';
    expect(stripThoughts(input)).toBe(expected);
  });

  it('handles empty string', () => {
    expect(stripThoughts('')).toBe('');
  });

  it('removes think tags with multiline content', () => {
    const input = 'Start <think>line1\nline2\nline3</think> end';
    const expected = 'Start  end';
    expect(stripThoughts(input)).toBe(expected);
  });

  it('handles text with only think tags', () => {
    const input = '<think>only thoughts here</think>';
    expect(stripThoughts(input)).toBe('');
  });

  it('preserves text before and after think tags', () => {
    const input = 'Before <think>thought</think> after';
    const expected = 'Before  after';
    expect(stripThoughts(input)).toBe(expected);
  });
});

describe('stripEvidenceJson', () => {
  it('removes evidence-json code blocks from text', () => {
    const input =
      'Text before ```evidence-json\n{"key": "value"}\n``` text after';
    const expected = 'Text before  text after';
    expect(stripEvidenceJson(input)).toBe(expected);
  });

  it('returns text unchanged when there are no evidence-json blocks', () => {
    const input = 'Hello world';
    expect(stripEvidenceJson(input)).toBe(input);
  });

  it('removes multiple evidence-json blocks from text', () => {
    const input =
      '```evidence-json\n{"a": 1}\n``` middle ```evidence-json\n{"b": 2}\n``` end';
    const expected = ' middle  end';
    expect(stripEvidenceJson(input)).toBe(expected);
  });

  it('handles empty string', () => {
    expect(stripEvidenceJson('')).toBe('');
  });

  it('removes evidence-json blocks with complex multiline JSON', () => {
    const input =
      'Start ```evidence-json\n{\n  "key": "value",\n  "nested": {\n    "data": [1, 2, 3]\n  }\n}\n``` end';
    const expected = 'Start  end';
    expect(stripEvidenceJson(input)).toBe(expected);
  });

  it('handles text with only evidence-json block', () => {
    const input = '```evidence-json\n{"data": "test"}\n```';
    expect(stripEvidenceJson(input)).toBe('');
  });

  it('preserves text before and after evidence-json blocks', () => {
    const input = 'Before ```evidence-json\n{"x": 1}\n``` after';
    const expected = 'Before  after';
    expect(stripEvidenceJson(input)).toBe(expected);
  });

  it('does not remove regular code blocks', () => {
    const input = 'Text ```json\n{"key": "value"}\n``` more text';
    expect(stripEvidenceJson(input)).toBe(input);
  });

  it('handles evidence-json blocks with empty content', () => {
    const input = 'Text ```evidence-json\n\n``` after';
    const expected = 'Text  after';
    expect(stripEvidenceJson(input)).toBe(expected);
  });
});
