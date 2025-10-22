import { describe, it, expect } from 'vitest';
import { listAgentsToolsToAgentTools } from '../../utils';
import { mockListToolsResult } from './utils.spec.config';

describe('listAgentsToolsToAgentTools', () => {
  it('maps a ListToolsResult into AgentTool[] without throwing (zod parse succeeds)', () => {
    expect(() =>
      listAgentsToolsToAgentTools(mockListToolsResult),
    ).not.toThrow();
  });

  it('produces exactly one AgentTool with the expected name/description', () => {
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);
    expect(tool).toBeDefined();
    expect(tool.name).toBe('get_user_info');
    expect(tool.description).toContain(
      'Get personal information about the user',
    );
  });

  it('has empty properties', () => {
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);
    expect(tool.args).toEqual({});
  });

  it('handles empty properties correctly', () => {
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);
    expect(tool.args).toBeDefined();
    expect(typeof tool.args).toBe('object');
  });

  it('has correct tool structure', () => {
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);
    expect(tool.name).toBe('get_user_info');
    expect(tool.description).toContain('Get personal information');
    expect(tool.args).toEqual({});
  });
});
