import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import { AgentTool, AgentToolSchema } from './react/types';

// Helper function to convert JSON Schema type to string
const convertJsonSchemaType = (type: any): string => {
  if (Array.isArray(type)) {
    // Handle union types like ["boolean", "null"]
    return type.filter((t) => t !== 'null').join(' | ');
  }
  return type;
};

// Helper function to convert JSON Schema to AgentTool arg format
const convertJsonSchemaToAgentToolArg = (schema: any): any => {
  const result: any = {
    type: convertJsonSchemaType(schema.type),
    required: false, // Default to false, will be overridden if needed
  };

  if (schema.description) {
    result.description = schema.description;
  }

  // Handle object properties
  if (schema.properties) {
    result.properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      result.properties[key] = convertJsonSchemaToAgentToolArg(value);
    }
  }

  // Handle anyOf (union types)
  if (schema.anyOf) {
    // For anyOf, we'll take the first non-null type
    const nonNullType = schema.anyOf.find(
      (option: any) => option.type !== 'null' && option.type !== null,
    );
    if (nonNullType) {
      Object.assign(result, convertJsonSchemaToAgentToolArg(nonNullType));
    }
  }

  return result;
};

export const listAgentsToolsToAgentTools = (
  listAgentsTools: ListToolsResult,
): AgentTool[] => {
  return listAgentsTools.tools.map((tool) => {
    const args: any = {};

    if (tool.inputSchema?.properties) {
      for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
        args[key] = convertJsonSchemaToAgentToolArg(value);

        // Set required based on inputSchema.required array
        if (tool.inputSchema.required?.includes(key)) {
          args[key].required = true;
        }

        // Special handling for include_in_response - ensure it matches the expected schema structure
        if (key === 'include_in_response') {
          // Ensure the include_in_response object has the correct structure
          args[key] = {
            type: 'object',
            description:
              'This option is mandatory and used to specify which fields should be included in the response.',
            required: true,
            properties: args[key].properties || {},
          };

          // Ensure all properties within include_in_response are required: true
          if (args[key].properties) {
            for (const propKey of Object.keys(args[key].properties)) {
              args[key].properties[propKey] = {
                type: 'boolean',
                required: true,
              };
            }
          }
        }
      }
    }

    return AgentToolSchema.parse({
      name: tool.name,
      description: tool.description,
      args,
    });
  });
};
