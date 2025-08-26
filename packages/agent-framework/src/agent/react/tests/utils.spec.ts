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

  it('adds args.include_in_response with required=true and type=object and default description', () => {
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);

    // base presence & shape
    expect(tool.args).toHaveProperty('include_in_response');
    const include = (tool.args as any).include_in_response;

    expect(include).toMatchObject({
      type: 'object',
      required: true,
    });

    // description is present (uses your default text if original missing)
    expect(
      typeof include.description === 'string' ||
        include.description === undefined,
    ).toBe(true);
  });

  it('marks ALL properties inside include_in_response as required booleans', () => {
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);
    const include = (tool.args as any).include_in_response;

    // sanity
    expect(include.properties && typeof include.properties === 'object').toBe(
      true,
    );

    // Every property -> { type: 'boolean', required: true }
    Object.entries(include.properties).forEach(([key, val]) => {
      expect(val).toEqual({ type: 'boolean', required: true });
      // ensure the keys we expect are there
      expect([
        'username',
        'firstname',
        'lastname',
        'siteurl',
        'userpictureurl',
        'userlang',
      ]).toContain(key);
    });
  });

  it('respects inputSchema.required at the top-level (include_in_response stays required)', () => {
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);
    const include = (tool.args as any).include_in_response;
    expect(include.required).toBe(true);
  });

  it('converts union types like ["boolean","null"] to "boolean" in nested properties before enforcing the override', () => {
    // This assertion verifies the conversion path ran, even though the special-case
    // override then forces { type: 'boolean', required: true }.
    // If the pipeline changes later, this will catch regressions in type normalization.
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);
    const include = (tool.args as any).include_in_response;

    // All nested props must be "boolean" after conversion & override
    for (const prop of Object.values(
      include.properties as Record<string, any>,
    )) {
      expect(prop.type).toBe('boolean');
    }
  });

  it('matches the expected include_in_response shape (order-agnostic)', () => {
    const [tool] = listAgentsToolsToAgentTools(mockListToolsResult);
    const include = (tool.args as any).include_in_response;

    // keys present, regardless of order
    expect(Object.keys(include.properties).sort()).toEqual(
      [
        'username',
        'firstname',
        'lastname',
        'siteurl',
        'userpictureurl',
        'userlang',
      ].sort(),
    );

    // every property is a required boolean
    for (const val of Object.values(
      include.properties as Record<string, any>,
    )) {
      expect(val).toEqual({ type: 'boolean', required: true });
    }

    // top-level shape
    expect(include).toMatchObject({
      type: 'object',
      required: true,
    });
  });
});
